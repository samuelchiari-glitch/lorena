#!/usr/bin/env node
/**
 * make-social.mjs: the GitHub Pages share card and icons (linked by scripts/wrap-site.sh only).
 *
 *   PLAYWRIGHT=/path/to/node_modules/playwright node scripts/make-social.mjs     # from the repo root
 *
 * Renders, with the site's own fonts and palette:
 *   assets/img/social/og-cover.jpg          1200 x 630  link previews (WhatsApp, email, DMs): the cover
 *                                                       (assets/img/cover.jpg) beside the name lockup
 *   assets/img/social/apple-touch-icon.png  180 x 180   "LM" monogram, Vanilla on Mahogany-deep
 *   assets/img/social/icon-32.png           32 x 32     the same monogram (favicon)
 * The Artifact never uses these (the fragment, site.html, is unchanged).
 */
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = (p) => pathToFileURL(path.join(ROOT, p)).href;
const OUT = path.join(ROOT, 'assets/img/social');
mkdirSync(OUT, { recursive: true });

const fonts = `
@font-face{font-family:"LM Sans";src:url("${url('assets/fonts/lm-sans-var-latin.woff2')}") format("woff2");font-weight:200 900;font-stretch:75% 100%}
@font-face{font-family:"LM Serif";src:url("${url('assets/fonts/eb-garamond-italic-latin.woff2')}") format("woff2");font-style:italic;size-adjust:112%}
*{margin:0;box-sizing:border-box}
body{background:#F1EADA;color:#584738;-webkit-font-smoothing:antialiased}
.sans{font-family:"LM Sans";font-weight:440;font-stretch:80%;text-transform:uppercase;letter-spacing:-.015em;line-height:.86}
.serif{font-family:"LM Serif";font-style:italic;font-feature-settings:"swsh" 1;line-height:.98}
.eye{font-family:"LM Sans";font-weight:520;font-size:15px;letter-spacing:.18em;text-transform:uppercase}`;

const card = `<style>${fonts}
body{width:1200px;height:630px;display:flex}
.ph{width:540px;height:630px;background:url("${url('assets/img/cover.jpg')}") 54% 30% / 700px auto no-repeat}
.tx{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:26px}
.lock{display:flex;flex-direction:column;align-items:center;font-size:118px}
.lock .serif{margin-top:-.06em}
.rule{width:56px;height:1px;background:#B59E7D}</style>
<div class="ph"></div><div class="tx"><p class="eye">Content creator &amp; art director</p>
<h1 class="lock"><span class="sans">Lorena</span><span class="serif">Maruch</span></h1><i class="rule"></i>
<p class="eye">Stays · Food · Fashion</p></div>`;

const icon = (s) => `<style>${fonts}
body{width:${s}px;height:${s}px;display:grid;place-items:center;background:#4D342D;color:#F1EADA}
.m{font-size:${Math.round(s * 0.44)}px;display:flex;align-items:baseline;gap:${s * 0.02}px;transform:translateY(-${s * 0.01}px)}</style>
<div class="m"><span class="sans">L</span><span class="serif">M</span></div>`;

const browser = await chromium.launch();
const tmp = mkdtempSync(path.join(os.tmpdir(), 'lm-social-'));
const shot = async (html, w, h, file, type) => {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const src = path.join(tmp, `${file}.html`); // a file: page may load the file: fonts and cover
  writeFileSync(src, `<!doctype html><meta charset="utf-8">${html}`);
  await page.goto(pathToFileURL(src).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, file), type, ...(type === 'jpeg' ? { quality: 82 } : {}) });
  await page.close();
  console.log(`assets/img/social/${file}`);
};
await shot(card, 1200, 630, 'og-cover.jpg', 'jpeg');
await shot(icon(180), 180, 180, 'apple-touch-icon.png', 'png');
await shot(icon(32), 32, 32, 'icon-32.png', 'png');
await browser.close();
rmSync(tmp, { recursive: true, force: true });
