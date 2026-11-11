/**
 * signature.js: constant-pen-speed draw timelines for the monoline signature (spec §7.3).
 * OWNER: hero section builder. The hero scrub is set up by hero.js (it owns the hero triggers);
 * the footer only calls playSignature() (site.js arms it at `top 80%`).
 *
 * The SVG paths come from scripts/make-signature.mjs and are pasted inline twice in site.html
 * (.sig--hero, .sig--footer). Stroke width is in viewBox units; never use vector-effect.
 * Static state (no JS / reduced motion): paths fully drawn, no dash properties in CSS.
 *
 * Exports:
 *   signatureTimeline(svg, {penLift=.04, tip=true})
 *                         PAUSED timeline, duration = 1 + penLift * (n-1). Every path's dash is set
 *                         to its length (undrawn) and drawn in writing order at constant pen speed
 *                         (each path's share of the duration = its share of the total length).
 *                         With `tip`, a small round pen tip (a <circle class="sig__tip">) rides the
 *                         active path end while 0 < progress < 1.
 *   inkedFraction(svg)    Σ(len − dashoffset) / Σ len, 0..1 (tests and debugging).
 *   playSignature(svg, {duration=1.8, ease='power1.inOut', paused=false})
 *                         footer one-shot: returns { tl, cleanup }. tl is a 1.8 s timeline (power1.inOut
 *                         over the constant-speed path set); cleanup() clears the dash props and the tip
 *                         (back to the static, fully drawn state).
 *   clearSignature(svg)   remove dash props and the pen tip.
 * Module contract: boot(ctx), ready(ctx), finish().
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const GAP = 4;         // viewBox units (≈ 0.5 px): see signatureTimeline
const TIP_PX = 3;      // pen-tip radius in CSS px at the signature's rendered width (6 px dot, Lando's look)
const tips = new Set();

function addTip(svg) {
  let tip = svg.querySelector('.sig__tip');
  if (!tip) {
    tip = document.createElementNS(SVG_NS, 'circle');
    tip.setAttribute('class', 'sig__tip');
    tip.setAttribute('aria-hidden', 'true');
    svg.appendChild(tip);
  }
  // radius in viewBox units, from the rendered width (the stroke width is in viewBox units too)
  const vb = svg.viewBox && svg.viewBox.baseVal;
  const w = svg.getBoundingClientRect().width || 1;
  const unitsPerPx = vb && vb.width ? vb.width / w : 1;
  tip.setAttribute('r', (TIP_PX * Math.min(unitsPerPx, 12)).toFixed(1));
  tip.style.visibility = 'hidden';
  tips.add(tip);
  return tip;
}

export function signatureTimeline(svg, { penLift = 0.04, tip = true } = {}) {
  const { gsap } = window;
  const paths = [...svg.querySelectorAll('path')];
  const lens = paths.map((p) => p.getTotalLength());
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const dot = tip ? addTip(svg) : null;
  const tl = gsap.timeline({ paused: true });
  let at = 0;
  paths.forEach((p, i) => {
    // set only when armed. The dash ends GAP units before the path start (GSAP rounds px offsets, and
    // a dash ending exactly at 0 leaves a round-cap dot), and the gap is longer than the path.
    gsap.set(p, { strokeDasharray: `${lens[i]} ${lens[i] + 4 * GAP}`, strokeDashoffset: lens[i] + GAP });
    const d = lens[i] / total; // constant pen speed
    tl.to(p, { strokeDashoffset: 0, duration: d, ease: 'none' }, at);
    at += d + penLift;
  });
  if (dot) {
    // the pen sits at the end of the last path that has started (it rests there through a pen lift)
    const starts = [];
    let t = 0;
    lens.forEach((len) => { starts.push(t); t += len / total + penLift; });
    tl.eventCallback('onUpdate', () => {
      const time = tl.time(), p = tl.progress();
      if (p <= 0 || p >= 1) { dot.style.visibility = 'hidden'; return; }
      let i = 0;
      while (i < starts.length - 1 && time >= starts[i + 1]) i++;
      const drawn = Math.min(1, Math.max(0, (time - starts[i]) / (lens[i] / total)));
      const pt = paths[i].getPointAtLength(drawn * lens[i]);
      dot.setAttribute('cx', pt.x.toFixed(1));
      dot.setAttribute('cy', pt.y.toFixed(1));
      dot.style.visibility = '';
    });
  }
  return tl;
}

export function inkedFraction(svg) {
  let inked = 0, all = 0;
  svg.querySelectorAll('path').forEach((p) => {
    const len = p.getTotalLength();
    const off = parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
    all += len;
    inked += Math.max(0, len - Math.min(len, off));
  });
  return all ? inked / all : 1;
}

export function clearSignature(svg) {
  if (!svg) return;
  const tip = svg.querySelector('.sig__tip');
  if (tip) { tips.delete(tip); tip.remove(); }
  if (window.gsap) window.gsap.set(svg.querySelectorAll('path'), { clearProps: 'strokeDasharray,strokeDashoffset' });
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
export function ready() {}
export function finish() {
  // finishAll(): the gsap context reverts the dash props; the tips are plain DOM, drop them here
  tips.forEach((tip) => tip.remove());
  tips.clear();
}
