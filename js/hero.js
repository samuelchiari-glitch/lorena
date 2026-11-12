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
 *   0.4 → 1.0 H  shade (bottom-weighted Mahogany-deep gradient: the signature reads on the robe)  power1.out, scrub
 *   0.12 → 0.45 H copy clip ellipse wipe + yPercent −8, sans chars yPercent −100 inside their own line
 *                (stagger .02; never up into the header), the copy's scrim fades out             power1.inOut, scrub
 *   0.55 → 1.0 H signature (Lorena's real one, written through its pen mask by signature.js) at constant
 *                pen speed, + the Lando snap on a fast exit; placed under her chin with its baseline on the
 *                card (heroSigPlace). It completes with the card: card, signature and handle hold from
 *                1.0 to 1.2 H, then the stage leaves (spec §4.1)                              ease none, scrub .5
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
import { isDesktop, onDesktop } from './desktop.js';

/** Desktop rem (css/site.css desktop tokens: clamp(992px, 100vw, 1920px) / 108), from the stage width. */
const deskRem = (W) => Math.min(1920, Math.max(992, W)) / 108;

/** Rest = the whole stage, square corners (the cover is full-bleed at scroll 0). Read from the render. */
export function restGeometry(stage) {
  const s = stage.getBoundingClientRect();
  const W = s.width, H = stage.offsetHeight;
  return { W, H, box: { top: 0, left: 0, right: W, bottom: H }, r: { rx: 0, ry: 0, rxb: 0, ryb: 0 } };
}

/**
 * The card. Mobile: ≈ 9:16, top at 20% so its centre sits at 49%, 28 px corners (the video cards' radius).
 * Desktop (≥ 992, docs/desktop-spec.md §4.1): portrait 3:4, .62 H tall, top at .19 H (centre on the stage's centre
 * line), corners --radius-card (2.4 dr: 32 px at 1440). isDesktop() is read at refresh, never in scroll callbacks.
 */
export const CARD_RADIUS = 28;
export function cardGeometry({ W, H }) {
  if (isDesktop()) {
    const h = 0.62 * H, w = 0.75 * h, left = (W - w) / 2, top = 0.19 * H, r = 2.4 * deskRem(W);
    return { box: { top, left, right: left + w, bottom: top + h }, r: { rx: r, ry: r, rxb: r, ryb: r } };
  }
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
const DESK_COVER = 1.7; // desktop: the cover ≈ 1.7 card widths in the card (head and shoulders)
function cardImageEnd(stage, img) {
  const H = stage.offsetHeight, W = stage.getBoundingClientRect().width;
  const left = img.offsetLeft, top = img.offsetTop, w = img.offsetWidth, h = img.offsetHeight;
  const { box } = cardGeometry({ W, H });
  const cw = box.right - box.left, ch = box.bottom - box.top;
  const desk = isDesktop();
  const scale = desk ? (DESK_COVER * cw) / w : W > H ? Math.min(END_SCALE, (1.9 * cw) / w) : END_SCALE;
  const ax = (x) => W / 2 + (x - W / 2) * scale, ay = (y) => H / 2 + (y - H / 2) * scale; // after the scale
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const y = clamp(box.top + 0.36 * ch - ay(top + COVER_EYE_Y * h), box.bottom + 12 - ay(top + h), box.top - 12 - ay(top));
  const x = desk || W > H ? clamp(box.left + cw / 2 - ax(left + COVER_EYE_X * w), box.right + 12 - ax(left + w), box.left - 12 - ax(left)) : 0;
  return { x: Math.round(x), y: Math.round(y), scale: +scale.toFixed(4) };
}

/**
 * Hero signature placement and size (read at refresh, never in scroll callbacks). Its width is CSS (css/hero.css:
 * 92% of the stage, max 560 px, at most 50svh). Its top follows the card's image: the chin line of cover.jpg (.54
 * of its height) mapped through the card-end transform, minus SIG_CLEAR, so the letters start under her face.
 * Its baseline (SIG_BASE of the box: the feet of the L and the M; only the M's lower loop hangs below) stays
 * SIG_IN px inside the card's bottom edge, so the ink sits on the card instead of straddling its edge. On short
 * stages, where the face fills more of the card, the signature narrows to fit (--sig-w), down to SIG_MIN of the
 * stage height; below that it rises over the chin. Kept SIG_FOOT px above the stage bottom.
 */
export const COVER_CHIN_Y = 0.54;
const SIG_CLEAR = 16, SIG_FOOT = 12, SIG_BASE = 0.82, SIG_IN = 10, SIG_MIN = 0.44;
// desktop: the ink's lowest point (the L's tail) is at .96 of the box; it keeps 3 dr above the stage's foot, and the
// signature stays at least 1.3 card widths wide (it overflows the card on both sides, Lando ref 05)
const SIG_LOW = 0.96, SIG_DESK_FOOT = 3, SIG_DESK_MIN = 1.3;
function heroSigPlace(stage, img, sig) {
  const H = stage.offsetHeight, W = stage.getBoundingClientRect().width;
  sig.style.removeProperty('--sig-w'); // measure the CSS size
  const { width: w0, height: h0 } = sig.getBoundingClientRect();
  if (!img || !w0) return { top: Math.round(0.54 * H), width: null };
  const { y, scale } = cardImageEnd(stage, img);
  const chin = H / 2 + (img.offsetTop + COVER_CHIN_Y * img.offsetHeight - H / 2) * scale + y;
  if (isDesktop()) {
    // under her chin, centred on the card (CSS: min(60 dr, 800px) wide), allowed to hang below the card's lower edge
    // like a signed print; narrowed to fit above the stage's foot, never below 1.3 card widths
    const { box } = cardGeometry({ W, H });
    const foot = H - SIG_DESK_FOOT * deskRem(W);
    let top = chin - SIG_CLEAR, w = w0;
    if (top + SIG_LOW * w * (h0 / w0) > foot) w = Math.max(SIG_DESK_MIN * (box.right - box.left), (foot - top) / (SIG_LOW * (h0 / w0)));
    w = Math.min(w, w0);
    top = Math.min(top, foot - SIG_LOW * w * (h0 / w0));
    return { top: Math.round(top), width: w < w0 ? +w.toFixed(1) : null };
  }
  const base = cardGeometry({ W, H }).box.bottom - SIG_IN; // the lowest the baseline may sit
  let h = h0;
  if (chin - SIG_CLEAR + SIG_BASE * h > base) h = Math.max(Math.min(h0, SIG_MIN * H * (h0 / w0)), (base - chin + SIG_CLEAR) / SIG_BASE);
  const top = Math.min(chin - SIG_CLEAR, base - SIG_BASE * h, H - h - SIG_FOOT);
  return { top: Math.round(top), width: h < h0 ? +(h * (w0 / h0)).toFixed(1) : null };
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
const WIPE_MOBILE = ['ellipse(110% 110% at 50% 0%)', 'ellipse(100% 0% at 50% 0%)'];
const WIPE_DESK = ['ellipse(150% 150% at 0% 100%)', 'ellipse(150% 0% at 0% 100%)'];
let heroEl = null;
let liveSplits = [];
let setLightTop = null; // refreshInit listener (positions .hero__light-zone)
let rewriteClip = null; // refresh listener (the clip at the restored scrub progress)

export function boot(ctx) {
  if (!ctx.motion || !isMotion() || !window.gsap) return;
  setupHero();
}

export function finish() {
  // finishAll(): scope() reverts every tween, ScrollTrigger and SplitText; drop what is left of ours
  liveSplits.forEach((s) => { try { s.revert(); } catch (_) { /* already reverted */ } });
  liveSplits = [];
  if (setLightTop && window.ScrollTrigger) window.ScrollTrigger.removeEventListener('refreshInit', setLightTop);
  if (rewriteClip && window.ScrollTrigger) window.ScrollTrigger.removeEventListener('refresh', rewriteClip);
  if (heroEl) {
    heroEl.classList.remove('hero--live', 'hero--past');
    const h1 = heroEl.querySelector('h1');
    if (h1) h1.classList.remove('is-split');
    heroEl.style.removeProperty('--hero-light-top');
    const photo = heroEl.querySelector('.hero__photo');
    if (photo) photo.style.removeProperty('--hero-clip');
    delete heroEl.dataset.clearUntil;
    const sig = heroEl.querySelector('.sig--hero');
    if (sig) { clearSignature(sig); sig.style.removeProperty('--sig-top'); sig.style.removeProperty('--sig-w'); }
    const handle = heroEl.querySelector('.hero__handle');
    if (handle) handle.style.removeProperty('opacity');
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
    // desktop: whole pixels (a .5 px edge let the stage background bleed through as a 1 px light seam at 1024)
    const qq = isDesktop() ? Math.round : q;
    const { a, b, W, Hh } = geo, k = clip.p, m = (x, y) => qq(x + (y - x) * k);
    const box = { top: m(a.box.top, b.box.top), left: m(a.box.left, b.box.left), right: W - m(W - a.box.right, W - b.box.right), bottom: Hh - m(Hh - a.box.bottom, Hh - b.box.bottom) };
    const r = m(a.r.rx, b.r.rx);
    const str = boxToInset({ box, r: { rx: r, ry: r, rxb: r, ryb: r } }, { W, H: Hh });
    if (str !== lastClip) { lastClip = str; photo.style.setProperty('--hero-clip', str); }
    // desktop: the handle shows only while the card is (nearly) settled, so on the way back up the growing card
    // never runs over it (its chars still rise / drop with their own scrub); below 992 it is left alone
    if (handle) {
      if (isDesktop()) handle.style.opacity = String(Math.min(1, Math.max(0, (k - 0.88) / 0.1)).toFixed(3));
      else if (handle.style.opacity) handle.style.removeProperty('opacity');
    }
  };
  const measure = () => {
    const a = restGeometry(stage);
    geo = { a, b: cardGeometry(a), W: a.W, Hh: a.H };
    lastClip = '';
    writeClip();
    if (sig) {
      const { top, width } = heroSigPlace(stage, img, sig);
      sig.style.setProperty('--sig-top', `${top}px`);
      if (width) sig.style.setProperty('--sig-w', `${width}px`);
    }
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
    // the shade darkens the card's lower half under the signature (eyes stay clear), from 0.4 H. power1.out: it is
    // already ≈ .45 when the pen starts (0.55 H), so the L's Vanilla hairlines read on the robe while being written.
    if (shade) main.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.4);
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
      // desktop: the copy is the bottom-left block, so the ellipse closes onto its bottom edge (origin 0% 100%)
      const wipe = (i) => () => (isDesktop() ? WIPE_DESK : WIPE_MOBILE)[i];
      copyTl.fromTo(copy, { clipPath: wipe(0), yPercent: 0 },
        { clipPath: wipe(1), yPercent: -8, duration: 1 }, 0);
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

    // 0.55 → 1.0 H: the signature writes itself (constant pen speed: ease none, scrub .5) + the Lando snap. It ends
    // with the card, so the finished signature holds with it through 1.0 → 1.2 H (with the scrub's lag, too).
    // signatureTimeline() arms the copy (mask on, nothing inked); progress 1 detaches the mask (exact artwork).
    if (sig) {
      const tl = signatureTimeline(sig);
      const snap = (self) => {
        const lenis = getLenis();
        const v = lenis ? Math.abs(lenis.velocity) : Math.abs(self.getVelocity()) / 60;
        if (v <= SNAP_VELOCITY) return;
        const tw = self.getTween();
        if (tw) tw.progress(1); // jump the scrub to where it is heading (0 or 1): never frozen half-drawn
      };
      // no invalidateOnRefresh: the tween has no layout-dependent values (start / end are re-read on every refresh
      // anyway), and invalidating it on a refresh re-rendered it at 0 (mask on, pens hidden) while the silent restore
      // to 1 never redrew it: a resize, a devtools toggle or a deep link left the held card without its signature
      // desktop: leaving back above 0.55 H always clears it (no strokes trailing over her face as the card grows)
      const snapBack = (self) => {
        if (!isDesktop()) { snap(self); return; }
        const tw = self.getTween();
        if (tw) tw.progress(1);
      };
      window.ScrollTrigger.create({
        trigger: hero, start: at(0.55), end: at(1), scrub: 0.5, animation: tl,
        onLeave: snap, onLeaveBack: snapBack,
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
    const h = H(), topFrac = cardGeometry({ W: stage.getBoundingClientRect().width, H: h }).box.top / h;
    const r = Math.max(0, line - 22) / (topFrac * h);
    const heroTop = hero.getBoundingClientRect().top + scrollY;
    const from = r >= 1 ? h * 3 : easeInv(r) * h; // the scroll (from the hero's top) where the edge reaches the text
    hero.style.setProperty('--hero-light-top', `${(from + line - heroTop).toFixed(1)}px`);
    hero.dataset.clearUntil = String(Math.round(heroTop + from));
    measure();
  };
  setLightTop();
  window.ScrollTrigger.addEventListener('refreshInit', setLightTop);
  // measure() runs at refreshInit, while ScrollTrigger holds the scrubs at their start (events suppressed), and the
  // restore after the refresh is silent too: write the clip again once the refresh is done, or a resize inside the
  // track (e.g. crossing 992 px) would leave the photo full-bleed until the next scroll
  rewriteClip = () => { lastClip = ''; writeClip(); };
  window.ScrollTrigger.addEventListener('refresh', rewriteClip);

  hero.classList.add('hero--live');
  writeClip();
  setupMarquee(hero, stage, photo);
}

/* ------------------------------------------------------------------ desktop text marquee (§4.1, Lando refs 03/06) */

/**
 * Two rows of giant type behind the card (desktop + motion only, built here and removed on teardown, so no markup
 * exists below 992): sans caps "STAYS · FOOD · FASHION" and the serif roles line, both approved copy, aria-hidden.
 * They sit between the stage background and the photo, so the shrinking photo uncovers them; opacity 0 → 1 from
 * 0.35 H to 0.7 H; the rows drift ±4vw (opposite) across the track. Each row loops with WAAPI at 40 px/s in opposite
 * directions; the direction follows Lenis's, and both pause while the hero is off-screen.
 */
const MQ_ROWS = [
  { text: 'Stays · Food · Fashion · ', cls: 'hero__mrow--sans', dir: 1 },
  { text: 'Content creator · Model · Actress · Art director · ', cls: 'hero__mrow--serif', dir: -1 },
];
const MQ_SPEED = 40; // px/s
const MQ_DRIFT = 0.04; // × viewport width
function setupMarquee(hero, stage, photo) {
  onDesktop((d) => {
    const { gsap } = window;
    if (!gsap) return;
    const wrap = document.createElement('div');
    wrap.className = 'hero__marquee';
    wrap.setAttribute('aria-hidden', 'true');
    const rows = MQ_ROWS.map(({ text, cls, dir }) => {
      const row = document.createElement('div');
      row.className = `hero__mrow ${cls}`;
      const track = document.createElement('div');
      track.className = 'hero__mtrack';
      row.appendChild(track);
      wrap.appendChild(row);
      return { row, track, text, dir, anim: null, reps: 0 };
    });
    stage.insertBefore(wrap, photo);
    // `live` goes false before the loops are cancelled: the context revert that follows re-renders the direction ramp
    // (its onUpdate calls sync), and pause() on a cancelled loop with a negative rate throws (WAAPI: infinite end)
    let live = true;
    d.cleanup(() => { live = false; rows.forEach((r) => r.anim && r.anim.cancel()); wrap.remove(); });

    // the loops run only while the hero is on screen AND the rows have started to fade in (0.35 H): at rest they sit
    // at opacity 0 behind the full-bleed cover, and running them there costs compositor work on the first view
    let visible = true, shown = false, rate = 1;
    const running = () => visible && shown;
    // two identical halves, each at least 1.25 stage widths long; the loop moves by one half
    const build = () => {
      if (!live) return;
      const W = stage.getBoundingClientRect().width;
      rows.forEach((r) => {
        const probe = document.createElement('span'); // one phrase, measured in place (fonts may have changed)
        probe.textContent = r.text;
        r.track.appendChild(probe);
        const one = probe.getBoundingClientRect().width || 1;
        probe.remove();
        const reps = Math.max(1, Math.ceil((1.25 * W) / one));
        if (reps === r.reps && r.anim) return;
        r.reps = reps;
        const half = r.text.repeat(reps);
        r.track.textContent = '';
        for (let i = 0; i < 2; i++) { const s = document.createElement('span'); s.textContent = half; r.track.appendChild(s); }
        const halfW = one * reps;
        const kf = r.dir > 0
          ? [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }]
          : [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }];
        const duration = (halfW / MQ_SPEED) * 1000;
        if (r.anim) r.anim.cancel();
        r.anim = r.track.animate(kf, { duration, iterations: Infinity, easing: 'linear' });
        r.anim.currentTime = duration * 10000; // deep into the loop: a negative rate (scrolling up) never reaches 0
        r.anim.playbackRate = rate;
        if (!running()) r.anim.pause();
      });
    };
    build();
    const sync = () => rows.forEach((r) => { if (live && r.anim) { r.anim.playbackRate = rate; if (running()) r.anim.play(); else r.anim.pause(); } });
    const fading = (self) => { const on = self.progress > 0; if (on !== shown) { shown = on; sync(); } };
    d.io((entries) => { visible = entries[entries.length - 1].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
    if (window.ScrollTrigger) {
      window.ScrollTrigger.addEventListener('refresh', build);
      d.cleanup(() => window.ScrollTrigger.removeEventListener('refresh', build));
    }

    d.add(() => {
      const H = () => stage.offsetHeight;
      const at = (f) => () => `top+=${(f * H()).toFixed(1)} top`;
      // desktop stage colour (css: --hero-bg-d over --hero-bg at >= 992): through the warm Tobacco midpoint by 0.35 H
      // and into Mahogany-deep by 0.65 H, so the khaki in-between is brief and the marquee runs on the dark stage
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: at(1), scrub: true, invalidateOnRefresh: true } })
        .fromTo(hero, { '--hero-bg-d': '#F1EADA' }, { '--hero-bg-d': '#B59E7D', duration: 0.35, ease: 'power1.in', immediateRender: true }, 0)
        .to(hero, { '--hero-bg-d': '#4D342D', duration: 0.3, ease: 'power1.out' }, 0.35)
        .to({}, { duration: 0.35 }, 0.65);
      gsap.fromTo(wrap, { opacity: 0 }, {
        opacity: 1, ease: 'none', immediateRender: true,
        scrollTrigger: { trigger: hero, start: at(0.35), end: at(0.7), scrub: true, invalidateOnRefresh: true, onUpdate: fading, onRefresh: fading },
      });
      rows.forEach(({ row, dir }) => {
        const amp = () => MQ_DRIFT * stage.getBoundingClientRect().width * dir;
        gsap.fromTo(row, { x: () => amp() }, {
          x: () => -amp(), ease: 'none', immediateRender: true,
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        });
      });
      // direction follows the scroll: ramp both rows' rate to ±1 over 400 ms
      const proxy = { rate: 1 };
      const ramp = gsap.quickTo(proxy, 'rate', { duration: 0.4, ease: 'power1.inOut', onUpdate: () => { rate = proxy.rate; sync(); } });
      const lenis = getLenis();
      if (lenis) {
        let dir = 1;
        const onScroll = (l) => { if (l.direction && l.direction !== dir) { dir = l.direction; ramp(dir); } };
        const off = lenis.on('scroll', onScroll);
        d.cleanup(typeof off === 'function' ? off : () => { try { lenis.off('scroll', onScroll); } catch (_) { /* gone */ } });
      }
    });
  }, { motion: true, name: 'hero-marquee' });
}
