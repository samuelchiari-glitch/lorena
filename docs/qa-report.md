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
| 3 Signature over the cream robe | `.hero__shade` is now a bottom-weighted Mahogany-deep gradient: .12 down to 46% of the stage, .58–.62 from 64%. It fades in from 0.4 H (`power1.in`). The eye line keeps the old .12 veil. | Frames at 390 and 1440, 1.0–1.2 H: the whole "Lorena" reads on the darkened lower card, and the eyes stay clear. |
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
