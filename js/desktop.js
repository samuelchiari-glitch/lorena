/**
 * desktop.js: the matchMedia lifecycle for everything desktop (docs/desktop-spec.md §3.1). Mobile never runs it.
 *
 *   onMedia(query, setup, { motion = false, name })   set up while `query` matches (and, with motion: true, while
 *                                 the page is in motion mode); torn down cleanly when it stops matching. Returns
 *                                 an unregister function.
 *   onDesktop(setup, opts)        onMedia(DESKTOP, setup, opts)
 *   isDesktop()                   matchMedia(DESKTOP).matches, for quick checks inside callbacks
 *   rescanDesktop(root)           arm the desktop reveals (data-d-*) of markup inserted after ready()
 *   DESKTOP, TABLET, FINE         the media queries
 *
 * setup(d) receives a registration context and may return a teardown function:
 *   d.add(fn)                     run fn inside this registration's own gsap.context: every tween, timeline,
 *                                 ScrollTrigger and SplitText it creates is reverted (killed, inline styles
 *                                 restored) on teardown. Returns fn's result. Never return a function from fn.
 *   d.arm(el, build, opts)        scroll.js armReveal (armed on approach, never while visible) in this context;
 *                                 on teardown it is cancelled or forced to its final state and cleaned up. An
 *                                 element that already played is not armed again after a resize round trip.
 *   d.on(target, type, fn, opts)  addEventListener, removed on teardown
 *   d.io(cb, opts)                scroll.js makeIO (root: document), disconnected on teardown; returns the observer
 *   d.cleanup(fn)                 any other undo step (run in reverse order)
 *   d.refresh()                   debounced ScrollTrigger.refresh()
 *
 * Media changes are coalesced to one animation frame: every registration whose condition flipped is torn down or
 * set up (never twice), then ScrollTrigger refreshes once. finishAll() (document `site:static`) tears down every
 * motion registration; the others keep running in static mode.
 */
import { armReveal, isMotion, makeIO, refresh } from './scroll.js';

export const DESKTOP = '(min-width: 992px)';
export const TABLET = '(min-width: 768px) and (max-width: 991.98px)';
export const FINE = '(hover: hover) and (pointer: fine)';

const deskMQ = matchMedia(DESKTOP);
export const isDesktop = () => deskMQ.matches;

const regs = [];
const played = new WeakSet();
let rafId = 0;
let scanFn = null; // reveals.scanDesktop, wired by site.js (keeps this module free of a reveals.js import cycle)
let liveScan = null; // the registration context of the running desktop scan

function listen(mq, fn) {
  if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn);
  return () => { if (mq.removeEventListener) mq.removeEventListener('change', fn); else if (mq.removeListener) mq.removeListener(fn); };
}

function makeContext(reg) {
  const { gsap } = window;
  const gctx = gsap ? gsap.context(() => {}) : null;
  const undo = [];
  const d = {
    name: reg.name,
    add(fn) {
      if (!gctx) return fn();
      let out;
      gctx.add(() => { out = fn(); });
      return out;
    },
    arm(el, build, opts = {}) {
      if (!el || played.has(el)) return;
      const wrapped = (node) => {
        const res = build(node);
        if (!res) return res;
        const tl = res.tl || res;
        if (tl && typeof tl.eventCallback === 'function') {
          const prev = tl.eventCallback('onComplete');
          tl.eventCallback('onComplete', function onDone(...args) {
            played.add(node);
            if (prev) prev.apply(this, args);
          });
        }
        return res;
      };
      undo.push(armReveal(el, wrapped, { ...opts, scope: (fn) => d.add(fn) }));
    },
    on(target, type, fn, opts) {
      if (!target) return;
      target.addEventListener(type, fn, opts);
      undo.push(() => target.removeEventListener(type, fn, opts));
    },
    io(cb, opts) {
      const io = makeIO(cb, opts);
      undo.push(() => io.disconnect());
      return io;
    },
    cleanup(fn) { if (typeof fn === 'function') undo.push(fn); },
    refresh,
    _teardown() {
      for (let i = undo.length - 1; i >= 0; i--) {
        try { undo[i](); } catch (err) { console.error(`[desktop] ${reg.name || 'registration'} teardown failed`, err); }
      }
      undo.length = 0;
      try { if (gctx) gctx.revert(); } catch (err) { console.error('[desktop] revert failed', err); }
    },
  };
  return d;
}

const wanted = (reg) => reg.mq.matches && (!reg.motion || isMotion());

function start(reg) {
  const d = makeContext(reg);
  reg.live = d;
  try {
    const out = reg.setup(d);
    if (typeof out === 'function') d.cleanup(out);
  } catch (err) {
    console.error(`[desktop] ${reg.name || 'registration'} setup failed`, err);
  }
}

function stop(reg) {
  const d = reg.live;
  reg.live = null;
  if (d) d._teardown();
}

/** Bring every registration in line with the current media/mode; refresh ScrollTrigger once if anything changed. */
function sync() {
  rafId = 0;
  let changed = false;
  // tear down first (reverse registration order), then set up in registration order
  for (let i = regs.length - 1; i >= 0; i--) {
    const r = regs[i];
    if (r.live && !wanted(r)) { stop(r); changed = true; }
  }
  regs.forEach((r) => { if (!r.live && wanted(r)) { start(r); changed = true; } });
  if (changed) refresh();
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(sync);
}

export function onMedia(query, setup, { motion = false, name = '' } = {}) {
  const reg = { mq: matchMedia(query), setup, motion, name, live: null };
  regs.push(reg);
  const unlisten = listen(reg.mq, schedule);
  if (wanted(reg)) start(reg);
  return () => {
    unlisten();
    const i = regs.indexOf(reg);
    if (i >= 0) regs.splice(i, 1);
    if (reg.live) stop(reg);
  };
}

export const onDesktop = (setup, opts) => onMedia(DESKTOP, setup, opts);

// finishAll(): motion registrations stop at once (their armed reveals were already forced by scroll.js)
document.addEventListener('site:static', () => {
  for (let i = regs.length - 1; i >= 0; i--) { if (regs[i].live && !wanted(regs[i])) stop(regs[i]); }
});

/** site.js: run the generic desktop reveals (reveals.scanDesktop) in their own motion registration. */
export function initDesktopReveals(scanDesktop) {
  scanFn = scanDesktop;
  onDesktop((d) => {
    liveScan = d;
    scanFn(d, document);
    return () => { liveScan = null; };
  }, { motion: true, name: 'reveals' });
}

/** Arm the data-d-* reveals of markup inserted after ready() (no-op below 992 or in static mode). */
export function rescanDesktop(root) {
  if (liveScan && scanFn && root) scanFn(liveScan, root);
}
