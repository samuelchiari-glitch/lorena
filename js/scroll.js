/**
 * scroll.js: smooth scroll (Lenis + ScrollTrigger, spec §5), lookahead arming (§4.0),
 * the arming watchdog and finishAll(). Shared by every module.
 *
 * API (all safe to call in any mode; motion-only helpers no-op without .motion):
 *   isMotion()                    true while <html> has .motion (GSAP, ScrollTrigger, SplitText, Lenis
 *                                 present and reduced motion off). Re-check it: finishAll() can drop it.
 *   initScroll()                  motion mode only (site.js calls it): Lenis + ScrollTrigger, window.lenis.
 *   getLenis()                    the Lenis instance, or null (static modes / after finishAll).
 *   makeIO(cb, opts)              IntersectionObserver with root: document (falls back to the implicit
 *                                 root if the browser refuses it). Use it for EVERY observer that needs
 *                                 a rootMargin: the implicit root ignores rootMargin inside the Artifact iframe.
 *   onApproach(el, arm, {ahead=.75, onSkip})
 *                                 calls arm(el) once, when el comes within `ahead` viewports below the fold.
 *                                 Guard: if el's top is already < innerHeight (visible, or above), arm is
 *                                 NOT called (onSkip is) and el keeps its final state. Returns a cancel fn.
 *   armReveal(el, build, {start='top 85%', trigger, ahead=.75, onSkip})
 *                                 the standard reveal: onApproach -> build(el) inside scope() -> data-armed
 *                                 -> ScrollTrigger {once} at `start` plays it -> on complete: cleanup,
 *                                 data-armed removed. build(el) returns a PAUSED gsap timeline already in
 *                                 its from-state, or { tl, cleanup }. Motion mode only.
 *   track(el, tl, cleanup, {due}) register an element you armed yourself (sets data-armed); the watchdog
 *                                 and finishAll() can then force it. release(el) when it has played.
 *                                 due(rect, innerHeight) (optional): true once the element should have
 *                                 played (default: as soon as it is in view); the watchdog counts from then.
 *   release(el)                   un-arm (removes data-armed, runs cleanup once).
 *   scope(fn)                     run fn inside the shared gsap.context(): every tween, ScrollTrigger and
 *                                 SplitText created in it is reverted by finishAll(). Returns fn's result.
 *   onFinish(fn)                  register a callback for finishAll() (jump to final state, drop inline styles).
 *   finishAll()                   armed timelines -> progress 1, finishers, revert the gsap context, kill
 *                                 ScrollTriggers, destroy Lenis, remove .motion, motion.js finish(document),
 *                                 then dispatch `site:static` on document, and keep the view on the content it
 *                                 showed (the static layout is shorter). Runs on beforeprint, on reduced
 *                                 motion turning on, and when boot throws.
 *   refresh()                     debounced ScrollTrigger.refresh().
 */
import { finish as motionFinish } from './motion.js';

const root = document.documentElement;
export const isMotion = () => root.classList.contains('motion');

let lenis = null;
let ctx = null;
let watchdogTimer = 0;
let finished = false;
const finishers = new Set();
const armed = new Map(); // el -> { el, tl, cleanup, played, seen, done }

export const getLenis = () => lenis;

/* ------------------------------------------------------------------ IntersectionObserver with root: document */

export function makeIO(cb, opts = {}) {
  const { root: _ignored, ...rest } = opts;
  try {
    return new IntersectionObserver(cb, { ...rest, root: document });
  } catch (_) {
    return new IntersectionObserver(cb, rest); // Safari < 14.1: implicit root (the arming guard keeps it safe)
  }
}

/* ------------------------------------------------------------------ Lenis + ScrollTrigger (§5) */

const raf = (t) => { if (lenis) lenis.raf(t * 1000); };

export function initScroll() {
  const { gsap, ScrollTrigger, Lenis } = window;
  const isIOS = /iP(hone|ad|od)/.test(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  const SYNC_TOUCH = new URLSearchParams(location.search).has('synctouch') ? true : !isIOS;
  lenis = new Lenis({
    lerp: 0.1, smoothWheel: true, wheelMultiplier: 1,
    syncTouch: SYNC_TOUCH, touchMultiplier: 1.25, syncTouchLerp: 0.075,
    autoResize: true, infinite: false, autoRaf: false,
    anchors: false, // in-page links go through ui.js (§4.0)
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({ ignoreMobileResize: true });
  window.lenis = lenis;

  ScrollTrigger.addEventListener('scrollEnd', watchdog);
  watchdogTimer = setInterval(watchdog, 1000);
  addEventListener('beforeprint', finishAll);
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const onRM = () => { if (rm.matches) finishAll(); };
  if (rm.addEventListener) rm.addEventListener('change', onRM); else if (rm.addListener) rm.addListener(onRM);
  return lenis;
}

let refreshTimer = 0;
export function refresh() {
  if (!isMotion() || !window.ScrollTrigger) return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => window.ScrollTrigger.refresh(), 60);
}

/* ------------------------------------------------------------------ gsap.context scope */

export function scope(fn) {
  if (!window.gsap) return fn();
  if (!ctx) ctx = window.gsap.context(() => {});
  let out;
  ctx.add(() => { out = fn(); }); // never return a function from add(): it would be kept as a revert callback
  return out;
}

export function onFinish(fn) {
  finishers.add(fn);
  return () => finishers.delete(fn);
}

/* ------------------------------------------------------------------ arm on approach (§4.0) */

const approachIOs = new Map(); // ahead -> IO
const approachCbs = new WeakMap(); // el -> [{ io, arm, onSkip }]

function onApproachEntries(entries, io) {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    io.unobserve(el);
    const all = approachCbs.get(el) || [];
    const mine = all.filter((x) => x.io === io);
    approachCbs.set(el, all.filter((x) => x.io !== io));
    const visible = el.getBoundingClientRect().top < innerHeight;
    for (const { arm, onSkip } of mine) {
      try {
        if (visible) { if (onSkip) onSkip(el); }
        else arm(el);
      } catch (err) {
        console.error('[scroll] arm failed', err);
      }
    }
  }
}

export function onApproach(el, arm, { ahead = 0.75, onSkip } = {}) {
  if (!el || finished) return () => {};
  if (typeof IntersectionObserver === 'undefined') { if (onSkip) onSkip(el); return () => {}; }
  const key = String(ahead);
  let io = approachIOs.get(key);
  if (!io) {
    io = makeIO(onApproachEntries, { rootMargin: `0px 0px ${Math.round(ahead * 100)}% 0px`, threshold: 0 });
    approachIOs.set(key, io);
  }
  const rec = { io, arm, onSkip };
  const list = approachCbs.get(el) || [];
  list.push(rec);
  approachCbs.set(el, list);
  io.observe(el);
  return () => {
    const l = (approachCbs.get(el) || []).filter((x) => x !== rec);
    approachCbs.set(el, l);
    if (!l.some((x) => x.io === io)) io.unobserve(el);
  };
}

/* ------------------------------------------------------------------ armed registry + watchdog */

function complete(entry) {
  if (entry.done) return;
  entry.done = true;
  armed.delete(entry.el);
  entry.el.removeAttribute('data-armed');
  if (entry.cleanup) {
    try { entry.cleanup(); } catch (err) { console.error('[scroll] cleanup failed', err); }
  }
}

function force(entry) {
  try { entry.tl && entry.tl.progress(1); } catch (_) { /* ignore */ }
  complete(entry);
}

export function track(el, tl, cleanup, { due } = {}) {
  const prev = armed.get(el);
  if (prev) complete(prev);
  const entry = { el, tl, cleanup, due, played: false, seen: 0, done: false };
  armed.set(el, entry);
  el.setAttribute('data-armed', '');
  return entry;
}

export function release(el) {
  const entry = armed.get(el);
  if (entry) complete(entry);
  else el.removeAttribute('data-armed');
}

/** Mark a tracked element as played (the watchdog then leaves it alone). */
export function markPlayed(el) {
  const entry = armed.get(el);
  if (entry) entry.played = true;
}

export function armReveal(el, build, { start = 'top 85%', trigger, ahead = 0.75, onSkip } = {}) {
  if (!el || !isMotion()) return;
  onApproach(el, () => {
    if (!isMotion()) return;
    scope(() => {
      const res = build(el);
      if (!res) return;
      const tl = res.tl || res;
      const entry = track(el, tl, res.cleanup);
      if (typeof tl.eventCallback === 'function') {
        const prev = tl.eventCallback('onComplete');
        tl.eventCallback('onComplete', function onDone(...args) {
          if (prev) prev.apply(this, args);
          complete(entry);
        });
      }
      window.ScrollTrigger.create({
        trigger: trigger || el,
        start,
        once: true,
        onEnter: () => {
          entry.played = true;
          tl.play();
        },
      });
    });
  }, { ahead, onSkip });
}

function watchdog() {
  if (!armed.size) return;
  const now = performance.now();
  const ih = innerHeight;
  let pending = false;
  armed.forEach((entry) => {
    const r = entry.el.getBoundingClientRect();
    const inView = r.top < ih && r.bottom > 0;
    if (!inView) { entry.seen = 0; return; }
    if (entry.played) {
      // played but stalled (e.g. a hidden tab): give it its full duration, then force
      if (!entry.seen) entry.seen = now;
      const dur = entry.tl && typeof entry.tl.totalDuration === 'function' ? entry.tl.totalDuration() * 1000 : 0;
      if (now - entry.seen > dur + 2000) force(entry);
      return;
    }
    if (entry.due && !entry.due(r, ih)) { entry.seen = 0; pending = true; return; }
    if (!entry.seen) { entry.seen = now; pending = true; }
    else if (now - entry.seen > 1200) force(entry);
    else pending = true;
  });
  if (pending) setTimeout(watchdog, 1250);
}

/* ------------------------------------------------------------------ finishAll */

/**
 * finishAll() changes layout above the viewport: the hero track collapses from 220svh to its static 100svh, the logo
 * marquee becomes the wrapping grid. Keep the view on the same content. Call before anything changes; the returned
 * function restores the view once the static layout is in place. In the hero track (the sticky stage holds the
 * viewport's centre line) the view lands where the stage's own scroll-away had got to (the top while the card
 * held); elsewhere the block crossing the centre line keeps its offset. Lenis is gone by then: a plain window
 * scroll (html has scroll-behavior: auto, so it is instant).
 */
function viewKeeper() {
  const y0 = scrollY;
  const mid = innerHeight / 2;
  const to = (top) => { if (Math.abs(top - scrollY) >= 1) window.scrollTo(0, top); };
  const hero = document.querySelector('.hero');
  if (hero && hero.getBoundingClientRect().bottom > mid) {
    const before = hero.offsetHeight;
    const top = hero.getBoundingClientRect().top + y0;
    return () => { if (y0 > top) to(Math.max(top, y0 - Math.max(0, before - hero.offsetHeight))); };
  }
  // the deepest block crossing the centre line (a section's padding belongs to the section itself)
  const blocks = [...document.querySelectorAll('main > section, main > section > *, main article > *, footer, footer > *')].reverse();
  const el = blocks.find((b) => { const r = b.getBoundingClientRect(); return r.height > 0 && r.top <= mid && r.bottom > mid; });
  if (!el) return () => {};
  const t0 = el.getBoundingClientRect().top;
  return () => to(scrollY + el.getBoundingClientRect().top - t0);
}

export function finishAll() {
  if (finished) return;
  finished = true;
  const keepView = viewKeeper();
  clearInterval(watchdogTimer);
  const { gsap, ScrollTrigger } = window;
  armed.forEach(force);
  finishers.forEach((fn) => {
    try { fn(); } catch (err) { console.error('[scroll] finisher failed', err); }
  });
  try { if (ctx) ctx.revert(); } catch (err) { console.error('[scroll] revert failed', err); }
  ctx = null;
  try { if (ScrollTrigger) ScrollTrigger.getAll().forEach((st) => st.kill()); } catch (_) { /* ignore */ }
  try { if (gsap) gsap.ticker.remove(raf); } catch (_) { /* ignore */ }
  if (lenis) {
    try { lenis.destroy(); } catch (_) { /* ignore */ }
    lenis = null;
  }
  try { delete window.lenis; } catch (_) { window.lenis = undefined; }
  approachIOs.forEach((io) => io.disconnect());
  approachIOs.clear();
  root.classList.remove('motion', 'lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling');
  try { motionFinish(document); } catch (_) { /* ignore */ }
  document.dispatchEvent(new CustomEvent('site:static'));
  try { keepView(); } catch (_) { /* ignore */ }
}
