# QA report: mobile v1 integration (2026-11-11)

This report covers the integrated build: the foundation plus the hero, content and proof sections, checked against `docs/build-spec.md` revision 2 and its client feedback block. It records what changed during integration, the result of every item in the §9 checklist, the deviations from the spec, the open decisions and the files the page needs at runtime.

**Verdict.** Every §9 item that can be run locally passes, in every listed context, with no console errors and no horizontal scroll from 320 to 430 px. Three things need a decision or a published URL:
1. Own CSS and JS are over the §8.1 size targets (§5 below).
2. Items 4 and 6b need the published Artifact and Pages URLs.
3. The Adobe Fonts kit adds two external hosts on GitHub Pages only, by client decision.

## 1. How it was tested

- **Build and serve.** `bash scripts/wrap-site.sh` builds the Pages page. `http-server@14.1.1` serves the repo; it answers `Range` with 206.
- **Two pages, same fragment:**
  - `index.html` is the Pages build, which links the Adobe Fonts kit.
  - `artifact.html` stands in for the Artifact. It is the same wrapper without the kit link, which is what the Artifact host runs.
- **Contexts:**
  - Playwright Chromium, with `devices['iPhone 13']` touch emulation at 390 × 844 (spec context).
  - Short phones: 390 × 664 and 375 × 548 (`iPhone SE (3rd gen)`).
  - A cross-origin sandboxed iframe at 390 × 844 and 390 × 700 (host on `localhost`, site on `127.0.0.1`).
  - Desktop 1440 × 900.
  - Reduced motion, and JavaScript disabled.
  - Widths 320, 360, 375, 390, 414 and 430.
- **Reading video state.** Video state is read over CDP with `userGesture:false`. Taps use `page.tap()`, and swipes use CDP touch events.
- **Scroll-through recording.** A 48 s wheel-driven recording at 390 × 844 was made, and frames were extracted at 2 fps for review (see §4).
- **Test scripts** are in `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/build/qa/`. They are temporary. The full run is `run-all.sh`, plus `glide.js` and `coverage.js`.

## 2. Changes made during integration

| File | Change | Why |
|---|---|---|
| `js/hero.js` | Removed `setupProfile()` and its imports; moved `setLightTop` to the module top | The Instagram profile screen was upgraded by two modules: `hero.js` removed `data-ig-static` so that `proof.js` would skip it. `proof.js` already does exactly that upgrade (on approach, `data-ig-flash` on the profile), so there is now one path. |
| `js/reveals.js` | Removed the `data-arch` scrub | The About arch was removed by client feedback 1; the code was dead. The `docs/build-foundation.md` table row was removed too. |
| `site.html` (hero) | `sizes` changed from `(max-aspect-ratio: 2/3) 150vw, 106vw` to `(max-aspect-ratio: 3/4) 150vw, 106vw` | At 375 × 548 the cover renders about 555 px wide, but `sizes` claimed 397 px, so a 2× iPhone SE got the soft `hero-828`. It now gets `hero-1242`. |
| `css/site.css` (tokens) | `--font-serif` now starts with `"the-seasons"` | Client feedback 3 |
| `scripts/wrap-site.sh` | Adds `<link rel="stylesheet" href="https://use.typekit.net/juy5uwr.css">` to the Pages skeleton only | Client feedback 3. `site.html` is unchanged, so the Artifact keeps the LM stand-ins, and `index.html` still contains `site.html` byte for byte. |
| `assets/fonts/LICENSES.md` | Records the Adobe Fonts decision (kit, domains, Pages only) | Licence trail |
| `site.html` + `css/site.css` (contact) | Removed the optional footer line "Type: Mona Sans, Gilda Display, EB Garamond (SIL OFL)" and its rule | On Pages the serif is now The Seasons, so the line would be wrong. The spec marks it optional. The OFL credits stay in `LICENSES.md` and the `site.html` source comment. |
| `css/site.css` (chrome) | Skip link: `min-height:44px` (it was 40 px) | Item 38 |
| `css/content.css` | Hint pill background `rgba(77,52,45,.78)` (spec `.55`) | Item 39: the 11 px Vanilla hint over white footage measured about 2.6:1 at .55, and 4.9:1 at .78. |
| `lab/type.html` | Added the open-question-14 panel: "MY CONTENT / *in motion*" at 480 and 650 weight, each with the italic and the roman serif | Spec §3 and §10 Q14. No section owned it. |

No other shared-file changes were needed. Every module boots, readies and finishes in the documented order, and there are no duplicate observers, listeners or upgrades left.

## 3. Acceptance checklist (§9)

### A. Fragment and hosting

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Starts with `<title>Lorena Maruch</title>`, then the `claude:viewport-fit-sides` meta. No doctype, html, head or body tags, and no inline script. |
| 2 | PASS | 142 referenced paths, all relative, all HTTP 200. Checked in the repo and in a fresh `_site`. |
| 3 | PASS | Artifact page: hosts are self, `cdnjs.cloudflare.com` and `cdn.jsdelivr.net`. Pages page: the same plus `use.typekit.net` and `p.typekit.net` (client decision, Pages only). No iframes, and no stylesheet from any other host. |
| 4 | PASS (local) | 4 pinned scripts with `integrity` and `crossorigin`; `html.motion` present in both pages. The published Artifact preview still needs checking: if its host rejects the SRI, drop `integrity`. |
| 5 | PASS | No console errors, page errors or failed requests through a full wheel scroll-through, on both pages. See the note below. |
| 6 | PASS | The word-bounded grep prints nothing. Only the 3 WOFF2 files are published. |
| 6a | PASS | Checked in a fresh copy: wrap and assemble; `_site/index.html` starts with the doctype and contains `site.html` byte for byte; there is no `_site/site.html`; `<title>` is in `<head>`; items 1–5 pass against the served `_site`. |
| 6b | PASS (local) / OPEN | The local server answers `206` with `content-range: bytes 0-1/3408073`. The Pages and Artifact URLs are not published yet; run the curl from §9 on both. |

**Note on item 5.** Chromium cancels each open-ended `.mp4` range request (`net::ERR_ABORTED`) once `preload=metadata` has its metadata. This is normal media loading, not an error; it shows up 3 times per scroll-through, once per real video. The harnesses ignore exactly this case.

### B. Layout

| # | Result | Evidence |
|---|---|---|
| 7 | PASS | `scrollWidth === innerWidth` at load and at every 400 px, with the fan open and the menu open and closed, at 320/360/375/390/414/430, in motion and reduced modes. |
| 8 | PASS | Every `.wrap` has ≥ 16 px padding, and no text box leaves the 16 px gutters. Only the fan cards and the marquee rows bleed, and they are clipped. |
| 9 | PASS | The header padding uses `env(safe-area-inset-top)`, and the toast `bottom` adds the bottom inset. |
| 10 | PASS | No lockup line wraps at 320 px, with the stand-in fonts and with The Seasons (Pages). |

### C. Complete at rest

| # | Result | Evidence |
|---|---|---|
| 11 | PASS | Without JS: hero (H1 + cover), About, 4 chapter headings, stats "1.9M Views / 39.2K Followers / +7,696 Net followers", 12/12 images loaded, 9 gallery captions and the contact rows. The header shows the wordmark, the pill and the 85% backing, with no menu button. Nothing is at opacity < 1 except decorative layers that rest at 0 by design: `.hero__shade`, the 2nd–4th stacked niche icons and the empty toast. |
| 12 | PASS | Reduced motion: `lenis` is undefined; there is no `.motion`, no `[data-armed]`, no `.mo-armed`, no inline `opacity:0`, no visible `0%` clip-path and no inline transform offset. The backing is clear at scroll 0 and the menu button is shown. The closed menu keeps its hidden-state clip, which is fine because it is `visibility:hidden`. |
| 13 | PASS | Before any scroll: 0 arm records, and nothing armed beyond 1.75 viewports. |
| 14 | PASS | After 120 px wheel steps to the bottom and back: `[data-armed]` = 0 and `.mo-armed` = 0; every h2, h3, p, img and IG card is at opacity 1; 65 arm records, none while visible. |

**Thumbnail-safe first frame.** The first paint is the full-bleed cover with the Vanilla lockup on its scrim. Nothing is hidden, and the signature and handle stay hidden until `hero--live`. Before `site.js` runs (about 0.3–0.5 s), the header briefly shows its no-JS look (frosted Vanilla bar, Mahogany ink) before it clears. It is legible either way.

### D. Smooth scroll

| # | Result | Evidence |
|---|---|---|
| 15 | PASS | `lerp 0.1`, `smoothWheel true`, `touchMultiplier 1.25`, `anchors false` |
| 16 | PASS | From mid-page: monotonic; largest frame step 20–22 px; never exactly 100; displacement 500.0; 90% reached 230 ms after the last wheel. |
| 17 | PASS | A 300 px CDP touch drag scrolls 285 px (native, iOS user agent) and 375 px with `?synctouch=1`, where `syncTouch` is true. |
| 18 | PASS | A rail swipe gives `scrollLeft` 260 while `scrollY` moves 0 px. |

### E. Hero (390 × 844, 390 × 664, 375 × 548, cross-origin iframe 390 × 700 and 390 × 844)

All 20/20 motion checks and 4/4 reduced checks pass in all five contexts.

| # | Result | Evidence |
|---|---|---|
| 19 (as changed by client feedback 1) | PASS | The H1 is visible. The cover fills the stage. Both eyes are ≥ 24 px under the lockup and centred. The header ink at scroll 0 is Vanilla (the hero is dark on its scrim), measured at 6.7:1 over the real pixels. The motion-vs-reduced stage diff at rest is 0.000–0.018% of pixels. |
| 19a | PASS | Eyes inside the card at 1.0 H, 36% down it. |
| 20 | PASS | The card is exactly `.575·.58H × .58H` (281.5 × 489.5 at 844) with 28 px corners. Both backgrounds are `rgb(77, 52, 45)` at 1.0 H and equal at 0.5 H. Shade .12; no filters. |
| 20a | PASS | 12-value px `inset()` at 0/.25/.5/.75/1 H, each value monotonic. It is read from `--hero-clip` (see §4). |
| 21 | PASS | Undrawn at 0.55 H; 45.8–46.2% inked at 0.85 H; fully drawn at 1.15 H; `vector-effect: none`. The footer is 48% inked 0.92 s after its play starts. |
| 22 | PASS | Screenshots at 0, 0.5 H and 1.0 H in each context: eyes inside the window, nothing over "Maruch". |
| Theme | PASS | dark → light (from 0.31–0.38 H, where the photo's edge passes the header line) → dark (0.5 H) |
| Mid-session reduced motion | PASS | Turning reduced motion on at 0.7 H leaves no inline hero style, no split, no `aria-label` and no dash. The hero returns to its 100svh static height. |

### F. Fan

| # | Result | Evidence |
|---|---|---|
| 23 | PASS | Slots 0 and 6 at −21° and 21° with scale .776; focus at z 10, scale 1. |
| 24 | PASS | stays-03 plays muted; no other fan video plays. |
| 25 | PASS | Swipe left → "05 / 07", caption updated, old video paused. A side-card tap focuses it. Prev and next are 44 × 44 and work. |
| 26 | PASS | Tap the focused card → `muted false` and `paused false`; the sound button is `aria-pressed="true"`. |
| 26a | PASS | Each tap toggles once (`volumechange` counted). `elementFromPoint` returns the sound and pause buttons. Sound is inherited only when the fan owned it. |
| 26b | PASS | fashion-01 is labelled "Soft light, brown jacket, video coming soon", with no `aria-pressed`. The sound hint is hidden, and a tap changes nothing. |

### G. Video rules

| # | Result | Evidence |
|---|---|---|
| 27 | PASS | At load: 0 mp4 requests, no video `src` or `poster`, and no poster or thumb WebP requested. |
| 28 | PASS | At most 1–2 videos playing at once (≤ 2 required). |
| 29 | PASS | The first feature starts playing at translateY ≈ 50 px. |
| 30 | PASS | B takes sound from A. When B scrolls away it is muted and released. |
| 31 | PASS | Swap to stays-03: `dome-bathtub.mp4`, playing, unmuted, `aria-pressed` true, `aria-current` set. A poster-only swap shows no sound button, and the video is paused with no `src`. |
| 32 | PASS | Reduced motion: nothing autoplays; a tap plays unmuted; a second tap pauses. |
| 33 | PASS | The pause button shows while playing; the pause sticks; it resumes. |
| 33a | PASS | Blocked autoplay: `.is-blocked`, the poster stays, a 52 × 52 glyph shows, and a tap plays. |
| 33b | PASS | Blocked unmute: re-muted and still playing, `.needs-gesture`, the hint is shown, `aria-pressed` stays false. |
| 33c | PASS | Desktop: hover shows "Click for sound"; the video plays muted. |
| 33d | PASS | A click pins sound; hover-to-hear after unlock; leaving re-mutes within 400 ms; a 100 ms pass never unmutes; hover then click pins. |

### H. Content, data and contact

| # | Result | Evidence |
|---|---|---|
| 34 | PASS | "1.9"+"M", "39.2"+"K" and "+7,696" with labels Views / Followers / Net followers, all from `metrics.json`. Count-ups end on the exact strings; motion.js keeps an sr-only copy. |
| 34a | PASS | One h1 (hero), one h2 in each other section and in the footer, one h3 per chapter. |
| 35 | PASS | Logos:<br>• 46 in the first copy: 42 with an alt, plus 4 with `alt=""` inside `aria-hidden` items.<br>• No bad alts.<br>• 46 duplicates with `alt=""`.<br>• Every height is 44 × scale; rows are 72 px.<br>• No blend modes.<br>• 92/92 images complete after approach.<br>• Pause sets `playState` to paused.<br>• Rows pause off-screen.<br>• Direction follows scroll (±1.00). |
| 36 | PASS | The values are selectable text. Copy works through the clipboard API (exact value on the clipboard) and through the fallback (text selected); both show "Copied". All 5 external links have `target="_blank" rel="noopener"`. |
| 37 | PASS | Menu: `aria-expanded`, Lenis stopped, focus inside, Esc closes and returns focus, and a link lands at 72 ± 8 px. |
| 37a | PASS | Motion and reduced: the Contact pill and "More stays ↓" land at 71.5–71.8 px; the wordmark and "Back to top" land at 0. Tab then Enter on a fresh load focuses `#main`. The hash never changes. |

### I. Quality gates

| # | Result | Evidence |
|---|---|---|
| 38 | PASS | Every button and link is ≥ 44 × 44, counting the 48 px `::after` areas. The skip link is now 44 px. |
| 39 | PASS | **Page text:**<br>• 111 text elements in motion mode and 106 in reduced mode meet 4.5:1, or 3:1 at ≥ 24 px.<br>• The gallery text also passes at the Surface end of its scrub.<br><br>**Text over the cover at scroll 0** (5th percentile of the real pixels under each element):<br>• eyebrow 5.6<br>• "LORENA" 5.5<br>• "Maruch" 4.0 (large text)<br>• header ink 6.7<br><br>**Header ink against the composited backing**, at every section top and every 0.1 H from 0.35 H to 1.2 H, in motion, reduced and no-JS modes:<br>• worst case 5.25 with black or white under the backing<br>• 4.84 while clear at 0.35 H. |
| 40 | PASS | CLS 0.0001 in motion and 0.0000 in reduced, from load through a full scroll. |
| 41 | PASS | First view, before any scroll, at 3× DPR (text gzipped as Pages serves it):<br>• Pages: 357 KB without the CDN libraries (this includes 39 KB of The Seasons), or 411 KB with them.<br>• Artifact: 330 KB without the CDN libraries.<br>• 0 video bytes and 0 poster requests. |
| 42 | PASS | Cross-origin iframe, 844 and 700 tall:<br>• 62 arm records, 0 while visible.<br>• The profile IG screen, the fan, 11 lockups and the footer signature were all armed ahead.<br>• Every video `src` was assigned below the fold.<br>• Muted autoplay works.<br>• The Instagram link opens a popup, and the frame URL is unchanged. |
| 43 | PASS | 1440 × 900:<br>• no horizontal scroll;<br>• column 672 px, centred;<br>• slot 0 at −30u;<br>• hover spreads the neighbours;<br>• no errors. |
| 44 | PASS | Read with `Accessibility.getFullAXTree` after the reveals:<br>• the h1 is named "Lorena Maruch";<br>• all 19 headings equal their text, apart from case;<br>• no `aria-label` on a span, p or div;<br>• thumbs are named "Play: " or "Show: ", with one `aria-current` per rail.<br><br>Chromium's computed AX name applies CSS `text-transform`, so it reads "MY CONTENT in motion"; the DOM text is "My content in motion". |
| 45 | PASS | The icon cycle and all 5 Ken Burns passes are `finished` after 6 s, and no content CSS animation is still running. The marquee pauses. |

## 4. Deviations from the spec

1. **Hero, from client feedback 1–2.** The hero now uses the full-bleed cover (`cover.jpg`, 2:3) with the lockup in Vanilla on a Mahogany-deep scrim. The arch, the `.hero__arch` probe and the About arch are gone. In motion mode `.hero` is `data-theme="dark"`, with a light zone from the scroll where the photo's top passes the header line until the dark zone at 0.5 H. Item 19's "header ink Mahogany" and "arch probe" checks became "header Vanilla over the scrim, ≥ 4.5:1" and "eyes ≥ 24 px under the lockup".
2. **Clip-path tween.** The 12-value `inset()` is tweened as the custom property `--hero-clip`, which `css/hero.css` feeds to `clip-path`. Chrome re-serializes a `clip-path` tween's ends compactly, and the card jumped at 1.0 H. Item 20a therefore reads `photo.style.getPropertyValue('--hero-clip')`.
3. **Hero load settle.** It is a CSS animation on `.hero__photo`'s `scale` property. It also runs without JS, and is off under reduced motion.
4. **Signature dash.** The dash is `len, len+16` with offset `len+4`, so no round-cap dots show at rest. There is also an optional 6 px pen tip.
5. **Content.**
   - Posters and thumbs load through their own 1.5-viewport `root: document` lookahead (`data-src`), not `loading="lazy"`. Chromium's native lazy margin pulled every fan poster at load.
   - The video fades in over the poster (0.45 s everywhere), instead of the poster fading out.
   - Fan wrap-around parks follow the arc (+19u / +28° on the right).
6. **Brands.** The edge mask sits on `.brands__rows`, and each row is 8vw wider than the screen on each side, so the ±6vw drift never shows an edge. The marquee runs in motion mode only.
7. **Hint pill** opacity .78 instead of .55 (contrast, item 39).
8. **Fonts.** The Seasons ships through Adobe Fonts on Pages only (client feedback 3). The Artifact keeps the OFL stand-ins, so the two builds differ in serif typography only; behaviour and markup are identical.
9. **Footer type credit line removed.** The spec marks it optional, and it would be wrong on Pages.

## 5. Known issues and open decisions

1. **Own code is over the §8.1 size targets** (it does not affect the first-view budget):
   - **CSS:** own CSS (`site.css`, `hero.css`, `content.css`, `proof.css`) is 47.7 KB against the 40 KB target (12.9 KB gzip).
   - **JS:** own JS (10 modules) is 106 KB against the 70 KB target (32 KB gzip).
   - **Comments:** stripped of comments, the totals would be about 37 KB of CSS and 79 KB of JS.
   - **What's heavy:** `video.js` (22 KB) and `fan.js` (14 KB) carry the full §6 rule set: scheduler, sound owner, desktop hover-to-hear, blocked states.
   - **Options** (I did not strip documentation to hit the number): accept the overage, or add a minify step to the Pages workflow only. The Artifact publishes the source files as they are.
2. **Items 4 and 6b on the real hosts.** Re-run `html.motion` and the range curl on the published Artifact URL and on the Pages URL. If the Artifact host answers 200 to a range request, iOS Safari will not play the videos in the Artifact preview.
3. **Snap threshold.** The Lando signature snap uses 100 px per frame of Lenis velocity, so on 120 Hz screens it triggers at about half the real speed.
4. **iOS is not tested on a device.** Native momentum, the address-bar resize under the sticky stage, and unmute behaviour were emulated only.
5. **The Seasons on Pages:**
   - The kit uses `font-display:auto`. Text waits up to about 3 s for the kit on a cold slow connection, but `fonts.ready` caps the split wait at 1.5 s.
   - The EB Garamond italic stand-in is still preloaded by `site.html` (29 KB on Pages). It serves only as a glyph fallback there.
   - Verified: no lockup wraps at 320 with The Seasons.
6. **Inbox not integrated, by design** (`docs/inbox.md`): `dome-breakfast.mp4`, `pousada-pool.mp4` and the new photos. Adding a video means a `videos.json` entry with `src`, `poster`, `duration` and `audio`.
7. **Copy fallback.** After a successful `execCommand` copy, the value stays selected (`ui.js`). This is harmless.
8. **Content gaps:**
   - Poster-only feature captions show only the category (there is no duration).
   - There is no tap-to-play for an `audio:false` fan card under reduced motion; none exist today.
9. **Spec open questions (§10) still need the client's answers.** Q14 can now be shown from the new panel in `lab/type.html`.

## 6. Files the page needs at runtime (Artifact publish list)

The list has 142 files, about 27.9 MB, plus `site.html` itself. Every path was verified to exist, to be requested or referenced at runtime, and to be served with 200. A coverage run requested 127 of them; the other 15 are reached only through `srcset` at higher DPR or desktop widths, or through a thumb swap. Nothing outside the list was requested.

- **CSS:** `css/site.css`, `css/hero.css`, `css/content.css`, `css/proof.css`, `css/insights.css`
- **JS:** `js/site.js`, `scroll.js`, `ui.js`, `reveals.js`, `hero.js`, `signature.js`, `fan.js`, `video.js`, `brands.js`, `proof.js`, `insights.js`, `motion.js`
- **Data:** `data/videos.json`, `data/brands.json`, `data/metrics.json`. `content.json` and `inventory.json` are not read at runtime.
- **Fonts:** `assets/fonts/lm-sans-var-latin.woff2`, `eb-garamond-italic-latin.woff2`, `lm-display-regular-latin.woff2`
- **Images:**
  - `assets/img/avatar.jpg` (IG profile, via `metrics.json`)
  - `assets/img/web/` hero-828/1242/1527
  - about-480/800
  - contact-06-320/480
  - gallery-{02,03,08,09,14,17,18,22,29}-{480,800}
- **Logos:** `assets/logos/*.svg` (46 files; no PNGs)
- **Video:** `assets/video/posters/*.webp` (22) and `assets/video/thumbs/*.webp` (22); `assets/video/stays/dome-bathtub.mp4`, `aframe-living-room.mp4`, `aframe-one-day.mp4`

Not published, and not referenced: `lab/`, `docs/`, `_source/`, `scripts/`, the original JPEGs in `assets/img/*`, `assets/logos/png/`, `assets/video/_ref/`, the `assets/video/stays/*.jpg` first-frame posters, `dome-breakfast.mp4` and `pousada-pool.mp4`. `index.html` is the Pages wrapper and is not part of the Artifact.
