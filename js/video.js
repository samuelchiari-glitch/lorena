/**
 * video.js: 9:16 video cards (spec §6; Conectaa §5 adapted). OWNER: content section builder.
 *
 * Public API (fan.js and the chapter renderer use only these):
 *   register(card)              idempotent. Binds .vcard__sound / .vcard__pause, the card-level click ONLY on
 *                               [data-vcard]:not([data-fan]), mouse hover-to-hear, the warm-up IO and the Ken Burns IO.
 *                               Cards without a <video> only get the Ken Burns observer.
 *   toggleSound(card)           the tap action; call it synchronously inside a click / pointerup / keydown handler.
 *   setEligible(card, bool, {warm})  fan focus (§6.2). `warm` (default = eligible) lets a side card load its src early
 *                               (slots 2 and 4 pre-warm the next swipe). Non-fan cards are eligible by default.
 *   swapSource(card, item)      thumb swap (§4.4b), synchronous inside the thumb's click handler.
 * DOM contract: a card carries .has-sound while it owns sound and dispatches a bubbling `vcard:sound` event when that changes.
 * Module contract (site.js): boot(ctx) renders the chapters + registers every card (every JS mode); ready(); finish().
 * Helpers for fan.js: cardHTML(item, opts), esc(str), formatDuration(sec).
 *
 * Data (data/videos.json): a category with `disabled: true` is skipped everywhere (client feedback 6); a category's
 * `rail` lists its rail items in order, and may mix in photo items (type "photo", client feedback 7): a photo thumb
 * shows the still in the feature card (poster-only: no sound or pause button, one Ken Burns pass). A category that is
 * enabled but has no shell in site.html gets one rendered from its data, so re-enabling a chapter is a data change.
 * Two optional video fields: `start` (s) = the clip plays from there (#t= on its src; its poster is that frame), and
 * `view` [top, bottom] = only that band of the frame is picture, so the <video> is scaled until the band fills the card
 * (its poster is already cropped to the band by scripts/make-images.py).
 */
import { makeIO } from './scroll.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function formatDuration(sec) {
  if (sec == null || !isFinite(sec)) return '';
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const SVG = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
const SPEAKER = '<path d="M3 9.5h3.2L11 5.5v13l-4.8-4H3z" fill="currentColor"/>';
const ICON_SOUND = `<svg class="vcard__icon vcard__icon--off" ${SVG}>${SPEAKER}<path d="m15 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
  + `<svg class="vcard__icon vcard__icon--on" ${SVG}>${SPEAKER}<g class="vcard__eq" fill="currentColor"><rect x="13.6" y="8.5" width="2" height="7" rx="1"/><rect x="17" y="5.5" width="2" height="13" rx="1"/><rect x="20.4" y="9.5" width="2" height="5" rx="1"/></g></svg>`;
const ICON_PAUSE = `<svg class="vcard__icon vcard__icon--pause" ${SVG}><path d="M8.5 6v12M15.5 6v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`
  + `<svg class="vcard__icon vcard__icon--play" ${SVG}><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>`;
const ICON_GLYPH = `<svg ${SVG}><path d="M9 6.2v11.6l9.3-5.8z" fill="currentColor"/></svg>`;

const items = new Map(); // id -> item (filled by cardHTML, so both renderers share it)

/** The src to load: from `start` when set (a media fragment; `loop` still restarts at 0). */
const srcOf = (item) => (item.start ? `${item.src}#t=${item.start}` : item.src);

/** `view` [top, bottom] (0..1 of the frame height): scale the <video> from its top centre so that band fills the card. */
function viewCSS(item) {
  const v = item && item.view;
  if (!Array.isArray(v) || !(v[1] > v[0])) return '';
  return `transform-origin:50% 0;transform:scale(${+(1 / (v[1] - v[0])).toFixed(4)}) translateY(${+(-100 * v[0]).toFixed(2)}%)`;
}

/**
 * One video card (§6.1). opts: { fan:bool, index:number, feature:bool, deal:number }.
 * No `src` and no `poster` attribute on <video>: both are set at warm-up (§6.3).
 * Poster and thumb <img>s carry data-src: lazyImages() assigns src 1.5 viewports ahead (see boot).
 */
export function cardHTML(item, opts = {}) {
  items.set(item.id, item);
  const hasVideo = !!item.src;
  const posterAlt = opts.feature && !hasVideo ? esc(item.alt) : ''; // a still is the content; a video names itself
  const audio = hasVideo && item.audio !== false;
  const cls = ['vcard', opts.fan ? 'fan__card' : '', opts.feature ? 'vcard--feature' : ''].filter(Boolean).join(' ');
  const attrs = [
    `class="${cls}"`, 'data-vcard', opts.fan ? 'data-fan' : '', `data-id="${esc(item.id)}"`,
    `data-has-video="${hasVideo}"`, `data-audio="${audio}"`,
    opts.index != null ? `data-index="${opts.index}"` : '',
    opts.deal != null ? `data-deal="${opts.deal}"` : '',
  ].filter(Boolean).join(' ');
  // fan cards have no <video> while poster-only; the feature card always keeps one (hidden)
  const withVideo = hasVideo || opts.feature;
  const video = withVideo
    ? `<video class="vcard__video" muted playsinline loop preload="none" disablepictureinpicture disableremoteplayback controlslist="nodownload noplaybackrate nofullscreen" aria-label="${esc(item.alt)}"${viewCSS(item) ? ` style="${viewCSS(item)}"` : ''}${hasVideo ? '' : ' hidden'}></video>`
    : '';
  const hit = opts.fan ? `<button class="fan__hit" type="button" aria-label="Show: ${esc(item.title)}"></button>` : '';
  return `<figure ${attrs}>`
    + `<div class="vcard__media"><img class="vcard__poster" data-src="${esc(item.poster)}" alt="${posterAlt}" width="540" height="960" decoding="async">${video}</div>`
    + `<span class="vcard__glyph" aria-hidden="true">${ICON_GLYPH}</span>`
    + hit
    + `<button class="vcard__sound" type="button" aria-pressed="false" aria-label="Turn sound on"${audio ? '' : ' hidden'}>${ICON_SOUND}</button>`
    + `<button class="vcard__pause" type="button" aria-pressed="false" aria-label="Pause video"${hasVideo ? '' : ' hidden'}>${ICON_PAUSE}</button>`
    + '<span class="vcard__hint" aria-hidden="true">Tap for sound</span>'
    + '</figure>';
}

const isPhoto = (item) => item.type === 'photo';

function thumbHTML(item, active) {
  const verb = isPhoto(item) ? 'View photo' : item.src ? 'Play' : 'Show';
  return `<button class="rail__thumb" type="button" data-id="${esc(item.id)}" aria-label="${verb}: ${esc(item.title)}"${active ? ' aria-current="true"' : ''}>`
    + `<img data-src="${esc(item.thumb)}" alt="" width="240" height="427" decoding="async">`
    + `${item.src ? `<span class="rail__play" aria-hidden="true">${ICON_GLYPH}</span>` : ''}</button>`; // a mixed rail tells videos from stills
}

export const catName = (cat) => (cat && (cat.name || cat.key)) || '';
const metaText = (cat, item) => {
  if (isPhoto(item)) return `${catName(cat)} · Photo`;
  const d = formatDuration(item.duration);
  return `${catName(cat)}${d ? ` · ${d}` : ''}`;
};

/** Chapter shell from the data, for an enabled category that site.html has no markup for. */
function shellHTML(cat) {
  const a = esc(cat.anchor || cat.key);
  return `<article id="${a}" class="chapter" data-chapter="${esc(cat.key)}" aria-labelledby="${a}-title"><div class="chapter__head wrap">`
    + `<p class="t-eyebrow" data-highlight>${esc(cat.eyebrow)}</p>`
    + `<h3 id="${a}-title" class="t-lockup t-lockup--sm" data-oval><span class="t-sans">${esc(cat.sans)}</span> <span class="t-serif">${esc(cat.serif)}</span></h3>`
    + `<p class="t-caption chapter__sub">${esc(cat.subtitle)}</p></div>`
    + `<div class="chapter__body" data-chapter-body="${esc(cat.key)}"></div></article>`;
}

/** Static boot render of every chapter body (feature card + caption + rail), then the thumb swap. */
export function renderChapters(data) {
  if (!data || !Array.isArray(data.categories)) return;
  const byId = new Map((data.videos || []).map((v) => [v.id, v]));
  const content = document.getElementById('content');
  data.categories.forEach((cat, ci) => {
    if (cat.disabled) return;
    let body = document.querySelector(`[data-chapter-body="${cat.key}"]`);
    if (!body && content) {
      content.insertAdjacentHTML('beforeend', shellHTML(cat));
      body = content.querySelector(`[data-chapter-body="${cat.key}"]`);
    }
    if (!body || body.hasAttribute('data-rendered')) return;
    const list = Array.isArray(cat.rail)
      ? cat.rail.map((id) => byId.get(id)).filter(Boolean)
      : (data.videos || []).filter((v) => v.category === cat.key && !isPhoto(v)).sort((a, b) => (a.order || 0) - (b.order || 0));
    const feature = byId.get(cat.feature) || list[0];
    if (!feature) return;
    list.forEach((it) => items.set(it.id, it));
    body.innerHTML = `<div class="chapter__feature">${cardHTML(feature, { feature: true, deal: ci })}`
      + `<div class="chapter__caption"><p class="t-intro chapter__title">${esc(feature.title)}</p>`
      + `<p class="t-caption chapter__meta">${esc(metaText(cat, feature))}</p></div></div>`
      + '<div class="rail" data-lenis-prevent-horizontal data-rise="24" data-rise-start="top 92%">'
      + list.map((it) => thumbHTML(it, it.id === feature.id)).join('')
      + '</div>';
    body.setAttribute('data-rendered', '');
    body.addEventListener('click', (e) => onThumb(e, body, cat));
  });
}

function onThumb(e, body, cat) {
  const thumb = e.target.closest('.rail__thumb');
  const card = body.querySelector('.vcard--feature');
  const item = thumb && items.get(thumb.dataset.id);
  if (!item || !card) return;
  if (card.dataset.id === item.id) { // the active thumb: give it sound if it has none, never reload it
    if (item.src && item.audio !== false && !card.classList.contains('has-sound')) toggleSound(card);
    return;
  }
  swapSource(card, item); // steps 1–5, synchronous (iOS gesture)
  body.querySelectorAll('.rail__thumb').forEach((b) => (b === thumb ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  const title = body.querySelector('.chapter__title');
  const meta = body.querySelector('.chapter__meta');
  if (title) title.textContent = item.title;
  if (meta) meta.textContent = metaText(cat, item);
}

/* ------------------------------------------------------------------ scheduler state (§6.2–§6.4) */

const qCoarse = matchMedia('(hover: none), (pointer: coarse)');
const qFine = matchMedia('(hover: hover) and (pointer: fine)');
const qReduce = matchMedia('(prefers-reduced-motion: reduce)');
const PLAY_AT = 0.35;
const STOP_BELOW = 0.15;
const maxPlaying = () => (qCoarse.matches || innerWidth < 768 ? 2 : 3);
const saveData = () => !!(navigator.connection && navigator.connection.saveData);
const autoplayOK = () => !qReduce.matches && !saveData();
const canFade = (() => { try { const t = document.createElement('video'); t.volume = 0.5; return t.volume === 0.5; } catch (_) { return false; } })();
const fades = () => canFade && qFine.matches; // volume fades only for desktop hover (none on iOS, none on touch taps)

const states = new Map(); // card -> state
const boxRatio = new Map(); // .fan box -> intersection ratio (fan cards use the fan's visibility, §4.4a)
let owner = null;
let unlocked = false;
let rafId = 0;
let hintShown = false;
let warmIO = null;
let farIO = null;
let visIO = null;
let kbIO = null;

const hasSrc = (s) => !!(s.v && s.el.dataset.hasVideo === 'true');
const hasAudio = (s) => hasSrc(s) && s.el.dataset.audio === 'true';
const ratioOf = (s) => (s.box ? boxRatio.get(s.box) || 0 : s.ratio);

function ensureIOs() {
  if (visIO) return;
  const T = [0, STOP_BELOW, PLAY_AT, 0.6, 1];
  visIO = makeIO((entries) => {
    entries.forEach((e) => {
      const r = e.isIntersecting ? e.intersectionRatio : 0;
      if (boxRatio.has(e.target)) boxRatio.set(e.target, r);
      else { const s = states.get(e.target); if (s) s.ratio = r; }
    });
    schedule();
  }, { threshold: T });
  warmIO = makeIO((entries) => entries.forEach((e) => {
    const s = states.get(e.target);
    if (s) { s.near = e.isIntersecting; if (s.near) warm(s); }
  }), { rootMargin: '100% 0px', threshold: 0 });
  // memory (iOS): a warmed card more than 2 viewports away drops its source; warmIO restores it on the way back
  farIO = makeIO((entries) => entries.forEach((e) => {
    const s = states.get(e.target);
    if (s && !e.isIntersecting) unwarm(s);
  }), { rootMargin: '200% 0px', threshold: 0 });
  kbIO = makeIO((entries) => entries.forEach((e) => {
    const s = states.get(e.target);
    if (!s || e.isIntersecting === s.kbOn) return;
    s.kbOn = e.isIntersecting; // one pass per entry: replays only after the card fully left
    s.el.classList.toggle('kb-run', s.kbOn);
  }), { threshold: 0 });
}

/** Warm-up (§6.3): muted first, then poster + src together, preload metadata once. Data saver: only on a tap. */
function warm(s) {
  if (s.warmed || !hasSrc(s) || !s.warmOK || !s.item || (saveData() && !s.userPlay)) return;
  s.warmed = true;
  s.v.muted = true;
  s.v.setAttribute('muted', '');
  s.v.poster = s.item.poster;
  s.v.src = srcOf(s.item);
  s.v.preload = 'metadata';
}

function unwarm(s) {
  if (!s.warmed || owner === s || !s.v.paused) return;
  s.warmed = false;
  s.tok++; // the next `playing` fades the footage in again over the poster
  s.el.classList.remove('is-live');
  s.v.removeAttribute('src');
  s.v.removeAttribute('poster');
  try { s.v.load(); } catch (_) { /* ignore */ }
}

export function register(card) {
  if (!card) return null;
  if (states.has(card)) return states.get(card);
  ensureIOs();
  const fan = card.hasAttribute('data-fan');
  const q = (sel) => card.querySelector(sel);
  const s = {
    el: card, v: q('video.vcard__video'), item: items.get(card.dataset.id) || null, fan, box: null,
    btn: q('.vcard__sound'), pauseBtn: q('.vcard__pause'), hint: q('.vcard__hint'),
    ratio: 0, eligible: !fan, warmOK: !fan, near: false, warmed: false, kbOn: false,
    pinned: false, viaHover: false, userPlay: false, userPaused: false, hover: false,
    hoverT: 0, hintT: 0, tok: 0, liveTok: -1, sTok: 0, fadeTok: 0,
  };
  states.set(card, s);
  kbIO.observe(card);
  if (!s.v) return s; // poster-only fan card: Ken Burns only (§6)
  if (s.hint) s.hint.textContent = qFine.matches ? 'Click for sound' : 'Tap for sound';
  s.v.muted = true;
  s.v.addEventListener('playing', () => {
    card.classList.add('is-playing');
    card.classList.remove('is-blocked');
    if (s.liveTok !== s.tok) { s.liveTok = s.tok; card.classList.add('is-live'); } // token: first `playing` of this source
    // the first-play hint goes to a chapter card: the fan has its own caption line ("tap for sound")
    if (!hintShown && !s.fan && hasAudio(s) && owner !== s && !qReduce.matches) { hintShown = true; flashHint(s, 2500); }
  });
  s.v.addEventListener('pause', () => card.classList.remove('is-playing'));
  if (s.btn) s.btn.addEventListener('click', (e) => { e.stopPropagation(); toggleSound(card); });
  if (s.pauseBtn) s.pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); userPause(s); });
  if (!fan) card.addEventListener('click', () => toggleSound(card)); // fan.js owns fan clicks (§4.4a)
  card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hoverIn(s); });
  card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hoverOut(s); });
  s.box = fan ? card.closest('.fan') : null;
  if (s.box) {
    if (!boxRatio.has(s.box)) { boxRatio.set(s.box, 0); visIO.observe(s.box); }
  } else visIO.observe(card);
  warmIO.observe(card);
  farIO.observe(card);
  return s;
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(() => { rafId = 0; reconcile(); });
}

/** Conectaa reconcile(): play at ≥ .35, pause below .15, max 2 (mobile) / 3, the sound owner always counts. */
function reconcile() {
  const list = [...states.values()].filter(hasSrc);
  const auto = autoplayOK();
  if (owner && ratioOf(owner) < STOP_BELOW) sound(owner, false); // owner scrolled away: fade, mute, release
  list.forEach((s) => {
    s.el.classList.toggle('no-autoplay', !auto);
    if (ratioOf(s) < STOP_BELOW) s.userPlay = false;
  });
  let keep = [];
  if (document.hidden) keep = [];
  else if (auto) {
    keep = list.filter((s) => s.eligible && !s.userPaused
      && (s === owner || ratioOf(s) >= PLAY_AT || (!s.v.paused && ratioOf(s) >= STOP_BELOW)))
      .sort((a, b) => (b === owner) - (a === owner) || ratioOf(b) - ratioOf(a))
      .slice(0, maxPlaying());
  } else keep = list.filter((s) => (s.userPlay || s === owner) && !s.userPaused && ratioOf(s) >= STOP_BELOW);
  list.forEach((s) => { if (!keep.includes(s) && !s.v.paused) s.v.pause(); });
  keep.forEach((s) => { warm(s); play(s); });
}

function play(s) {
  if (!s.v.paused) return;
  const p = s.v.play();
  if (p && p.then) p.then(() => s.el.classList.remove('is-blocked'), (err) => {
    if (err && err.name === 'NotAllowedError' && s.v.paused) s.el.classList.add('is-blocked'); // Low Power Mode etc.
  });
}

/* ------------------------------------------------------------------ sound (§6.4) */

function fade(s, to, ms, done) {
  const v = s.v;
  const tok = ++s.fadeTok;
  const from = v.volume;
  const t0 = performance.now();
  const step = (t) => {
    if (tok !== s.fadeTok) return;
    const k = Math.min(1, (t - t0) / ms);
    v.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else if (done) done();
  };
  requestAnimationFrame(step);
}

function sound(s, on, { viaHover = false, instant = false } = {}) {
  const v = s.v;
  if (on) {
    if (owner && owner !== s) sound(owner, false, { instant: true });
    owner = s;
    s.viaHover = viaHover;
    s.userPaused = false;
    const tok = ++s.sTok;
    s.fadeTok++;
    s.el.classList.remove('needs-gesture', 'show-hint');
    if (canFade) v.volume = viaHover && fades() ? 0 : 1;
    v.muted = false;
    if (viaHover && fades()) fade(s, 1, 300);
    const p = v.play(); // inside the gesture: never behind a timer
    if (p && p.catch) p.catch((err) => { if (owner === s && s.sTok === tok && !(err && err.name === 'AbortError')) locked(s); });
    requestAnimationFrame(() => { // unmute safety check (Conectaa §5.5)
      if (owner !== s || s.sTok !== tok) return;
      if (v.paused || v.muted) locked(s); else unlocked = true;
    });
  } else {
    if (owner === s) owner = null;
    s.pinned = false;
    s.viaHover = false;
    s.sTok++;
    if (instant || !fades()) { s.fadeTok++; v.muted = true; } else fade(s, 0, 200, () => { v.muted = true; });
  }
  render(s);
  schedule();
}

/** The browser refused the unmute: re-mute, replay muted, lock sound, show the hint (.needs-gesture). */
function locked(s) {
  s.v.muted = true;
  if (owner === s) owner = null;
  s.pinned = false;
  s.viaHover = false;
  unlocked = false;
  s.el.classList.add('needs-gesture');
  clearTimeout(s.hintT);
  if (!qFine.matches) s.hintT = setTimeout(() => s.el.classList.remove('needs-gesture'), 3000);
  render(s);
  s.v.play().catch(() => {});
  schedule();
}

function flashHint(s, ms) {
  s.el.classList.add('show-hint');
  clearTimeout(s.hintT);
  s.hintT = setTimeout(() => s.el.classList.remove('show-hint'), ms);
}

export function toggleSound(card) {
  const s = register(card);
  if (!s || !hasSrc(s) || (s.fan && !s.eligible)) return;
  clearTimeout(s.hoverT); // a click decides: a pending hover intent must not undo it
  if (!autoplayOK()) { userPlayPause(s); return; }
  if (!hasAudio(s)) return;
  if (owner === s && (s.pinned || !qFine.matches)) { sound(s, false, { instant: true }); return; }
  if (owner === s) { s.pinned = true; render(s); return; } // hover sound -> pin it
  sound(s, true);
  if (owner === s) s.pinned = true;
}

/** Reduced motion / data saver (Conectaa userPlayPause): a tap plays with sound, a second tap pauses. */
function userPlayPause(s) {
  if (s.v.paused) {
    s.userPlay = true;
    s.userPaused = false;
    warm(s);
    if (hasAudio(s)) { sound(s, true); if (owner === s) s.pinned = true; } else { play(s); render(s); }
  } else {
    s.userPlay = false;
    s.v.pause();
    if (owner === s) sound(s, false, { instant: true }); else render(s);
  }
}

/** The visible pause button (WCAG 2.2.2): pause/resume; the scheduler respects userPaused. */
function userPause(s) {
  if (!hasSrc(s)) return;
  if (s.userPaused || s.v.paused) {
    s.userPaused = false;
    s.userPlay = !autoplayOK();
    warm(s);
    play(s);
  } else {
    s.userPaused = true;
    s.userPlay = false;
    s.v.pause();
    if (owner === s) sound(s, false, { instant: true });
  }
  render(s);
  schedule();
}

function hoverIn(s) {
  s.hover = true;
  if (s.fan && !s.eligible) return;
  s.el.classList.add('is-hover');
  if (!hasAudio(s) || !autoplayOK() || s.userPaused) return;
  if (!unlocked) { if (owner !== s) s.el.classList.add('needs-gesture'); return; } // never unmute on hover while locked
  clearTimeout(s.hoverT);
  s.hoverT = setTimeout(() => { if (s.hover && owner !== s && !s.userPaused) sound(s, true, { viaHover: true }); }, 180);
}

function hoverOut(s) {
  s.hover = false;
  clearTimeout(s.hoverT);
  s.el.classList.remove('is-hover', 'needs-gesture');
  if (owner === s && s.viaHover && !s.pinned) sound(s, false);
}

function render(s) {
  const on = owner === s;
  if (s.btn) {
    s.btn.setAttribute('aria-pressed', String(on));
    s.btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  }
  if (s.pauseBtn) s.pauseBtn.setAttribute('aria-pressed', String(!!s.userPaused));
  s.el.classList.toggle('is-user-paused', !!s.userPaused);
  if (s.el.classList.contains('has-sound') !== on) {
    s.el.classList.toggle('has-sound', on);
    s.el.dispatchEvent(new CustomEvent('vcard:sound', { bubbles: true, detail: { on } }));
  }
}

export function setEligible(card, eligible, { warm: warmIt = eligible } = {}) {
  const s = register(card);
  if (!s) return;
  s.eligible = !!eligible;
  s.warmOK = !s.fan || !!(warmIt || eligible);
  if (!s.v) return;
  if (!eligible) {
    clearTimeout(s.hoverT);
    s.el.classList.remove('is-hover', 'needs-gesture', 'show-hint');
    if (owner === s) sound(s, false, { instant: true });
    s.userPlay = false;
    s.userPaused = false;
    if (!s.v.paused) s.v.pause();
    render(s);
  }
  if (s.near) warm(s);
  schedule();
}

/** Thumb swap (§4.4b): poster, src, muted=false + play(), safety check, owner. No timers. */
export function swapSource(card, item) {
  const s = register(card);
  if (!s || !item || !s.v) return;
  items.set(item.id, item);
  const v = s.v;
  s.item = item;
  card.dataset.id = item.id;
  s.tok++;
  card.classList.remove('is-live', 'is-blocked', 'needs-gesture', 'show-hint');
  const has = !!item.src;
  const img = card.querySelector('.vcard__poster');
  if (img) { img.removeAttribute('data-src'); img.src = item.poster; img.alt = has ? '' : item.alt || ''; }
  const audio = has && item.audio !== false;
  card.dataset.hasVideo = String(has);
  card.dataset.audio = String(audio);
  if (s.btn) s.btn.hidden = !audio;
  if (s.pauseBtn) s.pauseBtn.hidden = !has;
  s.userPaused = false;
  s.userPlay = false;
  if (!has) {
    if (owner === s) sound(s, false, { instant: true });
    v.pause();
    v.removeAttribute('src');
    v.removeAttribute('poster');
    v.hidden = true;
    try { v.load(); } catch (_) { /* ignore */ }
    s.warmed = false;
    card.classList.remove('kb-run'); // the still gets its single Ken Burns pass
    void card.offsetWidth;
    if (s.kbOn) card.classList.add('kb-run');
  } else {
    v.hidden = false;
    v.setAttribute('aria-label', item.alt || item.title || '');
    v.style.cssText = viewCSS(item);
    v.poster = item.poster;
    v.src = srcOf(item);
    s.warmed = true;
    if (!autoplayOK()) s.userPlay = true;
    if (audio) { sound(s, true); if (owner === s) s.pinned = true; } else {
      if (owner === s) sound(s, false, { instant: true });
      v.muted = true;
      play(s);
    }
  }
  render(s);
  schedule();
}

/* ------------------------------------------------------------------ poster / thumb loading */

/**
 * Our own lookahead instead of loading="lazy": Chromium's native margin is up to 3000 px (unknown connection type),
 * which fetched every fan poster at load, and it never loads thumbs clipped inside a horizontal rail ahead of time.
 * One root:document observer per group (fan box, chapter body) assigns every data-src in it 1.5 viewports ahead.
 */
function loadImgs(root) {
  root.querySelectorAll('img[data-src]').forEach((img) => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
}

function lazyImages(groups) {
  if (typeof IntersectionObserver === 'undefined') { groups.forEach(loadImgs); return; }
  const io = makeIO((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    loadImgs(e.target);
  }), { rootMargin: '50% 0px 150% 0px', threshold: 0 });
  groups.forEach((g) => io.observe(g));
}

/* ------------------------------------------------------------------ module contract */

export function boot(ctx) {
  renderChapters(ctx.data && ctx.data.videos);
  document.querySelectorAll('[data-vcard]').forEach(register);
  lazyImages([...document.querySelectorAll('#content .fan, [data-chapter-body]')]);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) states.forEach((s) => { if (s.v && !s.v.paused) s.v.pause(); });
    schedule();
  });
  document.addEventListener('site:static', schedule);
  const onRM = () => schedule();
  if (qReduce.addEventListener) qReduce.addEventListener('change', onRM); else if (qReduce.addListener) qReduce.addListener(onRM);
}

export function ready() { schedule(); }

export function finish() { schedule(); }
