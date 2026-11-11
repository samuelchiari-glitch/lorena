/**
 * signature.js: constant-pen-speed draw timelines for the monoline signature (spec §7.3).
 * OWNER: hero section builder (the footer only calls playSignature()).
 *
 * The SVG paths come from scripts/make-signature.mjs and are pasted inline twice in site.html
 * (.sig--hero, .sig--footer). Stroke width is in viewBox units; never use vector-effect.
 * Static state (no JS / reduced motion): paths fully drawn, no dash properties in CSS.
 *
 * Exports:
 *   signatureTimeline(svg, {penLift})   PAUSED timeline, duration = 1 + penLift * (n-1): every path's
 *                                       dash set to its length (undrawn) and drawn in writing order
 *                                       at constant pen speed. Hero: scrub it (TODO hero builder).
 *   playSignature(svg, {duration=1.8, ease='power1.inOut', paused=false})
 *                                       footer one-shot: returns { tl, cleanup }. tl is a 1.8 s timeline
 *                                       (power1.inOut over the constant-speed path set); cleanup() clears
 *                                       the dash props (back to the static, fully drawn state).
 *                                       site.js arms it with armReveal(svg, () => playSignature(svg,{paused:true}),
 *                                       { start: 'top 80%' }).
 *   clearSignature(svg)                 remove dash props.
 * Module contract: boot(ctx), ready(ctx), finish().
 */

export function signatureTimeline(svg, { penLift = 0.04 } = {}) {
  const { gsap } = window;
  const paths = [...svg.querySelectorAll('path')];
  const lens = paths.map((p) => p.getTotalLength());
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const tl = gsap.timeline({ paused: true });
  let at = 0;
  paths.forEach((p, i) => {
    gsap.set(p, { strokeDasharray: lens[i], strokeDashoffset: lens[i] }); // set only when armed
    const d = lens[i] / total; // constant pen speed
    tl.to(p, { strokeDashoffset: 0, duration: d, ease: 'none' }, at);
    at += d + penLift;
  });
  return tl;
}

export function clearSignature(svg) {
  if (!svg || !window.gsap) return;
  window.gsap.set(svg.querySelectorAll('path'), { clearProps: 'strokeDasharray,strokeDashoffset' });
}

export function playSignature(svg, { duration = 1.8, ease = 'power1.inOut', paused = false } = {}) {
  const { gsap } = window;
  const inner = signatureTimeline(svg);
  const tl = gsap.timeline({ paused: true });
  tl.to(inner, { progress: 1, duration, ease });
  if (!paused) tl.play();
  return { tl, cleanup: () => clearSignature(svg) };
}

export function boot() {}
export function ready() {
  // TODO(hero): the hero scrub (0.55 H -> 1.15 H, scrub .5, velocity snap) lives in hero.js or here.
}
export function finish() {}
