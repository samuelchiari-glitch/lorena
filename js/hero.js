/**
 * hero.js: hero timeline + arch -> card geometry (spec §4.1). OWNER: hero section builder.
 *
 * FOUNDATION STUB: the static hero (100svh cover, arch photo, lockup) is pure CSS in site.css
 * (=== section: hero ===) and is complete at rest. Motion-only CSS goes in css/hero.css
 * (.motion .hero{height:220svh}, sticky stage, .sig--hero / .hero__handle / .hero__dark-zone display).
 * TODO(hero): load settle on .hero__photo, the scrub table of §4.1, the signature scrub
 *   (signature.js), the handle chars, the Lando snap.
 *
 * Geometry helpers below are the spec's (§4.1), read back from the rendered .hero__arch probe.
 * Module contract: boot(ctx) [right after modules load, every JS mode], ready(ctx) [after fonts],
 * finish() [finishAll: drop inline styles; scope() reverts tweens created inside it].
 */

export function restGeometry(stage) {
  const s = stage.getBoundingClientRect(), arch = stage.querySelector('.hero__arch');
  const a = arch.getBoundingClientRect(), cs = getComputedStyle(arch);
  const [rx, ry = rx] = cs.borderTopLeftRadius.split(' ').map(parseFloat);
  return { W: s.width, H: s.height, imgY: parseFloat(cs.paddingTop),
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

export function boot() {}
export function ready() {}
export function finish() {}
