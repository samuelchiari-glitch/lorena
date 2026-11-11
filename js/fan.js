/**
 * fan.js: the 7-card fan (spec §4.4a; Lando §3). OWNER: content section builder.
 *
 * FOUNDATION STUB. What already works (every JS mode, so the arc is complete at rest):
 *   - boot render of the 7 cards from data/videos.json (fan[], fanFocus) with cardHTML() from video.js;
 *   - slot placement through the CSS custom properties --x --y --rot --s --z (site.css);
 *   - an INSTANT focus change (prev/next buttons, ← →, tap a side card) updating caption, counter,
 *     "More …" link, labels and the sound hint.
 * TODO(content): GSAP entrance (armed on approach), elastic focus tweens, wrap-around park, swipe,
 *   desktop table + hover spread, video.setEligible/toggleSound wiring (fan.js owns every fan click).
 *
 * Exports: boot(ctx), ready(ctx), finish(), SLOTS, slotOf(i, focus, n), setFocus(i, {instant}),
 *          getFocus(), cards().
 */
import { cardHTML, esc } from './video.js';

/** Mobile slot table (§4.4a), values in u. Desktop (>= 992) x values: TODO(content). */
export const SLOTS = [
  { s: 0.7756, rot: -21, x: -15, y: 7.3, z: 1 },
  { s: 0.8498, rot: -14, x: -11, y: 4, z: 2 },
  { s: 0.9346, rot: -7, x: -6, y: 1.3, z: 3 },
  { s: 1, rot: 0, x: 0, y: 0, z: 10 },
  { s: 0.9346, rot: 7, x: 6, y: 1.3, z: 3 },
  { s: 0.8498, rot: 14, x: 11, y: 4, z: 2 },
  { s: 0.7756, rot: 21, x: 15, y: 7.3, z: 1 },
];

export const slotOf = (i, focus, n = 7) => (((i - focus + 3) % n) + n) % n;

let fanEl = null;
let items = [];
let cats = [];
let focus = 3;

export const getFocus = () => focus;
export const cards = () => (fanEl ? [...fanEl.querySelectorAll('.fan__card')] : []);

function placeStatic(card, slot) {
  const S = SLOTS[slot];
  card.style.setProperty('--x', S.x);
  card.style.setProperty('--y', S.y);
  card.style.setProperty('--rot', `${S.rot}deg`);
  card.style.setProperty('--s', S.s);
  card.style.setProperty('--z', S.z);
  card.dataset.slot = slot;
}

function labelFor(item, focused) {
  if (!focused) return { label: `Show: ${item.title}`, pressed: null };
  if (!item.src) return { label: `${item.title}, video coming soon`, pressed: null };
  if (item.audio === false) return { label: `${item.title}, no sound`, pressed: null };
  return { label: `Sound for ${item.title}`, pressed: 'false' };
}

export function setFocus(i, { instant = true } = {}) {
  void instant;
  const list = cards();
  if (!list.length) return;
  const n = list.length;
  focus = ((i % n) + n) % n;
  list.forEach((card, idx) => {
    const slot = slotOf(idx, focus, n);
    placeStatic(card, slot);
    const it = items[idx];
    const hit = card.querySelector('.fan__hit');
    const { label, pressed } = labelFor(it, slot === 3);
    if (hit) {
      hit.setAttribute('aria-label', label);
      if (pressed == null) hit.removeAttribute('aria-pressed');
      else hit.setAttribute('aria-pressed', pressed);
    }
    card.classList.toggle('is-focus', slot === 3);
  });
  updateCaption();
}

function updateCaption() {
  const it = items[focus];
  if (!it) return;
  const cat = cats.find((c) => c.key === it.category) || {};
  const label = (String(cat.eyebrow || '').split('·')[1] || it.category || '').trim();
  const sec = document.getElementById('content');
  const q = (s) => sec && sec.querySelector(s);
  const catEl = q('.fan__cat');
  const titleEl = q('.fan__title');
  const more = q('.fan__more');
  if (catEl) catEl.textContent = label;
  if (titleEl) titleEl.textContent = it.title;
  if (more && cat.anchor) {
    more.setAttribute('href', `#${cat.anchor}`);
    more.innerHTML = `More ${esc(label.toLowerCase())} <span aria-hidden="true">↓</span>`;
  }
  const iEl = q('.fan__count-i');
  const nEl = q('.fan__count-n');
  if (iEl) iEl.textContent = String(focus + 1).padStart(2, '0');
  if (nEl) nEl.textContent = String(items.length).padStart(2, '0');
  const hint = q('.fan__soundhint');
  if (hint) hint.hidden = !(it.src && it.audio !== false);
}

export function boot(ctx) {
  const data = ctx.data && ctx.data.videos;
  fanEl = document.querySelector('#content .fan');
  if (!fanEl || !data || fanEl.querySelector('.fan__card')) return;
  const byId = new Map((data.videos || []).map((v) => [v.id, v]));
  cats = data.categories || [];
  items = (data.fan || []).map((id) => byId.get(id)).filter(Boolean);
  if (!items.length) return;
  fanEl.insertAdjacentHTML('beforeend', items.map((it, i) => cardHTML(it, { fan: true, index: i })).join(''));
  setFocus(Number.isInteger(data.fanFocus) ? data.fanFocus : 3);

  // minimal interaction (instant); the builder replaces it with the GSAP carousel
  const controls = document.querySelector('#content .fan__controls');
  if (controls) {
    controls.hidden = false;
    controls.querySelector('.fan__prev').addEventListener('click', () => setFocus(focus - 1));
    controls.querySelector('.fan__next').addEventListener('click', () => setFocus(focus + 1));
  }
  fanEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setFocus(focus - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setFocus(focus + 1); }
  });
  fanEl.addEventListener('click', (e) => {
    const card = e.target.closest('.fan__card');
    if (!card || e.target.closest('.vcard__sound, .vcard__pause')) return;
    const idx = cards().indexOf(card);
    if (idx !== focus) setFocus(idx);
  });
}

export function ready() {}
export function finish() {}
