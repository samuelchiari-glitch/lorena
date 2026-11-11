/**
 * proof.js: drives the Instagram screens and the Numbers section (spec §4.2, §4.5).
 * OWNER: proof section builder. (A foundation addition: the spec names no module for this.)
 *
 * What already works:
 *   boot(ctx)   bindMetrics(): every [data-metric] / [data-metric-label] / [data-period] is written
 *               from data/metrics.json (the static HTML carries the same strings).
 *               initTabs(): the Numbers screens sit in one horizontal snap rail; tab pills above it
 *               scroll to a screen and show which one is in view (aria-current).
 *   ready(ctx)  motion mode: each [data-ig-screen][data-ig-static] is upgraded on approach (the Numbers
 *               screens all together, when their rail approaches: the ones off to the side then play when
 *               they are swiped into view) (remove data-ig-static, renderScreen() again, so motion.js arms
 *               it below the fold; the profile screen gets data-ig-flash), and the stats count up.
 * insights.js auto-renders every screen statically on import (the resting state).
 *
 * Count-ups (the stats, the brand count and every Instagram screen) start at ~65% of their value (countFrom), so
 * a number waiting just below its play line never reads 0; the three stats share one data-motion-scope (site.html)
 * and start together.
 *
 * Exports: boot(ctx), ready(ctx), finish(), bindMetrics(metrics), getPath(obj, path), formatPeriod(period),
 *          countFrom(el, k).
 */
import { renderScreen } from './insights.js';
import { initMotion } from './motion.js';
import { getLenis, isMotion, onApproach, refresh } from './scroll.js';

export function getPath(obj, path) {
  return String(path).replace(/\[(\d+)\]/g, '.$1').split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function formatPeriod(p) {
  if (!p || !p.from || !p.to) return '';
  const f = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${f(p.from)} – ${f(p.to)}, ${p.to.slice(0, 4)}`;
}

export function bindMetrics(m) {
  if (!m) return;
  document.querySelectorAll('[data-metric]').forEach((el) => {
    const v = getPath(m, el.getAttribute('data-metric'));
    const mm = v == null ? null : String(v).match(/^([+\-]?[\d.,]+)(.*)$/);
    if (!mm) return;
    el.textContent = mm[1];
    const u = el.nextElementSibling;
    if (u && u.classList.contains('u')) u.textContent = mm[2];
  });
  document.querySelectorAll('[data-metric-label]').forEach((el) => {
    const v = getPath(m, el.getAttribute('data-metric-label'));
    if (typeof v === 'string' && v) el.textContent = v;
  });
  const period = formatPeriod(m.period);
  if (period) document.querySelectorAll('[data-period]').forEach((el) => { el.textContent = period; });
}

/** data-count-from = k × the element's own value, at its own precision (motion.js reads it when it arms). */
export function countFrom(el, k = 0.65) {
  const m = el.textContent.trim().match(/^[+-]?[\d.,]+/);
  if (!m) return;
  const raw = m[0].replace(/[+,]/g, '');
  const v = parseFloat(raw);
  if (Number.isFinite(v)) el.setAttribute('data-count-from', (v * k).toFixed((raw.split('.')[1] || '').length));
}

/**
 * renderScreen() (insights.js, reused unchanged) writes a screen's markup and arms its count-ups in one call, so
 * their start value has to be set in between: while it runs, the placeholder's innerHTML setter is shadowed by one
 * that writes the markup and then gives every [data-count] its data-count-from (motion.js reads it when it arms).
 */
function renderCountingFrom(el, metrics) {
  const native = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(el, 'innerHTML', {
    configurable: true,
    get() { return native.get.call(this); },
    set(html) {
      native.set.call(this, html);
      this.querySelectorAll('[data-count]').forEach((n) => countFrom(n));
    },
  });
  try {
    renderScreen(el, metrics);
  } finally {
    delete el.innerHTML; // back to the prototype's accessor
  }
}

function initTabs() {
  const rail = document.querySelector('#numbers .numbers__screens');
  const figs = rail ? [...rail.querySelectorAll('.numbers__screen')] : [];
  if (figs.length < 2 || rail.previousElementSibling?.classList.contains('numbers__tabs')) return;
  const tabs = document.createElement('div');
  tabs.className = 'numbers__tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Instagram screens');
  let picked = -1; // a tapped tab (see sync below)
  const btns = figs.map((fig, i) => {
    const cap = fig.querySelector('figcaption');
    if (!fig.id) fig.id = `ig-screen-${i + 1}`;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pill';
    b.textContent = cap ? cap.textContent : String(i + 1);
    b.setAttribute('aria-controls', fig.id);
    b.addEventListener('click', () => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      picked = i; // on wide screens the scroll may stop short of the snap line (the rail ends): the tap decides
      mark(i);
      rail.scrollTo({ left: fig.offsetLeft - figs[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    });
    tabs.appendChild(b);
    return b;
  });
  rail.before(tabs);
  // the tall screens (Performance, Audience) are cropped to their top cards until expanded
  figs.forEach((fig, i) => {
    const shot = fig.querySelector('[data-ig-screen]');
    if (!shot || !/^(performance|audience)$/.test(shot.dataset.igScreen)) return;
    fig.classList.add('is-cropped');
    if (!shot.id) shot.id = `ig-shot-${i + 1}`;
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'pill numbers__more';
    more.textContent = 'Show the full screen';
    more.setAttribute('aria-expanded', 'false');
    more.setAttribute('aria-controls', shot.id);
    more.addEventListener('click', () => {
      const before = more.getBoundingClientRect().top;
      const open = fig.classList.toggle('is-cropped') === false;
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'Show less' : 'Show the full screen';
      // collapsing a screen read to its end would pull the button up under the header: keep it where it was
      const shift = open ? 0 : more.getBoundingClientRect().top - before;
      if (Math.abs(shift) > 1) {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(scrollY + shift, { immediate: true, force: true });
        else window.scrollTo(0, scrollY + shift);
      }
      refresh(); // the page below moved: re-measure the scroll triggers
    });
    fig.appendChild(more);
  });
  // The current screen: the one at the snap line, or the last one once the rail is scrolled to its end (on wide
  // screens the last screens cannot reach the line). After a tab tap, that tab stays current until the visitor
  // moves the rail themselves.
  let raf = 0;
  const mark = (cur) => btns.forEach((b, i) => (i === cur ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  const sync = () => {
    raf = 0;
    if (picked >= 0) return;
    const x = rail.scrollLeft + figs[0].offsetLeft;
    let cur = 0;
    figs.forEach((f, i) => { if (Math.abs(f.offsetLeft - x) < Math.abs(figs[cur].offsetLeft - x)) cur = i; });
    if (rail.scrollLeft > 0 && rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2) cur = figs.length - 1;
    mark(cur);
  };
  ['pointerdown', 'wheel', 'keydown'].forEach((t) => rail.addEventListener(t, () => { picked = -1; }, { passive: true }));
  rail.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(sync); }, { passive: true });
  sync();
}

export function boot(ctx) {
  bindMetrics(ctx.data && ctx.data.metrics);
  initTabs();
}

export function ready(ctx) {
  const metrics = ctx.data && ctx.data.metrics;
  if (!ctx.motion || !isMotion() || !metrics) return;
  document.querySelectorAll('[data-ig-screen][data-ig-static]').forEach((el) => {
    onApproach(el.closest('.numbers__screens') || el, () => {
      if (!isMotion() || el.getAttribute('data-ig-rendered') !== '') return;
      el.removeAttribute('data-ig-static');
      if (el.closest('#instagram')) el.setAttribute('data-ig-flash', '');
      renderCountingFrom(el, metrics);
    });
  });
  const stats = document.querySelector('#numbers .stats');
  if (stats) {
    onApproach(stats, () => {
      if (!isMotion()) return;
      stats.querySelectorAll('[data-count]').forEach((el) => countFrom(el));
      initMotion(stats);
    });
  }
}

export function finish() {}
