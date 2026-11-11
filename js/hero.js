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
 * Motion mode (ready): one sticky stage (css/hero.css: .motion .hero{height:220svh}), H = stage.offsetHeight,
 * every range function-based so a refresh re-reads it (never innerHeight):
 *   0 → 1.0 H    photo clip full-bleed → card (boxToInset fromTo, 12 px values, tweened as --hero-clip
 *                on .hero__photo, see below), img scale 1.06 → .92 (+ y to frame the eyes), shade .12,
 *                --hero-bg Vanilla → Mahogany-deep on .hero (painted by .hero and the stage)    power1.inOut, scrub
 *   0 → 0.6 H    copy clip ellipse wipe + yPercent −20, sans chars yPercent −100 (stagger .02),
 *                the copy's scrim fades out                                                    power3.out, scrub
 *   0.55 → 1.15 H signature draw at constant pen speed, + the Lando snap on a fast exit            scrub .5
 *   0.7 → 1.0 H  handle chars yPercent 100 → 0 (stagger .02)                                    power3.out, scrub
 * The header (backing, hide/show, theme IO) is ui.js's. Theme: .hero is dark (Vanilla ink on the scrim);
 * .hero__light-zone takes over where the photo's top edge passes the header line (--hero-light-top,
 * computed here on every refresh), and .hero__dark-zone at 0.5 H.
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
 * The cover's eye line is at .387 of its height (cover.jpg, 1600 x 2400; the CSS sizes the img box to the
 * image's 2:3, see site.css). In the card the image is scaled .92 about the stage centre; this extra y puts
 * the eye line ≈ 36% down the card (a portrait's framing at every height), clamped so the image still
 * covers the card with 12 px to spare. Read from the rendered box at refresh, never in scroll callbacks.
 */
export const COVER_EYE_Y = 0.387;
const END_SCALE = 0.92;
function cardImageShift(stage, img) {
  const H = stage.offsetHeight, W = stage.getBoundingClientRect().width;
  const top = img.offsetTop, h = img.offsetHeight;
  const { box } = cardGeometry({ W, H });
  const at = (y) => H / 2 + (y - H / 2) * END_SCALE;                 // y after the .92 scale (no shift)
  const want = box.top + 0.36 * (box.bottom - box.top) - at(top + COVER_EYE_Y * h);
  const lo = box.bottom + 12 - at(top + h), hi = box.top - 12 - at(top);
  return Math.round(Math.min(hi, Math.max(lo, want)));
}

/** Inverse of power1.inOut (the scrub's ease: 2t² below .5, 1 − 2(1 − t)² above), for the light zone. */
const easeInv = (e) => (e <= 0.5 ? Math.sqrt(e / 2) : 1 - Math.sqrt((1 - e) / 2));

const px = (n) => n.toFixed(2) + 'px';
export function boxToInset({ box, r }, { W, H }) {
  return `inset(${px(box.top)} ${px(W - box.right)} ${px(H - box.bottom)} ${px(box.left)} round `
       + `${px(r.rx)} ${px(r.rx)} ${px(r.rxb)} ${px(r.rxb)} / ${px(r.ry)} ${px(r.ry)} ${px(r.ryb)} ${px(r.ryb)})`;
}

const SNAP_VELOCITY = 100; // Lenis px/frame: a fling, not a scroll (Lando §6.1)
let heroEl = null;
let liveSplits = [];
let setLightTop = null; // refreshInit listener (positions .hero__light-zone)

export function boot() {}

export function ready(ctx) {
  if (!ctx.motion || !isMotion() || !window.gsap) return;
  setupHero();
}

export function finish() {
  // finishAll(): scope() reverts every tween, ScrollTrigger and SplitText; drop what is left of ours
  liveSplits.forEach((s) => { try { s.revert(); } catch (_) { /* already reverted */ } });
  liveSplits = [];
  if (setLightTop && window.ScrollTrigger) window.ScrollTrigger.removeEventListener('refreshInit', setLightTop);
  if (heroEl) {
    heroEl.classList.remove('hero--live');
    heroEl.style.removeProperty('--hero-light-top');
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
  const dims = () => ({ W: stage.getBoundingClientRect().width, H: H() });
  const at = (f) => () => `top+=${(f * H()).toFixed(1)} top`;

  scope(() => {
    // 0 → 1.0 H: full-bleed → card, image, shade, background (power1.inOut, scrub)
    const main = gsap.timeline({
      defaults: { ease: 'power1.inOut', duration: 1 },
      scrollTrigger: { trigger: hero, start: 'top top', end: at(1), scrub: true, invalidateOnRefresh: true },
    });
    // The 12-value inset() string is tweened in a custom property that css/hero.css feeds to clip-path:
    // GSAP reads both ends of a clip-path tween back through the browser, which re-serializes inset()
    // compactly (equal values collapse: "round 28px"), so the two ends stop matching and the tween
    // would jump at the end. Unregistered custom properties keep their token string verbatim.
    main.fromTo(photo,
      { '--hero-clip': () => { const g = restGeometry(stage); return boxToInset(g, g); } },
      { '--hero-clip': () => { const d = dims(); return boxToInset(cardGeometry(d), d); } }, 0);
    if (img) main.fromTo(img, { y: 0, scale: 1.06 }, { y: () => cardImageShift(stage, img), scale: 0.92 }, 0);
    if (shade) main.fromTo(shade, { opacity: 0 }, { opacity: 0.12 }, 0);
    main.fromTo(hero, { '--hero-bg': '#F1EADA' }, { '--hero-bg': '#4D342D' }, 0);

    // 0 → 0.6 H: the lockup wipes away upward (power3.out, scrub)
    if (copy) {
      const copyTl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: hero, start: 'top top', end: at(0.6), scrub: true, invalidateOnRefresh: true },
      });
      copyTl.fromTo(copy, { clipPath: 'ellipse(110% 110% at 50% 0%)', yPercent: 0 },
        { clipPath: 'ellipse(100% 0% at 50% 0%)', yPercent: -20, duration: 1 }, 0);
      if (scrim) copyTl.fromTo(scrim, { opacity: 1 }, { opacity: 0, duration: 1 }, 0); // it only serves the copy
      // The sans chars are split only while the scrub is past 0 and unsplit back at 0: split chars
      // lose the caps' kerning (sub-pixel glyph shifts), and at rest the cover must match static mode.
      if (h1) {
        let split = null, charsTl = null;
        const unsplit = () => {
          if (charsTl) { charsTl.progress(0).kill(); charsTl = null; }
          if (split) { liveSplits = liveSplits.filter((x) => x !== split); split.revert(); split = null; }
        };
        window.ScrollTrigger.create({
          trigger: hero, start: 'top top', end: at(0.6), invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!isMotion()) return;
            if (self.progress <= 0) { unsplit(); return; }
            if (!split) {
              scope(() => {
                split = splitLockup(h1);
                liveSplits.push(split);
                const n = split.chars.length;
                charsTl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
                  .fromTo(split.chars, { yPercent: 0 }, { yPercent: -100, duration: 1 - 0.02 * (n - 1), stagger: 0.02 });
              });
            }
            if (charsTl) charsTl.progress(self.progress);
          },
          onLeaveBack: unsplit,
        });
      }
    }

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

  // Light theme zone: starts where the photo's top edge (clip top = .2 H × ease(p)) passes the header's
  // theme line (ui.js: hdr.offsetHeight − 32), so the clear header never sits Vanilla-on-Vanilla.
  setLightTop = () => {
    const hdr = document.querySelector('.hdr');
    const line = Math.max(0, (hdr ? hdr.offsetHeight : 64) - 32);
    const h = H(), r = line / (0.2 * h);
    const heroTop = hero.getBoundingClientRect().top + scrollY;
    const top = r >= 1 ? h * 3 : easeInv(r) * h + line - heroTop;
    hero.style.setProperty('--hero-light-top', `${top.toFixed(1)}px`);
  };
  setLightTop();
  window.ScrollTrigger.addEventListener('refreshInit', setLightTop);

  hero.classList.add('hero--live');
}
