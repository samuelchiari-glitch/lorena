# Desktop spec: lorenamaruch.com, desktop v1

The document the desktop builders follow. The mobile site (< 768 px) is **finished and approved**; this spec adds the desktop layout (≥ 992 px) and a tablet plan (768–991 px) on top of it, without changing a single mobile pixel.

Read with it:
- `docs/build-spec.md` (its CLIENT FEEDBACK block still overrides everything, also on desktop), `docs/build-foundation.md` (module contract, helpers, modes), `docs/effects-lando.md` (reference parameters, "Lando §n"), `docs/typography.md`, `docs/qa-report.md`.
- Client brief for this phase (2026-11-12): *mirror the way elements are arranged on the Lando site; that site has many loose elements, so organise them harmoniously; feel free.*

Rules (unchanged): re-implement, never copy the reference's JS, assets or fonts. No new external hosts (only the pinned GSAP / ScrollTrigger / SplitText / Lenis URLs). Never invent client data: numbers come from `data/metrics.json`, brands from `data/brands.json`, media from `data/videos.json`, copy only from strings already approved on the page or in `data/content.json`. Do not run git.

---

## 0. The hard rule: mobile is frozen

Everything below 768 px must render and behave exactly as it does now.

1. **CSS.** Every new desktop rule sits inside `@media (min-width: 992px)` (desktop) or `@media (min-width: 768px) and (max-width: 991.98px)` (tablet), or uses classes that only those media blocks style (`.d-frame`, `.d-grid`, `data-d-*`). Never edit a mobile rule; override it inside a media block. Hover-only rules also carry `(hover: hover) and (pointer: fine)`.
2. **Markup.** You may add classes and `data-d-*` / `data-roll` attributes, and wrapper elements that are `display: contents` or unstyled below 768. You may add elements that are `display: none` below 992 (the desktop nav, the hero marquee). Check the result with the compare script (§0.1); a change that moves one mobile pixel is a regression.
3. **JS.** Desktop behaviour runs only through the lifecycle in `js/desktop.js` (§3): it starts when `(min-width: 992px)` matches and is torn down cleanly when it stops matching (resize, orientation, split view), with no double-initialised ScrollTriggers and no leftover inline styles. Never read `innerWidth` to branch; use `isDesktop()` or a lifecycle registration.
4. **Images.** Desktop-only image upgrades go through `<picture><source media="(min-width: 992px)" …>` so phones keep choosing exactly the files they choose today. Never add a larger candidate to an existing `srcset` (a DPR-3 phone would start downloading it).

### 0.1 Mobile regression check (baseline + compare)

The baseline was captured **before any desktop edit** (2026-11-12): 6 combinations (reduced motion and motion-at-rest after a full scroll-through, at 320 × 568, 390 × 844 and 430 × 932, iPhone 13 emulation, deviceScaleFactor 1), 150 per-section viewport screens plus 6 full pages. Folder: `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/desktop/baseline/` (`shots/` is the read-only baseline; never overwrite it).

```bash
# 1. serve the repo (Range support for the videos); pick a free port in 8100-8999
cd /home/user/lorena && bash scripts/wrap-site.sh && npx --yes http-server /home/user/lorena -p 8543 -s -c-1 &
# 2. re-capture and diff against the baseline (≈ 9 min for all 6 combinations; filters make it faster)
B=/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/desktop/baseline
node $B/compare.js --base http://127.0.0.1:8543                       # everything
node $B/compare.js --base http://127.0.0.1:8543 --sizes 390x844 --modes motion   # one combination
node $B/compare.js --skip-capture                                       # re-diff the last capture
# 3. kill the server when done
```

- `capture.js` (also usable alone: `node $B/capture.js --base … --out <dir>`): loads `index.html`, checks the mode (`html.motion` present or absent, else it throws), scrolls through the page in half-viewport steps (Lenis immediate in motion), rests 3 s, then shoots each region (hero, instagram, about, fan, stays, food, fashion, numbers, brands, gallery, contact) in viewport-high steps while scrolling down only, and finally the full page at the top. Determinism: external requests (cdnjs, jsdelivr, Typekit) are replayed from a byte-exact cache (`net-cache/`, filled on first use, so SRI still matches); `Math.random` is seeded (the marquee phase); `<video>` is hidden (its poster shows); before each shot every finite animation/transition is finished and infinite ones are paused at 0.
- `compare.js` re-captures into `current/`, runs `diff.py`, prints one line per (mode, size, region) and exits non-zero on any failure. A pixel counts as changed when a channel moves by more than 16/255 (`--tol`); a region fails above 0.05 % changed pixels (`--max`). Red overlays: `current/_diff/<combo>/<file>.png`; JSON: `current/report.json`.
- Header mask: in motion mode the fixed header hides on scroll down and shows on scroll up from Lenis's direction after each programmatic jump, and that state is not deterministic between runs (it flipped between two captures of the unchanged page). So on motion screens scrolled away from the top, the 64 px header band is not compared (`--mask-header 0` turns this off). The header is still compared on every reduced-motion screen (it never hides there) and at the top in motion.
- Measured noise: two captures of the same page differ by 0 px on every region screen; full pages differ only by raster noise on the video cards' posters (≈ 5,000 px at tol 0, ≤ 170 px at tol 16, ≤ 0.004 %).
- After this foundation pass: **0 failed regions** (tol 16) in all 6 combinations, and every region screen is pixel-identical at tol 0.
- **Pass = 0 failed regions in all 6 combinations.** Run it after every change you make and before you report.

---

## 1. What the reference does on desktop, and how we organise it

Studied live at 1440 × 900 and 1920 × 1080 (wheel scroll-throughs, frames in `…/scratchpad/desktop/lando/`) plus the `ref/` sheets and the design-system doc.

**Its system.** A fluid rem (`clamp(992, 100vw, 1920) / 108`: 13.33 px at 1440, 17.78 px at 1920), so 1920 is 1440 scaled up 1.33×. A 4-column main grid with a 1.25 rem gap and only 1.25 rem side padding. Navbar 83 px: two-line wordmark left, small mark centre, Store pill + menu square right. Its section heads put a two-line sans/serif title on the left and a short paragraph "in the third column".

**Its sequence (home, 1440).** Hero head (full bleed) → shrinks to a centred card while a giant two-row text marquee runs behind it and the signature writes across it → huge centred statement with serif accent words → pinned horizontal gallery (scattered photos of 3–4 sizes, captions above, serif quotes with a mini signature; the page background scrubs dark → light) → On/Off Track split pair with cut-out portraits sliding in from both edges → full-bleed parallax photo → helmets title + 4-column grid whose columns are offset and close up while scrolling → centred CTA with an oval "visor" edge → store (title left, one big photo and small floating products) → partners (title left, paragraph right, a handwritten word scribbled over, one logo marquee) → centred 7-card fan → notched dark footer (signature over a centred statement, link groups left and right, logo marquee, legal row).

**What reads as loose.** Photos of unrelated sizes at unrelated heights; captions and tiny paragraphs floating in the margins; small products scattered around a big photo; marks and icons placed by eye. It is lively but noisy, and nothing lines up from one section to the next.

**How we organise it for Lorena (the harmony rules, binding for every section):**
1. **One grid.** Every element starts and ends on a line of the 12-column desktop grid (§2.2). Nothing is placed in px by eye.
2. **Three sizes.** Media come in S / M / L (3 / 4 / 5 columns in spreads; 26 / 39 / 52 svh tall in the pinned gallery, plus one XL at 65 svh). No other sizes.
3. **One vertical module.** Offsets are multiples of 4 dr (half the 8 dr module); the pinned gallery uses row lines every 13 svh.
4. **Captions above, flush left.** Every photo caption is an eyebrow 8 px above its frame, aligned to the frame's left edge (the reference's captioned photo, made consistent).
5. **Head + third-column paragraph.** Editorial sections open with eyebrow + lockup on cols 1–6 and their one short paragraph on cols 9–12, its last line on the lockup's last baseline.
6. **Stage / spread rhythm.** Centred "stage" moments (hero card, fan, spotlight, contact) alternate with asymmetric 12-column "spreads" (Instagram, About, chapters, Numbers, Brands) and one pinned horizontal track (Gallery). Never two stages or two pinned sections in a row.
7. **One accent per section.** At most one deliberate break of the grid per section (a rotated print, an overlap with a Vanilla ring, a full-bleed bleed). Everything else aligns.
8. **Full bleed is reserved** for: the hero, the fan, the brand rows, the gallery track and the contact panel.

---

## 2. Tokens, grid and type (≥ 992 px)

All of this is implemented in `css/site.css` (`/* === desktop: tokens === */`, `/* === desktop: grid === */`). Builders use the tokens; they do not add new global ones (scope extras to their section, as on mobile).

### 2.1 The desktop rem and spacing

| Token | Value | 1024 | 1280 | 1440 | 1920 |
|---|---|---|---|---|---|
| `--dr` (desktop rem) | `calc(clamp(992px, 100vw, 1920px) / 108)` | 9.48 | 11.85 | **13.33** | 17.78 |
| `--d-margin` (frame side padding) | `2.5 × dr` | 23.7 | 29.6 | **33.3** | 44.4 |
| `--d-gutter` (column gap) | `1.5 × dr` | 14.2 | 17.8 | **20** | 26.7 |
| `--d-module` (vertical module) | `8 × dr` | 76 | 95 | **107** | 142 |
| `--d-max` (frame cap) | `1920px` | | | | |
| `--d-colw` (one column) | `(min(100vw, 1920px) − 2 margin − 11 gutter) / 12` | 68.4 | 85.4 | **96.1** | 128.1 |
| `--section-pad` | `12 × dr` (overrides the mobile clamp) | 114 | 142 | **160** | 213 |
| `--header-h` | `80px` | | | | |
| `--radius-card` | `2.4 × dr` (video and fan cards) | 23 | 28 | **32** | 43 |

Above 1920 px the frame stops growing (`--dr` is capped) and is centred on the Vanilla page. Span widths: `n` columns = `n × colw + (n − 1) × gutter` (4 cols = 444 px at 1440).

### 2.2 Grid utilities (desktop only; no effect below 992)

```html
<div class="wrap d-frame d-grid"> … <p style="--d-col: 9 / span 4"> … </div>
```
- `.d-frame`: `max-width: var(--d-max); padding-inline: var(--d-margin)`, centred. Replaces `.wrap`'s 640 px column at ≥ 992 (keep `.wrap` in the markup for mobile).
- `.d-grid`: 12 columns, `column-gap: var(--d-gutter)`, `align-items: start`. Children are placed with `--d-col` (a `grid-column` value, default `1 / -1`) and `--d-row` (a `grid-row` value, default `auto`), set in the section's desktop block (inline style only for one-offs).
- Column x positions at 1440: col 1 = 33, 2 = 149, 3 = 266, 4 = 382, 5 = 498, 6 = 614, 7 = 730, 8 = 846, 9 = 962, 10 = 1078, 11 = 1194, 12 = 1310 (ends 1407).

### 2.3 Type scale (the mobile tokens, redefined at ≥ 992)

| Token | Desktop value | 1024 | 1440 | 1920 | Use |
|---|---|---|---|---|---|
| `--fs-display` | `max(96px, 9.6 dr)` | 96 | **128** | 171 | hero lockup |
| `--fs-h2` | `max(60px, 6.4 dr)` | 61 | **85** | 114 | section lockups |
| `--fs-h3` | `max(44px, 4.8 dr)` | 45 | **64** | 85 | chapter lockups |
| `--fs-statement` | `max(52px, 5.6 dr)` | 53 | **75** | 100 | About statement |
| `--fs-number` | `max(84px, 9 dr)` | 85 | **120** | 160 | stat numerals |
| `--fs-intro` | `max(22px, 2.25 dr)` | 22 | **30** | 40 | serif intros, fan caption |
| `--fs-intro-l` *(new, desktop only)* | `max(34px, 3.6 dr)` | 34 | **48** | 64 | big serif lines (IG intro, gallery quote, contact intro) |
| `--fs-body` | `clamp(16px, 1.25 dr, 20px)` | 16 | **16.7** | 20 | body |
| `--fs-caption` | `clamp(13px, 1 dr, 16px)` | 13 | **13.3** | 16 | captions |
| `--fs-eyebrow` | `clamp(11px, .9 dr, 14px)` | 11 | **12** | 14 | eyebrows, nav, pills |

The type rules of `docs/typography.md` §7 stay: sans line caps ≤ 12 characters, serif line italic sentence case at the same size, swash only in lockups, `--offset` lockup once (About). Desktop lockups in spreads are left-aligned (`.t-lockup--start`), stage lockups centred. Lines must not wrap at any width from 992 to 1920 (test it).

---

## 3. Shared desktop foundation (implemented in this pass)

### 3.1 `js/desktop.js`: the matchMedia lifecycle

```js
import { onDesktop, onMedia, isDesktop, DESKTOP, FINE } from './desktop.js';

export function ready(ctx) {
  onDesktop((d) => {                       // runs when ≥ 992 starts matching (and now, if it does)
    d.add(() => gsap.to(el, { …, scrollTrigger: { … } }));   // tweens + ScrollTriggers in this registration's own gsap.context
    d.arm(el, buildSomething, { start: 'top 85%' });        // armReveal on approach, disposable
    d.on(window, 'resize', onResize);                        // listeners removed on teardown
    d.io((entries) => …, { rootMargin: '0px 0px 50% 0px' }).observe(el);   // makeIO (root: document), disconnected on teardown
    d.cleanup(() => el.classList.remove('is-track'));        // anything else to undo
    return () => { /* optional extra teardown */ };
  }, { motion: true, name: 'gallery' });   // motion: true = only in motion mode (torn down by finishAll / reduced motion)
}
```
- `onMedia(query, setup, {motion, name})` is the general form; `onDesktop` = `onMedia(DESKTOP, …)`. Constants: `DESKTOP = '(min-width: 992px)'`, `TABLET = '(min-width: 768px) and (max-width: 991.98px)'`, `FINE = '(hover: hover) and (pointer: fine)'`.
- Media changes are coalesced to one animation frame: every registration whose condition flipped is torn down (in reverse order) or set up, then one `ScrollTrigger.refresh()` runs. A registration is never set up twice.
- Teardown order: armed reveals forced to their final state and cleaned up → listeners/observers removed → cleanup callbacks (reverse) → its gsap.context reverted (every tween and ScrollTrigger it created is killed and its inline styles restored).
- `finishAll()` (reduced motion turning on, print, boot failure) tears down every `motion: true` registration; the others (layout JS, the text roll, the nav marker) keep running in static mode.
- A reveal that already played is not armed again when desktop starts again after a round trip (no replays after a resize).
- `isDesktop()` is `matchMedia(DESKTOP).matches`. Use it inside callbacks only for quick checks.
- **Publish list:** `js/desktop.js` is a new runtime file (preloaded with `modulepreload` in `site.html`); the Artifact publish must include it at the same relative path, like every new module a builder adds (e.g. `js/gallery.js`).

### 3.2 Generic desktop effects (data attributes)

All are armed on approach exactly like the mobile reveals (never while visible; the watchdog covers them), only at ≥ 992 and only in motion mode, except `data-roll`, which is an interaction (fine pointer, no reduced motion, any JS mode).

| Attribute | Where it is built | Effect |
|---|---|---|
| `data-oval` *(existing, every width)* | `reveals.js buildOval` | lockup oval reveal (Lando §5.4) |
| `data-highlight` *(existing, every width)* | `reveals.js buildHighlight` | line highlight (Lando §5.5) |
| `data-d-oval` | `reveals.js buildOvalLines` | **desktop only.** Oval line reveal for any multi-line text (intros, big serif lines): SplitText lines; per line `clip-path ellipse(20% 0% at 50% 0%) → ellipse(100% 120% at 50% 0%)` 1.5 s `power2.inOut` (stagger .15) while its inner text goes `yPercent −40 → 0` (delay .15 + .1·i). Plays at `top 90%`. Unsplit on complete. |
| `data-d-highlight[="sand\|tobacco\|<colour>"]` | `reveals.js buildHighlight` | **desktop only** line highlight (captions, subtitles, footnotes, contact labels, gallery captions). `top 85%`. |
| `data-d-drift="N"` | `reveals.js` (scrub) | **desktop only.** `y: N·dr → 0`, `ease: none`, scrubbed from the trigger's `top bottom` to `bottom top` (Lando's helmet-column offset). Negative N allowed. `data-reveal-trigger` picks the trigger. |
| `data-d-slide="N"` | `reveals.js` (scrub) | **desktop only.** `x: N·dr → 0`, `power2.out`, scrubbed `top bottom → bottom bottom` (Lando's On/Off side portraits). |
| `data-roll` | `ui.js initRoll` | **hover text roll** (Lando §5.6) on links and buttons: the label's chars rise `translateY(0 → −1 line)` in .6 s `--ease-out-3`, 20 ms stagger, and an identical copy (a `text-shadow` one line below, no duplicated DOM) rolls in; on `:hover` and `:focus-visible`. Only at ≥ 992 with `(hover: hover) and (pointer: fine)` and no reduced motion. The accessible name stays the plain text (an `.sr-only` copy; the char spans are `aria-hidden`). Child elements (arrows, icons) are left alone; put the label in a `<span data-roll-text>` when a link has several text parts. |

Builders: add the attributes in markup; `reveals.scanDesktop()` and `ui.initRoll()` run from the desktop lifecycle (registered once in `site.js`). For markup inserted after `ready()`, call `reveals.scan(el)` as before; the desktop scan of late markup is `rescanDesktop(el)` (exported by `desktop.js`), and `ui.rescanRoll(el)` splits late `[data-roll]` labels (site.js already rescans the whole page once after every module's `boot()`).

### 3.3 Header and menu (≥ 992; implemented in this pass, `/* === desktop: chrome === */`)

- Bar 80 px, padding `0 var(--d-margin)`, laid out as a 3-column grid (`1fr auto 1fr`) so the nav is truly centred.
- **Brand (left):** the two-line mini lockup "LORENA / *Maruch*": sans caps 18 px (`--font-sans-lockup`, weight 480, stretch 82 %, tracking .04 em) over the swash italic 21 px, 1.25 em to the right with its swash tucked under "ENA", like the media kit. The link's text node is untouched (mobile stays byte-identical: wrapping the words in spans shifted "MARUCH" by a sub-pixel); at ≥ 992 its text is transparent and the two lines are `::before` / `::after` with `content: "…" / ""` (empty alt text, so the accessible name stays "Lorena Maruch"). 44 px tall hit area.
- **Nav (centre, new markup, `display:none` below 992):** Content · Numbers · Brands · Gallery, eyebrow style (12 px, 520, tracking .18 em), 36 px apart, each with `data-roll`. The link of the section under the reading line (45 % of the viewport) gets `aria-current="true"` and a 1 px underline that grows from the left (`scaleX 0 → 1`, .75 s `--ease-default`).
- **Right:** the Contact pill (with `data-roll`). The menu button is hidden at ≥ 992 (the nav covers every menu link); if the menu is open when the viewport crosses to desktop it closes, without moving focus into hidden UI.
- Theme band, backing, hide on scroll down / show on scroll up: unchanged from mobile.
- **Scale settle (motion only, Lando §7.2):** brand and actions start at `scale(1.12)` (origins left and right) and scrub to 1 over the first 10 % of a viewport of scroll.
- Scroll indicator: unchanged (right edge, 76 svh tall).

### 3.4 CSS blocks for the builders

`css/site.css` ends with one fenced block per section, each already wrapped in its media query, plus a tablet block:
`desktop: tokens` · `desktop: grid` · `desktop: effects` · `desktop: chrome` (foundation) · `desktop: hero` · `desktop: instagram` · `desktop: about` · `desktop: content` (fan) · `desktop: chapters` · `desktop: numbers` · `desktop: brands` · `desktop: gallery` · `desktop: contact` · `tablet` (all builders, one sub-comment per section).
Edit only your own blocks. Motion-only desktop states go in your section file (`hero.css`, `content.css`, `proof.css`) inside `@media (min-width: 992px)` and under `.motion`.

### 3.5 Ownership

| Builder | Sections (desktop + tablet) | JS | CSS |
|---|---|---|---|
| **HERO** | hero (+ its marquee) | `hero.js`, `signature.js` | `desktop: hero`, `hero.css` |
| **EDITORIAL** | instagram, about, contact | `proof.js` (Instagram screen only, coordinate with PROOF) | `desktop: instagram`, `desktop: about`, `desktop: contact` |
| **CONTENT** | fan, chapters, CHANEL spotlight | `fan.js`, `video.js` | `desktop: content`, `desktop: chapters`, `content.css` |
| **PROOF** | numbers, brands, gallery | `proof.js`, `brands.js`, new `js/gallery.js` | `desktop: numbers`, `desktop: brands`, `desktop: gallery`, `proof.css` |
| foundation (done) | tokens, grid, effects, chrome | `desktop.js`, `scroll.js`, `reveals.js`, `ui.js`, `site.js` | `desktop: tokens/grid/effects/chrome` |

Markup: edit only inside your section's `<!-- section:… -->` markers (the chrome markers are foundation's). New module `js/gallery.js` is added to `SECTION_MODULES` in `site.js` by PROOF (one-line change; also add its `modulepreload`).

---

## 4. Section by section (≥ 992). Numbers are at 1440 × 900 unless stated.

Background rhythm is unchanged: cover → dark (card, Instagram) → light (About, Content, Numbers) → Surface band (Brands) → light to Surface (Gallery) → dark panel (Contact).

### 4.1 Hero `#top` (stage) — HERO

**Rest (static mode = motion at scroll 0).** Full-bleed cover (client feedback 1). The `<img>` box keeps its 2:3 ratio at the stage width (1440 × 2160); the eye line sits at **44 %** of the stage height (eye midpoint on the centre line), so the frame runs from the top of her hair to the robe's collar.
- **Lockup bottom-left**, not top-centre: `.hero__copy` absolutely placed at `left: var(--d-margin); bottom: 9 dr` (120 px), text-align left. Eyebrow "Content creator & art director" above it. "LORENA / *Maruch*" at `--fs-display` (128 px) with the serif line pushed right by 1.6 em (the kit's offset, as `--offset`). Its right edge stays left of the face (≤ col 5 at every desktop size; test that the lockup box does not intersect the eye region).
- **Roles caption bottom-right** (cols 10–12, right-aligned, baseline on the lockup's last baseline): "Content creator · Model · Actress · Art director" (the approved About roles line), eyebrow style, Vanilla. `aria-hidden` (it repeats About).
- **Scrim** for Vanilla type: a radial wash from the bottom-left corner (`radial-gradient(ellipse 62% 70% at 0% 100%, rgba(77,52,45,.58), rgba(77,52,45,0))`) plus a 120 px top band at .30 for the header; contrast ≥ 4.5:1 for the eyebrow and ≥ 3:1 for the lockup over the real pixels (measure 5th percentile, as on mobile).
- **Image:** `<picture>` with `<source media="(min-width: 992px)" srcset="assets/img/web/hero-1527.webp 1527w, assets/img/web/hero-2048.webp 2048w" sizes="100vw">` before the existing `<img>` (unchanged for phones). New derivative `hero-2048.webp` (q 72, ≤ 280 KB) from `assets/img/cover.jpg` via `scripts/make-images.py`.

**Track (motion).** Same 220 svh sticky stage and timings as mobile (§4.1 of build-spec), with desktop geometry:
- **Card:** portrait 3:4, height `.62 H` (558), width `.75 × height` (419), centred, top at `.19 H`; corners `--radius-card` (32 px). Image end scale: the cover at ≈ 1.7 card widths, eye midpoint on the card's centre line at 36 % of its height.
- **Signature:** width `min(60 dr, 800px)` (800), centred on the card, its top just under her chin (same rule as mobile's `heroSigPlace`), overflowing the card on both sides (Lando ref 05).
- **Text marquee behind the card (new, desktop + motion only, Lando refs 03/06):** `.hero__marquee` (aria-hidden, `display:none` below 992), two rows centred on the card's vertical centre, between the stage background and the photo (so the shrinking photo uncovers it). Row 1, sans caps: `STAYS · FOOD · FASHION · ` repeated; row 2, serif italic: `Content creator · Model · Actress · Art director · ` repeated; both at `9 dr` (120 px), line-height .9, Tobacco at 80 % opacity on Mahogany-deep (decoration, never read: it repeats existing copy). Rows move in opposite directions at 40 px/s (WAAPI, like the brands rows), direction follows Lenis direction, paused off-screen. It fades in (`opacity 0 → 1`) from 0.35 H to 0.7 H and drifts `x ±4 vw` across the track.
- Lockup wipe, handle, theme zones, header backing: as mobile (the wipe runs on the bottom-left block; its ellipse origin moves to `0% 100%`).

### 4.2 Instagram `#instagram` (spread, dark) — EDITORIAL

- `padding-block: 6 dr 12 dr`. `.ig__inner` becomes `d-frame d-grid`.
- **Screen** (the profile shot) on **cols 7–11** (5 columns, 560 px; `--ig-shot-width: 560px`), `data-tilt` (motion.js's desktop tilt, max 4°).
- **Copy** on **cols 2–5**, vertically centred on the screen: eyebrow h2 "On Instagram" (line highlight, existing); intro "39.2K followers, *one point of view.*" at `--fs-intro-l` (48 px, max 9 em), left-aligned, `data-d-oval`; Follow link below (`data-roll`). The fallback line stays under the screen.
- Tablet: mobile layout, screen max 520 px.

### 4.3 About `#about` (spread + centred statement) — EDITORIAL

- `padding-block: 6 dr var(--section-pad)`; the dark → Vanilla background hand-off stays.
- Row 1: eyebrow "Hello" (col 1) above the **offset lockup** "ABOUT / *Lorena*" on **cols 1–7** at `10 dr` (133 px; the one place the page uses the kit's offset, now big).
- **Photo** on **cols 8–11** (4 cols, 444 × 555, 4:5), rows 1–2, top aligned with the lockup's cap line; curtain + inner parallax (existing) + `data-d-drift="-4"`.
- **Bio** on **cols 2–5**, row 2, `max-width: 34ch`, then the roles line.
- **Statement** (row 3) on **cols 2–11**, centred, `--fs-statement` (75 px), `margin-top: var(--d-module)`, `text-wrap: balance`; line highlight (existing, every width). This is the Lando "impact statement" moment.
- Tablet: photo 70 % (existing rule), statement max 14 em.

### 4.4 Content: the fan (stage) — CONTENT

- `padding-top: var(--section-pad)`. Intro centred: icon 48 px, lockup at `--fs-h2`, hint on fine pointers "Hover to spread · click a card for sound" (fan.js already swaps the sound half on fine pointers; replace the whole line on desktop).
- Fan unit on desktop: `--r: var(--dr)` (so it keeps growing to 1920; today it stops at 13.33 px), `--fan-k: 1`, card `20u` (267 × 474 at 1440, 356 × 632 at 1920), box height `40u`, card radius `3.3u` (44 px, Lando's). Desktop slot table x = Lando DESK (existing `DESK_X`).
- Entrance and elastic focus: existing. **Hover spread** (existing, Lando §3.4) on `(hover:hover) and (pointer:fine)`. Hovering the focused card reveals its sound and pause buttons; clicking a side card focuses it (and hands sound over if the fan owned it).
- Caption under the fan, centred; prev/next buttons 48 px on either side of the caption (same row), `data-roll` on "More …".
- Tablet: mobile table with `--fan-k: 1.18` (existing), swipe and tap as mobile.

### 4.5 Content: the three chapters (spreads, alternating) — CONTENT

Each `.chapter` becomes a 12-column spread, `padding-block: var(--section-pad) 0`, its head and its media on opposite sides; the sides alternate (Stays: text left, Food: text right, Fashion: text left).

| Part | Text-left chapter (Stays, Fashion) | Text-right chapter (Food) |
|---|---|---|
| Head (eyebrow number, h3 lockup `--start`, subtitle) | cols 1–6, row 1 | cols 7–12, row 1 |
| Feature card | cols 8–11, rows 1–2, centred in its span | cols 2–5, rows 1–2 |
| Rail ("contact sheet") | cols 1–6, row 2, aligned to the card's bottom | cols 7–12, row 2 |
| Feature caption | under the card, left-aligned to it | same |

- **Feature card:** height `min(76 svh, 56 dr)` (684 at 900), width = height × 9/16 (385). Deal entrance (existing). Hover reveals the sound/pause buttons; the first click unmutes (§5).
- **Rail as a contact sheet** (no horizontal scroller on desktop): `display: grid; grid-template-columns: repeat(6, 1fr); gap: 1.2 dr` inside its 6 columns; thumbs fill the cell at 9:16 (≈ 99 × 176). Stays 11 items = 2 rows, Food 4 = 1 row, Fashion 8 = 2 rows. No mask, no snap, no `data-lenis-prevent-horizontal` behaviour needed (it does not scroll). Each thumb shows its title as a caption on hover (fine pointer only: a Vanilla eyebrow on a Mahogany gradient at the thumb's foot, fades in .3 s). Active thumb ring as mobile. Rise entrance (existing).
- **Head:** `position: sticky; top: calc(var(--header-h) + 4 dr)` while its chapter scrolls (the card and sheet pass beside it). Subtitle `data-d-highlight`.
- **CHANEL spotlight** (after Fashion, a stage): head centred (eyebrow, lockup at `--fs-h2`, sub); the pair on the grid: frame A (4:5) on **cols 3–7**, frame B (2:3) on **cols 7–10** overlapping A by one column, `margin-top: 16 dr`, with its 6 px Vanilla ring (the section's one accent). `data-d-slide="-6"` on A and `"6"` on B (they glide in from the sides, Lando On/Off). Desktop sources via `<picture>` only if the 800 w files look soft at 560 px (check at DPR 2).
- Tablet: mobile chapters (feature card + scrolling rail), centred.

### 4.6 Numbers `#numbers` (spread) — PROOF

- Head on **cols 1–6** (eyebrow, lockup `--start`); the footnote "Recreated from Lorena's Instagram insights, {period}." moves up to **cols 9–12** as the third-column paragraph (last line on the lockup's baseline), `--fs-body`, `data-d-highlight`.
- **Stats** in one row: three cells on cols 1–4, 5–8, 9–12, each with a 1 px `--line` rule on top, the numeral (`--fs-number`, 120 px) left-aligned and its label under it (line highlight, existing). `margin-top: var(--d-module)`.
- **Screens** side by side, no rail: Home / Performance / Audience in the same three cells (each ≤ 430 px wide, centred in its 444 px cell), captions above as eyebrows (the tab pills are hidden at ≥ 992; the rail's snap, mask and tabs logic are off). The two tall screens stay cropped with "Show the full screen". **Column offsets** (Lando's helmet grid): Performance `data-d-drift="6"`, Audience `data-d-drift="12"` (they start lower and close up as the row passes).
- Tablet: the existing full-bleed rail with tabs; stats in one row of three.

### 4.7 Brands `#brands` (spread head + full-bleed rows) — PROOF

- Head on **cols 1–6** (eyebrow, lockup `--start`); the caption "46 brands across …" on **cols 9–12** at `--fs-intro` in the serif (the count still counts up), with the pause button under it, right-aligned to col 12.
- Rows: 3 full-bleed marquee rows, **100 px** tall, 20 px apart; logo height `4 dr × scale` (53 px base; the 1.45 logos are 77 px), `margin-inline: 2.4 dr`. Speed **48 px/s** (a logo crosses 1440 px in 30 s), rows 1 and 3 left, row 2 right, direction follows scroll, drift `±4 vw`. Edge fade 6 % / 94 %. **Hover on a row** (fine pointer): its `playbackRate` eases to 0.2 over 400 ms (readable), back on leave.
- Reduced motion: the wrapping grid (existing) at the desktop logo size, max 1100 px wide.

### 4.8 Gallery `#gallery` (pinned horizontal track) — PROOF

The reference's horizontal gallery, organised (§1 rules 2–4).

**Motion mode, ≥ 992 (`js/gallery.js`, registered with `onDesktop(…, {motion:true})`):**
- Structure: `.gallery` gets `.gallery--track`; its content sits in a sticky pin `position: sticky; top: 0; height: 100svh; overflow: clip` (CSS sticky, never a ScrollTrigger `pin`); the section's height is `100svh + (trackWidth − viewportWidth)`, written as a CSS variable on every refresh. One scrubbed tween moves the track `x: 0 → −(trackWidth − viewportWidth)`, `ease: none`, `scrub: 1` (Lando's glide), from `top top` to `bottom bottom`.
- **Vertical grid in the pin:** row lines at 15, 28, 41, 54, 67 svh (module 13 svh; content band 15–93 svh). Frame heights: S 26 svh, M 39 svh, L 52 svh, XL 65 svh; widths from each frame's ratio. Every frame's top sits on a row line; its caption hangs 8 px above it.
- **Sequence (stacks of 1–2 items, 6 dr between stacks):**

| Stack | Item(s) | Size / top row | Note |
|---|---|---|---|
| 0 | eyebrow "Selected photos" + lockup "PHOTO / *Diary*" (`--start`) | vertically centred, 30 dr wide | starts at `--d-margin` |
| 1 | `portrait-white-floor` (4:5) | L, row 28 | |
| 2 | `gallery-03` rings (4:5) above, `gallery-22` breakfast (3:4) below | S row 15; M row 54, shifted right 8 dr | a diagonal pair |
| 3 | the serif line "*Light, texture and a little slowness.*" | `--fs-intro-l`, 24 dr wide, centred on row 41 | `data-d-oval` |
| 4 | `gallery-04` white suit (3:5) | XL, row 15 | |
| 5 | `stays-kitchen-view` (3:4) above, `gallery-20` sailing (4:5) below | M row 15; S row 67, shifted left 6 dr | |
| 6 | `gallery-18` garden dress (3:4) | L, row 28 | |
| 7 | `portrait-wood-shoulder` (4:5) above, `gallery-31` avocado (1:1) below | S row 15; M row 54, shifted right 10 dr | ends 12 dr before the track's end |

  At 1440 × 900 the track is ≈ 3,750 px, so the pin lasts ≈ 2,300 px of scroll (≈ 2.6 viewports).
- **Inside each frame:** horizontal inner parallax (the `img` is `4 dr` wider, `x 0 → −4 dr` while the frame crosses the viewport, `containerAnimation`); the vertical `data-parallax` is off in the track. Captions get the line highlight as they enter (`containerAnimation`, `left 92%`). The curtain reveal is replaced by the track motion (no clip at rest).
- **Background:** Vanilla → Surface scrubbed across the pin (`data-bg-range` becomes `top top|bottom bottom` on desktop).
- `will-change: transform` on the track only while the pin is active.
- Keyboard/a11y: the track is presentational; the figures stay in DOM order; focus never lands inside (no focusable children). Reduced motion, static mode and no JS get the static grid below.

**Static desktop layout (no JS, reduced motion, CDN failure, and the CSS default at ≥ 992):** three groups on the 12-column grid, captions above: pair = left frame cols 1–5, right frame cols 7–10 starting `12 dr` lower; single = cols 6–11; the serif line centred on cols 3–10 between groups 2 and 3 at `--fs-intro-l`. `.gallery--track` overrides it in motion.

### 4.9 Contact `#contact` (stage, dark panel) — EDITORIAL

- Panel: `margin-top: −5 dr`, top radius `5 dr` (67 px), `padding-block: var(--section-pad) 3 dr`; a soft Tobacco glow behind the panel's top edge (a `::before` radial gradient, Tobacco at 35 %, 70 vw × 30 vw, behind the panel, no blur filter).
- **Stage:** the signature centred (width `46 dr`, 613 px) with the rust-knit print on **cols 2–3** rotated −4° and tucked under the signature's first stroke (the section's accent); the lockup "LET'S / *work together*" centred under the signature at `--fs-h2`, its first line overlapping the signature's lower loop by 0.2 em (Lando's footer); intro centred at `--fs-intro` (max 30 em), `data-d-oval`.
- **Contact grid:** the four rows become four cells on cols 1–3, 4–6, 7–9, 10–12 (Email, WhatsApp, Instagram, TikTok), each: label eyebrow (`data-d-highlight="sand"`), value at `1.5 dr` (20 px), its pills under it; 1 px `--line-on-dark` rules above and below the row. Pills and links `data-roll`.
- Legal row: © left, "Back to top ↑" right (`data-roll`).
- Tablet: the four rows as a 2 × 2 grid.

### 4.10 Tablet 768–991 (hybrid; every builder for their sections)

The mobile flow and markup, in a 640 px centred column (no token change), with: the mobile header (menu), mobile fan table, mobile chapters, the numbers rail, the gallery groups; plus the two-cell layouts named above (stats in one row, contact 2 × 2). Hover effects only on hover-capable devices. Check 768 × 1024 and 991 × 1024 in both orientations' widths (768 portrait, 1024 landscape is desktop).

---

## 5. Video on desktop (Conectaa §5 adapted; `video.js`, CONTENT)

- Eligible cards (the focused fan card, each chapter's feature card) autoplay **muted** when ≥ 35 % visible; at most **3** play at once (existing `maxPlaying` on fine pointers).
- **Hover** a playing card: its sound and pause buttons fade in (existing rule under `(hover:hover) and (pointer:fine)`); the sound button is always visible while the card owns sound.
- **First click** on a card (anywhere on it, or on its sound button) unmutes it and pins it as the single sound owner (it keeps sound after the pointer leaves; a second click mutes); that click is the page's audio unlock. After the unlock, hovering another card for 180 ms lends it the sound (hover-to-hear) and leaving re-mutes it within 400 ms unless it was clicked; a 100 ms pass-over never unmutes. This is the existing `video.js` behaviour, verified by `…/scratchpad/batch2/fix1/qa/content/desk-test.js` (items 33c/33d): keep it.
- Pause button: click pauses/resumes (existing). Keyboard: the focused card's buttons are reachable; Space/Enter on the fan's focused card toggles sound.
- Never autoplay with sound; never play more than one with sound.

---

## 6. Performance budget (desktop)

- **First view at 1440 × 900** (Chromium, cold, text gzipped): ≤ 1.1 MB transferred (hero 2048 ≤ 280 KB, fonts 121 KB, libraries 55 KB).
- **Own CSS** (site + hero + content + proof): ≤ 75 KB uncompressed in total (≈ 55 KB today); **own JS added** for desktop ≤ 24 KB uncompressed (`desktop.js` ≤ 7 KB). No new libraries, no new hosts.
- **Scroll smoothness:** Lenis config untouched (`lerp .1`, `smoothWheel`, `wheelMultiplier 1`). During a mouse-wheel scroll-through at 1440 × 900 in motion mode: no long task > 50 ms (`PerformanceObserver('longtask')`), and the rAF delta stays ≤ 20 ms in ≥ 98 % of frames (headless, informative). Animate only transform, opacity, clip-path, stroke-dashoffset (and the two existing background scrubs). No layout reads inside scroll callbacks (measure on refresh).
- One pinned section at a time (the gallery), CSS sticky only. `will-change` only on the hero image (track) and the gallery track (while pinned). At most 3 decoding videos.
- **CLS** ≤ 0.02 at every desktop size (reserve every media box with `aspect-ratio`).

---

## 7. Acceptance checklist

**A. Mobile regression (must, blocking)**
1. `compare.js` passes: 0 failed regions in all 6 combinations (§0.1).
2. The mobile test suite still passes (`…/scratchpad/build/foundation/test.js`): no horizontal scroll at 320–430, arming invariant, aria rules, menu, router.
3. Round trip: load at 1440, resize to 390 × 844 and wait 1 s: the page shows the mobile layout (same as a fresh 390 load in each section screen ±0.05 %), `ScrollTrigger.getAll().length` equals a fresh 390 load's count, no `data-armed`, no inline `transform`/`clip-path` left on desktop-only targets.

**B. Desktop (1440 × 900 primary; 1280 × 800, 1920 × 1080, 1024 × 768; motion, reduced, no JS)**
4. No horizontal scroll, no console errors, no failed requests, at every size and mode.
5. Complete at rest: reduced motion and no-JS show every section's final desktop layout (the gallery as the static grid).
6. Grid: every spread's left text edge is on col 1 or its specified column (± 1 px); no text closer than `--d-margin` to the viewport edge; lockup lines never wrap (992–1920).
7. Header: two-line brand, centred nav with the current-section marker, Contact pill, no menu button; text roll on hover and on keyboard focus (frame check at 0 / .2 / .6 s); theme switches over dark sections.
8. Hero: lockup bottom-left clear of the face; the card is portrait 3:4 at .62 H; the signature is fully drawn at 1.0 H and overflows the card; the marquee runs behind the card and is absent below 992.
9. Each section matches its §4 layout (screenshots at 1440 and 1920 reviewed by eye; 1920 is the 1440 layout scaled 1.33×; at 2560 the frame is capped at 1920 and centred).
10. Gallery: the track moves horizontally with the wheel with no jump on entering or leaving the pin; the section's scroll length equals the track overflow; reduced motion shows the static grid; a resize 1440 → 900 → 1440 inside the gallery leaves one pin, one track tween, no stray transforms.
11. Reveals: nothing armed while visible; after a wheel scroll-through `data-armed` = 0 and nothing at opacity < 1; desktop reveals play once (no replay after a resize round trip).
12. Video: hover shows the sound button; the first click unmutes and owns sound; one owner; ≤ 3 playing.
13. Lenis: a 100 px wheel notch glides ≈ 400 ms (existing item 16, run at 1440); no long task > 50 ms during the scroll-through.
14. Budget (§6) met; CLS ≤ 0.02.

**C. Tablet (768 × 1024, 991 × 1024)**
15. Intentional layout: centred column, no awkward empty halves, header with menu, the two-cell layouts of §4.10; no horizontal scroll; hover effects absent on touch emulation.

---

## 8. Notes and decisions where the brief was silent

- **Why no pinned chapter.** Only the gallery pins. Pinning a chapter would put two long pinned stretches 4 viewports apart and break the stage / spread rhythm; the chapters get the sticky head and contact sheet instead, which keeps the thumb → feature swap visible at all times.
- **Why the menu button hides on desktop.** The centred nav plus the Contact pill cover every menu link; the reference keeps its menu because it holds more pages than ours.
- **Lockup weight.** Open question 14 (`--sans-lockup-wght`) still applies; the desktop sizes were checked at 480.
- **Copy.** No new copy: the hero marquee and roles caption reuse approved strings; the gallery quote and the contact intro are the existing lines.

---

## 9. Amendments after the desktop review (fixes round 1, 2026-11-12)

These override the sections they name. Details and measurements: `docs/qa-report.md` §12.

- **§4.1 Hero.** At 16:9 and wider the lockup is capped at `14svh` (151 px at 1920 × 1080), so "Maruch" stays in her hair, clear of the jaw. The desktop stage colour runs Vanilla → Tobacco by 0.35 H → Mahogany-deep by 0.65 H (`--hero-bg-d`, desktop registration), so the khaki in-between is brief. The card clip is whole pixels on desktop. Going back up, the signature clears as soon as the scroll leaves its range (0.55 H), and the handle's opacity follows the card's clip progress. The marquee loops run only once their fade has started (0.35 H). The desktop `<source>` gains `hero-2688.webp` (168 KB) for DPR-2 laptops.
- **§4.4 Fan.** The stage fits one screen under the header, icon to counter: no top padding on `.content` (About's bottom padding is the gap), icon 40 px, a tighter intro, and `--r: clamp(.72 dr, (100svh − 80px − 142px − 16.4 dr) / 43.7, dr)` (cards 210 × 373 at 1440 × 900; 808 px icon to counter; 988 at 1920 × 1080). The hovered centre card lifts 1.2 u (not 2.5). Desktop entrance: plays at the fan's `top 85%`, rise 0.5 s (stagger 0.25), spread label at −0.2.
- **§4.5 Chapters.** The feature card's outer edge sits on a column line: right edge on col 11's end (text-left chapters, with the About photo and the IG screen), left edge on col 2 (Food). The contact sheet takes its shape from its count (`--sheet-cols` / `--sheet-rows` from `video.js`: 11 → 6 + 5, 8 → 4 + 4, 4 → 4), thumbs as large as the card's height allows, foot on the card's foot. Hover titles: sentence-case serif, two lines at most. The CHANEL boutique media (`fashion-07`) is scaled 1.013 from its top on desktop to hide a white band in the source.
- **§4.6 Numbers.** The screens sit on their cell's left line (with the stats and captions); the drift scrubs end at `center center` (`data-d-drift-end`).
- **§4.7 Brands.** The logos are tinted to Mahogany (`filter`, black → 88, 71, 56) on desktop.
- **§4.8 Gallery.** The pin holds still for 0.35 of its height before the track moves (the section is 100svh + hold + overflow + 5 dr); the head's title plays its oval reveal from its `top bottom` at 1.2× speed, so it has landed before the track moves. Reveals left of their sideways start line when the pin starts take the vertical trigger; the others (the serif line) wait for the track. The quote box is `6.6em` with greedy wrapping: "Light, texture / and a little / slowness." at every width. Static desktop layout: one staircase band per group (M on 4 columns, S on 3, S on 3, 8 dr steps), the middle group mirrored.
- **§4.9 Contact.** The glow is Vanilla (lifts, not stains). The Instagram and TikTok cells get the "Open ↗" pill (desktop only), so the four cells share one structure.
- **§3.3 Header.** At ≥ 992 the bar switches theme in 0.2 s.
- **§3.2 Reveals.** On desktop, curtains start at `top 95%` and their wash clears from 0.2 s (phones: `top 85%`, 0.4 s).
- **§4.10 Tablet.** `.content` has no top padding (as desktop); the About offset lockup is 5.2 em wide, so "Lorena" tucks under "OUT".

## 10. Amendments after the round-1 verification (fixes round 2, 2026-11-12)

These override §9 where they differ. Details and measurements: `docs/qa-report.md` §13.

- **§4.4 Fan.** At ≥ 992 the arc follows any change of the fan unit, including a height-only change (the fitted `--r` reads `svh`): a taller or shorter window, F11 or docked devtools re-fit the arc at once, with no jump on the next hover. A deal that is still waiting reads the unit when it opens. Below 992 nothing changed: only a width change moves the arc.
- **§4.8 Gallery.** The head's title plays its oval reveal at 1.8× (0.98 s), so it has landed before the track moves, even at a brisk wheel. The serif line's sideways reveal runs at 1.5× (1.23 s) from the same `left 85%` start, so it lands in view and crosses fully drawn.
- **§4.7 Brands.** The logo tint stays a CSS `filter`. It is rasterised once into the moving rows and costs nothing per frame in the measurements, so pre-tinted logo files are not needed.
