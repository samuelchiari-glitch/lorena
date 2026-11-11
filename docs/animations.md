# Animated Instagram screens

The Instagram screenshots are rebuilt as live HTML/CSS. Each one still looks like a phone screenshot floating on the page, but its numbers count up, its charts draw in and its bars grow when it scrolls into view. Everything renders from one data file.

| File | What it is |
| --- | --- |
| `data/metrics.json` | The single source of truth for every number, label and chart series. |
| `css/insights.css` | Screen styles. Self-contained, scoped under `.ig-shot`, with no global rules. |
| `js/insights.js` | Renders the screens from the JSON into placeholders and builds the SVG charts. |
| `js/motion.js` | A small motion engine driven by data-attributes. It works on any page element, not only these screens. |
| `lab/insights.html` | Demo page showing all four screens on Vanilla `#F1EADA`, in mobile and desktop layouts. |

There is no build step and there are no dependencies. Serve the repo over HTTP, because `fetch()` of the JSON does not work from `file://`.

## 1. Drop a screen into a page

```html
<link rel="stylesheet" href="css/insights.css">

<div data-ig-screen="profile"></div>      <!-- A: profile header -->
<div data-ig-screen="summary"></div>      <!-- B: Home tab, Summary -->
<div data-ig-screen="performance"></div>  <!-- C: Performance tab -->
<div data-ig-screen="audience"></div>     <!-- D: Audience tab -->

<script type="module" src="js/insights.js"></script>
```

When `insights.js` is imported, it renders every `[data-ig-screen]` on the page. It finds `data/metrics.json` and the avatar relative to its own file, so it works from any page depth. Rendering is idempotent, and a rendered element gets `data-ig-rendered`.

Options you can set on the placeholder:

| Attribute | Effect |
| --- | --- |
| `data-ig-tilt` | Gentle 3D tilt that follows the pointer, plus a soft glare. Desktop only: it is ignored on touch, on `pointer: coarse` and under reduced motion. |
| `data-ig-flash` | A brief white flash as the card lands, like taking a screenshot. Opt-in, and best used on one screen at most. |
| `data-ig-static` | No motion at all: final values and no entrance. Use it for print, OG images or thumbnails. |
| `data-ig-device="390"` | Lay the screen out for a 390pt iPhone. The default is 430pt (see §5). |
| `data-ig-src="…/other.json"` | Render from a different metrics file. |
| `data-ig-label="…"` | Custom accessible name. The default is generated, e.g. "Instagram dashboard, Home tab: summary for the last 30 days". |

For content inserted later (for example a modal or a tab), call:

```js
import { renderInsights } from './js/insights.js';
await renderInsights({ root: someElement }); // renders the placeholders inside it
```

### Sizing

- The screen fills its parent's width up to `--ig-shot-width`, which defaults to `430px` (1:1 with the phone). Set the width from the page grid, for example `.my-slot .ig-shot { --ig-shot-width: 360px }` or just a narrower parent.
- Everything inside is sized in iPhone points relative to the card width. The card is a CSS size container, and `--u = 100cqw / 430`. The screen therefore scales as one piece and keeps the screenshot's exact proportions at any width, with crisp vector text and SVG at every size. There is no horizontal page scroll down to 320px.
- Design-system tokens the card reads (fallbacks in parentheses):
  - `--shadow-shot` (a six-layer warm shadow: a hairline ring plus contact, near and ambient layers tinted `rgb(64 44 22)`, tuned for `#F1EADA`)
  - `--radius-shot` (`26px`)

## 2. Update the numbers

Edit `data/metrics.json` only. Every screen reads from it, so a number changed once updates everywhere it appears. For example, `kpis.views` feeds both the Summary and the Performance screens.

- Text values are display strings, written exactly as Instagram shows them: `"1,873,567"`, `"+7,696"`, `"44.0%"`, `"39.2K"`, `"1.5M"`. The count-up reads the format from the string itself: prefix, thousands separators, decimals and suffix. Keep en-US formatting.
- `kpis.*`: stat cards (`label`, `value`, `delta`). The delta is rendered as `delta + " " + period.deltaSuffix` ("+955.0% vs. Oct 9"). `delta: null` hides it.
- `profile`: header, stats, bio lines (`mention` is shown in link blue), pills and the "Your dashboard" card.
- `charts.viewsDaily` / `charts.followersDaily`: 30 daily values (Oct 10 → Nov 8).
  - `yMin`/`yMax` set the vertical scale. Instagram puts the top gridline at the period maximum.
  - `yTicks`/`xTicks` are the axis labels exactly as printed.
- `contentTypes.rows[].segments`: `[followers%, nonFollowers%]` of the full track. The track represents total views.
- `audience.gender.rows[].percent`: bar length, on a 0–100% track.
- `audience.age.rows[].segments`: `[women%, men%]`, on a 0–100% track.
- Rows with `value: null` are not rendered. Fill in 45-54 / 55-64 / 65+ when the client sends them, and they appear automatically.
- `screens.*`: which cards each screen shows and which one is selected (black outline).
  - `scrollTo` sets where the Performance card rail rests, as in the print: `{ "card": "viewers", "x": 46 }` puts the Viewers card 46pt from the left edge, or use `"end"`.
  - `smallLabels` draws long card labels in the smaller size Instagram uses for them.
- `statusBar`: clock per screen, network, signal bars, battery and charging.
- Anything with `verify: true` still needs the client's confirmation (see §6).

## 3. `motion.js` API

`motion.js` is generic: use it on any element of the site.

```js
import { initMotion, replay, finish, onEnter } from './js/motion.js';
initMotion(document); // register everything with data-attributes (safe to call again)
```

### Effects (attributes)

| Attribute | Effect |
| --- | --- |
| `data-reveal` / `="up"` / `="fade"` / `="scale"` | Fade in. `up` also rises 14px, and `scale` also settles from 0.96. |
| `data-count` | Count up to the element's own text, e.g. `1,873,567`, `+7,696`, `44.0%`, `39.2K`, `1.5M`. Uses easeOutExpo over 1.6s. The final string is in the HTML, so no-JS, SEO and screen readers always get the real number. |
| `data-draw` | SVG path: draw the stroke via `stroke-dashoffset` (1.5s, ease-in-out). |
| `data-draw-fill` | SVG area under a line: fades in behind the drawing line. |
| `data-grow` / `="y"` | Bar grows from 0 using `scale`. The origin is left or bottom. |
| `data-shot` / `="flash"` | "Screenshot drop-in" entrance for a card (see §4), with an optional white flash. |
| `data-tilt` / `="glare"` | Pointer tilt on desktop, max 5°. Change it with `data-tilt-max="deg"`. |

### Modifiers

| Attribute | Effect |
| --- | --- |
| `data-delay="ms"` | Start later. |
| `data-duration="ms"` | Override the default duration. |
| `data-stagger="ms"` | On a parent: its animated children of the same kind start one after another, in DOM order. |
| `data-motion-scope` | On a parent: all its descendants start together when the parent enters the viewport. Without it, each element waits for itself. The scope receives a `motion:enter` event (`detail.delay`) each time it plays. |
| `data-motion-repeat` | On a trigger: replay every time it re-enters, instead of once. |
| `data-count-from="n"` | Count from a value other than 0. |
| `data-count-align="end"` | Right-align the counting digits. Use it for right-aligned numbers. |
| `data-count-to="…"` | Count to this string instead of the element's text. |

### Functions

| Function | What it does |
| --- | --- |
| `initMotion(root)` | Registers and arms elements, then starts IntersectionObservers. Re-entrant. |
| `replay(root)` | Resets everything under `root` and plays it again as it is (re-)seen. The lab's "Replay" button uses it. |
| `finish(root)` | Jumps to final state. |
| `onEnter(el, cb)` | Calls `cb` every time a scope or shot plays. Returns an unsubscribe function. |
| `parseFormat(str)` | The count-up formatter, exposed for reuse. |
| `prefersReducedMotion()` | Reports whether the user prefers reduced motion. |

### Guarantees

- **No layout shift while counting.** Each counter holds an invisible "ghost" copy of the final string in the same grid cell, so its box is the final width from frame one. Digits use `font-variant-numeric: tabular-nums`. A visually-hidden copy carries the real value for screen readers.
- **60fps.**
  - Only `opacity`, `translate`/`scale` (compositor), `stroke-dashoffset` and one text write per counter per frame are animated, through a single shared rAF ticker.
  - Nothing reads layout during animation, and there are no permanent `will-change`s.
  - All animations use WAAPI with `fill: backwards`, so finished elements return to plain CSS.
- **Once per element** by default, and safe to `initMotion` the same tree twice.
- **`prefers-reduced-motion: reduce`.** Nothing is armed or hidden and nothing moves: the final values are already in the markup. Turning the setting on mid-session settles everything.
- Elements stay visible in print, and when IntersectionObserver is missing they play immediately.

## 4. How the "screenshot" effect works

1. **The card** (`.ig-shot__card`) is white, clipped to `--radius-shot`, and floats on `--shadow-shot`.
   - The fallback shadow is six layers: a 1px hairline ring that keeps the white edge crisp on Vanilla, then 1px, 2px, 6px, 14px and 32px drops in a warm brown at low alpha.
   - An inset 1px hairline (`::after`) keeps the edge crisp on any background.
2. **The content is the real Instagram screen,** not an image.
   - It has the iOS status bar and nav bar, and tabs with the active underline.
   - White 12pt-radius sections sit on the `#EFF2F5` page with 8pt gaps.
   - Stat cards, SVG charts and bars are drawn in iPhone points.
   - Colours were sampled from the page-08 crops:

     | Element | Colour |
     | --- | --- |
     | Text | `#0B1014` |
     | Secondary text | `#666F79` |
     | Cards | `#EFF2F5` |
     | Gridlines | `#E6EAEE` |
     | Delta green | `#0A8937` |
     | Chart line | `#E705CB` |
     | Bars (women / followers) | `#D301C5` |
     | Bars (men / non-followers) | `#8F0185` |
   - Text uses `-apple-system, "SF Pro Text", …`, so Apple devices render the real SF font.
3. **The drop-in.** When a card enters the viewport it fades and lifts 34px, overshoots to 1.006 and settles at 1, in 1s on an expo-out curve, so it lands like a screenshot thumbnail. With `="flash"`, a white layer pulses to 85% for 0.5s at the moment of landing.
4. **Content waits for the card.** Count-ups, line draws and bar growth inside a card are held until the card has landed (380ms lead). Lower sections of tall screens trigger separately as they scroll into view.
5. **The swipe.** On the Performance screen, the card rail starts on the selected "Views" card and then glides to the scrolled position of the client's print. Viewers, Views from followers and Views from non-followers count up as they arrive. Visitors can still swipe the rail themselves.

## 5. Fidelity notes

- **Device width.** The page-08 crops come from a 430pt-wide iPhone (Pro Max or Plus): the Canva frames hold the full 2.168:1 screen image, and status bar plus nav measure 103.8pt (59 + 44). The spacing also snaps to whole points at that scale: 16pt margins, 12pt gaps, 12pt radii, 8pt bars and a 4pt chart line. The fresh screenshots almost certainly come from the same phone, so the default layout is 430pt and proportions match the prints 1:1. `data-ig-device="390"` gives a 390pt layout.
- **Calibration.** Text baselines, card geometry, chart gridlines, bar positions and the line series were overlaid on the page-08 crops at the same scale. They align within about 1pt. The remaining difference is font: SF renders on Apple devices, and Inter or Roboto stand in elsewhere and run slightly wider.
- **Daily series.** The followers series is digitised from the higher-resolution page-08 crop (31,545 → 39,241). The views series is the lead's digitisation. Both are flagged `approximate`.
- **Delta truncation.** English deltas ("+955.0% vs. Oct 9") are shorter than the Portuguese ones, so they fit without "…". Long card labels still truncate with an ellipsis when they don't fit.

## 6. Values flagged `verify: true`

| Field | Issue |
| --- | --- |
| `kpis.viewers.delta` | Not legible in the fresh print, so it is hidden. The older page-08 crop of the same period shows **+2,665.2%**. It is stored as `deltaFromReference` and is not rendered. |
| `kpis.follows` | The third Audience card is cut off in the print. The label "Follows" is a guess; the value is +8,919. |
| `profile.threadsBadge` | The badge reads "9…"; "9+" is a guess. |
| `audience.age` 13-17 | The women/men split is not legible. It is drawn as a minimal tick (0.1%). |
| `audience.age` 45-54, 55-64, 65+ | Missing. They are `null` and not rendered, and the Age section is drawn cut at the bottom edge. |
| `statusBar.signalBars` | Not transcribed. Shown as full. |
| `contentTypes.rows[].segments`, `charts.*.values` | Measured from prints, so approximate. |

Not built: the Home tab's "Tools" grid. Its contents (icons and labels) aren't in the transcription and would have to be invented. It can be added once we have a screenshot.
