/**
 * brands.js: partner logos from data/brands.json (spec §4.6). OWNER: proof section builder.
 *
 * boot(ctx), every JS mode:
 *   - renders the three rows (logos distributed i % 3; each row's <ul> rendered twice, the copy
 *     aria-hidden with alt=""; the 4 "unidentified" entries alt="" inside aria-hidden items),
 *     logo height 44px × scale via --scale, and the brand count (brands.length);
 *   - eager-loads every logo one viewport ahead (IO with root: document, rootMargin 100% below);
 *   - motion mode only: adds .brands--marquee (css/proof.css) so the rows render straight into the
 *     marquee layout (no second layout change later), starts one WAAPI loop per row (rows 1 and 3
 *     move left, row 2 right; a logo crosses 390 px in ≈ 7 s), pauses them off-screen, and unhides
 *     the pause button. The CSS default (no JS, reduced motion, CDN failure) is the wrapping grid.
 * ready(ctx), motion mode: direction follows scroll (playbackRate ramps to ±1 over 400 ms when
 *   lenis.direction flips), the ±6vw row drift scrubbed across the section's pass, and the brand
 *   count-up (motion.js initMotion, armed on approach).
 * finish(): finishAll() (reduced motion turned on, print, boot failure): cancel the loops and go
 *   back to the static grid.
 *
 * Exports: boot(ctx), ready(ctx), finish(), renderBrands(list), setPaused(bool).
 */
import { getLenis, isMotion, makeIO, onApproach, refresh, scope } from './scroll.js';
import { initMotion } from './motion.js';

const SPEED = 56;          // px per second (§4.6)
const RAMP = 0.4;          // s, playbackRate ramp when the scroll direction flips
const DRIFT = 0.06;        // × innerWidth, the whole row's scrubbed drift
const ROW_DIR = [1, -1, 1]; // +1 = moves left (rows 1 and 3), -1 = moves right (row 2)

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

/* ------------------------------------------------------------------ eager-load one viewport ahead (every JS mode) */

function eagerLoad(section) {
  const imgs = () => section.querySelectorAll('.brands__item img[loading="lazy"]');
  const go = () => imgs().forEach((img) => { img.loading = 'eager'; });
  if (typeof IntersectionObserver === 'undefined') { go(); return; }
  // Horizontally clipped marquee items would never be fetched by native lazy loading; this hides nothing.
  const io = makeIO((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    go();
  }, { rootMargin: '0px 0px 100% 0px', threshold: 0 });
  io.observe(section);
}

/* ------------------------------------------------------------------ marquee (motion mode) */

let M = null; // { section, rows:[{row, track, anim, dir}], btn, io, paused, visible, rate, onResize, offLenis }

function copiesNeeded(row, list) {
  const lw = list.offsetWidth || 1;
  // the row must stay covered across a full loop: n × list ≥ row width + one list
  return Math.max(2, Math.ceil(row.offsetWidth / lw) + 1);
}

function buildLoop(r) {
  const { row, track, dir } = r;
  const lists = track.querySelectorAll(':scope > .brands__list');
  const first = lists[0];
  if (!first) return;
  const n = copiesNeeded(row, first);
  for (let i = lists.length; i < n; i++) {
    const copy = track.querySelector(':scope > .brands__list[aria-hidden="true"]').cloneNode(true);
    copy.setAttribute('data-extra', '');
    track.appendChild(copy);
  }
  const all = track.querySelectorAll(':scope > .brands__list').length;
  const listW = first.offsetWidth;
  const shift = `${(-100 / all).toFixed(4)}%`;           // one list width (−50% with the two copies of §4.6)
  const kf = dir > 0
    ? [{ transform: 'translateX(0)' }, { transform: `translateX(${shift})` }]
    : [{ transform: `translateX(${shift})` }, { transform: 'translateX(0)' }];
  const duration = Math.max(8000, (listW / SPEED) * 1000);
  const prev = r.anim;
  const progress = prev && prev.effect ? (prev.currentTime % prev.effect.getTiming().duration) / prev.effect.getTiming().duration : Math.random();
  if (prev) prev.cancel();
  const anim = track.animate(kf, { duration, iterations: Infinity, easing: 'linear' });
  // start deep into the infinite loop, so a negative playbackRate (scrolling up) never reaches time 0
  anim.currentTime = duration * (10000 + (Number.isFinite(progress) ? progress : 0));
  anim.playbackRate = M ? M.rate : 1;
  r.anim = anim;
  syncPlay();
}

function syncPlay() {
  if (!M) return;
  const run = M.visible && !M.paused;
  M.rows.forEach(({ anim }) => {
    if (!anim) return;
    if (run && anim.playState !== 'running') anim.play();
    else if (!run && anim.playState === 'running') anim.pause();
  });
}

export function setPaused(paused) {
  if (!M) return;
  M.paused = !!paused;
  if (M.btn) {
    M.btn.setAttribute('aria-pressed', M.paused ? 'true' : 'false');
    const label = M.btn.querySelector('.brands__pause-label');
    if (label) label.textContent = M.paused ? 'Play logos' : 'Pause logos';
    M.btn.classList.toggle('is-paused', M.paused);
  }
  syncPlay();
}

function startMarquee(section) {
  const box = section.querySelector('[data-brands]');
  if (!box || !box.hasAttribute('data-rendered') || typeof Element.prototype.animate !== 'function') return;
  section.classList.add('brands--marquee');
  M = { section, rows: [], btn: null, io: null, paused: false, visible: false, rate: 1, onResize: null, offLenis: null, drift: [] };
  M.rows = [...box.querySelectorAll('.brands__row')].map((row, i) => ({
    row, track: row.querySelector('.brands__track'), anim: null, dir: ROW_DIR[i % ROW_DIR.length],
  }));
  M.rows.forEach(buildLoop);

  // pause off-screen (no margin needed, but root: document keeps it consistent inside the Artifact iframe)
  if (typeof IntersectionObserver !== 'undefined') {
    M.io = makeIO((entries) => {
      if (!M) return;
      M.visible = entries[entries.length - 1].isIntersecting;
      syncPlay();
    }, { threshold: 0 });
    M.io.observe(box);
  } else {
    M.visible = true;
    syncPlay();
  }

  // pause control (WCAG 2.2.2): visible pill, aria-pressed
  const btn = section.querySelector('.brands__pause');
  if (btn) {
    if (!btn.querySelector('.brands__pause-label')) {
      btn.innerHTML = '<span class="brands__pause-icon" aria-hidden="true"></span><span class="brands__pause-label">Pause logos</span>';
    }
    btn.hidden = false;
    btn.onclick = () => setPaused(!M.paused);
    M.btn = btn;
    setPaused(false);
  }

  // wide screens: re-check the copies (and loop length) after a resize
  let t = 0;
  M.onResize = () => {
    clearTimeout(t);
    t = setTimeout(() => { if (M) M.rows.forEach(buildLoop); }, 200);
  };
  addEventListener('resize', M.onResize);
}

function stopMarquee() {
  if (!M) return;
  M.rows.forEach(({ anim, track }) => {
    if (anim) anim.cancel();
    track.querySelectorAll(':scope > .brands__list[data-extra]').forEach((l) => l.remove());
  });
  if (M.io) M.io.disconnect();
  if (M.onResize) removeEventListener('resize', M.onResize);
  if (M.offLenis) M.offLenis();
  if (M.btn) { M.btn.hidden = true; M.btn.onclick = null; }
  M.section.classList.remove('brands--marquee');
  M = null;
}

/* direction follows scroll: ramp every row's playbackRate to ±1 over 400 ms */
function followScroll() {
  const lenis = getLenis();
  const { gsap } = window;
  if (!lenis || !gsap || !M) return;
  const proxy = { rate: M.rate };
  let dir = 1;
  const apply = () => {
    if (!M) return;
    M.rate = proxy.rate;
    M.rows.forEach(({ anim }) => { if (anim) anim.playbackRate = proxy.rate; });
  };
  const onScroll = (l) => {
    const d = l.direction;
    if (!M || !d || d === dir) return;
    dir = d;
    scope(() => gsap.to(proxy, { rate: d, duration: RAMP, ease: 'power1.inOut', overwrite: true, onUpdate: apply }));
  };
  const off = lenis.on('scroll', onScroll);
  M.offLenis = typeof off === 'function' ? off : () => { try { lenis.off('scroll', onScroll); } catch (_) { /* ignore */ } };
}

/* the whole row drifts ±6vw (opposite per row), scrubbed across the section's pass */
function drift() {
  const { gsap } = window;
  if (!gsap || !M) return;
  scope(() => {
    M.rows.forEach(({ row, dir }) => {
      const amp = () => DRIFT * innerWidth * dir;
      gsap.fromTo(row, { x: () => amp() }, {
        x: () => -amp(), ease: 'none',
        scrollTrigger: { trigger: M.section, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
    });
  });
}

/* ------------------------------------------------------------------ module contract */

export function boot(ctx) {
  const data = ctx.data && ctx.data.brands;
  renderBrands(data && data.brands);
  const section = document.querySelector('#brands');
  if (!section || !section.querySelector('[data-brands][data-rendered]')) return;
  eagerLoad(section);
  if (ctx.motion && isMotion()) startMarquee(section);
}

export function ready(ctx) {
  if (!ctx.motion || !isMotion() || !M) return;
  followScroll();
  drift();
  const count = M.section.querySelector('[data-brand-count][data-count]');
  if (count) onApproach(count, () => { if (isMotion()) initMotion(count); });
  refresh();
}

export function finish() {
  stopMarquee();
}
