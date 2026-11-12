/**
 * signature.js: Lorena's real signature, written stroke by stroke (spec §7, the kit in assets/signature/).
 * OWNER: hero section builder. The hero scrub is set up by hero.js (it owns the hero triggers); the footer
 * only calls playSignature() (site.js arms it on approach and plays it at `top 80%`).
 *
 * The artwork is a filled outline (.ink), so it cannot be dashed. It is revealed through a <mask> in which two
 * hand-traced centre lines (.pen, in writing order: 1 = L, 2 = M) are drawn with the dash trick; black
 * .pen-guard patches keep a wide pen from uncovering a crossing stroke before it is written (static guards sit
 * between the pens; the 34 timed ones, data-pen + data-release, lift as their pen passes). Only .pen paths are
 * ever dashed. assets/signature/README.md has the details; this is its recipe, wired to GSAP and the module contract.
 *
 * Markup (site.html, two inline copies: a mask only animates in the page's DOM): each copy has its own mask id
 * (lm-sig-mask-hero, lm-sig-mask-footer), and its .ink carries NO mask attribute. So without JS, under reduced
 * motion and after a draw, the signature is the untouched artwork; the mask is attached only while a draw is
 * armed or running (0 <= progress < 1) and detached at 1. Stroke widths are in viewBox units: never vector-effect.
 *
 * Exports:
 *   createSignature(svg, {pause=.045})   the kit controller: { render(p), clear() }.
 *                         render(p) is idempotent: pens dashed to p at constant pen speed (each pen's share = its
 *                         length; a pen lift of pause × total between them), guards lifted, mask on below 1, off at 1.
 *                         A pen that has not started is visibility:hidden (no round-cap dot). The site draws no pen
 *                         tip, so the kit's penPoint() is not carried here (lab/signature.html and the kit README
 *                         keep the full recipe).
 *   signatureTimeline(svg, {penLift=.045}) PAUSED GSAP timeline, duration 1, ease none: progress 0 -> 1 writes the
 *                         signature. It arms the copy at once (render(0): nothing inked). Hero: scrubbed.
 *   playSignature(svg, {duration=2.2, ease='none', paused=false})
 *                         footer one-shot: returns { tl, cleanup }. Linear = constant pen speed (kit: 2.2 s);
 *                         cleanup() puts the static artwork back (pens undashed, mask detached).
 *   clearSignature(svg)   back to the static markup state; later renders of that controller are no-ops.
 *   inkedFraction(svg)    drawn pen length / total pen length, 0..1 (1 when no mask is attached). Tests, debugging.
 * Module contract: boot(ctx), ready(ctx), finish() (finishAll: every armed copy back to the static artwork).
 */

const live = new Map(); // svg -> controller (armed copies)

export function createSignature(svg, { pause = 0.045 } = {}) {
  const ink = svg.querySelector('.ink');
  const mask = svg.querySelector('mask');
  const pens = [...svg.querySelectorAll('.pen')];
  if (!ink || !mask || !mask.id || !pens.length) return null;
  const maskRef = `url(#${mask.id})`;
  const lens = pens.map((pen) => pen.getTotalLength());
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const gap = pause * total;                    // pen lift, in length units
  const span = total + gap * (pens.length - 1); // the whole timeline, in length units
  const guards = [...svg.querySelectorAll('.pen-guard[data-release]')]
    .map((g) => [g, Number(g.dataset.pen) - 1, Number(g.dataset.release)]);
  let dead = false;

  const prev = live.get(svg);
  if (prev) prev.clear();

  function render(progress) {
    if (dead) return;
    const p = Math.min(1, Math.max(0, Number(progress) || 0));
    let t = p * span;
    const drawn = pens.map((pen, i) => {
      const f = Math.min(1, Math.max(0, t / lens[i]));
      t -= lens[i] + gap;
      // one dash as long as the pen, then a longer gap: no second dash can wrap in
      pen.style.strokeDasharray = `${lens[i]}px ${lens[i] + 20}px`;
      pen.style.strokeDashoffset = `${lens[i] * (1 - f)}px`;
      pen.style.visibility = f > 0 ? 'visible' : 'hidden'; // a zero-length dash would still paint a round cap
      return f * lens[i];
    });
    for (const [g, i, at] of guards) g.style.visibility = drawn[i] < at ? 'visible' : 'hidden';
    // fully written: drop the mask, so the final frame is the untouched artwork
    if (p >= 1) ink.removeAttribute('mask');
    else if (ink.getAttribute('mask') !== maskRef) ink.setAttribute('mask', maskRef);
  }

  function clear() {
    dead = true;
    const unstyle = (el, ...props) => {
      props.forEach((prop) => el.style.removeProperty(prop));
      if (!el.getAttribute('style')) el.removeAttribute('style');
    };
    pens.forEach((pen) => unstyle(pen, 'stroke-dasharray', 'stroke-dashoffset', 'visibility'));
    guards.forEach(([g]) => unstyle(g, 'visibility'));
    ink.removeAttribute('mask');
    if (live.get(svg) === ctl) live.delete(svg);
  }

  const ctl = { render, clear };
  live.set(svg, ctl);
  return ctl;
}

export function signatureTimeline(svg, { penLift = 0.045 } = {}) {
  const { gsap } = window;
  const sig = createSignature(svg, { pause: penLift });
  const state = { p: 0 };
  const tl = gsap.timeline({ paused: true });
  if (!sig) return tl;
  sig.render(0); // armed: nothing inked until the timeline moves
  tl.to(state, { p: 1, duration: 1, ease: 'none', onUpdate: () => sig.render(state.p) });
  return tl;
}

export function playSignature(svg, { duration = 2.2, ease = 'none', paused = false } = {}) {
  const { gsap } = window;
  const inner = signatureTimeline(svg);
  const tl = gsap.timeline({ paused: true });
  tl.to(inner, { progress: 1, duration, ease });
  if (!paused) tl.play();
  return { tl, cleanup: () => clearSignature(svg) };
}

export function clearSignature(svg) {
  const ctl = svg && live.get(svg);
  if (ctl) ctl.clear();
}

export function inkedFraction(svg) {
  const ink = svg.querySelector('.ink');
  if (!ink || !ink.hasAttribute('mask')) return 1;
  let inked = 0, all = 0;
  svg.querySelectorAll('.pen').forEach((pen) => {
    const len = pen.getTotalLength();
    const cs = getComputedStyle(pen);
    const off = parseFloat(cs.strokeDashoffset) || 0;
    all += len;
    if (cs.visibility !== 'hidden') inked += Math.max(0, len - Math.min(len, off));
  });
  return all ? inked / all : 1;
}

export function boot() {}
export function ready() {}
export function finish() {
  // finishAll(): every armed copy back to the static artwork (the gsap context reverts only the tweens)
  [...live.values()].forEach((ctl) => ctl.clear());
}
