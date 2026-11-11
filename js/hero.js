/**
 * hero.js: hero timeline + arch -> card geometry (spec §4.1), the hero signature scrub (§7.3) and the
 * hand-over to the Instagram profile screen in the dark band (§4.2). OWNER: hero section builder.
 *
 * Static modes: nothing here runs. The static hero (100svh cover, arch photo, lockup) is pure CSS in
 * site.css (=== section: hero ===) and is complete at rest; the load settle is a CSS animation in
 * css/hero.css (first paint, off under reduced motion).
 *
 * Motion mode (ready): one sticky stage (css/hero.css: .motion .hero{height:220svh}), H = stage.offsetHeight,
 * every range function-based so a refresh re-reads it (never innerHeight):
 *   0 → 1.0 H    photo clip arch → card (boxToInset fromTo, 12 px values, tweened as --hero-clip on
 *                .hero__photo, see below), img y/scale, shade .12,
 *                --hero-bg Vanilla → Mahogany-deep on .hero (painted by .hero and the stage)    power1.inOut, scrub
 *   0 → 0.6 H    copy clip ellipse wipe + yPercent −20, sans chars yPercent −100 (stagger .02)   power3.out, scrub
 *   0.55 → 1.15 H signature draw at constant pen speed, + the Lando snap on a fast exit            scrub .5
 *   0.7 → 1.0 H  handle chars yPercent 100 → 0 (stagger .02)                                    power3.out, scrub
 * The header (backing, hide/show, theme at 0.5 H) is ui.js's; the theme switch is .hero__dark-zone.
 *
 * Exports: restGeometry(stage), cardGeometry({W,H}), boxToInset(geo,{W,H}) (spec helpers, also used
 * by tests), boot(ctx), ready(ctx), finish().
 */
import { isMotion, scope, getLenis, onApproach } from './scroll.js';
import { splitLockup } from './reveals.js';
import { signatureTimeline, clearSignature } from './signature.js';
import { renderScreen } from './insights.js';

export function restGeometry(stage) {
  const s = stage.getBoundingClientRect(), arch = stage.querySelector('.hero__arch');
  const a = arch.getBoundingClientRect(), cs = getComputedStyle(arch);
  const [rx, ry = rx] = cs.borderTopLeftRadius.split(' ').map(parseFloat);
  return { W: s.width, H: s.height, imgY: parseFloat(cs.paddingTop) || 0,
           box: { top: a.top - s.top, left: a.left - s.left, right: a.right - s.left, bottom: a.bottom - s.top },
           r: { rx, ry, rxb: 0, ryb: 0 } };
}

export function cardGeometry({ W, H }) {
  const h = 0.58 * H, w = 0.575 * h, left = (W - w) / 2, top = 0.2 * H;
  return { box: { top, left, right: left + w, bottom: top + h }, r: { rx: 28, ry: 28, rxb: 28, ryb: 28 } };
}

const px = (n) => n.toFixed(2) + 'px';
export function boxToInset({ box, r }, { W, H }) {
  return `inset(${px(box.top)} ${px(W - box.right)} ${px(H - box.bottom)} ${px(box.left)} round `
       + `${px(r.rx)} ${px(r.rx)} ${px(r.rxb)} ${px(r.rxb)} / ${px(r.ry)} ${px(r.ry)} ${px(r.ryb)} ${px(r.ryb)})`;
}

const SNAP_VELOCITY = 100; // Lenis px/frame: a fling, not a scroll (Lando §6.1)
let heroEl = null;
let liveSplits = [];

export function boot() {}

export function ready(ctx) {
  if (!ctx.motion || !isMotion() || !window.gsap) return;
  setupHero();
  setupProfile(ctx.data && ctx.data.metrics);
}

export function finish() {
  // finishAll(): scope() reverts every tween, ScrollTrigger and SplitText; drop what is left of ours
  liveSplits.forEach((s) => { try { s.revert(); } catch (_) { /* already reverted */ } });
  liveSplits = [];
  if (heroEl) {
    heroEl.classList.remove('hero--live');
    clearSignature(heroEl.querySelector('.sig--hero'));
  }
}

/* ------------------------------------------------------------------ hero scrub (§4.1) */

function setupHero() {
  const hero = document.querySelector('.hero');
  const stage = hero && hero.querySelector('.hero__stage');
  const photo = stage && stage.querySelector('.hero__photo');
  if (!stage || !photo || !stage.querySelector('.hero__arch')) return;
  heroEl = hero;
  const { gsap } = window;
  const img = photo.querySelector('img');
  const shade = photo.querySelector('.hero__shade');
  const copy = stage.querySelector('.hero__copy');
  const h1 = copy && copy.querySelector('h1');
  const handle = stage.querySelector('.hero__handle');
  const sig = stage.querySelector('.sig--hero');
  const H = () => stage.offsetHeight;
  const dims = () => ({ W: stage.getBoundingClientRect().width, H: H() });
  const at = (f) => () => `top+=${(f * H()).toFixed(1)} top`;

  scope(() => {
    // 0 → 1.0 H: arch → card, image, shade, background (power1.inOut, scrub)
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
    if (img) main.fromTo(img, { y: () => restGeometry(stage).imgY, yPercent: 0, scale: 1.06 }, { y: 0, yPercent: 0, scale: 0.92 }, 0);
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

  hero.classList.add('hero--live');
}

/* ------------------------------------------------------------------ Instagram profile hand-over (§4.2) */

/**
 * The profile screen rests as insights.js's static render (data-ig-static). On approach (¾ viewport
 * ahead, root: document) it is re-rendered with motion (data-shot="flash"), so motion.js arms it below
 * the fold and plays the drop-in + count-ups on entry. The arming guard in onApproach skips it if it is
 * already in view. data-ig-static is dropped right away (it only matters at render time) so that the
 * generic screen upgrade in proof.js leaves this one screen to us: exactly one upgrade path.
 */
function setupProfile(metrics) {
  const el = document.querySelector('#instagram [data-ig-screen="profile"]');
  if (!el || !metrics || !el.hasAttribute('data-ig-static')) return;
  if (el.getAttribute('data-ig-rendered') !== '') return; // static render not in yet: leave it static
  el.removeAttribute('data-ig-static');
  el.setAttribute('data-ig-upgrade', 'approach');
  onApproach(el, () => {
    if (!isMotion() || el.getAttribute('data-ig-upgrade') !== 'approach') return;
    el.setAttribute('data-ig-upgrade', 'done');
    el.setAttribute('data-ig-flash', '');
    renderScreen(el, metrics);
  });
}
