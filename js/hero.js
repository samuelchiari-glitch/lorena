/**
 * hero.js: hero timeline + full-bleed -> card geometry (spec §4.1, revised by client feedback: no arch;
 * the cover fills the first screen and shrinks into a centred rounded rectangle) and the hero signature
 * scrub (§7.3). The Instagram profile screen below it is upgraded by proof.js, like every IG screen.
 * OWNER: hero section builder.
 *
 * Static modes: nothing here runs. The static hero (100svh full-bleed cover, scrim, Vanilla lockup) is
 * pure CSS in site.css (=== section: hero ===) and is complete at rest; the load settle is a CSS
 * animation in css/hero.css (first paint, off under reduced motion).
 *
 * Motion mode (set up in boot(), so the scrub is live before the fonts wait; only the H1 split needs the
 * fonts, and it happens lazily on scroll): one sticky stage (css/hero.css: .motion .hero{height:220svh}),
 * H = stage.offsetHeight, every range function-based so a refresh re-reads it (never innerHeight):
 *   0 → 1.0 H    photo clip full-bleed → card (12-value inset() written to --hero-clip on .hero__photo,
 *                quantized to 0.5 px and written only when it changes, see below), img scale 1.06 → .92
 *                (landscape: the cover ≈ 1.9 card widths) + x/y to frame the eyes, --hero-bg Vanilla →
 *                Tobacco (0.5 H, a warm midpoint) → Mahogany-deep on .hero                      power1.inOut, scrub
 *   0.4 → 1.0 H  shade (bottom-weighted Mahogany-deep gradient: the signature reads on the robe)  power1.in, scrub
 *   0.12 → 0.45 H copy clip ellipse wipe + yPercent −8, sans chars yPercent −100 inside their own line
 *                (stagger .02; never up into the header), the copy's scrim fades out             power1.inOut, scrub
 *   0.55 → 1.15 H signature draw at constant pen speed, + the Lando snap on a fast exit            scrub .5
 *   0.7 → 1.0 H  handle chars yPercent 100 → 0 (stagger .02)                                    power3.out, scrub
 * The header (backing, hide/show, theme IO) is ui.js's. Theme: .hero is dark (Vanilla ink on the scrim);
 * .hero__light-zone takes over when the photo's top edge reaches the header controls (--hero-light-top,
 * computed here on every refresh), and .hero__dark-zone at 0.5 H. data-clear-until on .hero tells ui.js
 * the same scroll, where the header backing comes on (the bar never sits clear across the photo's edge).
 * Past the track (.hero--past) the img drops its will-change layer.
 *
 * Exports: restGeometry(stage), cardGeometry({W,H}), boxToInset(geo,{W,H}) (spec helpers, also used
 * by tests), boot(ctx), ready(ctx), finish().
 */
import { isMotion, scope, getLenis } from './scroll.js';
import { splitLockup } from './reveals.js';
import { signatureTimeline, clearSignature } from './signature.js';

/** Rest = the whole stage, square corners (the cover is full-bleed at scroll 0). Read from the render. */
export function restGeometry(stage) {
  const s = stage.getBoundingClientRect();
  const W = s.width, H = stage.offsetHeight;
  return { W, H, box: { top: 0, left: 0, right: W, bottom: H }, r: { rx: 0, ry: 0, rxb: 0, ryb: 0 } };
}

/** The card: ≈ 9:16, top at 20% so its centre sits at 49%, 28 px corners (the video cards' radius). */
export const CARD_RADIUS = 28;
export function cardGeometry({ W, H }) {
  const h = 0.58 * H, w = 0.575 * h, left = (W - w) / 2, top = 0.2 * H;
  const r = CARD_RADIUS;
  return { box: { top, left, right: left + w, bottom: top + h }, r: { rx: r, ry: r, rxb: r, ryb: r } };
}

/**
 * The cover's eye line is at .387 of its height and the eye midpoint at .544 of its width (cover.jpg,
 * 1600 x 2400; the CSS sizes the img box to the image's 2:3, see site.css). In the card the image is scaled
 * about the stage centre: .92 on portrait stages; on landscape stages the cover box is as wide as the screen,
 * so the scale is taken from the card width instead (image ≈ 1.9 card widths: a portrait, not a close-up).
 * x/y put the eye midpoint on the card's centre line, ≈ 36% down the card, clamped so the image still covers
 * the card with 12 px to spare. Read from the rendered box at refresh, never in scroll callbacks.
 */
export const COVER_EYE_Y = 0.387;
export const COVER_EYE_X = 0.544;
const END_SCALE = 0.92;
function cardImageEnd(stage, img) {
  const H = stage.offsetHeight, W = stage.getBoundingClientRect().width;
  const left = img.offsetLeft, top = img.offsetTop, w = img.offsetWidth, h = img.offsetHeight;
  const { box } = cardGeometry({ W, H });
  const cw = box.right - box.left, ch = box.bottom - box.top;
  const scale = W > H ? Math.min(END_SCALE, (1.9 * cw) / w) : END_SCALE;
  const ax = (x) => W / 2 + (x - W / 2) * scale, ay = (y) => H / 2 + (y - H / 2) * scale; // after the scale
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const y = clamp(box.top + 0.36 * ch - ay(top + COVER_EYE_Y * h), box.bottom + 12 - ay(top + h), box.top - 12 - ay(top));
  const x = W > H ? clamp(box.left + cw / 2 - ax(left + COVER_EYE_X * w), box.right + 12 - ax(left + w), box.left - 12 - ax(left)) : 0;
  return { x: Math.round(x), y: Math.round(y), scale: +scale.toFixed(4) };
}

/** Inverse of power1.inOut (the scrub's ease: 2t² below .5, 1 − 2(1 − t)² above), for the light zone. */
const easeInv = (e) => (e <= 0.5 ? Math.sqrt(e / 2) : 1 - Math.sqrt((1 - e) / 2));

const px = (n) => n.toFixed(2) + 'px';
const q = (n) => Math.round(n * 2) / 2; // 0.5 px: no sub-pixel repaints, no fractional-edge stair
export function boxToInset({ box, r }, { W, H }) {
  return `inset(${px(box.top)} ${px(W - box.right)} ${px(H - box.bottom)} ${px(box.left)} round `
       + `${px(r.rx)} ${px(r.rx)} ${px(r.rxb)} ${px(r.rxb)} / ${px(r.ry)} ${px(r.ry)} ${px(r.ryb)} ${px(r.ryb)})`;
}

const SNAP_VELOCITY = 100; // Lenis px/frame: a fling, not a scroll (Lando §6.1)
let heroEl = null;
let liveSplits = [];
let setLightTop = null; // refreshInit listener (positions .hero__light-zone)

export function boot(ctx) {
  if (!ctx.motion || !isMotion() || !window.gsap) return;
  setupHero();
}

export function finish() {
  // finishAll(): scope() reverts every tween, ScrollTrigger and SplitText; drop what is left of ours
  liveSplits.forEach((s) => { try { s.revert(); } catch (_) { /* already reverted */ } });
  liveSplits = [];
  if (setLightTop && window.ScrollTrigger) window.ScrollTrigger.removeEventListener('refreshInit', setLightTop);
  if (heroEl) {
    heroEl.classList.remove('hero--live', 'hero--past');
    const h1 = heroEl.querySelector('h1');
    if (h1) h1.classList.remove('is-split');
    heroEl.style.removeProperty('--hero-light-top');
    const photo = heroEl.querySelector('.hero__photo');
    if (photo) photo.style.removeProperty('--hero-clip');
    delete heroEl.dataset.clearUntil;
    clearSignature(heroEl.querySelector('.sig--hero'));
  }
}

/* ------------------------------------------------------------------ hero scrub (§4.1) */

function setupHero() {
  const hero = document.querySelector('.hero');
  const stage = hero && hero.querySelector('.hero__stage');
  const photo = stage && stage.querySelector('.hero__photo');
  if (!stage || !photo) return;
  heroEl = hero;
  const { gsap } = window;
  const img = photo.querySelector('img');
  const shade = photo.querySelector('.hero__shade');
  const scrim = photo.querySelector('.hero__scrim');
  const copy = stage.querySelector('.hero__copy');
  const h1 = copy && copy.querySelector('h1');
  const handle = stage.querySelector('.hero__handle');
  const sig = stage.querySelector('.sig--hero');
  const H = () => stage.offsetHeight;
  const at = (f) => () => `top+=${(f * H()).toFixed(1)} top`;

  // The 12-value inset() is written to a custom property that css/hero.css feeds to clip-path (a clip-path
  // tween would be read back through the browser, which re-serializes inset() compactly, and jump). The
  // scrub drives a 0..1 proxy; each frame interpolates rest → card, quantizes every value to 0.5 px and
  // writes only a changed string, so Lenis's sub-pixel tail never repaints the clipped photo.
  let geo = null;
  let lastClip = '';
  const clip = { p: 0 };
  const writeClip = () => {
    if (!geo || !hero.classList.contains('hero--live')) return; // finish() drops the class before the revert
    const { a, b, W, Hh } = geo, k = clip.p, m = (x, y) => q(x + (y - x) * k);
    const box = { top: m(a.box.top, b.box.top), left: m(a.box.left, b.box.left), right: W - m(W - a.box.right, W - b.box.right), bottom: Hh - m(Hh - a.box.bottom, Hh - b.box.bottom) };
    const r = m(a.r.rx, b.r.rx);
    const str = boxToInset({ box, r: { rx: r, ry: r, rxb: r, ryb: r } }, { W, H: Hh });
    if (str !== lastClip) { lastClip = str; photo.style.setProperty('--hero-clip', str); }
  };
  const measure = () => {
    const a = restGeometry(stage);
    geo = { a, b: cardGeometry(a), W: a.W, Hh: a.H };
    lastClip = '';
    writeClip();
  };

  scope(() => {
    // 0 → 1.0 H: full-bleed → card, image, background (power1.inOut, scrub)
    const main = gsap.timeline({
      defaults: { ease: 'power1.inOut', duration: 1 },
      scrollTrigger: { trigger: hero, start: 'top top', end: at(1), scrub: true, invalidateOnRefresh: true },
    });
    main.fromTo(clip, { p: 0 }, { p: 1, onUpdate: writeClip }, 0);
    if (img) {
      main.fromTo(img, { x: 0, y: 0, scale: 1.06 }, {
        x: () => cardImageEnd(stage, img).x, y: () => cardImageEnd(stage, img).y, scale: () => cardImageEnd(stage, img).scale,
      }, 0);
    }
    // the shade darkens the card's lower half under the signature (eyes stay clear), from 0.4 H
    if (shade) main.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.in' }, 0.4);
    // warm midpoint: Vanilla → Tobacco → Mahogany-deep. The two halves of power1.inOut are power1.in and
    // power1.out, so the timing matches one inOut tween; only the colour it passes through changes.
    main.fromTo(hero, { '--hero-bg': '#F1EADA' }, { '--hero-bg': '#B59E7D', duration: 0.5, ease: 'power1.in' }, 0)
      .to(hero, { '--hero-bg': '#4D342D', duration: 0.5, ease: 'power1.out' }, 0.5);

    // 0.12 → 0.45 H: the lockup wipes away upward while the photo starts to shrink (power1.inOut, scrub)
    if (copy) {
      const copyTl = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: { trigger: hero, start: at(0.12), end: at(0.45), scrub: true, invalidateOnRefresh: true },
      });
      copyTl.fromTo(copy, { clipPath: 'ellipse(110% 110% at 50% 0%)', yPercent: 0 },
        { clipPath: 'ellipse(100% 0% at 50% 0%)', yPercent: -8, duration: 1 }, 0);
      if (scrim) copyTl.fromTo(scrim, { opacity: 1 }, { opacity: 0, duration: 1 }, 0); // it only serves the copy
      // The sans chars are split only while the scrub is past 0 and unsplit back at 0: split chars
      // lose the caps' kerning (sub-pixel glyph shifts), and at rest the cover must match static mode.
      // While split, the line clips them (.is-split in css/hero.css): they leave through their own line.
      if (h1) {
        let split = null, charsTl = null;
        const unsplit = () => {
          if (charsTl) { charsTl.progress(0).kill(); charsTl = null; }
          if (split) { liveSplits = liveSplits.filter((x) => x !== split); split.revert(); split = null; }
          h1.classList.remove('is-split');
        };
        window.ScrollTrigger.create({
          trigger: hero, start: at(0.12), end: at(0.45), invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!isMotion()) return;
            if (self.progress <= 0) { unsplit(); return; }
            if (!split) {
              scope(() => {
                split = splitLockup(h1);
                liveSplits.push(split);
                h1.classList.add('is-split');
                const n = split.chars.length;
                charsTl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' } })
                  .fromTo(split.chars, { yPercent: 0 }, { yPercent: -100, duration: 1 - 0.02 * (n - 1), stagger: 0.02 });
              });
            }
            if (charsTl) charsTl.progress(self.progress);
          },
          onLeaveBack: unsplit,
        });
      }
    }

    // past the track: the img no longer needs its compositor layer
    window.ScrollTrigger.create({
      trigger: hero, start: 'bottom top', invalidateOnRefresh: true,
      onEnter: () => hero.classList.add('hero--past'), onLeaveBack: () => hero.classList.remove('hero--past'),
    });

    // 0.7 → 1.0 H: the handle rises, char by char (power3.out, scrub)
    if (handle) {
      const split = window.SplitText.create(handle, { type: 'chars', aria: 'none' });
      liveSplits.push(split);
      const n = split.chars.length;
      gsap.set(split.chars, { yPercent: 100 }); // staggered children of a scrubbed timeline do not all render their from-state
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: hero, start: at(0.7), end: at(1), scrub: true, invalidateOnRefresh: true },
      }).fromTo(split.chars, { yPercent: 100 }, { yPercent: 0, duration: 1 - 0.02 * (n - 1), stagger: 0.02 });
    }

    // 0.55 → 1.15 H: the signature writes itself (constant pen speed, scrub .5) + the Lando snap
    if (sig) {
      const tl = signatureTimeline(sig);
      const snap = (self) => {
        const lenis = getLenis();
        const v = lenis ? Math.abs(lenis.velocity) : Math.abs(self.getVelocity()) / 60;
        if (v <= SNAP_VELOCITY) return;
        const tw = self.getTween();
        if (tw) tw.progress(1); // jump the scrub to where it is heading (0 or 1): never frozen half-drawn
      };
      window.ScrollTrigger.create({
        trigger: hero, start: at(0.55), end: at(1.15), scrub: 0.5, animation: tl, invalidateOnRefresh: true,
        onLeave: snap, onLeaveBack: snap,
      });
    }
  });

  // Light theme zone + header backing: from the scroll where the photo's top edge (clip top = .2 H × ease(p))
  // reaches the top of the header's 44 px controls (22 px above the theme line, ui.js: hdr.offsetHeight − 32).
  // From there the bar gets its backing (ui.js reads data-clear-until), so it never sits clear across the
  // edge (Vanilla ink over the light page above it, or the light photo top).
  setLightTop = () => {
    const hdr = document.querySelector('.hdr');
    const line = Math.max(0, (hdr ? hdr.offsetHeight : 64) - 32);
    const h = H(), r = Math.max(0, line - 22) / (0.2 * h);
    const heroTop = hero.getBoundingClientRect().top + scrollY;
    const from = r >= 1 ? h * 3 : easeInv(r) * h; // the scroll (from the hero's top) where the edge reaches the text
    hero.style.setProperty('--hero-light-top', `${(from + line - heroTop).toFixed(1)}px`);
    hero.dataset.clearUntil = String(Math.round(heroTop + from));
    measure();
  };
  setLightTop();
  window.ScrollTrigger.addEventListener('refreshInit', setLightTop);

  hero.classList.add('hero--live');
  writeClip();
}
