/**
 * fan.js: the 7-card fan (spec §4.4a; Lando §3 adapted). OWNER: content section builder.
 *
 * boot (every JS mode): render the 7 cards from data/videos.json (fan[], fanFocus; cards of a disabled category
 *   are skipped) and place them in their slots through --x --y --rot --s --z (site.css), so the arc is complete
 *   without GSAP; focus carousel (swipe, tap, prev/next, ← →), caption/counter/labels, a roving tabindex (only
 *   the focused card is a tab stop; keyboard focus follows the focus change), video eligibility, the icon cycle.
 * ready (motion only): the elastic entrance (armed on approach, plays when the stack's centre reaches 75% of the
 *   viewport, so the spring opens in full view; the focus card holds its poster until the spread and the caption
 *   fades in with it), elastic focus tweens with the wrap-around park, the cards follow
 *   the finger during a horizontal drag, desktop hover spread. GSAP's inline transform then overrides the CSS
 *   slot transform; finish() drops it again. Static modes change focus instantly.
 * Click ownership: fan.js owns every click on a fan card; it calls video.toggleSound / video.setEligible only.
 *
 * Exports: boot(ctx), ready(ctx), finish(), SLOTS, slotOf(i, focus, n), setFocus(i, opts), getFocus(), cards().
 */
import { cardHTML, catName, esc, setEligible, toggleSound } from './video.js';
import { isMotion, makeIO, markPlayed, onApproach, release, scope, track } from './scroll.js';
import { DESKTOP, FINE, onMedia } from './desktop.js';
import { rescanRoll } from './ui.js';

/** Slot table (§4.4a), values in u. x is the mobile column; desktop (>= 992) uses DESK_X. */
export const SLOTS = [
  { s: 0.7756, rot: -21, x: -15, y: 7.3, z: 1 },
  { s: 0.8498, rot: -14, x: -11, y: 4, z: 2 },
  { s: 0.9346, rot: -7, x: -6, y: 1.3, z: 3 },
  { s: 1, rot: 0, x: 0, y: 0, z: 10 },
  { s: 0.9346, rot: 7, x: 6, y: 1.3, z: 3 },
  { s: 0.8498, rot: 14, x: 11, y: 4, z: 2 },
  { s: 0.7756, rot: 21, x: 15, y: 7.3, z: 1 },
];
const DESK_X = [-30, -22, -11, 0, 11, 22, 30];
const EASE = 'elastic.out(1, 0.75)';
const DRAG = 0.35; // cards follow the finger at this fraction of the drag
const SWIPE = 40;  // px: a shorter drag springs back

export const slotOf = (i, focus, n = 7) => (((i - focus + 3) % n) + n) % n;

const qDesk = matchMedia('(min-width: 992px)');
const qHover = matchMedia('(hover: hover) and (pointer: fine)');
const qReduce = matchMedia('(prefers-reduced-motion: reduce)');

let fanEl = null;
let probe = null;
let items = [];
let cats = [];
let focus = 3;
let gsapOn = false; // GSAP owns the card transforms (motion mode)
let entrance = null; // the entrance timeline while it has not finished
let held = null; // the focused card, kept on its poster (= its `start` frame) until the deal opens
let hovered = null;
let leaveT = 0;
let swipedAt = 0;
let dealU = 0; // desktop: the unit the deal's spread uses, read when the spread starts (0 = not read yet)

export const getFocus = () => focus;
export const cards = () => (fanEl ? [...fanEl.querySelectorAll('.fan__card')] : []);

const slotVals = (slot) => ({ ...SLOTS[slot], x: qDesk.matches ? DESK_X[slot] : SLOTS[slot].x });
const unit = () => (probe ? probe.getBoundingClientRect().width : 0) || 12.78;
const target = (slot, u = unit()) => { const S = slotVals(slot); return { x: S.x * u, y: S.y * u, rotation: S.rot, scale: S.s, opacity: 1 }; };
const animated = () => gsapOn && isMotion() && !!window.gsap && !qReduce.matches;
const slotOfCard = (card) => +card.dataset.slot;

function placeStatic(card, slot) {
  const S = slotVals(slot);
  card.style.setProperty('--x', S.x);
  card.style.setProperty('--y', S.y);
  card.style.setProperty('--rot', `${S.rot}deg`);
  card.style.setProperty('--s', S.s);
  card.style.setProperty('--z', S.z);
  card.dataset.slot = slot;
}

function labelFor(item, focused, sound) {
  if (!focused) return { label: `Show: ${item.title}`, pressed: null };
  if (!item.src) return { label: `${item.title}, video coming soon`, pressed: null };
  if (item.audio === false) return { label: `${item.title}, no sound`, pressed: null };
  return { label: `Sound for ${item.title}`, pressed: String(!!sound) };
}

function label(card) {
  const it = items[cards().indexOf(card)];
  const hit = card.querySelector('.fan__hit');
  if (!it || !hit) return;
  const focused = slotOfCard(card) === 3;
  const { label: l, pressed } = labelFor(it, focused, card.classList.contains('has-sound'));
  hit.tabIndex = focused ? 0 : -1; // roving tabindex: side cards stay tappable, not tab stops
  hit.setAttribute('aria-label', l);
  if (pressed == null) hit.removeAttribute('aria-pressed'); else hit.setAttribute('aria-pressed', pressed);
}

/**
 * Move the focus to card i. opts.inherit: the call runs inside a user gesture (swipe, tap, button, key), so if
 * the fan owns sound the new focused card takes it over (§6.4). opts.instant: no tween.
 */
export function setFocus(i, { inherit = false, instant = false } = {}) {
  const list = cards();
  if (!list.length) return;
  const n = list.length;
  const next = ((i % n) + n) % n;
  const changed = next !== focus;
  const owned = inherit && changed && !!list[focus] && list[focus].classList.contains('has-sound');
  const prev = new Map(list.map((c) => [c, slotOfCard(c)]));
  focus = next;
  list.forEach((card, idx) => {
    const slot = slotOf(idx, focus, n);
    placeStatic(card, slot);
    card.classList.toggle('is-focus', slot === 3);
    label(card);
  });
  // video: the old focus first (it releases sound and pauses), then the new one (§6.2)
  list.forEach((card) => { const sl = slotOfCard(card); if (sl !== 3) setEligible(card, false, { warm: sl === 2 || sl === 4 }); });
  const now = list[focus];
  setEligible(now, true);
  const it = items[focus];
  if (owned && it && it.src && it.audio !== false) toggleSound(now); // Reels-like: sound follows the focus
  if (changed && !instant && animated()) animateFocus(prev);
  else if (animated()) list.forEach((c) => window.gsap.set(c, target(slotOfCard(c))));
  updateCaption();
  // keyboard focus follows the carousel focus (never steals it from outside the fan)
  const active = document.activeElement;
  if (changed && active && active !== fanEl && fanEl.contains(active)) {
    const hit = now.querySelector('.fan__hit');
    if (hit) hit.focus({ preventScroll: true });
  }
}

function animateFocus(prev) {
  const { gsap } = window;
  if (entrance) entrance.progress(1);
  const u = unit();
  cards().forEach((card) => {
    const to = slotOfCard(card);
    const d = Math.abs(to - prev.get(card));
    gsap.killTweensOf(card);
    if (d > 3) { // wraps around (slot 0 <-> 6): fade out, park beyond the far end, spring in
      const side = to > 3 ? 1 : -1;
      gsap.timeline()
        .to(card, { opacity: 0, duration: 0.15, ease: 'power1.out' })
        .set(card, { x: side * (qDesk.matches ? 36 : 19) * u, y: 11 * u, rotation: side * 28, scale: 0.7 })
        .to(card, { ...target(to, u), duration: 0.5, ease: EASE });
    } else gsap.to(card, { ...target(to, u), duration: 0.5, ease: EASE, overwrite: 'auto', delay: 0.02 * d });
  });
  if (hovered) setTimeout(() => { if (hovered) spread(slotOfCard(hovered)); }, 160);
}

function updateCaption() {
  const it = items[focus];
  if (!it) return;
  const cat = cats.find((c) => c.key === it.category) || {};
  const name = catName(cat) || it.category || '';
  const sec = document.getElementById('content');
  const q = (s) => sec && sec.querySelector(s);
  const set = (s, v) => { const el = q(s); if (el && el.textContent !== v) el.textContent = v; };
  set('.fan__cat', name);
  set('.fan__title', it.title);
  const more = q('.fan__more');
  if (more && cat.anchor) {
    more.setAttribute('href', `#${cat.anchor}`);
    const html = `More ${esc(name.toLowerCase())} <span aria-hidden="true">↓</span>`;
    if (!more.classList.contains('has-roll')) more.innerHTML = html;
    else if (more.dataset.cat !== cat.key) {
      // desktop text roll (ui.js): a split label is not re-split in place, so a fresh link takes its place
      const fresh = more.cloneNode(false);
      fresh.classList.remove('has-roll');
      fresh.innerHTML = html;
      more.replaceWith(fresh);
      fresh.dataset.cat = cat.key;
      rescanRoll(fresh);
    }
    const now = q('.fan__more');
    if (now) now.dataset.cat = cat.key;
  }
  set('.fan__count-i', String(focus + 1).padStart(2, '0'));
  set('.fan__count-n', String(items.length).padStart(2, '0'));
  const hint = q('.fan__soundhint');
  if (hint) hint.hidden = !(it.src && it.audio !== false);
}

/** Desktop + fine pointer, motion: the hint names the hover spread (spec §4.4); restored on teardown. */
function desktopHint(d) {
  const hint = document.querySelector('#content .fan__hint');
  if (!hint) return;
  const prev = hint.innerHTML;
  hint.innerHTML = 'Hover to spread<span class="fan__soundhint"> · click a card for sound</span>';
  updateCaption();
  d.cleanup(() => { hint.innerHTML = prev; updateCaption(); });
}

/* ------------------------------------------------------------------ input */

function bindInput() {
  const controls = document.querySelector('#content .fan__controls');
  if (controls) {
    controls.hidden = false;
    controls.querySelector('.fan__prev').addEventListener('click', () => setFocus(focus - 1, { inherit: true }));
    controls.querySelector('.fan__next').addEventListener('click', () => setFocus(focus + 1, { inherit: true }));
  }
  fanEl.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setFocus(focus + (e.key === 'ArrowRight' ? 1 : -1), { inherit: true });
  });
  // swipe (pointer events; touch-action: pan-y keeps vertical scrolling native): swipe left = next.
  // Motion mode: once the drag is horizontal the cards follow the finger (DRAG × dx); a release past SWIPE px
  // commits ±1 with the elastic focus tween, a shorter one springs back.
  let sx = 0;
  let sy = 0;
  let pid = null;
  let dragging = false;
  const end = (commit) => {
    const was = dragging;
    pid = null;
    dragging = false;
    if (was) swipedAt = performance.now(); // the click that follows a drag is not a tap
    if (commit) setFocus(focus + commit, { inherit: true });
    else if (was) springBack();
  };
  fanEl.addEventListener('pointerdown', (e) => { if (e.isPrimary && e.button === 0) { pid = e.pointerId; sx = e.clientX; sy = e.clientY; dragging = false; } });
  fanEl.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (!dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { pid = null; return; } // vertical: the page scrolls
      if (Math.abs(dx) < 8 || Math.abs(dx) <= 1.2 * Math.abs(dy)) return;
      dragging = true;
    }
    follow(dx);
  });
  fanEl.addEventListener('pointercancel', (e) => { if (e.pointerId === pid) end(0); });
  fanEl.addEventListener('pointerup', (e) => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    end(Math.abs(dx) > SWIPE && Math.abs(dx) > 1.2 * Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0);
  });
  // one owner per tap: side card -> focus it; focused card -> sound (when it has a video with sound)
  fanEl.addEventListener('click', (e) => {
    if (performance.now() - swipedAt < 400) return;
    const card = e.target.closest('.fan__card');
    if (!card || e.target.closest('.vcard__sound, .vcard__pause')) return;
    if (entrance) entrance.progress(1); // a tap while the deck waits deals it at once (and releases the held card)
    const idx = cards().indexOf(card);
    if (idx !== focus) { setFocus(idx, { inherit: true }); return; }
    const it = items[idx];
    if (it && it.src && it.audio !== false) toggleSound(card);
  });
  fanEl.addEventListener('vcard:sound', (e) => { const c = e.target.closest('.fan__card'); if (c) label(c); });
}

/** Drag follow (motion mode): every card sits DRAG × dx off its slot. */
function follow(dx) {
  if (!animated()) return;
  if (entrance) entrance.progress(1);
  const u = unit();
  cards().forEach((c) => {
    window.gsap.killTweensOf(c);
    window.gsap.set(c, { ...target(slotOfCard(c), u), x: target(slotOfCard(c), u).x + DRAG * dx });
  });
}

function springBack() {
  if (!animated()) return;
  const u = unit();
  cards().forEach((c) => window.gsap.to(c, { ...target(slotOfCard(c), u), duration: 0.5, ease: EASE, overwrite: 'auto' }));
}

/* ------------------------------------------------------------------ niche icon: one 4.8 s cycle per entry (§4.4a) */

function initIconCycle() {
  const icons = document.querySelector('#content .fan__icons');
  if (!icons || typeof IntersectionObserver === 'undefined') return;
  makeIO((entries) => entries.forEach((e) => icons.classList.toggle('is-cycling', e.isIntersecting)), { threshold: 0 }).observe(icons);
}

/* ------------------------------------------------------------------ desktop hover spread (Lando §3.4) */

function spread(n) {
  if (!animated() || entrance || !qDesk.matches) return;
  const { gsap } = window;
  const u = unit();
  cards().forEach((card) => {
    const i = slotOfCard(card);
    const B = slotVals(i);
    const d = Math.abs(i - n);
    const p = 1 - Math.abs((i - 3) / 3);
    const c = 1 + 0.2 * Math.max(0, 3 - d);
    let t;
    // the hovered card lifts and grows; the centre card lifts less (2.5 u would reach the hint line above the fan)
    if (i === n) t = { x: B.x, y: B.y - (i === 3 ? 1.2 : 2.5), scale: B.s * 1.08, rotation: B.rot };
    else if (i < n) t = { x: B.x - 8 * p * c, y: B.y, scale: B.s, rotation: B.rot - 3 / (d + 1) };
    else { const e = i === 6; t = { x: B.x + (e ? 0 : 8 * p * c), y: B.y + (e ? -1 : 0), scale: B.s, rotation: B.rot + 3 / (d + 1) }; }
    gsap.to(card, { x: t.x * u, y: t.y * u, scale: t.scale, rotation: t.rotation, opacity: 1, duration: 0.5, ease: EASE, overwrite: 'auto', delay: d * 0.02 });
  });
}

function rest() {
  if (!animated() || entrance) return;
  const u = unit();
  cards().forEach((card) => {
    const i = slotOfCard(card);
    window.gsap.to(card, { ...target(i, u), duration: 0.5, ease: EASE, overwrite: 'auto', delay: Math.abs(i - 3) * 0.02 });
  });
}

/** The hover spread lives in a desktop + fine-pointer registration (js/desktop.js): torn down on resize to mobile. */
function bindHover(d) {
  cards().forEach((card) => {
    d.on(card, 'pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(leaveT);
      hovered = card;
      spread(slotOfCard(card));
    });
    d.on(card, 'pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || hovered !== card) return;
      hovered = null;
      clearTimeout(leaveT);
      leaveT = setTimeout(() => { if (!hovered) rest(); }, 50); // 50 ms grace between neighbours
    });
  });
  d.cleanup(() => {
    clearTimeout(leaveT);
    if (hovered) { hovered = null; rest(); }
  });
}

/* ------------------------------------------------------------------ entrance (Lando §3.3; armed on approach) */

/** The held focus card may play again (it starts on its `start` frame, the poster it has been showing). */
function unhold() {
  const card = held;
  held = null;
  if (card && slotOfCard(card) === 3) setEligible(card, true);
}

function armEntrance() {
  if (!isMotion()) return;
  scope(() => {
    const { gsap, ScrollTrigger } = window;
    const list = cards().sort((a, b) => slotOfCard(a) - slotOfCard(b));
    const caption = document.querySelector('#content .fan__caption');
    const u = unit();
    gsap.set(list, { x: 0, y: 10 * u, rotation: 0, scale: 1, opacity: 1 }); // stacked lower, visible
    // the lowered stack would cover the caption: it fades in as the deck opens
    if (caption) gsap.set(caption, { opacity: 0 });
    // The focus card (the CHANEL film) waits on its poster, which is its `start` frame, and starts playing as the
    // deck springs open: its best shot lands on the spread, not on the stack rising half off screen. It warms up.
    held = list.find((c) => slotOfCard(c) === 3) || null;
    if (held) setEligible(held, false, { warm: true });
    gsapOn = true;
    // desktop (chosen when armed): the stack rises faster and the deal starts as the fan's top enters the lower
    // 15 % of the view, so the spread lands with the fan near the middle of the screen even at a brisk wheel
    // (the phone timing stays as it was)
    const desk = qDesk.matches;
    const tl = gsap.timeline({ paused: true, onComplete: () => release(fanEl) });
    tl.to(list, { y: 0, duration: desk ? 0.5 : 0.8, ease: 'power2.out', stagger: { amount: desk ? 0.25 : 0.5, from: 'end' } });
    tl.addLabel('spread', desk ? '-=0.2' : '-=0.4');
    tl.call(unhold, null, 'spread');
    // desktop: the spread's unit is read when it starts, so a height change while the deck waits re-fits the arc
    dealU = 0;
    const du = () => (desk ? dealU || (dealU = unit()) : u);
    tl.to(list, {
      x: (k, el) => target(slotOfCard(el), du()).x,
      y: (k, el) => target(slotOfCard(el), du()).y,
      rotation: (k, el) => target(slotOfCard(el), du()).rotation,
      scale: (k, el) => target(slotOfCard(el), du()).scale,
      duration: 1.2, ease: EASE, stagger: { amount: 0.2, from: 'center' },
    }, 'spread');
    if (caption) tl.to(caption, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 'spread');
    entrance = tl;
    // the deal plays when the stack's centre reaches 75% of the viewport (in full view on a phone; on desktop when
    // the fan's top reaches 85 %); the watchdog only counts from that point, so a visitor pausing above it never
    // gets a forced, frozen fan
    const due = desk ? (r, ih) => r.top < 0.85 * ih : (r, ih) => r.top + r.height / 2 < 0.75 * ih;
    track(fanEl, tl, () => { entrance = null; }, { due });
    ScrollTrigger.create({ trigger: fanEl, start: desk ? 'top 85%' : 'center 75%', once: true, onEnter: () => { markPlayed(fanEl); tl.play(); } });
  });
}

/** Fan already in view (or above) at arming time: GSAP takes over at the resting arc, no entrance. */
function takeOver() {
  if (!isMotion() || gsapOn) return;
  gsapOn = true;
  const u = unit();
  cards().forEach((c) => window.gsap.set(c, target(slotOfCard(c), u)));
}

/**
 * The unit changed (the width; at >= 992 also the height, the fitted --r), or the 992 line was crossed: the cards go
 * to the arc at the current unit. Desktop: a deal still waiting is re-stacked (its spread reads the unit when it
 * starts) and one under way is landed first; a hovered fan spreads again from its new arc.
 */
function relayout() {
  cards().forEach((c) => placeStatic(c, slotOfCard(c)));
  if (!animated()) return;
  const u = unit();
  if (entrance) {
    if (!qDesk.matches) return; // below 992 as before: the deal keeps the unit it was armed with
    if (entrance.paused() && entrance.progress() === 0) { // still waiting: re-stack; the spread reads the unit later
      dealU = 0;
      window.gsap.set(cards(), { y: 10 * u });
      return;
    }
    entrance.progress(1);
  }
  cards().forEach((c) => { window.gsap.killTweensOf(c); window.gsap.set(c, target(slotOfCard(c), u)); });
  if (hovered) spread(slotOfCard(hovered));
}

/* ------------------------------------------------------------------ module contract */

export function boot(ctx) {
  const data = ctx.data && ctx.data.videos;
  fanEl = document.querySelector('#content .fan');
  if (!fanEl || !data || fanEl.querySelector('.fan__card')) return;
  const byId = new Map((data.videos || []).map((v) => [v.id, v]));
  cats = data.categories || [];
  const off = new Set(cats.filter((c) => c.disabled).map((c) => c.key));
  items = (data.fan || []).map((id) => byId.get(id)).filter((it) => it && !off.has(it.category));
  if (!items.length) return;
  fanEl.insertAdjacentHTML('beforeend', '<i class="fan__probe" aria-hidden="true"></i>'
    + items.map((it, i) => cardHTML(it, { fan: true, index: i })).join(''));
  probe = fanEl.querySelector('.fan__probe');
  const hint = document.querySelector('#content .fan__soundhint');
  if (hint && qHover.matches) hint.textContent = ' · click for sound';
  focus = Number.isInteger(data.fanFocus) ? data.fanFocus : 3;
  setFocus(focus, { instant: true });
  bindInput();
  initIconCycle();
  const onDesk = () => relayout();
  if (qDesk.addEventListener) qDesk.addEventListener('change', onDesk); else if (qDesk.addListener) qDesk.addListener(onDesk);
  // the arc moves with the unit. Below 992 the unit follows the width only, and iOS fires resize whenever its toolbar
  // collapses or expands, so only a width change counts there. At >= 992 the fitted --r also reads the height (svh):
  // a taller or shorter window (F11, docked devtools, the bookmarks bar) re-fits the arc too.
  let rt = 0;
  let lastW = innerWidth;
  let lastU = unit();
  addEventListener('resize', () => {
    if (!qDesk.matches && innerWidth === lastW) return; // below 992 only a width change moves the arc (as before)
    lastW = innerWidth;
    clearTimeout(rt);
    rt = setTimeout(() => {
      const u = unit();
      if (qDesk.matches && Math.abs(u - lastU) < 0.01) return; // desktop: any change of the unit (width or height)
      lastU = u;
      relayout();
    }, 150);
  });
}

export function ready(ctx) {
  if (!fanEl || !cards().length || !ctx.motion || !isMotion()) return;
  onMedia(`${DESKTOP} and ${FINE}`, (d) => { bindHover(d); desktopHint(d); }, { motion: true, name: 'fan-hover' });
  onApproach(fanEl, armEntrance, { onSkip: takeOver });
}

export function finish() {
  unhold();
  gsapOn = false;
  entrance = null;
  hovered = null;
  const list = cards();
  if (window.gsap && list.length) {
    window.gsap.killTweensOf(list);
    window.gsap.set(list, { clearProps: 'transform,opacity' });
  }
}
