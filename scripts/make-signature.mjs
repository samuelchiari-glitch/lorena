#!/usr/bin/env node
/**
 * make-signature.mjs: emits the placeholder signature "Lorena" as a monoline SVG
 * (build spec §7.1). Paste the output inline in site.html (hero + footer).
 *
 *   node scripts/make-signature.mjs                      # <svg class="sig"> on stdout
 *   node scripts/make-signature.mjs --class "sig sig--hero"
 *
 * Glyph centre-lines: EMS Allure (SIL OFL 1.1), from the `hersheytext@2.0.0` package,
 * file svg_fonts/EMSAllure.svg (glyphs L o r e n a). Used as drawn artwork; credited in
 * assets/fonts/LICENSES.md and in the source comment in site.html.
 *
 * Steps: compose by x-advance, flip y, smooth each polyline with Catmull-Rom -> cubic
 * Bezier, translate to a tight viewBox padded by one stroke width, and emit the
 * stroke width in viewBox units (~0.95% of the width) so it scales with the SVG.
 * Never add vector-effect: non-scaling-stroke (it breaks dasharray maths, §7.1).
 */

const G = {"L":{"adv":617,"d":"M 230 126 L 239 126 L 425 202 L 589 337 L 687 510 L 702 624 M 709 624 L 671 702 L 605 721 L 498 680 L 410 567 L 346 369 L 249 88.2 L 214 -6.3 L 176 -69.3 L 145 -107 L 126 -120 M 123 81.9 L 6.3 50.4 L 18.9 81.9 L 135 40.9 L 302 -75.6 L 435 -151 L 583 -211 L 750 -202 L 819 -151 L 838 -120 L 841 -56.7"},"o":{"adv":391,"d":"M 195 337 L 142 365 L 66.1 315 L -6.3 233 L -40.9 161 L -56.7 75.6 L 12.6 9.45 L 101 40.9 L 183 110 L 230 208 L 239 246 L 239 284 L 220 284 M 167 158 L 183 101 L 214 72.4 L 255 75.6 L 296 110 L 359 183"},"r":{"adv":369,"d":"M -31.5 183 L 34.6 287 L 154 463 L 47.2 391 L 47.2 365 L 59.9 356 L 258 353 L 145 214 L 81.9 101 L 97.6 22 L 186 28.4 L 296 132 L 337 183"},"e":{"adv":346,"d":"M 66.1 170 L 148 211 L 217 249 L 252 306 L 239 350 L 180 356 L 63 287 L 15.8 252 L -34.6 192 L -66.1 139 L -72.4 88.2 L -50.4 44.1 L 31.5 9.45 L 170 44.1 L 214 81.9 L 277 135 L 315 183"},"n":{"adv":580,"d":"M 148 328 L 41 25.2 L 183 186 L 271 280 L 334 318 L 381 337 L 394 312 L 331 195 L 290 101 L 293 47.2 L 328 15.8 L 387 25.2 L 450 69.3 L 513 132 L 548 183"},"a":{"adv":526,"d":"M 495 183 L 457 132 L 406 78.8 L 331 31.5 L 271 18.9 L 243 63 L 255 142 L 296 274 L 277 243 L 176 145 L 69.3 56.7 L -18.9 18.9 L -63 66.1 L -56.7 154 L 34.6 261 L 148 331 L 230 356 L 312 356 L 324 343"}};

const args = process.argv.slice(2);
const cls = args.includes('--class') ? args[args.indexOf('--class') + 1] : 'sig';
const WORD = 'Lorena';

function strokesFor(word) {
  let x = 0;
  const strokes = [];
  for (const ch of word) {
    const g = G[ch];
    if (!g) { x += 378; continue; }
    g.d.split('M').map((s) => s.trim()).filter(Boolean).forEach((sub) => {
      const n = sub.replace(/L/g, ' ').trim().split(/\s+/).map(Number);
      const pts = [];
      for (let i = 0; i < n.length; i += 2) pts.push([n[i] + x, -n[i + 1]]);
      strokes.push(pts);
    });
    x += g.adv;
  }
  return strokes;
}

/** Catmull-Rom through the points -> list of cubic segments [p1, c1, c2, p2]. */
function segments(p) {
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out.push([p1, c1, c2, p2]);
  }
  return out;
}

const bez = (a, b, c, d, t) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const strokes = strokesFor(WORD).map(segments);

// tight bounds of the actual curves (sampled)
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const segs of strokes) {
  for (const [p1, c1, c2, p2] of segs) {
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const x = bez(p1[0], c1[0], c2[0], p2[0], t), y = bez(p1[1], c1[1], c2[1], p2[1], t);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}

const rawW = maxX - minX;
const SW = Math.round(rawW * 0.0095);           // stroke width in viewBox units (~0.95% of the width)
const pad = SW;                                 // one stroke width so round caps are never clipped
const ox = -minX + pad, oy = -minY + pad;
const W = Math.round(rawW + pad * 2), H = Math.round(maxY - minY + pad * 2);
const f = (n) => (Math.round(n * 10) / 10).toString();
const pt = ([x, y]) => `${f(x + ox)},${f(y + oy)}`;

const paths = strokes.map((segs) => {
  let d = `M${pt(segs[0][0])}`;
  for (const [, c1, c2, p2] of segs) d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  return `<path d="${d}"/>`;
});

process.stdout.write(
  `<svg class="${cls}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="currentColor" ` +
  `stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" overflow="visible" aria-hidden="true" focusable="false">` +
  paths.join('') + `</svg>\n`
);
