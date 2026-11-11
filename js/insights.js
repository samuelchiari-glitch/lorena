/**
 * insights.js — renders live recreations of Lorena's Instagram dashboard
 * screenshots from data/metrics.json and wires them to motion.js.
 *
 *   <link rel="stylesheet" href="css/insights.css">
 *   <div data-ig-screen="profile"></div>       Screen A: profile header
 *   <div data-ig-screen="summary"></div>       Screen B: Home tab, Summary
 *   <div data-ig-screen="performance"></div>   Screen C: Performance tab
 *   <div data-ig-screen="audience"></div>      Screen D: Audience tab
 *   <script type="module" src="js/insights.js"></script>
 *
 * Placeholder options (attributes):
 *   data-ig-flash        white "screenshot taken" flash when the card lands
 *   data-ig-tilt         gentle pointer tilt + glare on desktop
 *   data-ig-static       no motion at all (final values, no entrance)
 *   data-ig-device="390" lay out for a 390pt iPhone instead of 430pt
 *   data-ig-src="url"    use another metrics.json
 *
 * The module auto-renders every [data-ig-screen] on the page when imported.
 * For content added later call:  renderInsights({ root: someElement })
 */

import { initMotion, onEnter, prefersReducedMotion } from './motion.js';

const DEFAULT_SRC = new URL('../data/metrics.json', import.meta.url).href;
const SITE_ROOT = new URL('../', import.meta.url);
const cache = new Map();
let uid = 0;

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function loadMetrics(src = DEFAULT_SRC) {
  if (!cache.has(src)) {
    cache.set(
      src,
      fetch(src, { cache: 'no-cache' }).then((r) => {
        if (!r.ok) throw new Error(`metrics: ${r.status} ${src}`);
        return r.json();
      })
    );
  }
  return cache.get(src);
}

/** Render every [data-ig-screen] under `root` (idempotent). */
export async function renderInsights({ root = document, src, data } = {}) {
  const els = [...root.querySelectorAll('[data-ig-screen]')];
  if (root.nodeType === 1 && root.matches('[data-ig-screen]')) els.unshift(root);
  const todo = els.filter((el) => !el.hasAttribute('data-ig-rendered'));
  if (!todo.length) return [];
  await Promise.all(
    todo.map(async (el) => {
      el.setAttribute('data-ig-rendered', 'pending');
      try {
        const d = data || (await loadMetrics(el.getAttribute('data-ig-src') || src || DEFAULT_SRC));
        renderScreen(el, d);
      } catch (err) {
        el.removeAttribute('data-ig-rendered');
        console.error('[insights]', err);
      }
    })
  );
  return todo;
}

/** Render one placeholder synchronously from an already-loaded metrics object. */
export function renderScreen(el, d) {
  const kind = el.getAttribute('data-ig-screen');
  const W = el.getAttribute('data-ig-device') === '390' ? 390 : 430;
  const ctx = { d, W, id: ++uid, motion: !el.hasAttribute('data-ig-static') };
  const builders = { profile: screenProfile, summary: screenSummary, performance: screenPerformance, audience: screenAudience };
  const build = builders[kind];
  if (!build) throw new Error(`Unknown data-ig-screen="${kind}"`);

  const shotAttr = ctx.motion ? ` data-shot${el.hasAttribute('data-ig-flash') ? '="flash"' : ''}` : '';
  const tiltAttr = ctx.motion && el.hasAttribute('data-ig-tilt') ? ' data-tilt="glare"' : '';
  const label = el.getAttribute('data-ig-label') || LABELS[kind](d);

  el.classList.add('ig-shot');
  el.innerHTML = `<div class="ig-shot__card"${shotAttr}${tiltAttr}><div class="ig-screen" role="group" aria-label="${esc(label)}">${build(ctx)}</div></div>`;
  el.setAttribute('data-ig-rendered', '');

  // Avatar falls back to a neutral circle if the file is missing.
  el.querySelectorAll('.ig-avatar__img img').forEach((img) => {
    img.addEventListener('error', () => img.remove(), { once: true });
  });

  if (kind === 'performance' || kind === 'audience') setupRail(el, ctx, kind);
  if (ctx.motion) initMotion(el);
}

const LABELS = {
  profile: (d) => `Instagram profile of @${d.profile.username}`,
  summary: (d) => `Instagram dashboard, Home tab: summary for the last ${d.period.label}`,
  performance: (d) => `Instagram dashboard, Performance tab: views for the last ${d.period.label}`,
  audience: (d) => `Instagram dashboard, Audience tab: followers, gender and age for the last ${d.period.label}`,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const svg = (vb, body, cls = 'ig-icon', extra = '') =>
  `<svg class="${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;

const ICON = {
  back: (c) => svg('0 0 24 24', '<path d="M15.5 4.5 8 12l7.5 7.5" stroke-width="2.1"/>', c),
  share: (c) =>
    svg(
      '0 0 24 24',
      '<path d="M12 14.6V3.6M7.6 7.9 12 3.5l4.4 4.4" stroke-width="1.9"/><path d="M8.6 10.4H6.9c-1 0-1.8.8-1.8 1.8v7.1c0 1 .8 1.8 1.8 1.8h10.2c1 0 1.8-.8 1.8-1.8v-7.1c0-1-.8-1.8-1.8-1.8h-1.7" stroke-width="1.9"/>',
      c
    ),
  info: (c) =>
    svg('0 0 24 24', '<circle cx="12" cy="12" r="9.6" stroke-width="1.9"/><path d="M12 11.2v5.6" stroke-width="2"/><circle cx="12" cy="7.7" r="1.3" fill="currentColor" stroke="none"/>', c),
  infoSerif: (c) =>
    svg(
      '0 0 24 24',
      '<circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M10.2 10.6h2.1v6.2M9.9 16.8h4.6" stroke-width="1.9"/><circle cx="11.9" cy="7.4" r="1.35" fill="currentColor" stroke="none"/>',
      c
    ),
  chevDown: (c) => svg('0 0 24 24', '<path d="m5 8.5 7 7 7-7" stroke-width="2.6"/>', c),
  chevSmall: (c) => svg('0 0 24 24', '<path d="m6 9.5 6 6 6-6" stroke-width="2.6"/>', c),
  plus: (c, w = 2) => svg('0 0 24 24', `<path d="M12 4.2v15.6M4.2 12h15.6" stroke-width="${w}"/>`, c),
  menu: (c) => svg('0 0 24 24', '<path d="M3.6 5.8h16.8M3.6 12h16.8M3.6 18.2h16.8" stroke-width="2"/>', c),
  threads: (c, w = 2) =>
    svg('0 0 24 24', `<circle cx="12" cy="12" r="3.9" stroke-width="${w}"/><path d="M15.9 8.1v5a2.85 2.85 0 0 0 5.7 0V12a9.6 9.6 0 1 0-3.8 7.65" stroke-width="${w}"/>`, c),
  heart: (c) =>
    svg('0 0 24 24', '<path d="M12 20.2s-7.6-4.5-7.6-10.2A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.6 10c0 5.7-7.6 10.2-7.6 10.2Z" stroke-width="2"/>', c),
  trend: (c) => svg('0 0 24 24', '<path d="M6.5 17.5 17.5 6.5M9 6.5h8.5V15" stroke-width="2.4"/>', c),
};

function verifiedBadge(cls = 'ig-verified') {
  // Scalloped rosette (Instagram's verified badge) built from alternating radii.
  const n = 8;
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 ? 9.1 : 10.6;
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-label="Verified" role="img"><polygon points="${pts.join(' ')}" fill="#0095F6" stroke="#0095F6" stroke-width="2.2" stroke-linejoin="round"/><path d="m7.9 12.3 2.8 2.8 5.5-5.6" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function statusBar(d, key) {
  const sb = d.statusBar || {};
  const time = (sb[key] && sb[key].time) || '9:41';
  const bars = Math.max(0, Math.min(4, sb.signalBars ?? 4));
  const pct = Math.max(0, Math.min(100, sb.batteryPercent ?? 100));
  const heights = [4.4, 6.6, 8.8, 11];
  const signal = heights
    .map((h, i) => `<rect x="${i * 4.9}" y="${11.6 - h}" width="3.2" height="${h}" rx="0.9" fill="${i < bars ? 'currentColor' : 'rgba(0,0,0,.22)'}"/>`)
    .join('');
  const fill = sb.charging ? '#34C759' : pct <= 20 ? '#FF3B30' : '#000';
  const bw = 24.5;
  const level = ((bw - 0.001) * pct) / 100;
  const cid = `igbat${++uid}`;
  const battery = `<svg class="ig-status__battery" viewBox="0 0 32 13" aria-hidden="true" focusable="false">
<defs><clipPath id="${cid}"><rect x="0" y="0" width="${bw}" height="13" rx="4"/></clipPath>
<mask id="${cid}m"><rect width="32" height="13" fill="#fff"/><text x="${bw / 2}" y="10.05" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,Arial,sans-serif" font-size="9.6" font-weight="700" fill="#000" letter-spacing="-.2">${pct}</text></mask></defs>
<g mask="url(#${cid}m)"><g clip-path="url(#${cid})"><rect width="${bw}" height="13" fill="rgba(60,60,67,.32)"/><rect width="${level.toFixed(2)}" height="13" fill="${fill}"/></g>
<path d="M25.6 4.4c.9.2 1.5.9 1.5 2.1s-.6 1.9-1.5 2.1z" fill="rgba(60,60,67,.42)"/></g>
${sb.charging ? '<path d="M30.9 1.6 28 7.2h2l-.7 4.2 2.9-5.7h-2.1l.8-4.1z" fill="#000"/>' : ''}</svg>`;
  return `<div class="ig-status" aria-hidden="true"><span class="ig-status__time">${esc(time)}</span><span class="ig-status__right"><svg class="ig-status__signal" viewBox="0 0 18 12" fill="#000">${signal}</svg><span class="ig-status__net">${esc(sb.network || '')}</span>${battery}</span></div>`;
}

function navBar(d) {
  return `<div class="ig-nav"><span class="ig-nav__left">${ICON.back('ig-icon')}</span><span class="ig-nav__title">${esc(d.ui.dashboardTitle)}</span><span class="ig-nav__right">${ICON.share('ig-icon')}${ICON.info('ig-icon ig-icon--sm')}</span></div>`;
}

function tabs(d, active) {
  return `<div class="ig-tabs" role="presentation">${d.ui.tabs
    .map((t, i) => `<span class="ig-tab${i === active ? ' is-active' : ''}"><span class="ig-tab__label">${esc(t)}</span></span>`)
    .join('')}</div>`;
}

function head(title, range) {
  return `<div class="ig-head"><h3 class="ig-h1">${esc(title)}</h3><span class="ig-range">${esc(range)}${ICON.chevDown('')}</span></div>`;
}

function h2(title) {
  return `<h3 class="ig-h2">${esc(title)}${ICON.infoSerif('')}</h3>`;
}

/** A stat card. `opts.delay` staggers the count-up. */
function card(d, key, ctx, opts = {}) {
  const k = d.kpis[key];
  if (!k) return '';
  const cls = ['ig-card', opts.feature ? 'ig-card--feature' : '', opts.selected ? 'is-selected' : ''].filter(Boolean).join(' ');
  const labelCls = opts.small ? 'ig-card__label ig-card__label--sm' : 'ig-card__label';
  const m = ctx.motion;
  const delay = opts.delay || 0;
  const deltaText = k.delta ? `${k.delta} ${d.period.deltaSuffix}` : '';
  return `<div class="${cls}" data-kpi="${esc(key)}">
<span class="${labelCls}">${esc(k.label)}</span>
<span class="ig-card__value"><span class="ig-num"${m ? ` data-count data-delay="${delay}"` : ''}>${esc(k.value)}</span></span>
${deltaText ? `<span class="ig-card__delta"${m ? ` data-reveal="fade" data-delay="${delay + 650}"` : ''}>${esc(deltaText)}</span>` : ''}
${opts.inner || ''}</div>`;
}

/* ------------------------------------------------------------------ */
/* Charts (SVG, drawn in iPhone points; the viewBox scales with --u)    */
/* ------------------------------------------------------------------ */

function pointsFor(values, { w, h, top, bottom, min, max, inset }) {
  const n = values.length;
  const span = max - min || 1;
  return values.map((v, i) => {
    const x = inset + (i * (w - inset * 2)) / (n - 1);
    const y = bottom - ((v - min) / span) * (bottom - top);
    return [x, y];
  });
}

const pathOf = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L');

function sparkline(ctx, chart) {
  // Plot box inside the feature card, in points.
  const cardW = ((ctx.W - 44) * 50.5) / 100;
  const w = cardW - 32;
  const h = 81;
  const top = 3.3;
  const bottom = 79.5;
  const pts = pointsFor(chart.values, { w, h, top, bottom, min: chart.yMin ?? 0, max: chart.yMax, inset: 1 });
  const line = pathOf(pts);
  const area = `${line}L${pts[pts.length - 1][0].toFixed(2)} ${bottom + 1}L${pts[0][0].toFixed(2)} ${bottom + 1}Z`;
  const gid = `igspark${ctx.id}`;
  const m = ctx.motion;
  const [l, r] = chart.sparkLabels || [];
  return `<div class="ig-spark"><svg viewBox="0 0 ${w.toFixed(2)} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E705CB" stop-opacity=".23"/><stop offset="1" stop-color="#E705CB" stop-opacity=".04"/></linearGradient></defs>
<path d="${area}" fill="url(#${gid})"${m ? ' data-draw-fill data-delay="500" data-duration="1100"' : ''}/>
<path d="${line}" fill="none" stroke="#E705CB" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${m ? ' data-draw data-duration="1600"' : ''}/>
</svg></div><div class="ig-spark__x" aria-hidden="true"><span>${esc(l)}</span><span>${esc(r)}</span></div>`;
}

function lineChart(ctx, chart) {
  const w = ctx.W - 86;
  const h = 95.5;
  const sw = 4;
  const pts = pointsFor(chart.values, { w, h, top: sw / 2, bottom: h - sw / 2, min: chart.yMin ?? 0, max: chart.yMax, inset: sw / 2 });
  const grid = [0, h / 2, h]
    .map((y) => `<line x1="0" x2="${w}" y1="${Math.min(h - 0.4, Math.max(0.4, y))}" y2="${Math.min(h - 0.4, Math.max(0.4, y))}" stroke="#E6EAEE" stroke-width="0.8"/>`)
    .join('');
  const m = ctx.motion;
  const yl = (chart.yTicks || []).map((t, i, a) => `<span style="top:${(i * 100) / (a.length - 1)}%">${esc(t)}</span>`).join('');
  const xl = (chart.xTicks || []).map((t) => `<span>${esc(t.label)}</span>`).join('');
  return `<div class="ig-chart"${m ? ' data-motion-scope' : ''}>
<div class="ig-chart__y" aria-hidden="true">${yl}</div>
<div class="ig-chart__plot"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${grid}
<path d="${pathOf(pts)}" fill="none" stroke="#E705CB" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${m ? ' data-draw data-duration="1700" data-delay="150"' : ''}/></svg></div>
<div class="ig-chart__x" aria-hidden="true">${xl}</div></div>`;
}

/* ------------------------------------------------------------------ */
/* Bar lists                                                           */
/* ------------------------------------------------------------------ */

function legend(items) {
  return `<div class="ig-legend">${items.map((it, i) => `<span><i class="${i ? 'is-2' : ''}"></i>${esc(it.label)}</span>`).join('')}</div>`;
}

function barRows(ctx, rows, { afterLegend = false } = {}) {
  const m = ctx.motion;
  const html = rows
    .filter((r) => r.value !== null && r.value !== undefined)
    .map((r) => {
      let segs = [];
      if (Array.isArray(r.segments)) segs = r.segments;
      else if (typeof r.percent === 'number') segs = r.key === 'men' ? [0, r.percent] : [r.percent];
      else if (typeof r.total === 'number') segs = [r.total];
      let left = 0;
      const segHtml = segs
        .map((p, i) => {
          if (!(p > 0)) return '';
          const gap = left > 0 ? 2 : 0;
          const s = `<i class="ig-bar__seg${i ? ' is-2' : ''}" style="left:calc(${left}% + ${gap} * var(--u));width:calc(${p}% - ${gap} * var(--u))"></i>`;
          left += p;
          return s;
        })
        .join('');
      const hasBar = segs.some((p) => p > 0);
      return `<div class="ig-bar"><span class="ig-bar__label">${esc(r.label)}</span><div class="ig-bar__row"><div class="ig-bar__track">${
        hasBar ? `<div class="ig-bar__fill"${m ? ' data-grow' : ''}>${segHtml}</div>` : ''
      }</div><span class="ig-bar__value ig-num"${m ? ' data-count data-count-align="end" data-duration="1400"' : ''}>${esc(r.value)}</span></div></div>`;
    })
    .join('');
  return `<div class="ig-bars${afterLegend ? ' ig-bars--after-legend' : ''}"${m ? ' data-motion-scope data-stagger="110"' : ''}>${html}</div>`;
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

function screenProfile(ctx) {
  const { d } = ctx;
  const p = d.profile;
  const m = ctx.motion;
  const avatar = p.avatar ? new URL(p.avatar, SITE_ROOT).href : '';
  const stats = p.stats
    .map(
      (s, i) =>
        `<span class="ig-pstat"><b class="ig-num"${m ? ` data-count data-delay="${i * 120}"` : ''}>${esc(s.value)}</b><span>${esc(s.label)}</span></span>`
    )
    .join('');
  const bio = p.bio
    .map((line) => `<p>${esc(line.text)}${line.mention ? `<span class="ig-mention">${esc(line.mention)}</span>` : ''}</p>`)
    .join('');
  const pills = (p.pills || [])
    .map((pl) => `<span class="ig-pill">${pl.icon === 'threads' ? ICON.threads('', 2.2) : ICON.plus('', 2.4)}${esc(pl.label)}</span>`)
    .join('');
  const dc = p.dashboardCard;
  return `<div class="ig-profile"${m ? ' data-motion-scope' : ''}>
<div class="ig-ptop" aria-hidden="true"><span class="ig-ptop__left">${ICON.plus('ig-icon', 2.1)}</span>
<span class="ig-ptop__user">${esc(p.username)}${p.verified ? verifiedBadge() : ''}${ICON.chevSmall('ig-ptop__chev')}<i class="ig-ptop__dot"></i></span>
<span class="ig-ptop__right"><span class="ig-badge-wrap">${ICON.threads('ig-icon', 2)}${p.threadsBadge ? `<span class="ig-badge">${esc(p.threadsBadge)}</span>` : ''}</span>${ICON.menu('ig-icon')}</span></div>
<div class="ig-phead"><div class="ig-avatar"><div class="ig-avatar__img">${
    avatar ? `<img src="${esc(avatar)}" alt="${esc(p.name)}" width="160" height="160" loading="lazy" decoding="async">` : ''
  }</div><span class="ig-avatar__plus" aria-hidden="true">${ICON.plus('', 2.6)}</span></div>
<div class="ig-phead__info"><p class="ig-phead__name">${esc(p.name)}</p><div class="ig-pstats">${stats}</div></div></div>
<div class="ig-pbio"><p class="ig-pbio__cat">${esc(p.category)}</p>${bio}</div>
<div class="ig-pills" aria-hidden="true">${pills}</div>
<div class="ig-dash"><p class="ig-dash__title">${esc(dc.title)}</p><p class="ig-dash__text">${ICON.trend('')}<span><span class="ig-num"${
    m ? ' data-count data-delay="360"' : ''
  }>${esc(dc.value)}</span> ${esc(dc.text)}</span></p></div>
</div>`;
}

function screenSummary(ctx) {
  const { d } = ctx;
  const s = d.screens.summary;
  const m = ctx.motion;
  const feature = card(d, s.featured, ctx, { feature: true, delay: 0, inner: sparkline(ctx, d.charts.viewsDaily) });
  const side = s.cards.map((k, i) => card(d, k, ctx, { delay: 140 * (i + 1) })).join('');
  return `${statusBar(d, s.statusBar)}${navBar(d)}${tabs(d, s.tab)}
<div class="ig-page ig-page--end"><section class="ig-section"${m ? ' data-motion-scope' : ''}>${head(s.title || d.ui.summaryTitle, d.period.label)}
<div class="ig-summary">${feature}${side}</div></section></div>`;
}

function rail(ctx, screen, delays) {
  const { d } = ctx;
  const small = new Set(screen.smallLabels || []);
  const cards = screen.cards
    .map((k, i) => card(d, k, ctx, { selected: k === screen.selected, small: small.has(k), delay: delays[i] ?? i * 120 }))
    .join('');
  return `<div class="ig-rail"><div class="ig-rail__track">${cards}</div></div>`;
}

function screenPerformance(ctx) {
  const { d } = ctx;
  const s = d.screens.performance;
  const m = ctx.motion;
  const glide = m && !!s.scrollTo;
  const ct = d.contentTypes;
  const teaser = d.interactionsTeaser;
  const chips = teaser && teaser.show && s.interactionsTeaser
    ? `<section class="ig-section ig-section--cut">${h2(teaser.title)}<div class="ig-chips" aria-hidden="true">${teaser.chips
        .map((c, i) => `<span class="ig-chip${i === 0 ? ' is-active' : ''}">${c === 'Likes' ? ICON.heart('') : ''}${esc(c)}</span>`)
        .join('')}</div></section>`
    : '';
  return `${statusBar(d, s.statusBar)}${navBar(d)}${tabs(d, s.tab)}
<div class="ig-page"><section class="ig-section"${m ? ' data-motion-scope' : ''}>${head(s.title || d.ui.allContentTitle, d.period.label)}
${rail(ctx, s, glide ? [0, 120, 1000, 1120] : [0, 120, 240, 360])}
${lineChart(ctx, d.charts[s.chart])}</section>
${s.contentTypes ? `<section class="ig-section">${h2(ct.title)}${legend(ct.legend)}${barRows(ctx, ct.rows, { afterLegend: true })}</section>` : ''}
${chips}</div>`;
}

function screenAudience(ctx) {
  const { d } = ctx;
  const s = d.screens.audience;
  const m = ctx.motion;
  const g = d.audience.gender;
  const a = d.audience.age;
  return `${statusBar(d, s.statusBar)}${navBar(d)}${tabs(d, s.tab)}
<div class="ig-page"><section class="ig-section"${m ? ' data-motion-scope' : ''}>${head(s.title || d.ui.allContentTitle, d.period.label)}
${rail(ctx, s, [0, 120, 240])}
${lineChart(ctx, d.charts[s.chart])}</section>
${s.gender ? `<section class="ig-section ig-section--gender">${h2(g.title)}${barRows(ctx, g.rows)}</section>` : ''}
${s.age ? `<section class="ig-section ig-section--age ig-section--cut">${h2(a.title)}${legend(a.legend)}${barRows(ctx, a.rows, { afterLegend: true })}</section>` : ''}
</div>`;
}

/* ------------------------------------------------------------------ */
/* Card rail: initial scroll position + the "swipe" glide               */
/* ------------------------------------------------------------------ */

function setupRail(el, ctx, kind) {
  const screen = ctx.d.screens[kind];
  const railEl = el.querySelector('.ig-rail');
  const track = el.querySelector('.ig-rail__track');
  if (!railEl || !screen.scrollTo) return;
  let userScrolled = false;
  let gliding = false;
  const setScroll = (v) => {
    if (Math.abs(railEl.scrollLeft - v) >= 1) railEl.scrollLeft = v;
  };

  const target = () => {
    const u = railEl.clientWidth / ctx.W;
    const max = railEl.scrollWidth - railEl.clientWidth;
    const st = screen.scrollTo;
    if (st === 'end') return max;
    const c = railEl.querySelector(`[data-kpi="${st.card}"]`);
    if (!c) return 0;
    return Math.max(0, Math.min(max, c.offsetLeft - (st.x ?? 16) * u));
  };

  const place = () => {
    if (userScrolled || gliding) return;
    setScroll(target());
  };

  const armGlide = ctx.motion && !prefersReducedMotion();
  requestAnimationFrame(() => {
    const t = target();
    setScroll(t);
    if (armGlide && t > 0) track.style.translate = `${t}px 0`;
  });

  if (armGlide) {
    // When the section plays, the rail starts on the first card and "swipes"
    // to the screenshot's scroll position, like a thumb flick.
    const section = railEl.closest('[data-motion-scope]');
    let anim = null;
    onEnter(section, ({ delay = 0 }) => {
      if (userScrolled) return;
      const t = target();
      setScroll(t);
      if (anim) anim.cancel();
      track.style.translate = '';
      if (!t) return;
      gliding = true;
      anim = track.animate([{ translate: `${t}px 0` }, { translate: '0 0' }], {
        duration: 1250,
        delay: delay + 700,
        easing: 'cubic-bezier(.5,0,.15,1)',
        fill: 'backwards',
      });
      anim.onfinish = anim.oncancel = () => (gliding = false);
    });
  }

  // Once the visitor swipes the rail themselves, leave it where they put it.
  // (Scroll events alone can't tell: the browser also fires them when it clamps
  // the position on resize, so only scrolls right after a user gesture count.)
  let intentAt = -Infinity;
  const intent = () => (intentAt = performance.now());
  ['pointerdown', 'touchstart', 'keydown'].forEach((t) => railEl.addEventListener(t, intent, { passive: true }));
  railEl.addEventListener('wheel', (e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && intent(), { passive: true });
  let healing = 0;
  railEl.addEventListener(
    'scroll',
    () => {
      if (performance.now() - intentAt < 1500) userScrolled = true;
      // Not the visitor: the browser moved it (e.g. clamped during a resize). Put it back.
      else if (!healing) healing = requestAnimationFrame(() => ((healing = 0), place()));
    },
    { passive: true }
  );
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(place).observe(railEl);
}

/* ------------------------------------------------------------------ */
/* Auto-render                                                         */
/* ------------------------------------------------------------------ */

if (typeof document !== 'undefined') {
  const go = () => renderInsights();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
  else go();
}
