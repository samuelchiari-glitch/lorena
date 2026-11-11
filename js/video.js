/**
 * video.js: video cards (spec §6; Conectaa §5 adapted). OWNER: content section builder.
 *
 * FOUNDATION STUB. What already works: the static boot render of the four chapters
 * (feature card + thumb rail, from data/videos.json) and the shared card markup used by
 * fan.js, so the page is complete at rest. Everything below marked TODO is for the builder.
 *
 * Public API (spec §6; fan.js and the chapter renderer use only these):
 *   register(card)              idempotent; binds .vcard__sound / .vcard__pause, the card-level click
 *                               ONLY on [data-vcard]:not([data-fan]), hover (mouse), warm-up IO, Ken Burns IO.
 *                               Cards without a <video> get only the Ken Burns observer.
 *   toggleSound(card)           the tap action; call synchronously inside a click/pointerup/keydown handler.
 *   setEligible(card, bool)     fan focus (§6.2); non-fan cards are eligible by default.
 *   swapSource(card, item)      thumb swap (§4.4b), synchronous inside the thumb's click handler.
 * Module contract (site.js): boot(ctx) [static render, every JS mode], ready(ctx), finish().
 * Helpers for fan.js: cardHTML(item, opts), esc(str), formatDuration(sec).
 */

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function formatDuration(sec) {
  if (sec == null || !isFinite(sec)) return '';
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const ICON_SOUND = '<svg class="vcard__icon vcard__icon--off" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  + '<svg class="vcard__icon vcard__icon--on" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const ICON_PAUSE = '<svg class="vcard__icon vcard__icon--pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 6v12M16 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  + '<svg class="vcard__icon vcard__icon--play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';

/**
 * One video card (§6.1). opts: { fan:bool, index:number, feature:bool, deal:number, lazy:bool }.
 * No `src` and no `poster` attribute on <video>: both are set at warm-up (§6.3).
 */
export function cardHTML(item, opts = {}) {
  const hasVideo = !!item.src;
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
    ? `<video class="vcard__video" muted playsinline loop preload="none" disablepictureinpicture disableremoteplayback controlslist="nodownload noplaybackrate nofullscreen" aria-label="${esc(item.alt)}"${hasVideo ? '' : ' hidden'}></video>`
    : '';
  const hit = opts.fan ? `<button class="fan__hit" type="button" aria-label="Show: ${esc(item.title)}"></button>` : '';
  return `<figure ${attrs}>`
    + `<div class="vcard__media"><img class="vcard__poster" src="${esc(item.poster)}" alt="" width="540" height="960" decoding="async" loading="lazy">${video}</div>`
    + hit
    + `<button class="vcard__sound" type="button" aria-pressed="false" aria-label="Turn sound on"${audio ? '' : ' hidden'}>${ICON_SOUND}</button>`
    + `<button class="vcard__pause" type="button" aria-pressed="false" aria-label="Pause video"${hasVideo ? '' : ' hidden'}>${ICON_PAUSE}</button>`
    + '<span class="vcard__hint" aria-hidden="true">Tap for sound</span>'
    + '</figure>';
}

function thumbHTML(item, active) {
  const verb = item.src ? 'Play' : 'Show';
  return `<button class="rail__thumb" type="button" data-id="${esc(item.id)}" aria-label="${verb}: ${esc(item.title)}"${active ? ' aria-current="true"' : ''}>`
    + `<img src="${esc(item.thumb)}" alt="" width="240" height="427" loading="lazy" decoding="async"></button>`;
}

function categoryLabel(cat) {
  const parts = String(cat.eyebrow || '').split('·');
  return (parts[1] || parts[0] || '').trim();
}

/** Static boot render of every chapter body (feature card + caption + rail). */
export function renderChapters(data) {
  if (!data || !Array.isArray(data.categories)) return;
  const byId = new Map((data.videos || []).map((v) => [v.id, v]));
  data.categories.forEach((cat, ci) => {
    const body = document.querySelector(`[data-chapter-body="${cat.key}"]`);
    if (!body || body.hasAttribute('data-rendered')) return;
    const items = (data.videos || []).filter((v) => v.category === cat.key).sort((a, b) => (a.order || 0) - (b.order || 0));
    const feature = byId.get(cat.feature) || items[0];
    if (!feature) return;
    const dur = formatDuration(feature.duration);
    const meta = `${esc(categoryLabel(cat))}${dur ? ` · ${dur}` : ''}`;
    body.innerHTML = `<div class="chapter__feature">${cardHTML(feature, { feature: true, deal: ci })}`
      + `<div class="chapter__caption"><p class="t-intro chapter__title">${esc(feature.title)}</p>`
      + `<p class="t-caption chapter__meta">${meta}</p></div></div>`
      + `<div class="rail" data-lenis-prevent-horizontal data-rise="24" data-rise-start="top 92%">`
      + items.map((it) => thumbHTML(it, it.id === feature.id)).join('')
      + '</div>';
    body.setAttribute('data-rendered', '');
  });
}

/* ------------------------------------------------------------------ module contract */

export function boot(ctx) {
  renderChapters(ctx.data && ctx.data.videos);
  document.querySelectorAll('[data-vcard]').forEach(register);
}

export function ready() {
  // TODO(content): scheduler (§6.2), warm-up IO (§6.3, root: document via makeIO), sound owner (§6.4).
}

export function finish() {}

/* ------------------------------------------------------------------ public API (TODO: content builder) */

const registered = new WeakSet();

export function register(card) {
  if (!card || registered.has(card)) return;
  registered.add(card);
  // TODO(content): bindings per §6 (sound, pause, card click on :not([data-fan]), hover, warm-up, Ken Burns).
}

export function toggleSound(card) { void card; /* TODO(content) */ }
export function setEligible(card, eligible) { void card; void eligible; /* TODO(content) */ }
export function swapSource(card, item) { void card; void item; /* TODO(content) */ }
