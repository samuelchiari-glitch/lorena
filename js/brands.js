/**
 * brands.js: partner logos from data/brands.json (spec §4.6). OWNER: proof section builder.
 *
 * FOUNDATION STUB. What already works (every JS mode): the boot render of the three rows
 * (logos distributed i % 3; each row's <ul> rendered twice, the copy aria-hidden with alt=""),
 * accessible names (alt = name; the 4 "unidentified" entries alt="" inside aria-hidden items),
 * logo height 44px x scale via --scale, and the brand count. CSS default = one centred wrapping
 * grid of all 46 (site.css); the copies are hidden in that layout.
 * TODO(proof): add .brands--marquee on .brands (css/proof.css) + WAAPI rows, direction follows
 *   scroll, ±6vw drift, pause button (unhide .brands__pause), off-screen pause, eager-load one
 *   viewport ahead (makeIO from scroll.js, root: document). Reduced motion keeps the grid.
 *
 * Exports: boot(ctx), ready(ctx), finish(), renderBrands(list).
 */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const unidentified = (b) => /unidentified/i.test(b.name || '');

function itemHTML(b, copy) {
  const hidden = copy || unidentified(b);
  const alt = hidden ? '' : esc(b.name);
  const scale = Number(b.scale) || 1;
  const h = Math.round(44 * scale * 10) / 10;
  const w = Math.round(h * (Number(b.aspect) || 1) * 10) / 10;
  return `<li class="brands__item"${hidden && !copy ? ' aria-hidden="true"' : ''}>`
    + `<img src="${esc(b.svg)}" alt="${alt}" width="${w}" height="${h}" style="--scale:${scale}" loading="lazy" decoding="async"></li>`;
}

export function renderBrands(list) {
  const box = document.querySelector('[data-brands]');
  if (!box || !Array.isArray(list) || box.hasAttribute('data-rendered')) return;
  const rows = [[], [], []];
  list.forEach((b, i) => rows[i % 3].push(b));
  box.innerHTML = rows.map((row, r) => `<div class="brands__row" data-row="${r + 1}"><div class="brands__track">`
    + `<ul class="brands__list" aria-label="Brand partners, row ${r + 1}">${row.map((b) => itemHTML(b, false)).join('')}</ul>`
    + `<ul class="brands__list" aria-hidden="true">${row.map((b) => itemHTML(b, true)).join('')}</ul>`
    + '</div></div>').join('');
  box.setAttribute('data-rendered', '');
  const count = document.querySelector('[data-brand-count]');
  if (count) count.textContent = String(list.length);
}

export function boot(ctx) {
  const data = ctx.data && ctx.data.brands;
  renderBrands(data && data.brands);
}

export function ready() {}
export function finish() {}
