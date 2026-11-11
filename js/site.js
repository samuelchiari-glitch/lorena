/**
 * site.js: entry module (spec §3, §4.0). Boot, mode switch, library checks, orchestration.
 *
 * Modes:
 *   motion   <html class="js motion">  reduced motion off AND gsap, ScrollTrigger, SplitText, Lenis loaded
 *   static   <html class="js">         reduced motion, or a CDN failed (everything final, native scroll)
 *   no JS    <html>                    the CSS defaults (complete at rest)
 *
 * Section modules are loaded with dynamic import() and every call is wrapped, so one failing
 * module (even a syntax error) never breaks the page. Each may export (all optional):
 *   boot(ctx)    right after load, every JS mode: static render from data, listeners. Never hides. The hero
 *                (EARLY_MODULES) boots the moment its module loads, before the data: ctx.data is empty then.
 *   ready(ctx)   after every boot() resolved and fonts are ready (or 1.5 s): motion setup when ctx.motion.
 *   finish()     called by finishAll() (beforeprint, reduced motion turning on, boot failure).
 * ctx = { motion, reduced, data: { videos, brands, metrics }, fontsReady, modules }
 */
import { initScroll, finishAll, isMotion, onFinish, armReveal, refresh } from './scroll.js';
import * as ui from './ui.js';
import * as reveals from './reveals.js';

const SECTION_MODULES = ['hero', 'signature', 'fan', 'video', 'brands', 'proof'];
const EARLY_MODULES = ['hero']; // need no data: booted the moment they load, so the cover's scrub is live first
const root = document.documentElement;
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const libsReady = () => !!(window.gsap && window.ScrollTrigger && window.SplitText && window.Lenis);

async function safe(name, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[site] ${name} failed`, err);
    return undefined;
  }
}

async function loadJSON(rel) {
  try {
    const r = await fetch(new URL(rel, import.meta.url), { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn(`[site] could not load ${rel}`, err);
    return null;
  }
}

/** §6.6 validation: console.warn, never throw. */
function validateVideos(v) {
  if (!v) return;
  const ids = new Set();
  (v.videos || []).forEach((x) => {
    if (ids.has(x.id)) console.warn(`[videos] duplicate id ${x.id}`);
    ids.add(x.id);
    if (x.src && !/\.mp4$/i.test(x.src)) console.warn(`[videos] ${x.id}: src should end in .mp4`);
    if (!x.poster) console.warn(`[videos] ${x.id}: missing poster`);
  });
  (v.fan || []).forEach((id) => { if (!ids.has(id)) console.warn(`[videos] fan id ${id} not found`); });
  (v.categories || []).forEach((c) => { if (c.feature && !ids.has(c.feature)) console.warn(`[videos] feature ${c.feature} not found`); });
}

/**
 * The cover fades in from the Mahogany photo box, and its CSS settle starts, once the image is decoded, not at
 * first paint (css/hero.css .is-loading). Only while it is still loading: an image already painted is left alone.
 */
function waitHeroImage() {
  const photo = document.querySelector('.hero__photo');
  const img = photo && photo.querySelector('img');
  if (!img || img.complete) return;
  photo.classList.add('is-loading');
  const done = () => photo.classList.remove('is-loading');
  img.addEventListener('load', () => { (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(done); }, { once: true });
  img.addEventListener('error', done, { once: true });
}

/**
 * The Seasons (the client's serif; the Adobe Fonts kit is linked on GitHub Pages only) leads the running serif text
 * once both faces the page uses have loaded (.has-seasons, css/site.css): the kit's font-display:auto would otherwise
 * hide that text while they load. (Lockups block on their faces by design.) On the Artifact no face matches.
 */
function loadSeasons() {
  if (!document.fonts || typeof document.fonts.load !== 'function') return Promise.resolve();
  return Promise.all(['italic 400 1em "the-seasons"', '400 1em "the-seasons"'].map((f) => document.fonts.load(f)))
    .then((faces) => { if (faces.every((list) => list.length)) root.classList.add('has-seasons'); })
    .catch(() => {});
}

async function boot() {
  root.classList.add('js');
  waitHeroImage();
  const seasons = loadSeasons();

  // 1. mode
  if (!reduceMQ.matches && libsReady()) {
    root.classList.add('motion');
    try {
      window.gsap.registerPlugin(window.ScrollTrigger, window.SplitText);
      initScroll();
    } catch (err) {
      console.error('[site] smooth scroll failed', err);
      finishAll();
    }
  } else if (!reduceMQ.matches) {
    console.warn('[site] animation libraries missing: static mode');
  }

  // 2. chrome first (header, menu, router, copy): works in every JS mode
  await safe('ui.boot', () => ui.boot());

  // 3. data + section modules in parallel. The early modules (the hero) boot as soon as they load, without
  //    waiting for the JSON or the other modules; ctx.data and ctx.modules are filled in before the others boot.
  const fontsReady = Promise.race([Promise.all([document.fonts ? document.fonts.ready : null, seasons]), sleep(1500)]);
  const ctx = { motion: isMotion(), reduced: reduceMQ.matches, data: {}, fontsReady, modules: {} };
  const bootModule = async (name, m) => {
    if (typeof m.boot === 'function') await safe(`${name}.boot`, () => m.boot(ctx));
  };
  const insightsP = import('./insights.js').catch((err) => { console.error('[site] insights.js failed', err); return null; });
  const modsP = Promise.all(SECTION_MODULES.map((n) => import(`./${n}.js`)
    .then(async (m) => {
      if (EARLY_MODULES.includes(n)) await bootModule(n, m);
      return [n, m];
    })
    .catch((err) => { console.error(`[site] ${n}.js failed to load`, err); return [n, null]; })));
  const [videos, brands, metrics, mods] = await Promise.all([
    loadJSON('../data/videos.json'),
    loadJSON('../data/brands.json'),
    insightsP.then((m) => (m ? m.loadMetrics() : null)).catch(() => null),
    modsP,
  ]);
  validateVideos(videos);

  const modules = Object.fromEntries(mods.filter(([, m]) => m));
  Object.assign(ctx, { motion: isMotion(), data: { videos, brands, metrics }, modules });

  // 4. boot phase (static renders), then let ScrollTrigger measure the rendered page
  for (const [name, m] of Object.entries(modules)) {
    if (!EARLY_MODULES.includes(name)) await bootModule(name, m);
  }
  for (const [name, m] of Object.entries(modules)) {
    if (typeof m.finish === 'function') onFinish(() => { try { m.finish(); } catch (err) { console.error(`[site] ${name}.finish failed`, err); } });
  }

  // 5. ready phase (after fonts): reveals, then section modules
  await fontsReady;
  ctx.motion = isMotion();
  if (ctx.motion) window.ScrollTrigger.refresh();
  await safe('reveals.ready', () => reveals.ready(ctx));
  await safe('ui.ready', () => ui.ready(ctx));
  for (const [name, m] of Object.entries(modules)) {
    if (typeof m.ready === 'function') await safe(`${name}.ready`, () => m.ready(ctx));
  }

  // 6. footer signature: drawn at rest, plays once at top 80% when armed on approach (§4.8)
  const sig = document.querySelector('.sig--footer');
  const signature = modules.signature;
  if (ctx.motion && sig && signature && typeof signature.playSignature === 'function') {
    armReveal(sig, () => signature.playSignature(sig, { paused: true }), { start: 'top 80%' });
  }

  refresh();
  root.classList.add('is-ready');
}

boot().catch((err) => {
  console.error('[site] boot failed', err);
  root.classList.remove('motion');
  finishAll();
});
