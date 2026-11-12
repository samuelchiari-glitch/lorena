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
4. **Signature draw** (rewritten for Lorena's real signature kit; §10.2). The artwork is a filled outline revealed through a mask, and only the two mask pens are dashed: each pen's dash is `len px, len+20 px` with offset `len × (1 − f)`. A pen that has not started yet is `visibility: hidden`, so no round-cap dot shows. There is no pen tip. The hero draws 0.55 → 1.0 H (spec: 0.55 → 1.15 H) and the footer plays 2.2 s linear (spec: 1.8 s `power1.inOut`).
5. **Content.**
   - Posters and thumbs load through their own 1.5-viewport `root: document` lookahead (`data-src`), not `loading="lazy"`. Chromium's native lazy margin pulled every fan poster at load.
   - The video fades in over the poster (0.45 s everywhere), instead of the poster fading out.
   - Fan wrap-around parks follow the arc (+19u / +28° on the right).
6. **Brands.** The edge mask sits on `.brands__rows`, and each row is 8vw wider than the screen on each side, so the ±6vw drift never shows an edge. The marquee runs in motion mode only.
7. **Hint pill** opacity .78 instead of .55 (contrast, item 39).
8. **Fonts.** The Seasons ships through Adobe Fonts on Pages only (client feedback 3). The Artifact keeps the OFL stand-ins, so the two builds differ in serif typography only; behaviour and markup are identical.
9. **Footer type credit line removed.** The spec marks it optional, and it would be wrong on Pages.

## 5. Known issues and open decisions

1. **Own code is over the §8.1 size targets; accepted** (it does not affect the first-view budget). Re-measured in batch 2 round 1 (§10):
   - **CSS:** own CSS (`site.css`, `hero.css`, `content.css`, `proof.css`) is 57.3 KB against the 40 KB target: 15.9 KB gzip as one stream, 17.4 KB as the four files are served. It was 47.7 KB (12.9 KB gzip) at integration.
   - **JS:** own JS (10 modules, without `motion.js` and `insights.js`) is 134.1 KB against the 70 KB target: 41.5 KB gzip as one stream, 47.4 KB as served file by file. It was 106 KB (32 KB gzip) at integration. The heaviest are `video.js` 26.3 KB, `fan.js` 18.4 KB and `hero.js` 17.7 KB.
   - **Why:** the modules carry the full §6 rule set (scheduler, sound owner, desktop hover-to-hear, blocked states), the real-signature kit and long comments for the next builder: comments are about 29% of the JS and 27% of the CSS.
   - **Decision (batch 2 round 1):** accepted as is. The first view stays at 431–470 KB against 700 KB, and every module loads in parallel through `modulepreload`. A minify step would have to go into the Pages workflow only (the Artifact publishes the sources as they are), and a build tool could not be installed in this sandbox to measure or test one. Revisit with the desktop pass if the budget matters.
2. **Items 4 and 6b on the real hosts.** Re-run `html.motion` and the range curl on the published Artifact URL and on the Pages URL. If the Artifact host answers 200 to a range request, iOS Safari will not play the videos in the Artifact preview.
3. **Snap threshold.** The Lando signature snap uses 100 px per frame of Lenis velocity, so on 120 Hz screens it triggers at about half the real speed.
4. **iOS is not tested on a device.** Native momentum, the address-bar resize under the sticky stage, and unmute behaviour were emulated only. Playwright's WebKit and Firefox are not installed here, so the paths that matter most on iPhone ran in Chromium only. **Before shipping, on a real iPhone (Safari 17 or 18) at 390 × 844, check and record here:**
   - **(a) Hero signature.** Scrub slowly from 0.5 H to 1.2 H: the L, then the M, are written with no stale mask frames (each frame re-rasterises a ~360 px `<mask>` with 2 dashed pens and up to 34 guard visibility flips). Record the frame rate in Web Inspector's Timelines, and the clip-path repaint cost (M19) in the same run.
   - **(b) CHANEL fan card.** It waits on its poster (the N°5 frame) while the stack rises, starts playing from 21.2 s (`#t=21.2`, `preload=metadata`) as the deck opens, and loops. Note where the loop restarts (Chromium wraps to 0:00) and that the poster and the first played frame match.
   - **(c) Wine card** (`view`): the `<video>` scaled 1.553× inside the clip-path rounded card shows no white band and no "2/2" badge, in the Food rail swap too.
   - **(d) Cold load over cellular:** first paint, the hero going live, the lockup fonts (block, ≤ 3 s), and the first video starting.
   - **Floor:** `translate`, `svh` and `min(92%, 560px, 50svh)` need iOS 15.4 or later; older Safari gets a hero track and a signature width that fall back badly.
   - **Results:** not yet run (no device in this sandbox).
5. **The Seasons on Pages:**
   - The kit uses `font-display:auto`. Text waits up to about 3 s for the kit on a cold slow connection, but `fonts.ready` caps the split wait at 1.5 s.
   - The EB Garamond italic stand-in is still preloaded by `site.html` (29 KB on Pages). It serves only as a glyph fallback there.
   - Verified: no lockup wraps at 320 with The Seasons.
6. **Inbox integrated after this report** (2026-11-11, see `docs/inbox.md`): `dome-breakfast.mp4` is now `stays-01`, `pousada-pool.mp4` is the new `stays-07`, and the client's photos went into About, a new Stays photo pair and the gallery. The full §9 regression was re-run and passes. Item 41's first view grew to 498 KB on Pages and 471 KB on the Artifact, still within budget; `docs/inbox.md` says why. The file list in §6 below is updated.
7. **Copy fallback.** After a successful `execCommand` copy, the value stays selected (`ui.js`). This is harmless.
8. **Content gaps:**
   - Poster-only feature captions show only the category (there is no duration).
   - There is no tap-to-play for an `audio:false` fan card under reduced motion; none exist today.
9. **Spec open questions (§10) still need the client's answers.** Q14 can now be shown from the new panel in `lab/type.html`.

## 6. Files the page needs at runtime (Artifact publish list)

The list has 150 files, about 43 MB, plus `site.html` itself (updated for the inbox integration; the coverage figures below are from the original run). Every path was verified to exist, to be requested or referenced at runtime, and to be served with 200. A coverage run requested 127 of them; the other 15 are reached only through `srcset` at higher DPR or desktop widths, or through a thumb swap. Nothing outside the list was requested.

- **CSS:** `css/site.css`, `css/hero.css`, `css/content.css`, `css/proof.css`, `css/insights.css`
- **JS:** `js/site.js`, `scroll.js`, `ui.js`, `reveals.js`, `hero.js`, `signature.js`, `fan.js`, `video.js`, `brands.js`, `proof.js`, `insights.js`, `motion.js`
- **Data:** `data/videos.json`, `data/brands.json`, `data/metrics.json`. `content.json` and `inventory.json` are not read at runtime.
- **Fonts:** `assets/fonts/lm-sans-var-latin.woff2`, `eb-garamond-italic-latin.woff2`, `lm-display-regular-latin.woff2`
- **Images:**
  - `assets/img/avatar.jpg` (IG profile, via `metrics.json`)
  - `assets/img/web/` hero-828/1242/1527
  - about-480/800
  - portrait-white-floor, portrait-wood-shoulder (each -480/800)
  - stays-{aframe,ofuro,golden,kitchen,loft,bath}-{card,thumb} (the Stays rail's photo items; polish round 1)
  - contact-06-320/480
  - gallery-{03,04,07,09,18,20,22}-{480,800} (polish round 1: 04, 07, 20 replace 02, 17 and the kitchen single)
- **Logos:** `assets/logos/*.svg` (46 files; no PNGs)
- **Video:** `assets/video/posters/*.webp` (23) and `assets/video/thumbs/*.webp` (23); `assets/video/stays/dome-bathtub.mp4`, `aframe-living-room.mp4`, `aframe-one-day.mp4`, `dome-breakfast.mp4`, `pousada-pool.mp4`

Not published, and not referenced: `lab/`, `docs/`, `_source/`, `scripts/`, the original JPEGs in `assets/img/*`, `assets/logos/png/`, `assets/logos/master/`, `assets/video/_ref/`, the `assets/video/stays/*.jpg` first-frame posters. `index.html` is the Pages wrapper and is not part of the Artifact; it alone uses `assets/img/social/` and `sitemap.xml` (Pages only).

## 7. Polish round 1 (2026-11-11)

Every finding from the round-1 design, motion and tech reviews was applied: the musts first, then the shoulds, then all 15 nice-to-have items. The musts overlap: two client-feedback items were found by all three reviewers, plus the rail touch bug. Where a fix conflicted with the spec, the client feedback block won (no arches, full-bleed cover, the care removal, the mixed rail). The test scripts are temporary, in `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/polish/fix1/`; `qa/` there is the §9 suite adapted to this round.

### 7.1 Must

| Finding | What changed | Verified |
|---|---|---|
| Skin & hair care still live (design 1, motion 14, tech 21; client feedback 6) | • The `#care` article and the serum-bottle icon are deleted from `site.html`.<br>• `data/videos.json`: the skincare category has `"disabled": true`, and its data and assets stay. `video.js` and `fan.js` skip disabled categories. For an enabled category with no markup, `video.js` renders a chapter shell from the data, so re-enabling care is the one-line data change.<br>• Fan refilled (§7.4, item 1).<br>• Meta description: "…Stays, food and fashion."<br>• About statement: "…about *places,* food *&* style."<br>• Gallery: "Beauty · Chanel" (a hair-mist product shot) is replaced by "Travel · Sailing" (`gallery/20`).<br>• The icon cycle is retimed for 3 icons (3.6 s). | • Page text, `alt` and `aria-label` contain no "skin", "hair care", "self-care", "serum" or "hair mist". The only "Chanel" left is the brand logo's alt in Brands.<br>• No `#care`; 3 icons; 3 chapter `h3`s; no broken `#` anchors; the fan reads "04 / 07". |
| Stays rail not mixed (design 2, motion 15, tech 22; client feedback 7) | • The Stays rail now has 11 items, starting with a video and alternating:<br>dome breakfast (video), A-frame deck, bath with a view (video), ofurô deck, inside the A-frame (video), golden hour on the deck (couple), pousada (video), kitchen from above, one day in an A-frame (video), cooking for two (couple), bath among the trees (couple).<br>• Photo items live in `videos.json` (`type: "photo"`, `master`, `crop`), ordered by the category's new `rail` list. `make-images.py` cover-crops them to 9:16 around the subject (720 × 1280 card, 240 × 427 thumb).<br>• 3 new web masters from the client's originals: `assets/img/stays/deck-golden-hour.jpg` (dsc01104), `loft-kitchen.jpg` (02) and `bath-trees.jpg` (likeappro-3279).<br>• A photo thumb shows the still in the feature card: same frame, no sound or pause button, one Ken Burns pass, the photo's alt on the image, "Stays · Photo" under it. Its thumb is named "View photo: …".<br>• Video thumbs carry a small play badge, so the rail reads as mixed.<br>• The 2 placeholders (`stays-02`, the one-woman band, and `stays-04`) are out of the rail; their data stays.<br>• The photo pair under the chapter duplicated rail items, so it was removed (markup, CSS and derivatives). | • Tapping thumb 2 swaps in `stays-aframe-card.webp`: `data-has-video=false`, sound and pause hidden, no video `src`.<br>• Tapping thumb 3 plays `dome-bathtub.mp4` unmuted.<br>• Items 31 and 44 re-run with the photo swap. |
| Vertical swipes dead on the thumb rails on the iOS path (motion 13) | The inlined Lenis rule no longer applies `overscroll-behavior: contain` to `[data-lenis-prevent-horizontal]` on both axes. Horizontal scrollers now get `overscroll-behavior-x: contain; overscroll-behavior-y: auto`. | A 220 px CDP touch drag starting on each rail:<br>• iPhone 13 UA (native touch): scrollY +205 on all 3 rails (it was 0).<br>• `?synctouch=1` and Pixel 5: +273.<br>• Reduced motion: +240.<br>• Item 18 (a horizontal swipe scrolls only the rail) still passes. |

### 7.2 Should: design

| # | What changed | Verified |
|---|---|---|
| 3 Signature over the cream robe | `.hero__shade` is now a bottom-weighted Mahogany-deep gradient: .12 down to 46% of the stage, .58–.62 from 64%. It fades in from 0.4 H (`power1.out` since the signature swap, so it is ≈ .45 when the pen starts; it was `power1.in`). The eye line keeps the old .12 veil. | Frames at 390 and 1440, 1.0–1.2 H: the whole "Lorena" reads on the darkened lower card, and the eyes stay clear. |
| 4 About italic tucked into the wood wall | The photo's negative margin is gone (`margin-top: 10px`). The italic sits 6 px in from the photo's right edge. | Screenshot. |
| 5 Header clear across the photo's edge (with tech 23) | • hero.js computes, from the scrub's ease, the scroll where the shrinking photo's top edge reaches the header's 44 px controls (≈ 0.17 H at 844). It sets both `--hero-light-top` and `data-clear-until` there.<br>• ui.js turns the backing on at that scroll (it was 0.35 H).<br>• Inside the hero track the bar's colour fades take .15 s (`.hdr--quick`). | Header ink over the real pixels, at every 0.02 H from 0 to 0.4 H plus 0.45, 0.5 and 0.6, at 390 × 844, 375 × 548, 360 × 640 and 430 × 932:<br>• worst 5.43 while clear over the cover;<br>• worst 5.98 while backed.<br>Before: 1.12–1.5 between 0.2 and 0.34 H. |
| 6 Heavy scrim | • The linear wash is .36 → .34 → .2, gone 40 px under the lockup. It was .62 → .5 → .34, gone 120 px under it.<br>• One softer oval sits behind "Maruch" (.54, 54% × 88 px).<br>• The text shadow is kept. | Item 39 over the cover (5th percentile), at 320–430:<br>• eyebrow 4.78<br>• "LORENA" 4.66<br>• "Maruch" 3.16–3.30 (large text)<br>• header 5.5–5.7 |
| 7 Stays feature card off-brand | `categories[0].feature` is now `stays-01` (Lorena setting out breakfast in the dome, no burned-in titles). `stays-06` sits 9th in the rail. | Item 29: the first feature plays at translateY 45. |
| 8 Yellow satin four times | • Fashion feature: `fashion-06` (gold earrings, black blazer).<br>• Gallery group 2, left: `gallery/04` "Fashion · White suit".<br>• No fan pick is a chapter feature.<br>• The gallery's kitchen single is now a rail item, so it became `gallery/07` "Food · Long lunch". | Yellow satin now appears only in the fan and as a non-active Fashion thumb. |
| 9 Repeated words | • About eyebrow: "About" → "Hello".<br>• Chapter eyebrows are the numeral only ("01", "02", "03").<br>• The fan caption and the chapter meta read the new `name` field instead of parsing the eyebrow. | |
| 10 "self-care" in the statement | "I make *slow,* warm stories about *places,* food *&* style." It is still for client approval. | |
| 11 Widows and wraps | • `text-wrap: balance` on `.chapter__sub` and the gallery captions.<br>• "Wellness · Massage".<br>• Single-photo captions span from the frame's left edge to the column's. | |
| 12 Numbers 3.5 screens long | • The 3 screens form one horizontal snap rail: a screen plus a peek of the next.<br>• Tab pills (Home / Performance / Audience) scroll to a screen and mark the visible one with `aria-current`.<br>• Performance and Audience show their top cards and charts under a soft fade, with a "Show the full screen" toggle (`aria-expanded`). No data changed.<br>• proof.js arms the 3 screens together when the rail approaches, so a screen off to the side plays its drop-in when it is swiped in. | • `#numbers` is 1,409 px tall at 390 (it was 2,960), or 1,662 px with one screen expanded.<br>• No horizontal page scroll: the rail is `position: relative`, so the screens' absolutely positioned layers stay inside it. |

### 7.3 Should: motion and tech

| # | What changed | Verified |
|---|---|---|
| M16 Lockup gone before the photo moves | The copy wipe, the scrim fade and the char rise now run 0.12 → 0.45 H with `power1.inOut`. The copy lifts 8% (it lifted 20%). | Frames at 0.1–0.5 H: the name clips away between 0.2 and 0.35 H while the photo shrinks. |
| M17 Count-ups waiting at 0 | • proof.js `countFrom()` sets `data-count-from` to 65% of each value (the stats and the brand count) before `initMotion`.<br>• The 3 stats share one `data-motion-scope`.<br>• **Not done for the Instagram screens.** Their counts are generated inside the frozen `insights.js`, so they still start at 0. The fix there is one line: emit `data-count-from`. | |
| M18 Desktop card is a face crop | • On landscape stages the end scale comes from the card width (the cover is ≈ 1.9 card widths).<br>• An x shift puts the eye midpoint on the card's centre line (`cardImageEnd`, function-based, re-read on refresh).<br>• Portrait stages keep .92. | 1440 × 900 at 1.0 H: `scale(0.396)`, eyes centred 36% down the card. |
| M19 Clip-path repaint | The scrub drives a 0..1 proxy. Each frame interpolates rest → card, quantizes the 12 values to 0.5 px, and writes `--hero-clip` only when the string changes. | `--hero-clip` is still a 12-value px `inset()` (item 20a). Not re-measured on real hardware. |
| M20 Ken Burns on every poster | The pass runs only on the chapter feature cards and the focused fan card. `will-change` is set only while it runs. | Item 45 re-run at the Food feature. |
| T23 Header across the photo edge | See design 5. | |
| T24 Header fade at boot | • The markup ships no `data-nav`. With `@media (scripting: enabled)` the bar starts clear with Vanilla ink.<br>• ui.js applies the first theme under `.hdr--boot` (no transition), removed 2 frames after the first theme callback.<br>• Without JS the bar keeps its frosted look. | • Cold load at 1.6 Mbps / 150 ms: the header's colour and background never change, from first paint to `data-nav=dark`.<br>• Item 11 (no JS): frosted Vanilla bar, Mahogany ink. |
| T25 Adobe Fonts on Pages | • `wrap-site.sh` preconnects `use.typekit.net` and `p.typekit.net`.<br>• **Open:** `font-display: swap` must be set in the Adobe Fonts web project (the client's account).<br>• The EB Garamond preload stays in the fragment, which must stay byte-identical. | |
| T26 Wide fallback snapping narrow | • `.t-sans` and `.t-statement` fall back to a system condensed face before Helvetica Neue / Arial: "Avenir Next Condensed" (iOS, macOS), `sans-serif-condensed` (Android) or "Arial Narrow".<br>• The line heights are unitless, so the swap does not move the layout. | Not verifiable here: the test machine has none of these fonts. |
| T27 Boot waterfall | • `site.html` adds `modulepreload` for all 12 modules and `preload as="fetch"` for the 3 JSON files.<br>• hero.js binds its scrub in `boot()`, before the fonts wait. | All 12 modules and 3 JSON files are requested at 28–30 ms, with no duplicate JSON fetch. |
| T28 Menu dialog | • `aria-modal` is removed.<br>• While the menu is open, the skip link, the wordmark, the Contact pill, main and the footer are `inert`.<br>• The header's menu button (the close control) stays reachable. | Tab cycles Content → … → @lorena_maruch → Close → Content. Esc closes the menu and lifts `inert`. |
| T29 Fan keyboard focus | • Roving tabindex: only the focused card's hit is a tab stop.<br>• Keyboard focus follows the carousel focus. | The arrow keys move focus to the new centre card, and Enter then toggles its sound (no jump back). |
| T30 Share meta | • `wrap-site.sh` adds a canonical link, theme-color, `og:title`/`description`/`url`/`image` (with size and alt), `twitter:card`, an icon and an apple-touch-icon.<br>• New `scripts/make-social.mjs` renders, with the site fonts: `assets/img/social/og-cover.jpg` (1200 × 630, the cover beside the lockup), `apple-touch-icon.png` and `icon-32.png`.<br>• New one-URL `sitemap.xml`; the workflow already copies it. | |

### 7.4 Nice to have (all 15)

1. **Fan vs reference.**
   - Side cards have no shadow; the focus card has a light, tight one.
   - The fan no longer flashes its own "Tap for sound" pill: the caption keeps "· tap for sound". The pill still shows when an unmute is refused.
   - The fan is `fashion-01, stays-07, stays-05, stays-03*, restaurants-04, fashion-02, fashion-03`: 3 live videos, and none is a chapter feature.
2. **Hero mid-scroll.**
   - While split, the chars clip inside their own line (`.is-split`), so they never rise into the header.
   - `--hero-bg` passes through Tobacco at 0.5 H, using the two halves of the same ease.
3. **Footer.**
   - "Back to top ↑" has its space (`gap`).
   - At ≤ 380 px the wrapped WhatsApp pills sit on the right.
4. **Fan deal in view.**
   - The deal plays when the stack's centre reaches 75% of the viewport.
   - `track(…, {due})` stops the watchdog forcing it while it waits.
   - Verified: still stacked with the centre at 85%, dealt from 75%.
5. **Fan swipe feel.**
   - Once the drag passes the axis test, the cards follow the finger at 0.35 × dx.
   - A release commits ±1 with the elastic tween; under 40 px the cards spring back.
   - Verified: a −90 px drag offsets the cards by −31 px before release.
6. **Sound hint during the deal.** Gone with item 1: fan cards never flash the first-play hint.
7. **Header flicker scrolling up.** The colour fades take .15 s inside the hero track.
8. **First-paint pops.**
   - If the cover is still loading when site.js runs, it is hidden and its settle is held (`.is-loading`).
   - Once decoded it fades in (.45 s) and settles. Verified at 1.6 Mbps: the fade and settle start at 3.1 s, when the image completes.
   - Fallback faces: see T26.
9. **Background hand-offs.**
   - The hero midpoint: see item 2.
   - About scrubs Mahogany-deep → Vanilla over `top bottom → top 72%` (new `data-bg-from` and `data-bg-range` in reveals.js). The Instagram → About boundary is no longer a hard cut.
10. **iOS 15.** `overflow: hidden` comes before `clip` on `.hero__stage`, and `overflow-x: hidden` before `clip` on `.content` and `.brands`.
11. **Logo payload.**
    - The masters moved to `assets/logos/master/`.
    - `scripts/optimize-logos.sh` writes the served files with svgo 3.3.2 (`scripts/svgo.config.mjs`). It keeps the viewBox, drops the rounded dimensions, and picks the precision per file from the viewBox.
    - 1.4 MB → 332 KB raw, 525 → 105 KB gzipped. Rendered at 132 px against the masters, there is no visible change.
12. **Video bytes.**
    - `pousada-pool.mp4` is re-muxed without its audio track: 10.5 → 9.85 MB.
    - Under Save-Data, `warm()` waits for a tap.
    - A warmed, paused card that does not own sound drops its source when it is more than 2 viewports away. The warm-up IO restores it.
13. **Resize handlers.**
    - The fan and brands react to width changes only.
    - The theme observer still rebuilds on any resize.
    - `finishAll()` clears the watchdog interval.
14. **Compositor memory.**
    - Fan cards have no permanent `will-change`; GSAP promotes them while they tween.
    - The hero img drops it once the track has passed (`.hero--past`).
    - Not re-measured on a phone.
15. **Instagram fallback line.** Both numbers and the period are bound from `metrics.json` (`data-metric`, `data-metric-label`).

### 7.5 Checks (§9 core, re-run after every change)

The §9 suite from `build/qa` was copied and re-run against `index.html` and the Artifact-like page (`artifact.html`: the same wrapper without the Adobe Fonts lines).

**Test adaptations.** These cover this round's intended changes only:
- 3 chapters instead of 4.
- Rail thumbs may be named "View photo:".
- The hero shade now ends at opacity 1, because it is a gradient.
- The fan's slot after the focus is `restaurants-04`, the Stays feature is `stays-01`, and the poster-only swap taps a photo item.
- The Numbers rail is excluded from the gutter check, like the chapter rails.
- A screen not yet swiped into view, or below a cropped screen's fold, may stay armed.
- A video re-warmed above the viewport on the way back up does not count as "armed while visible".
- Ken Burns (item 45) is checked at the Food feature.
- With JS disabled, the module and JSON preloads cannot be used. Playwright reports them as `csp` and "preloaded but not used".

**Result.** The final full run (`run-all.sh`) has 187 PASS and 0 FAIL, on both pages, after the last change:
- **Items 1–3:** 158 referenced paths are relative and resolve.
  - Hosts on the Artifact page: self, cdnjs, jsdelivr.
  - Pages adds `use.typekit.net` and `p.typekit.net`.
- **Item 5:** no console errors through a full scroll-through. The only aborted requests are Chromium's usual `.mp4` range cancels.
- **Item 7:** no horizontal scroll at 320/360/375/390/414/430, in motion and reduced modes, or at 1440.
- **Items 11–12:** complete at rest.
  - No JS: the frosted header, no element under opacity 1, all images loaded.
  - Reduced motion: no Lenis, nothing armed, and the header is clear at scroll 0.
- **Items 13–14 and 42:**
  - Nothing is armed before scrolling.
  - After a wheel scroll-through and back, `data-armed` = 0 and `mo-armed` = 0 in view.
  - In the cross-origin iframe there are 59 arm records, none while visible.
- **Hero items 19–22:** 20/20 motion and 4/4 reduced checks pass in all 5 contexts. The motion-vs-static stage diff at rest is ≤ 0.021%.
- **Items 23–33d, 43, 44, 45:** all pass, including the photo swap.
- **Item 39:** 110 text elements in motion and 105 in reduced mode meet their contrast. The cover figures are in §7.2 (design 6).
- **Item 40:** CLS is 0.0000 in motion and in reduced mode.
- **Item 41 (first view, 3× DPR, excluding the CDN):** 374 KB on Pages and 347 KB on the Artifact. It was 498 / 471 KB. The saving is the removed Stays photo pair, which Chromium's native lazy-load margin used to fetch at load.

### 7.6 Publish list changes (Artifact)

- **Removed:** `assets/img/web/stays-aframe-deck-*`, `stays-ofuro-deck-*`, `stays-kitchen-above-*`, `gallery-17-*` and `gallery-02-*` (all `.webp`).
- **Added:** `assets/img/web/stays-{aframe,ofuro,golden,kitchen,loft,bath}-{card,thumb}.webp` (12 files) and `gallery-{04,20,07}-{480,800}.webp` (6 files).
- **Changed in place:** the 46 `assets/logos/*.svg` (optimized), `assets/video/stays/pousada-pool.mp4` (no audio track), `data/videos.json` and every edited CSS/JS file.
- **Not published:** `assets/logos/master/`, `assets/img/stays/*.jpg`, `scripts/`. `assets/img/social/` and `sitemap.xml` are for Pages only.

### 7.7 Still open

- The Adobe Fonts project setting `font-display: swap` (the client's account).
- The Instagram screens' count-ups start at 0 (frozen `insights.js`).
- iPhone checks for nice items 14 and M19 (layer memory, repaint cost), and for the condensed fallback faces.
- Copy for client approval:
  - the About eyebrow "Hello" and the statement;
  - the 6 photo titles;
  - the gallery captions "Fashion · White suit", "Travel · Sailing" and "Food · Long lunch".

## 8. Polish round 2 (2026-11-11)

The nine findings from the round-1 verification were applied: the regressions and partial fixes first, then the nits. Each one was re-measured with Playwright after the change. The test scripts are temporary, in `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/polish/fix2/`; `qa/` there is the §9 suite from round 1.

**Test server.** This round's suite runs on `fix2/cachesrv.py`: a small static server that sends `Cache-Control: max-age=600`, as GitHub Pages does, and answers single `Range` requests with 206 (`npx` could not be run in this session). Several spot checks (`numrail.js`, `igcount.js`, `ig.js`, `gap.js`, `tk.js`) ran against an `http-server -c-1` instance (`no-store`) that was already serving the repo on port 8637.

### 8.1 Findings

| # | Finding | What changed | Verified |
|---|---|---|---|
| 1 | Numbers rail clipped at the content column at ≥ 768 px (regression) | • `site.html`: the rail moved out of `.wrap`; the note sits in its own `.wrap` below it.<br>• `site.css`: the rail is full-bleed like the chapter rails. Its left padding and `scroll-padding` are `max(gutter, 50% − 320px)` (`--rail-start`), so the first screen still lines up with the content column. The tab pills have their own gutter.<br>• At ≥ 700 px the rail fades out over its last 120 px, like the chapter rails, so the peeking screen ends in a fade at the screen edge, not a cut.<br>• `proof.js`: on wide screens the last screens cannot reach the snap line, so a tapped tab stays current until the visitor moves the rail; scrolled by hand to the end, the last screen is current. | `numrail.js`: the rail box is 0–W at 320, 390, 430, 768, 1024 and 1440, the same as `#stays .rail`. The first screen starts at 16 / 64 / 192 / 400 px (the column edge). Each tab marks itself current at every width (at 1024 and 1440, Performance used to mark Audience). No horizontal page scroll. Screenshots `num/num-768-0.png`, `num-1440-0.png`. |
| 2 | Instagram screens counted up from 0 (partial #17) | `proof.js` `renderCountingFrom()`: `insights.js` (never edited) writes a screen's markup and arms its count-ups in one call. While `renderScreen()` runs, the placeholder's own `innerHTML` setter is shadowed: it writes the markup, then gives every `[data-count]` its `data-count-from` (65%, the stats' rule). The prototype accessor is restored in `finally`. | `igcount.js`, read while armed below the fold:<br>• profile: 1,838 / 25.5K / 2,120 / 1.2M (finals 2,828 / 39.2K / 3,262 / 1.9M);<br>• Home: 1,217,819 / 25,507 / +5,002;<br>• Performance and Audience: every count at 65%. "0" and "0.1%" have nothing to count and stay static.<br>• After play, Home ends on 1,873,567 / 39,241 / +7,696.<br>• `ig.js` (the verifier's): the profile enters at 1,838 and 25.5K, never 0. |
| 3 | Hero live only after all JSON and modules (partial #27) | • `site.js`: `EARLY_MODULES = ['hero']` boot the moment their module loads. `hero.boot()` needs no data, so the scrub no longer waits for the JSON or the other five modules. `ctx.data` and `ctx.modules` are filled in before the other modules boot.<br>• `site.html`: the module preloads follow the import graph. `motion.js` (imported by `scroll.js`, so it gates `site.js`) now comes right after `scroll.js`, then `ui`, `reveals`, `hero`, `signature`, then the rest. | `gap.js` (the verifier's), 3 runs each:<br>• 150 ms / 1.6 Mbps: `motion` → `hero--live` 21–30 ms (was 895 ms);<br>• 300 ms / 800 kbps: 26–51 ms (was 1,665 ms).<br>• `motion` itself arrives 60–130 ms earlier (1,831–1,849 ms and 3,547–3,581 ms; were 1,895–1,918 and 3,645–3,686). |
| 4 | Adobe kit `font-display:auto`; preconnect modes (partial #25) | • `wrap-site.sh`: `use.typekit.net` is preconnected with `crossorigin` (the font files are CORS fetches). `p.typekit.net` is preconnected without it (`p.css`, which the kit `@import`s, is a no-cors stylesheet). The kit CSS itself is requested on the next line, so it needs no preconnect.<br>• `font-display:auto` is handled on our side. The running-text serif stack (`--font-serif`: intro, units, accents) no longer starts with `"the-seasons"`. `site.js` `loadSeasons()` loads the two faces the page uses (italic 400, roman 400) with `document.fonts.load()`, then adds `html.has-seasons`, which puts The Seasons first. The kit's block period therefore never hides that text: LM Serif shows until then (a swap).<br>• Without JS (`@media (scripting: none)`), The Seasons leads at once. On the Artifact no face matches, so nothing changes.<br>• The lockups keep `"the-seasons"` first by design (see 5): they block on their face, at most 3 s. | `tk.js`:<br>• Pages: `has-seasons` is set; the H1 serif and `.t-intro` compute `the-seasons` first; both kit faces are `loaded`, the two 300 faces are never fetched.<br>• Artifact: no `has-seasons`, LM stacks, no typekit request.<br>• Socket reuse cannot be measured here: this sandbox's Chromium reaches external hosts through a local HTTP/1.1 proxy, where even a plain preconnect followed 1.5 s later by the request opens a new connection (`pc.js`). The modes now match the fetch modes. |
| 5 | "LORENA" snapped from 289 to 195 px when LM Sans arrived (#26, unverified on Linux) | The condensed system fallback does not exist on Linux, or on Windows without Office. The lockups and the statement now block while their face loads (at most 3 s, then the condensed fallback) and appear in their final shape (tokens `--font-sans-lockup`, `--font-serif-lockup`):<br>• `"LM Sans Lockup"` is the preloaded LM Sans file declared a second time, with `font-display:block`. Header, eyebrows and body keep the `swap` face.<br>• The EB Garamond italic face is `block` itself: its other users (accents, units) sit below the fold. | `boot.js` (the verifier's, 2 Mbps / 120 ms), frames read:<br>• Pages: at 0.32 s the header and eyebrow show and the H1 is blank; from 1.9 s "LORENA" (195 px) and "Maruch" (The Seasons) are drawn in their final faces. There is no wide frame and no serif swap.<br>• Artifact: "Maruch" (EB Garamond) appears first, then "LORENA" at its final 195 px; nothing moves.<br>• The layout box still measures 289 px while the text is invisible; nothing around it moves (centred, unitless line heights).<br>• **One download each** with `Cache-Control: max-age=600` (what Pages sends), and also with `no-store` at 150 ms / 1.6 Mbps, where the preload is still in flight when the stylesheet asks for the font (`fontreq.js`, `fontreq3.js`). Only unthrottled on a `no-store` server (the spec's `http-server -c-1`) does Chromium fetch LM Sans a second time (78 KB): the preload has finished and may not be reused. |
| 6 | About statement left "STYLE." alone on line 3 (nit) | `.about__statement{ text-wrap: balance }`. | `caps.js`: "I make *slow,* warm / stories about *places,* / food *&* style." at 320, 360, 375, 390, 414 and 430. `widows.js` (the verifier's) no longer lists it. |
| 7 | "Food · Long lunch" (`gallery/07`) showed the Food rail's salad plate (nit) | • The closing single is now `gallery/31`: "Food · Avocado & mango", a hand holding a bowl of avocado, mango, roasted vegetables and grains (alt from `inventory.json`). No video thumb or other gallery photo shows it.<br>• `make-images.py`: `GALLERY_CROP` cover-crops landscape originals to 5:6 around a centre (0.52 here), so the 800 px file is 800 × 960 and its frame never upscales. Its frame is `--ar:1/1`, so the whole bowl shows.<br>• `gallery-07-{480,800}.webp` are deleted (no longer referenced). | `food-nodup.png`: `gallery-31` beside the four Food thumbs and `gallery-22`. `gal-320.png`, `gal-390.png`. |
| 8 | At 390 the Numbers rail took the cropped Performance height (524 px), leaving ~190 px under Home (nit) | The tall screens are cropped at 118cqw, where their first section (cards and chart) ends; it was 132cqw. A 20 px fade softens the cut. "Show the full screen" straddles the cut (`margin-top: −38px`) instead of sitting 16 px below it. | `numrail.js` at 390: rail 439 px (was 524). Home 335 px vs cropped 411 px: 76 px under Home (was ~190). The chart and its date labels stay whole above the pill (`num-390-1.png`; 320 in `num-320-2.png`). |
| 9 | "Travel · Sailing" wrapped at 320 (nit) | • Under 375 px the gallery captions use letter-spacing .08em (as the Numbers tabs already do), so the 40% column (115 px at 320) fits "Portrait · Linen" (111 px), "Travel · Sailing" and "Details · Rings".<br>• Left-column captions may span the pair (the right photo starts 80 px lower), so "Fashion · Garden dress" no longer wraps at 320 or 360. | `caps.js`: every gallery caption is one line at 320, 360, 375, 390, 414 and 430. |

### 8.2 Found while verifying

- **"Show the full screen" could not be tapped in its top half (motion mode).** Straddling the cut put it over the cropped screen, which paints above it, and a CSS mask does not stop hits: `elementFromPoint` returned the screen's `.ig-page`. The pill is now `position: relative; z-index: 1` inside its figure. `hit.js`: hits at 15%, 50% and 85% of its height land on the pill, in motion and reduced modes.
- **"Show less" jumped under the header.** Collapsing a screen read to its end shrank the page above the button, so the button ended up at y = 0. `proof.js` now keeps the button where it was (it scrolls by the shift, through Lenis when it runs). `expand.js`: the button stays at y ≈ 400 after collapsing, in both modes; it was y = 0.

### 8.3 Checks (§9 core)

The full suite (`qa/run-all.sh`) ran once against this round's changes, with **182 PASS and 0 FAIL** on both pages, plus the 10 hero runs (20/20 motion and 4/4 reduced checks in all 5 contexts; motion-vs-static stage diff ≤ 0.021%). After the two fixes in §8.2 and the single italic face (finding 5), the core checks were re-run (`qa/logs/recheck2.log`: files, `test.js`, `main.js`, first view, Numbers, CLS, the 844 and 548 hero contexts and the iframe), with **103 PASS and 0 FAIL**. The results below are from that run where both exist.

- **Items 1–3, 6:** 158 referenced paths are relative and resolve; the publish list changes only by the gallery swap (§8.4). Hosts: self, cdnjs and jsdelivr on the Artifact page; Pages adds `use.typekit.net` and `p.typekit.net`. No reference-site names.
- **Item 5:** no console errors, page errors or failed requests through a full scroll-through, on both pages. The only aborted requests are Chromium's usual `.mp4` range cancels.
- **Item 7:** no horizontal scroll at 320, 360, 375, 390, 414 and 430 in motion and reduced modes (menu open and closed), nor at 768, 1024 or 1440.
- **Items 11–12 (complete at rest):** without JS, the frosted header, every section with final values, 12/12 images, the 9 gallery captions, and nothing under opacity 1; the Numbers rail is hidden as before and the note follows the stats. `@media (scripting: none)` puts The Seasons first on Pages. Reduced motion: no Lenis, nothing armed, the header clear at scroll 0.
- **Items 13–14, 42:** nothing armed before scrolling; after a wheel scroll-through and back, `data-armed` = 0 and `mo-armed` = 0; 65 arm records, none while visible. Cross-origin iframe: 59 records, none while visible, with the profile screen, 10 lockups and the footer signature armed ahead.
- **Hero items 19–22:** all pass in the five contexts (above). The hero now goes live before the data (finding 3) and nothing in its geometry changed.
- **Items 23–33d, 43, 44, 45:** all pass (fan, video rules, rails, desktop table, accessible names, moving content).
- **Item 34:** the stats end on "1.9" + "M", "39.2" + "K", "+7,696", with the `metrics.json` labels.
- **Item 38:** every button and link ≥ 44 × 44, including the straddling pill.
- **Item 39:** every text pair passes; header ink over the cover 5.6–5.8 (5th percentile).
- **Item 40:** CLS 0.0000 in motion and in reduced mode on the Pages page, including the switch to The Seasons.
- **Item 41 (first view, 3× DPR, excluding the CDN, `max-age` server):** 388 KB on Pages (was 374) and 349 KB on the Artifact (was 347). Each font file is fetched once. The 14 KB on Pages is the LM Serif roman (13 KB), which the running serif text now uses until The Seasons has loaded.

### 8.4 Publish list changes (Artifact)

- **Removed:** `assets/img/web/gallery-07-480.webp`, `gallery-07-800.webp`.
- **Added:** `assets/img/web/gallery-31-480.webp` (480 × 576), `gallery-31-800.webp` (800 × 960).
- **Changed in place:** `site.html`, `css/site.css`, `js/site.js`, `js/proof.js`. (`scripts/wrap-site.sh` and `scripts/make-images.py` also changed; they are not published.)

### 8.5 Deviations and notes

- **`font-display: block` for the lockups and the EB Garamond italic face** (spec §8.1 says `swap`): the reviewer's evidence wins. Header, eyebrows, body and the serif roman keep `swap`.
- **Own CSS** is now 55.0 KB (15.0 KB gzip). It was 53.0 KB at the start of this round. The §5 note on the size targets still applies.
- **No Adobe Fonts change is needed any more.** Running text never waits for the kit, and the lockups are meant to block on their face. Leave the project's `font-display` at its default: with `swap` there, the lockup serif line would swap from EB Garamond to The Seasons.

### 8.6 Still open

- **The Artifact host's caching headers.** If it serves the fonts with `Cache-Control: no-store` and the network is fast enough for the preload to finish before the stylesheet asks for the font, Chromium fetches LM Sans twice (78 KB more; first view stays far under budget). Check with `curl -sI <artifact>/assets/fonts/lm-sans-var-latin.woff2`. If it says `no-store`, dropping the LM Sans preload from `site.html` makes both faces share one in-flight request, at the cost of a later start. A local first-view run on the spec's `http-server -c-1` shows the same second fetch.
- **Preconnect reuse** is not measurable in this sandbox (§8.1, finding 4): check it in WebPageTest or Chrome DevTools against the Pages URL.
- **iPhone checks** from §7.7 are still open (layer memory, clip repaint cost). The block faces make the condensed-fallback check moot.
- **Copy for client approval:** the gallery caption "Food · Avocado & mango" replaces "Food · Long lunch". The rest of the §7.7 list stands.

## 9. Batch 2 (2026-11-11): new media, the CHANEL centrepiece and spotlight, copy and gallery decisions

This batch put in the client files from `docs/inbox.md` (restaurant, fashion and stays videos, and the two CHANEL photos), applied the lead's copy and gallery decisions, and fixed the two Numbers regressions from the round-2 verify. The signature swap ran in parallel in another session and is not covered here. The test scripts are temporary, in `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/batch2/b2/`:
- `qa/` is the §9 suite, adapted;
- `vid.js` checks `start`, the loop, `view`, `audio:false` and the photo swaps;
- `pill.js` checks the Numbers fixes;
- `walk.js` takes the screenshots, and `rec2.js` records the video.

### 9.1 Media and data (`data/videos.json`, `scripts/make-images.py`)

**Every Food and Fashion item is now a real file.** Each item's alt text was rewritten from frames of its footage.

| Item | File | Duration, audio | Notes |
|---|---|---|---|
| `restaurants-01` Gnocchi night with Pronto Light | `pronto-gnocchi.mp4` | 23.8 s, −14.4 LUFS | `start` 15.5 s (at the table; frame 0 is a fridge door) |
| `restaurants-02` A colorful table | `salad-table.mp4` | 24.5 s, music fading in from about −44 to −23 LUFS | kept `audio: true`: the track is music, not noise. Re-levelled in §10: −15.5 LUFS, the intro from about −19 |
| `restaurants-03` A glass of white | `wine-tasting.mp4` | 34.9 s, −16.2 LUFS | `start` 3.6 s (the first sip), and `view` [0, 0.644], see below |
| `restaurants-04` Breakfast among plants | `garden-breakfast.mp4` | 31.0 s, −14.4 LUFS | now the Food feature; `start` 2.4 s since §10 (at the table, not walking in) |
| `fashion-01` Burgundy blazer, red sneakers | `burgundy-blazer.mp4` | 30.0 s, −14.0 LUFS | |
| `fashion-02` A teal dress at golden hour | `teal-dress-deck.mp4` | 26.6 s, −15.5 LUFS | `start` 3.0 s (frame 0 is a hem and feet) |
| `fashion-03` Yellow satin by the lake | `yellow-satin-lake.mp4` | 26.2 s, **`audio: false`** | the track is digital silence (−91 dB) |
| `fashion-04` Sandals & a picnic | `picnic.mp4` | 18.8 s, **−6.9 LUFS** | `start` 10.6 s; the track was loud (see 9.7). Re-encoded: −15.7 LUFS (§10) |
| `fashion-07` At the CHANEL boutique (new) | `chanel-boutique.mp4` | 35.6 s, −15.8 LUFS | `start` 21.2 s: she holds N°5 to her cheek (frame 0 is a blurred shop interior). The fan's centre and the Fashion feature. |
| `fashion-08` Towel turban, ALVA in hand (new) | `alva-towel.mp4` | 7.3 s, −14.1 LUFS | the last item of the Fashion rail |
| `stays-08` Cushions above the forest (new) | `deck-cushions.mp4` | 22.8 s, **`audio: false`** | the track is a steady hiss at −42 LUFS (LRA 3 LU); 11th of the 12 Stays rail items |

- **Removed:** `fashion-05` and `fashion-06` (no originals): their data, posters and thumbs. Their `_ref` JPGs stay in the repo.
- **`start` (new, optional):**
  - `video.js` loads the item from `src#t=<start>`, and `make-images.py` builds its poster and thumb from that frame with ffmpeg, so the first frame on screen is the poster.
  - `loop` still wraps to 0:00: in Chromium, a seek to 0.4 s before the end continued at 0.9 s.
- **`view` (new, optional): `wine-tasting.mp4` is a screen recording of an Instagram carousel.**
  - The picture is only rows 0–823 of 1280. Below it is a white band, and the carousel's "2/2" badge and mute icon sit at its right edge.
  - `make-images.py` cuts the poster and thumb from that band.
  - `video.js` scales the `<video>` 1.5528× from its top centre (inline `transform`, set in `cardHTML` and on every `swapSource`). The band fills the card, and the badge and icon fall outside it.
  - Verified: the transform is `matrix(1.5528 …)` with origin `50% 0` after a thumb swap, and back to `none` on the next item. In the screenshot, no white shows.
- **Rails:**
  - **Stays:** 12 items, alternating video and photo; `stays-08` comes before the bath photo. (§10: 11 items; the overhead kitchen photo left the rail, `stays-08` now closes it.)
  - **Food:** an explicit rail with the feature first: `restaurants-04`, `-01`, `-02`, `-03`. It stays video-only, because the only unused real food photo (`gallery/07`) repeats the salad video.
  - **Fashion is now a mixed rail**, 10 items: `fashion-07`, gown, `-01`, zebra print, `-02`, tailoring, `-03`, boots, `-04`, `-08`.
    - The 4 photo items are real media-kit photos not used anywhere else on the page: `gallery/21`, `26`, `12` and `25`.
    - They are cover-cropped to 9:16 into `fashion-{gown,print,tailoring,boots}-{card,thumb}.webp`.
- **Features:** Stays `stays-01` (unchanged), Food `restaurants-04` (was `-03`), Fashion `fashion-07`. The client asked for CHANEL in Fashion as well, so it is both a feature and the fan's centre card.

### 9.2 The fan (client: CHANEL in the centre)

- **The fan:** `fashion-01` burgundy blazer · `restaurants-02` salad table · `stays-03` bath with a view · **`fashion-07` CHANEL (index 3, z-index 10, scale 1, upright)** · `restaurants-03` glass of white · `stays-05` inside the A-frame · `fashion-02` teal dress.
- **All 7 cards are real videos with sound.**
- **Composition:**
  - The categories alternate: Fashion, Food, Stays, *CHANEL*, Food, Stays, Fashion.
  - Each side has one warm and one cool colour: burgundy and the teal-walled salad, then the green dome on the left; red, white and blue at the wine, the orange A-frame and the teal dress on the right.
- **The static caption in `site.html`** (shown before JS runs) now reads "Fashion / At the CHANEL boutique / More fashion ↓" (`#fashion`).
- **Sound now always follows a swipe**, because no poster-only fan card is left (6.4). The fan test was adapted:
  - a swipe and the prev button pass the sound on;
  - the sound button releases it;
  - card 0's label is "Sound for Burgundy blazer, red sneakers".

### 9.3 CHANEL spotlight

- **Placement:** the end of the Fashion chapter, after its rail (`<section class="spotlight">` in `site.html`; static layout in the `site.css` content block). The rail drives the feature card, so the spotlight comes after it rather than between them. It is the last thing in the content section before Numbers.
- **The head:** eyebrow "Spotlight" (line highlight), lockup "CHANEL / *Chance & N°5*" (h4, oval reveal), and the caption "Two portraits at the boutique."
  - The lockup follows the type rules: the sans line is 6 caps characters and the serif line is sentence case.
  - Nothing is invented: the two products are the ones in the photos, and the N°5 photo shows the boutique.
- **The pair:**
  - Chance is 70% wide at 4:5. N°5 is 58% wide at 2:3 and overlaps Chance's lower right by 28% of the column (`margin-top: -28%`), cut out by a 6 px Vanilla ring.
  - Each frame has the curtain with the Sand wash (the second staggered by 0.12 s; trigger `.spotlight__pair`) and the inner parallax, as in the gallery pairs.
  - From 672 px the pair is capped at 520 px and centred.
  - Alt texts describe each photo. The page never says "hair mist": the Chance bottle's label reads "PARFUM CHEVEUX / HAIR MIST", not Eau Vive as the inbox note had it.
- **Loading:** the two `<img>`s use `data-src`/`data-srcset`, filled by `video.js`'s lookahead 1.5 viewports ahead, with a `<noscript>` copy.
  - With native `loading="lazy"`, Chromium fetched both photos at first view (+100 KB). Before `site.js` renders the chapters the page is short, so the pair sits inside the lazy-load margin.
  - Without JS, the `data-src` copies are `display: none` and the `<noscript>` copies fill the frames.
- **WebP:** `chanel-chance-{480,800}` and `chanel-n5-boutique-{480,800}` (`PHOTOS` in `make-images.py`).
- **Motion, recorded at 390 × 844:**
  - the Fashion card deals in and the CHANEL film starts on the N°5 frame;
  - the "Tap for sound" hint flashes once;
  - then the eyebrow highlight and the oval lockup play, and the two Sand curtains open, the overlapping frame 0.12 s later;
  - the parallax drifts as the pair passes.
  - Checked at 320 (reduced), 390 (motion and no JS) and 1440 (screenshots `shots/m390-_spotlight*.png`, `r320-*`, `nojs-*`, `d1440-*`).

### 9.4 Gallery and copy (lead's decisions)

- **Gallery:**
  - "Beauty · Chanel" (`gallery/02`, the hair-mist product) was already replaced by "Travel · Sailing" in polish round 1 (§7.1). No CHANEL product photo was left in the gallery, so there was nothing to swap.
  - "Wellness · Massage" (`gallery/09`) is replaced by **"Stays · Kitchen view"**, the client's `dsc02726`: barefoot in a white beanie, cropped tee and wide trousers at a marble island in a glass-walled kitchen, with hills beyond.
    - New web master `assets/img/stays/kitchen-view.jpg`: sRGB, 1600 × 2400, q86.
    - New derivatives `stays-kitchen-view-{480,800}.webp`.
    - The 3 × (pair + single) rhythm stays.
  - The gallery categories now read Portrait, Details, Food / Fashion, Travel, Stays / Fashion, Portrait, Food.
  - `gallery-09-*.webp` is deleted, and `09` is out of `GALLERY`. `dsc01104` (the couple on the deck) was not used: it is already the Stays rail's "Golden hour on the deck".
- **Instagram intro:**
  - Before: "Eight years of sponsored content, *one point of view.*"
  - After: "**39.2K** followers, *one point of view.*"
  - The number is bound to `profile.stats[1].value` (`data-metric` plus its `.u` unit), so it follows `metrics.json`.
- **About bio:**
  - Before: "Film graduate. Eight years creating sponsored content on Instagram, and creative direction for national and international brands in fashion, beauty, food and fitness."
  - After: "Film graduate. Eight years of sponsored content on Instagram, from stays to food and fashion, and creative direction for national and international brands."
  - The niches qualify the sponsored content (media-kit pages 4–6). `content.json` only lists fashion, beauty, food and fitness for the creative direction, so no niche is claimed for it.
- **The page has no "serum", "hair mist", "hair care", "self-care" or "skin" in any text, `alt` or `aria-label`**, including the new alts. The CHANEL film's alt says "the red N°1 bottle".

### 9.5 Numbers regressions

| # | Finding | Fix | Verified (`pill.js`) |
|---|---|---|---|
| i | At 320–340 px, "Show the full screen" covered the chart's date labels: the pill sat 1–2 px over them, and only 1–3 px clear at 360–390 | The chart labels end 7.3cqw above the 118cqw cut. The pill's fixed −38 px became `margin-top: calc(-8px - 6cqw)`, so it still straddles the cut and keeps a gap at every width | Gap from the labels to the pill: **12 px** at 320/330/340, 13 at 360–414, 14 at 430 and ≥ 700. Screenshot `num/pills.png`: "Oct 10 · Oct 24 · Nov 8" whole above the pill. |
| ii | At ≥ 700 px the 120 px right-edge fade hid part of the last screen when the rail was scrolled to its end | The mask is sized `100% + 120px` and sits at −120 px. `proof.js` sets `.is-end` when nothing remains to the right (or the rail cannot scroll; it also re-checks on resize), and the mask then slides to 0 so the fade leaves the box (.45 s) | 700/768/1024/1440: mask at −120 px at the start, and `is-end` with the mask at 0 px at the end of the rail. Screenshot `num/num-768-end.png`: Audience whole. |

### 9.6 Checks (§9 core)

The suite ran once in full: 187 PASS. The 11 FAILs were 10 hero signature checks and the old Ken Burns test (both below).
After the spotlight lookahead change it ran again without the hero part (`run-b2.sh`): 182 PASS and 1 FAIL, the no-JS image count, which needed a test adaptation. With that adaptation `main.js` runs **59/59**.

- **Test adaptations, all for this batch's intended changes:**
  - the fan's centre is `fashion-07`, and the slot after it is `restaurants-03`;
  - sound follows every swipe (no poster-only fan card);
  - the moving-sound test's fan owner is `fashion-07`;
  - item 45's Ken Burns pass is checked on a photo item swapped into the Fashion feature: every feature is now a real video;
  - the no-JS image count skips `display:none` images (the spotlight's JS-only copies).
- **Items 1–3, 6:** 183 referenced paths are relative and resolve. The hosts are unchanged.
- **Item 5:** no console errors through full scroll-throughs, on both pages. The only aborted requests are Chromium's usual `.mp4` range cancels.
- **Item 7:** no horizontal scroll at 320, 360, 375, 390, 414 and 430, in motion and reduced modes, with the menu open and closed, nor at 1440.
- **Items 11–12:** complete at rest without JS (14/14 visible images, including the spotlight's `<noscript>` pair; 9 gallery captions) and in reduced motion (spotlight screenshot at 320).
- **Items 13–14, 42:** nothing armed before scrolling, and none of 75 arm records armed while visible. In the cross-origin iframe, 63 records, none while visible.
- **Items 23–33d, 43–45:** all pass:
  - the fan, sound inheritance, thumb swaps and the pause button;
  - reduced motion plays only on a tap;
  - `stays-08` and `fashion-03` play muted with no sound button;
  - a photo swap hides sound and pause;
  - rails 12/4/10 with one current thumb each.
- **Item 39:** 116 (motion) and 111 (reduced) text elements meet their ratio.
- **Item 40:** CLS 0.0000 in motion and in reduced mode.
- **Item 41, first view (3× DPR, excluding the CDN):** 394 KB on Pages and 355 KB on the Artifact. It was 388 / 349 KB. Before the lookahead change it measured 494 / 454 KB.
- **Hero items 19–22:**
  - All reduced-motion checks pass.
  - In motion, the run showed two FAILs per context: "21 inked 50% ± 10% at 0.85H" read 85%, and "back at 0: sig undrawn" read 0.71. They were the test, not the page: it summed every `path` in the signature (the outline and the guards too), while the real signature is a masked outline in which only the two `.pen` paths are drawn. **Resolved (§10):** with a pen-based measure (visible pens only; no mask attached = complete) both checks passed in every context, 47.7% at 0.85 H and 0 back at 0, before the range change in §10; the current targets and results are in §10.3.

### 9.7 Still open

- ~~**`picnic.mp4` is loud:** −6.9 LUFS.~~ **Fixed** (§10.1, finding 4): re-encoded through `scripts/encode-video.sh`'s `loudnorm=I=-16:TP=-1.5` pass; it measures −15.7 LUFS, true peak −7.1 dBFS.
- **`wine-tasting.mp4`:** a re-encode cropped to the picture (`crop=464:824:128:0,scale=720:1280`) would let `view` go, and would sharpen the card: it is now a 1.55× upscale of a 720 px-wide screen recording.
- **The Artifact publish is about 115 MB:** the "videos in a second call" plan cannot work, because the 16 MP4s alone are over the 64 MB per-publish limit. The corrected three-call plan is in §10.4.
- **Copy for client approval:**
  - the Instagram intro and the About bio (9.4);
  - the spotlight's eyebrow, lockup and caption;
  - the new titles (`restaurants-02`, `fashion-01/02/04/07/08`, `stays-08`, and the 4 Fashion photos);
  - the gallery caption "Stays · Kitchen view".
- ~~**The hero test's signature checks**~~ updated for the real signature (§10.3).

### 9.8 Publish list changes (Artifact)

- **Removed:**
  - `assets/img/web/gallery-09-{480,800}.webp`;
  - `assets/video/posters/fashion-0{5,6}.webp` and `assets/video/thumbs/fashion-0{5,6}.webp`.
- **Added, images:**
  - `assets/img/web/chanel-chance-{480,800}.webp`, `chanel-n5-boutique-{480,800}.webp`, `stays-kitchen-view-{480,800}.webp`;
  - `fashion-{gown,print,tailoring,boots}-{card,thumb}.webp`;
  - `assets/video/posters/` and `thumbs/` `fashion-07`, `fashion-08`, `stays-08` (`.webp`).
- **Added, video:**
  - `assets/video/restaurants/` `pronto-gnocchi`, `salad-table`, `wine-tasting`, `garden-breakfast`;
  - `assets/video/fashion/` `chanel-boutique`, `burgundy-blazer`, `teal-dress-deck`, `yellow-satin-lake`, `picnic`, `alva-towel`;
  - `assets/video/stays/deck-cushions` (all `.mp4`).
- **Changed in place:**
  - images: `assets/video/posters/` and `thumbs/` `restaurants-01…04` and `fashion-01…04`, now cut from the real footage;
  - code and data: `data/videos.json`, `site.html`, `css/site.css`, `js/video.js`, `js/proof.js`.
  - `scripts/make-images.py` changed too, but it is not published.
- **Not published:** the masters `assets/img/fashion/*.jpg` and `assets/img/stays/kitchen-view.jpg`, and the first-frame `.jpg`s next to the MP4s.

## 10. Batch 2 fixes round 1 (2026-11-12)

All 18 findings from the batch-2 design/motion and tech reviews were applied: the shoulds first, then the nice-to-haves. Each was verified with Playwright (Chromium, `devices['iPhone 13']` at 390 × 844 unless noted), and the motion ones from recorded scroll videos read frame by frame. The test scripts are temporary, in `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/batch2/fix1/`: `qa/` is the §9 suite (adaptations in §10.3), `fanhold.js` and `rec-fan.js` check the fan, `hero-stills.js` and `touchhero.js` the hero signature, `spot.js` and `degtest.js` the spotlight, `rmplace.js` the mid-session reduced-motion view.

### 10.1 Findings

| # | Finding | What changed | Verified |
|---|---|---|---|
| 1 | **Fan: the CHANEL film's best shot was used up before the deck opened** (should). The focus card played from the moment the fan was 35% visible; the deal plays at the stack's centre 75%. The N°5 shot (21.03–22.37 s, 1.3 s long) ran while the stack was still rising half off screen. | `fan.js`: when the entrance is armed, the focus card is made ineligible (`setEligible(card, false, {warm:true})`): it warms up but waits on its poster, which is its `start` frame (N°5 against her cheek). A `call(unhold)` at the entrance's `spread` label (0.9 s in, when the side cards spring out) makes it eligible again, so the film starts from 21.2 s exactly as the deck opens. A tap on the card while the deck waits completes the entrance first (as a swipe already did), so the first tap still gives sound. The watchdog's force, `finishAll()` and `finish()` release the card too. | `fanhold.js`: waiting with the stack's centre at 88%: paused at 21.20, poster `fashion-07.webp`; 0.4 s after the trigger still held (the stack rising); at rest playing from 21.2 (23.18 after about 2.2 s). Tap while waiting: dealt, playing, unmuted, `has-sound`. `rec-fan.js`: the `play` event now comes 3,101 ms into the slow scroll (was 1,683 ms). Frames (`rec/fan390/sheet.png`): the N°5 poster on the rising stack, the N°5 shot playing while the cards spread, then the film moves on (jars) at rest. |
| 2 | **Food feature opened on a rear view** (should) | `data/videos.json`: `restaurants-04` gets `start: 2.4` (the cut to the table is at 2.33 s). `python3 -I scripts/make-images.py` rebuilt its poster and thumb from that frame. | The poster and thumb show her eating at the plant-filled table, juice and croquettes in front (`media/r04.png`). The item plays from `garden-breakfast.mp4#t=2.4`. |
| 3 | **The finished hero signature had almost no hold** (should): complete only from 1.15 H, the stage leaves at 1.2 H. | `hero.js`: the signature scrub is now **0.55 → 1.0 H** (was 1.15), still linear with `scrub: .5` and the Lando snap. It completes with the card and the handle, so all three hold through 1.0 → 1.2 H (169 px at 844), as spec §4.1 intends. The start stays at 0.55 H, where the shade is already ≈ .44 and the image ≈ 60% scaled. | `hero-stills.js`, inked at 0.5 / 0.6 / 0.7 / 0.8 / 0.9 / 1.0 / 1.1 / 1.2 H: 0 / .115 / .349 / .535 / .769 / 1 / 1 / 1 at 390 × 844 (664, 548 and 1440 × 900 the same). Touch (`touchhero.js`, CDP touch swipes of 278 px = 0.33 H): after the 2nd swipe 25%, after the 3rd (0.99 H) 97%, then complete on the hold; frames `rec/touch/sheet.png` show the full LM with the card and handle before the 4th swipe takes the stage away. Hero test targets updated (§10.3). |
| 4 | **`picnic.mp4` 8–10 LU louder than the rest** (should) | It had already been re-encoded through `scripts/encode-video.sh`, whose pass now normalises with `loudnorm=I=-16:TP=-1.5:LRA=11`. Confirmed final. `start` 10.6 s kept. | −15.7 LUFS integrated, true peak −7.1 dBFS, 18.8 s, 720 × 1280, AAC 48 kHz. Its H.264 stream is identical (md5) to a fresh `encode-video.sh` run on the source (`_source/drive-5/f-9.mp4`), and so is the first-frame JPG, so the poster and thumb (rebuilt from 10.6 s) show the same frame. |
| 5 | **Hero signature straddled the card's lower edge on short and wide stages** (nice) | `hero.js` `heroSigPlace()` (was `heroSigTop()`): besides the chin line, the signature's baseline (82% of its box: the feet of the L and the M; only the M's lower loop hangs below) stays ≥ 10 px inside the card's bottom edge. Where the card is too short for that, it narrows (`--sig-w`, read by `css/hero.css`), down to 44svh; below that it rises over the chin. | Width at 1.0 H: 844: 359 px (unchanged); 664: 301 (was 332); 548: 241 (the 44svh floor, was 274; the floor binds, so its top follows the baseline rule and sits slightly above the chin rule; baseline 10 px inside the card); 320 × 568: 250; 360 × 640: 290; 430 × 932: 396 (unchanged); 768 × 1024: 483 (was 512); 1440 × 900: 450, unchanged (its baseline was already 11 px inside). Screens `hs/`: on every stage the L's baseline and the M's feet sit on the card; the M's lower loop crosses the edge like a descender. At 548 and 664 the first strokes (0.55–0.7 H) still pass over the jaw while the image is scaling; that is the same mechanism as before, with a smaller signature. |
| 6 | **Stack covered the fan caption** (nice) | `fan.js`: the caption block (`.fan__caption`) starts at opacity 0 in the entrance's from-state and fades in (0.4 s, `power1.out`) at the `spread` label. It is part of the tracked entrance timeline, so the watchdog and `finishAll()` force it to 1, and the gsap context revert drops the inline style. | Opacity 0 while the stack waits, 1 after the deal (`fanhold.js`). Frames: no "At t…que" behind the stack. |
| 7 | **The CHANEL spotlight read as a footnote** (nice) | `site.html` + `css/site.css`: the lockup is at `--fs-h2` (the `--sm` modifier is gone), the block has 120 px above it (was 88), and a 48 px Tobacco hairline sits over the "Spotlight" eyebrow. The pair is unchanged. | `spot.js`: lockup 45 px at 390, 38 px at 320, 80 px at 1440; each line stays one line at 320 (Pages and Artifact, motion and reduced). Screens `shots/spot-*.png`. |
| 8 | **"N°5" read as "N5" in The Seasons** (nice) | The lockup's sign is `N<span class="deg">°</span>5`, and `.has-seasons .spotlight .deg{ margin-left: .12em }`. The finding's .06em still left the N's swash over the degree sign; .12em clears it at 1× and 3×. EB Garamond (the Artifact) is untouched. | `degtest.js` at DPR 1 and 3 (`shots/deg-cmp1.png`, `deg-cmp3.png`), and `glyph.js`: The Seasons on Pages, EB Garamond on the Artifact. |
| 9 | **The gallery's "Stays · Kitchen view" duplicated the rail's "The kitchen, from above"** (nice): same shoot, outfit, beanie and marble island. | The overhead kitchen photo (`stays-p-kitchen`, `dsc02755`) left the Stays rail; the gallery single stays. The rail is now 11 items and still alternates, starting and ending with a video. The item and its derivatives stay in the repo: adding its id back to the `rail` list restores it. | Rails 11 / 4 / 10, one current thumb each (§10.3). Each scene from that shoot now appears once: the ofurô deck in the rail, the kitchen in the gallery. |
| 10 | **`salad-table.mp4` faded in from about −44 LUFS** (nice) | A `start` could not help: the fade runs the whole clip (still −27 at 20 s). `scripts/encode-video.sh` gained a `LUFS` override for its `loudnorm` target, and the file was re-encoded from the source (`_source/drive-4/food-2.mp4`) with `LUFS=-19`: single-pass `loudnorm` flattens the fade into a gentle swell and lands about 3.5 LU above its target. | −15.5 LUFS integrated (was −27.5); short-term −19 at 2 s rising to −13.4 at 24 s (was −45 → −23); true peak −0.6 dBFS after AAC. Its H.264 stream is bit-identical to the old one (md5) and the first-frame JPG is identical, so its poster and thumb did not change. |
| 11 | **The "videos in a second call" publish plan cannot work** (should) | The plan and figures are corrected in §10.4 and §9.7. | Sizes measured from the publish list. |
| 12 | **iPhone/WebKit-only risk in new code paths** (should) | The four device checks (hero mask scrub and frame rate, the CHANEL card's start frame and loop, the wine card's `view`, a cold load over cellular) and the iOS 15.4 floor are listed in §5, item 4, with a place for the results. | Not run: there is no device here, and Playwright's WebKit is not installed. |
| 13 | **Docs drift after the signature swap** (nice) | §10.2 records the swap. §4 deviation 4 and §7.2 item 3 are corrected; the §9.6 FAIL note is replaced; picnic is marked fixed (§9.1, §9.7). `docs/build-foundation.md` §7 and §9 now describe the kit (no `make-signature.mjs`, no 9 paths or 2855 × 991 viewBox, the 2.2 s linear footer). The footer target is restated for the kit's timing (§10.2). | |
| 14 | **16 unreferenced files in the publish list** (nice) | The list-building check (`qa/files.js`) now follows what the page can reach: an enabled category's rail and feature, and the fan's picks from enabled categories. The skincare posters and thumbs (12), `stays-02` and `stays-04` (4), and now `stays-kitchen-{card,thumb}.webp` (2) leave the publish; they all stay in the repo. | 165 files plus `site.html`, every one requested or referenced and served with 200. |
| 15 | **Dead code in `signature.js`** (nice) | `penPoint()` and the controller's `lengths` and `length` are removed; the export comment says the site draws no pen tip and points to the kit README and `lab/signature.html`, which keep the full recipe. | No caller anywhere in `js/`; the hero and footer checks pass. |
| 16 | **The spotlight added a region landmark** (nice) | It is a `<div class="spotlight wrap">` now; its h4 is unchanged under the Fashion h3. | `probe2.js`: the labelled sections are top, instagram, about, content, numbers, brands and gallery; Chromium's AX tree lists banner, main, contentinfo and those 7 regions, and no CHANEL region. Item 44: 19 heading names, the h4 named "CHANEL Chance & N°5". |
| 17 | **Mid-session reduced motion jumped the view** (nice, pre-existing) | `scroll.js` `finishAll()` now keeps the view on the same content. Before anything changes it picks an anchor; after the static layout is in place (and `site:static` has run) it restores it with an instant `window.scrollTo` (Lenis is gone by then). In the hero track (the sticky stage holds the viewport's centre line) the view lands where the stage's own scroll-away had got to: the top while the card held. Elsewhere the deepest section block crossing the centre line keeps its offset. This covers the hero's 220svh → 100svh collapse and the brands marquee turning into its taller grid. A hero-only fix was not enough: the static logo grid is 674 px taller than the marquee (`#brands` 727 → 1,401 px at 390), which also sits above the footer. | `rmplace.js`, reduced motion turned on: footer signature mid-draw at 70% of the viewport: its top stays at 591 px (before the fix the view landed on the contact rows and legal line); hero at 0.7 H → scroll 0, the whole static cover; hero at 1.7 H → the Instagram section stays at 422 px; Instagram at 100 px stays at 100; gallery at −300 stays at −300. No console errors. Screenshot `shots/rm-footer.png`: the complete signature in view. |
| 18 | **Own code over the §8.1 targets** (nice) | Accepted in writing, with the re-measured numbers (§5, item 1). | 134.1 KB JS (41.5 KB gzip as one stream), 57.3 KB CSS (15.9 KB). |

### 10.2 The signature swap (record)

Lorena's real signature replaced the EMS Allure placeholder in a parallel session during batch 2 (`docs/inbox.md`, "Signature"). This is its record.

- **The kit** (`assets/signature/lorena-signature.svg`, details in its README): her "LM" from `_source/drive-3/assinatura-lorena.svg` (an Illustrator outline), cropped to a viewBox of 1056 × 598. The artwork is one filled outline, `.ink`, coloured by `currentColor`. A `<mask>` holds two hand-traced pen centre lines in writing order (`.pen`: the L, 1,407.5 units; the M, 2,230.7; 18.5 units wide), static black guards between them, and 34 timed `.pen-guard` slices at self-crossings.
- **Two inline copies** in `site.html` (`.sig--hero`, `.sig--footer`), each with its own mask id. The `.ink` has no `mask` attribute in the markup, so without JS, in reduced motion and after a draw, the signature is the untouched artwork.
- **The mask recipe** (`js/signature.js`): `render(p)` dashes each pen to `p` at constant pen speed (a pen's share of the timeline is its length, plus a 4.5% pen lift between the L and the M). A pen that has not started is `visibility: hidden` (no round-cap dot). Each timed guard shows while its pen has drawn less than its `data-release`. The mask is attached while `p < 1` and removed at 1, so the final frame is the exact artwork. Only the pens are dashed; `vector-effect` stays `none`. There is no pen tip.
- **Hero:** scrubbed **0.55 → 1.0 H** since this round (it was 0.55 → 1.15 H, as spec §4.1), `scrub: .5`, the Lando snap on a fast exit. Vanilla ink, `width: min(92%, 560px, 50svh)` unless `--sig-w` narrows it. Placement (`heroSigPlace`, formerly `heroSigTop`): its top 16 px above the cover's chin line (.54 of its height) mapped through the card-end transform, so the strokes start beside and under her chin, and since this round its baseline is kept on the card (§10.1, finding 5).
- **Shade:** the bottom-weighted Mahogany-deep gradient fades in from 0.4 H over 0.6 H with **`power1.out`** (it was `power1.in`), so it is ≈ .44 when the pen starts and the L's hairlines read on the cream robe while they are written.
- **Footer:** `playSignature()` plays **2.2 s, linear** (the kit's timing: constant pen speed), armed on approach and played at `top 80%`. Spec §7.3 asked for 1.8 s `power1.inOut`; the swap changed it to the kit's linear timing, so the footer writes at the same constant pen speed as the hero, and this was recorded only in the integrator's message until now. **Item 21's footer target, restated for this timing:** the timeline's midpoint is 1.1 s, where 47.7% is inked (target 50% ± 15%). At 0.9 s the pen is in the L → M lift (38.7% inked), which the old "0.9 s" target only passed by 4 points.
- **Removed:** the placeholder artwork, `scripts/make-signature.mjs`, the optional pen tip and, this round, `penPoint()`. `assets/fonts/LICENSES.md` already says the signature is her own artwork.

### 10.3 Checks (§9 core)

The full suite (`fix1/qa/run-all.sh`, the batch-2 suite with the adaptations below) ran once after the last code change: **182 PASS and 1 FAIL**. The FAIL was the cross-origin iframe's "autoplay muted" check: it scrolls through at about 2,000 px/s and never stops, and the fan's focus card now waits for the deal's spread (finding 1), so it was off screen before it could start. Adapted to stop once at the fan, like a reader, it passes: the fan card and a feature play muted, at most 1 at a time.

- **Test adaptations, all for this round's intended changes:**
  - **Hero item 21** measures ink by the pens (visible `.pen` paths only; no mask attached = complete), as the real signature needs. Targets: the first pen undrawn at 0.55 H; **50% ± 10% at 0.775 H**, the midpoint of the new range; **complete with the mask detached at 1.0 H**; still complete at 1.15 H (the hold); 0 back at 0.
  - **Footer item 21** (`proof/sig.js`) measures by the pens too, and is read at the timeline's midpoint, 1.1 s (§10.2).
  - **Publish list** (`files.js`): only the media the page can reach (finding 14).
  - **Iframe autoplay:** the scroll-through stops at the fan once (above).
  - The rails are 11 / 4 / 10.
- **Items 1–3, 6:** 165 referenced paths plus `site.html`, all relative, all resolving with 200. Hosts unchanged: self, cdnjs and jsdelivr on the Artifact page; Pages adds `use.typekit.net` and `p.typekit.net`.
- **Item 5:** no console errors, page errors or failed requests through a full wheel scroll-through, on both pages.
- **Item 7:** no horizontal scroll at 320, 360, 375, 390, 414 and 430, in motion and reduced modes, with the menu open and closed, nor at 1440.
- **Items 11–12 (complete at rest):** without JS, 14/14 images, nothing under opacity 1, the 3 chapters, the stats and the 9 gallery captions; the spotlight renders as its `<div>`. Reduced motion: no Lenis, nothing armed, the header clear at scroll 0.
- **Items 13–14, 42:** nothing armed before scrolling; 75 arm records, none while visible; after a wheel scroll-through and back, `data-armed` = 0 and `mo-armed` = 0, and nothing under opacity 1. The fan's caption is part of the tracked entrance. Cross-origin iframe, 844 and 700 tall: 63 arm records, none while visible, including the profile screen, 11 lockups and the footer signature.
- **Hero items 19–22:** 21/21 motion checks and 4/4 reduced checks in all five contexts (844, 664, 548, iframe 700, iframe 844). Inked at 0.775 H: 47.8% (844) and 48.0% (548). Motion vs reduced stage at rest: ≤ 0.021% of pixels differ.
- **Items 23–33d, 43–45:** all pass: the fan geometry and carousel, sound inheritance, the centre card playing muted at rest, thumb swaps, the pause button, reduced-motion taps, the blocked states, the desktop table and hover-to-hear, the Ken Burns pass and the rails (one current thumb each). Mid-session reduced motion during the entrance leaves no inline transform and nothing armed.
- **Item 21 footer:** 39.0% inked at 918 ms, 46.2% at 1,071 ms, 54.1% at 1,224 ms: about 47.7% at 1.1 s.
- **Items 34, 34a, 35, 36, 38:** the stats end on the `metrics.json` strings; one h1, one h2 per section, one h3 per chapter (the spotlight's h4 sits under Fashion's); 46 logos with correct alts, 92/92 loaded, the marquee pause and direction; the copy buttons; every target ≥ 44 × 44.
- **Item 39:** 117 (motion) and 112 (reduced) text elements meet their ratio; over the cover at scroll 0, eyebrow 4.79, "LORENA" 4.68, "Maruch" 3.19 (large), header 5.66–5.75; the header ink against its backing passes in every mode.
- **Item 40:** CLS 0.0000 in motion and in reduced mode.
- **Item 41, first view (3× DPR, text gzipped):** 396 KB on Pages and 356 KB on the Artifact excluding the CDN (450 / 411 KB with it); 0 MP4 and 0 poster requests. It was 394 / 355 KB.
- **Spot checks for this round** (§10.1): `fanhold.js`, `rec-fan.js` (with frames), `hero-stills.js` at 8 stage sizes, `touchhero.js` (with frames), `spot.js`, `degtest.js`, `glyph.js`, `rmplace.js` and `probe2.js`. None logged a console error.

### 10.4 Publish list and plan (Artifact)

**The list:** 165 files plus `site.html`, 166 files and **114.9 MB** (109.6 MiB) in total.
- Everything except the video (page, CSS, JS, JSON, fonts, images, logos): 150 files, 3.43 MB.
- The 16 MP4s: 111.45 MB. Stays 6 files, 42.04 MB; restaurants 4 files, 30.93 MB; fashion 6 files, 38.48 MB.
- The largest file is `garden-breakfast.mp4`, 11.12 MB; no file is over the 15 MB limit.

**The video alone is over the 64 MB per-publish limit**, so the "videos in a second call" plan from §9.7 cannot work. Publish to the same URL in **three calls, back to back**:
1. `site.html`, every non-video file and `assets/video/stays/*.mp4`: 156 files, **45.5 MB**.
2. `assets/video/restaurants/*.mp4`: 4 files, **30.9 MB**.
3. `assets/video/fashion/*.mp4`: 6 files, **38.5 MB**.

The version then holds 166 files and 114.9 MB, inside the 511-file and 256 MB limits. Between the calls the page already points at MP4s that are not there yet (the Food and Fashion cards would show only their posters), so run them one after the other. A two-call split also fits but leaves little room: call 1 = the non-video files, the Stays MP4s, `teal-dress-deck.mp4` and `alva-towel.mp4` (158 files, 53.4 MB); call 2 = the Food MP4s and the other four Fashion MP4s (8 files, 61.5 MB, 2.5 MB under the limit).

**Changes this round:**
- **Left out (not referenced; they stay in the repo):** `assets/video/posters/` and `thumbs/` `skincare-01…06` and `stays-02`, `stays-04` (16 files), and `assets/img/web/stays-kitchen-{card,thumb}.webp` (finding 9). Re-enabling care, or putting the kitchen photo back in the rail, means adding its files to the publish again.
- **Changed in place:** `assets/video/posters/restaurants-04.webp` and `thumbs/restaurants-04.webp`; `assets/video/restaurants/salad-table.mp4` (audio only); `assets/video/fashion/picnic.mp4` (re-encoded before this round); `site.html`, `css/site.css`, `css/hero.css`, `js/fan.js`, `js/hero.js`, `js/signature.js`, `js/scroll.js`, `data/videos.json`.
- `scripts/encode-video.sh` changed too (the `LUFS` override); it is not published.

### 10.5 Still open

- **iPhone checks** (§5, item 4): the hero's mask scrub and frame rate, the CHANEL card's start frame and loop, the wine card's `view`, a cold load over cellular. No device here.
- **The CHANEL fan card waits for the deal.** A visitor who scrolls past the fan without stopping sees its N°5 poster only; the film starts 0.9 s after the deal begins. That is the intended trade (finding 1); `unhold` at the start of the entrance instead of its `spread` label would start it 0.9 s earlier.
- **Desktop:** at 1440 × 900 the signature's baseline is only just inside the card (11 px) and the M's loop hangs well below; the spotlight pair stays 520 px wide. Both are for the desktop pass.
- **`wine-tasting.mp4`** re-encode cropped to the picture (§9.7) is still open.
- **Copy and choices for client approval:** the §9.7 list, plus the bigger spotlight head and the overhead kitchen photo leaving the Stays rail (one line in `data/videos.json` puts it back).
