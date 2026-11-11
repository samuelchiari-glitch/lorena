/**
 * proof.js: drives the Instagram screens and the Numbers section (spec §4.2, §4.5).
 * OWNER: proof section builder. (A foundation addition: the spec names no module for this.)
 *
 * What already works:
 *   boot(ctx)   bindMetrics(): every [data-metric] / [data-metric-label] / [data-period] is written
 *               from data/metrics.json (the static HTML carries the same strings).
 *   ready(ctx)  motion mode: each [data-ig-screen][data-ig-static] is upgraded on approach
 *               (remove data-ig-static, renderScreen() again, so motion.js arms it below the fold;
 *               the profile screen gets data-ig-flash), and the stats count up (initMotion on approach).
 * insights.js auto-renders every screen statically on import (the resting state).
 *
 * Exports: boot(ctx), ready(ctx), finish(), bindMetrics(metrics), getPath(obj, path), formatPeriod(period).
 */
import { renderScreen } from './insights.js';
import { initMotion } from './motion.js';
import { isMotion, onApproach } from './scroll.js';

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

export function boot(ctx) {
  bindMetrics(ctx.data && ctx.data.metrics);
}

export function ready(ctx) {
  const metrics = ctx.data && ctx.data.metrics;
  if (!ctx.motion || !isMotion() || !metrics) return;
  document.querySelectorAll('[data-ig-screen][data-ig-static]').forEach((el) => {
    onApproach(el, () => {
      if (!isMotion() || el.getAttribute('data-ig-rendered') !== '') return;
      el.removeAttribute('data-ig-static');
      if (el.closest('#instagram')) el.setAttribute('data-ig-flash', '');
      renderScreen(el, metrics);
    });
  });
  const stats = document.querySelector('#numbers .stats');
  if (stats) onApproach(stats, () => { if (isMotion()) initMotion(stats); });
}

export function finish() {}
