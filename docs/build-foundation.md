# Build foundation: conventions for the section builders

The foundation is in place: `site.html` holds every section's markup, and the page renders **complete at rest** at 390 × 844 in all three modes (no JS, reduced motion, motion). Lenis smooth scroll and the generic reveals already run. This file covers what you need to build on top of it. `docs/build-spec.md` (revision 2) remains the source of truth.

## 1. Who edits what

| Owner | JS | CSS | Markup (`site.html` markers) |
|---|---|---|---|
| foundation (treat as frozen, see §9) | `site.js`, `scroll.js`, `reveals.js`, `ui.js` | `site.css`: tokens, base, type, components, blocks `chrome`, `about`, `contact` | `chrome`, `about`, `contact` |
| **hero** | `hero.js`, `signature.js` | `css/hero.css`, `site.css` block `hero` | `hero` |
| **content** | `fan.js`, `video.js` | `css/content.css`, `site.css` block `content` | `content` |
| **proof** | `brands.js`, `proof.js` | `css/proof.css`, `site.css` blocks `instagram`, `numbers`, `brands`, `gallery` | `instagram`, `numbers`, `brands`, `gallery` |

- **Markup.** Each section sits between `<!-- section:NAME -->` and `<!-- /section:NAME -->`. Edit only inside your own markers.
- **`site.css`.** Each section's static layout sits between `/* === section: NAME === */` and `/* === /section: NAME === */`. Edit only your own blocks. Put new rules in your own file (`hero.css`, `content.css` or `proof.css`, all loaded after `site.css`).
- **New tokens.** Do not add tokens to `:root`. Scope them to your section, for example `.fan{--u:…}`.
- **Never edit:** `js/motion.js`, `js/insights.js`, `css/insights.css` (reused, not forked), and `data/metrics.json`, `data/brands.json`, `data/content.json` (read-only).
- **`data/videos.json`** is new and follows spec §6.6: 22 items, 3 with `src`, `alt` taken from `inventory.json`. The content builder may adjust it.
- **CSS budget.** `site.css` is 34.7 KB, and the spec budget is ≤ 40 KB of own CSS. Keep the three section files small.

## 2. Modes and the module contract

| Mode | `<html>` classes | When |
|---|---|---|
| no JS | none | CSS defaults: the static, final layout |
| static | `js` (+ `is-ready`) | reduced motion, or a CDN library missing; native scroll, nothing armed |
| motion | `js motion lenis` (+ `is-ready`) | reduced motion off and `gsap`, `ScrollTrigger`, `SplitText`, `Lenis` all present |

`site.js` loads the section modules with `import()`, in this order: `hero`, `signature`, `fan`, `video`, `brands`, `proof`. Every call is wrapped in try/catch, so a broken module (even one with a syntax error) only logs. Each module may export:

```js
export function boot(ctx)   // every JS mode, right after load: render from data, bind listeners. NEVER hide anything.
export function ready(ctx)  // every JS mode, after all boot()s and fonts (or 1.5 s): set up motion only if ctx.motion.
export function finish()    // finishAll(): jump to the final state, drop your inline styles/classes.
// ctx = { motion, reduced, data:{ videos, brands, metrics }, fontsReady, modules }
```

- **Boot order:** mode → `initScroll()` (motion) → `ui.boot()` → data and modules load in parallel (`hero.boot()` runs the moment `hero.js` loads: it needs no data, so the cover's scrub is live before the JSON arrives) → every other `boot()` → fonts (and, on Pages, The Seasons) → `ScrollTrigger.refresh()` → `reveals.ready()` → `ui.ready()` → every `ready()` → footer signature armed → `refresh()`.
- **Mode can drop to static mid-session** (`finishAll()` runs on `beforeprint`, when reduced motion turns on, and when boot throws). Always re-check `isMotion()` inside callbacks. Listen for `document`'s `site:static` event if you keep state, such as autoplay.

## 3. `js/scroll.js` helpers (import them; do not re-implement)

| Helper | Use |
|---|---|
| `isMotion()` | `html.motion` is present now |
| `getLenis()` | the Lenis instance, or `null`; it is also on `window.lenis` |
| `makeIO(cb, opts)` | IntersectionObserver with `root: document` (falls back to the implicit root). **Use it for every observer that has a `rootMargin`** (warm-up, eager-load, Ken Burns or icon replays). In the Artifact iframe the implicit root ignores `rootMargin`. |
| `onApproach(el, arm, {ahead=.75, onSkip})` | calls `arm(el)` once, when `el` is within `ahead` viewports below the fold. Guard: if `el.top < innerHeight` it **does not arm** (calls `onSkip`). Returns a cancel function. |
| `armReveal(el, build, {start='top 85%', trigger, ahead, onSkip})` | the standard reveal. `build(el)` runs inside `scope()` and returns a **paused** GSAP timeline already in its from-state, or `{ tl, cleanup }`. The helper sets `data-armed`, plays the timeline from a `once` ScrollTrigger at `start`, then runs `cleanup()` and removes `data-armed` on complete. The watchdog forces the final state if an element sits visible for 1.2 s without playing. |
| `track(el, tl, cleanup, {due})` / `markPlayed(el)` / `release(el)` | for arming you do yourself (e.g. the fan entrance with its own trigger). You must `release(el)` when it has played. `due(rect, innerHeight)` (optional) says when the element should have played; the watchdog only counts from then (the fan plays at `center 75%`). |
| `scope(fn)` | **create every tween, ScrollTrigger and SplitText inside it.** `finishAll()` reverts them all to CSS. Arming callbacks that run later must call `scope()` again. |
| `onFinish(fn)` | an extra cleanup step for `finishAll()` |
| `refresh()` | debounced `ScrollTrigger.refresh()`; call it after you change layout |
| `finishAll()` | do not call it yourself unless you are handling a fatal error |

Lenis is configured exactly as in spec §5 (`anchors:false`, `syncTouch` off on iOS, `?synctouch=1` forces it on). One gsap ticker drives everything. Never use ScrollTrigger `pin`; the hero uses CSS sticky.

## 4. `js/reveals.js`: data attributes (motion only, armed on approach)

| Attribute | Effect |
|---|---|
| `data-oval` | `.t-lockup` oval line reveal at `top 90%`. Sets `aria-label` on the heading and `aria-hidden` on its lines while split; on complete it unsplits and removes both. |
| `data-highlight[="sand"]` | line highlight (Tobacco block by default) at `top 85%`. Used on eyebrows, the statement and the stat labels. |
| `data-curtain` (+ `data-curtain-delay=".12"`) | image curtain + wash. The wash is `var(--wash)`: Sand on light, Tobacco inside `.on-dark`. Plays at `top 85%`. |
| `data-reveal-trigger="<selector>"` | any reveal: use `el.closest(selector)` as the trigger. Used for the gallery pairs. |
| `data-parallax` | the frame's direct child `<img>` moves `y 0 → -48`, scrubbed. In motion mode the img is 48px taller. |
| `data-deal="0..3"` | dealt card scrub (y 110, scale .94, rotation from the table), `top 100% → top 55%`, `scrub .5`. Already set on each chapter feature card. |
| `data-rise="24"` (+ `data-rise-start`) | the element's children rise once (stagger .06). Used on the rails (`top 92%`) and the contact rows (`16`, `top 90%`). |
| `data-bg-scrub="#E6DECB"` (+ `data-bg-from`, `data-bg-range="start\|end"`) | section background: computed colour (or `data-bg-from`) → this colour, `top 60% → bottom bottom` by default (gallery). About uses `#4D342D → #F1EADA` over `top bottom → top 72%`: the hand-off from the dark Instagram block. |

- Markup you insert **after** `ready()` needs `reveals.scan(rootEl)` (it is idempotent).
- Also exported: `splitLockup(h)`, which applies the aria rules and returns `{chars, revert}`; it is meant for the hero h1. Also `buildOval`, `buildHighlight`, `buildCurtain`.
- Clip-path rule: every clip-path tween is a `fromTo` with identical string structure. `inset()` strings with radii use `boxToInset()` (12 px values) from `hero.js`.

## 5. `js/ui.js` and the chrome

- **Exports:** `scrollToTarget('#id' | el | 0, {focus})`, `toast(msg)`, `openMenu()`, `closeMenu()`, `isMenuOpen()`.
- **In-page links.** Every `a[href^="#"]` goes through one delegated router. Do not bind your own anchor scrolling. Lenis `scrollTo` uses no offset (it subtracts `scroll-margin-top` itself). `main [id], footer[id]` have `scroll-margin-top: var(--anchor-offset)`.
- **Header theme.** It comes from a 1px IO band at the bar's midline over every `[data-theme]` element; the last one in document order wins. A section only needs `data-theme="light|dark"`. The hero's `.hero__dark-zone` (`data-theme="dark"`) is `display:none` until **hero.css** shows it with `.motion .hero__dark-zone{display:block}`. The IO picks it up automatically.
- **Header backing.** It is cleared while `scrollY < .hero[data-clear-until]` (motion: hero.js sets it where the shrinking photo's edge reaches the header controls, ≈ 0.17 H; `.35 × stage` is the fallback) or `< 1` (static). In motion it hides on scroll down and shows on scroll up. Inside the hero track its colour fades are .15 s (`.hdr--quick`), and the first theme applies with no transition (`.hdr--boot`). With JS the bar starts clear with Vanilla ink (`@media (scripting: enabled)`), so no-JS keeps the frosted bar.
- **Copy buttons.** `[data-copy="value"]` inside `.contact__line`, next to `.contact__value`.
- **Scroll indicator.** Created by `ui.ready()` in motion mode (`.scrollbar`).

## 6. CSS conventions

- **Tokens.** Use the spec §2 tokens only. `.on-dark` flips the role tokens (`--bg --ink --ink-strong --muted --line --wash`), so primitives read correctly on dark. On dark, eyebrows use `--muted-on-dark` (Sand), and the serif line may use `--accent-on-dark` (≥ 24px only).
  - Surface sections set `--muted: var(--ink)`, because Moss fails on Surface. The brands and gallery sections do this already.
- **Z-index.**
  - Page level: `--z-card-max 10` (top fan card), `--z-header 50` (also the scroll bar), `--z-menu 60`, `--z-toast 70`. The open-menu header is `61` and the skip link is `71`.
  - Inside a card: media 0 < `.fan__hit` 1 < `.vcard__sound`/`.vcard__pause` 2 < the curtain wash 5.
  - Do not create new page-level layers.
- **Fonts.** Lockup lines and the statement use `--font-sans-lockup` / `--font-serif-lockup`, which block while their face loads (at most 3 s), so a headline never paints in a wide fallback and then snaps: `"LM Sans Lockup"` is the preloaded LM Sans file declared again with `font-display: block`, and the EB Garamond italic face is `block` itself (the running italics sit below the fold). Header, eyebrows and body keep the `swap` LM Sans. The Seasons (Pages only) leads the lockup serif stack, and the running-text stack once `site.js` has loaded its faces (`html.has-seasons`).
- **Static first.** The CSS default is the final layout. Pre-animation states live only under `.motion …` or are set by JS just before use, and only on armed elements.
  - Never put `overflow:hidden` on an ancestor of `.hero`; `html, body` use `overflow-x: clip`.
  - Full-bleed bands clip themselves (`.content` and `.brands` have `overflow-x: clip`).
- **`[hidden]{display:none!important}`** is global. Use the `hidden` attribute for JS-only controls and unhide them in `boot()`. The fan controls and the brands pause button ship `hidden`.
- **No-JS.** `html:not(.js)` hides the empty IG screen boxes and collapses the fan box. `html.js` is added first thing in `site.js`.
- **Frosted surfaces.** Every `backdrop-filter` is preceded by the `-webkit-` version.
- **Animated properties.** Animate only transform, opacity, clip-path and stroke-dashoffset, plus the gallery background and the hero `--hero-bg`. `will-change` goes only on the hero photo while the hero track is in play (`.hero--past` drops it) and on a Ken Burns poster while it runs; GSAP promotes fan cards only while they tween.

## 7. Per-section starting points

- **Hero.**
  - The static CSS from spec §4.1 is in the `hero` block, verbatim.
  - The signature SVGs (`.sig--hero`, `.sig--footer`) are inline copies of Lorena's real signature kit, `assets/signature/lorena-signature.svg` (viewBox 1056 × 598): a filled outline (`.ink`) revealed through a `<mask>` in which two pen centre lines (`.pen`, the L then the M) are dashed, plus black `.pen-guard` patches at the crossings. Each copy has its own mask id (`lm-sig-mask-hero`, `lm-sig-mask-footer`), and its `.ink` carries no `mask` attribute in the markup, so it is the plain artwork without JS. `assets/signature/README.md` has the recipe. (The placeholder EMS Allure signature and `scripts/make-signature.mjs` are gone.)
  - `hero.js` already has `restGeometry`, `cardGeometry` and `boxToInset`.
  - `signature.js` has `signatureTimeline()` (constant pen speed, a 4.5% pen lift between the letters) and `playSignature(svg,{paused})`. `site.js` uses `playSignature` to arm the footer (`top 80%`, 2.2 s linear, the kit's timing); keep that export's signature. The hero draws 0.55 → 1.0 H, `scrub: .5` (qa-report §10).
  - Your motion CSS (220svh, sticky, sig/handle/dark-zone display) goes in `hero.css`.
- **Content.**
  - `video.js` `boot()` renders the chapter bodies of the enabled categories (`[data-chapter-body]`; Skin & hair care is `disabled` in the data, and an enabled category without markup gets a shell rendered from the data): a feature card with `data-deal`, a caption, and a rail with `data-rise`. It also calls `register()` on every `[data-vcard]`. `cardHTML(item, {fan, index, feature, deal})` is the shared markup from §6.1. It renders no `src` or `poster` on `<video>`, and the poster `<img>` is lazy.
  - `fan.js` renders the 7 cards and places them through `--x --y --rot --s --z`. It also does an **instant** focus change (buttons, ← →, tap), updating the caption, counter, "More …" link, `.fan__hit` labels and the sound hint. Replace that with the GSAP carousel. Note that GSAP's inline `transform` overrides the CSS slot transform. `--u` is 12.78px at 390 (compute it as `clamp(8.9, 2.7778vw, 13.33) × 1.18`).
  - The API stubs (`register`, `toggleSound`, `setEligible`, `swapSource`) are no-ops.
  - Sound and pause buttons and the hint are `display:none` in `site.css` until you style them in `content.css`.
  - The fan icons are 3 stacked SVGs (`.fan__icon`: stays, food, fashion); only the first one is visible.
- **Proof.**
  - `insights.js` renders all four screens statically when it is imported.
  - `proof.js` already binds `[data-metric]`, `[data-metric-label]` and `[data-period]` from `metrics.json`. In motion mode it upgrades each screen on approach (`renderScreen`, `data-ig-flash` on the profile) and runs `initMotion()` on `.stats` on approach.
  - `brands.js` renders the 3 rows × 2 lists with the alt and aria rules. The CSS default is the wrapping grid (also the reduced-motion layout). Add `.brands--marquee` for the moving rows in `proof.css`, and unhide `.brands__pause`.
  - The gallery is static HTML with `data-curtain`, `data-parallax` and `data-bg-scrub`, already animated by `reveals.js`.

## 8. How to test

- **Build and serve:** `bash scripts/wrap-site.sh`, then `python3 -m http.server <8100–8999> --directory /home/user/lorena`. For anything that plays video, serve with `npx --yes http-server@14.1.1 . -p <port> -c-1` instead (it answers Range requests). Kill your server when you are done.
- **Images:** `python3 -I scripts/make-images.py` rebuilds `assets/img/web/*`, `assets/video/posters/*` and `assets/video/thumbs/*` from `data/videos.json`. Use `--force` to rebuild everything.
- **Reusable Playwright scripts.** Run them with `node`; they live in `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/build/foundation/`. Copy them into your own scratch folder before changing them.

| Script | Usage | What it does |
|---|---|---|
| `shoot.js` | `<url> <motion\|reduced\|nojs> <w> <h> <out.png> [scrollThrough=1]` | full-page screenshot at deviceScaleFactor 1; logs console/page/HTTP errors and horizontal scroll |
| `split.py` | `<png> <prefix> [1700]` | tiles a tall screenshot, three columns per image, for the Read tool |
| `probe.js` | `<url> <mode> "<js expression>"` | evaluates one expression after load |
| `seq.js` | `<url> <selector> <offset> <prefix>` | scrolls so the selector's top sits at `offset × innerHeight`, then screenshots at 0.3 / 0.7 / 1.1 / 1.6 / 2.6 s (reveal frames) |
| `test.js` | `<base>` | no h-scroll at 320–430 (motion and reduced), lockup lines not wrapping, the arming probe before and after a wheel scroll-through (nothing armed while visible, `data-armed`/`.mo-armed` back to 0, every element at opacity 1, no `aria-label` on span/p/div), desktop wheel glide (item 16), menu, Esc and router landing at 72 ± 8 |
| `iframe.js` | `<hostUrl> <frameBase>` | cross-origin iframe arming check (item 42). Serve `host/` on another port, then pass `http://localhost:<hostPort>/host.html?src=http://127.0.0.1:<port>/index.html&h=844`. |
| `modes.js` | `<url>` | first-view bytes, header hide and show, reduced motion turned on mid-reveal (finishAll leaves no inline states) |

- **Current results:** every check above passes with no console errors. The cross-origin iframe arms 60 elements, none while visible, including the IG profile screen, 11 lockups and the footer signature.

## 9. Notes and choices where the spec was silent

- **`js/proof.js`** is new; the spec names no module for the IG screen upgrade or the Numbers binding. Its owner is the proof builder.
- **Chapter renderer.** It lives in `video.js` (`renderChapters`); the spec names no file for it.
- **Signature.** At the foundation stage `scripts/make-signature.mjs` drew a placeholder so the footer was complete at rest. Lorena's real signature kit has since replaced it (qa-report §10.2); the script is deleted. The hero builder owns its draw.
- **Oval reveal.** The clip sits on the line span itself, and an inner `.rv-line` moves inside it, instead of a wrapper div. This keeps the `--offset` and flex layout intact. The inner span is unwrapped on complete.
- **Line highlight.**
  - Each SplitText line's content is wrapped in an inline-block `.rv-hl`, so the block hugs centred text.
  - The clip uses `inset(-12px … -12px …)` vertically, so descenders and accents are not cut. `mask:'lines'` is not used, because the mask would clip the serif swashes.
  - `autoSplit` and `onSplit` are kept; an outer timeline drives each re-split by progress.
- **Brands without JS.** No logos render, because the rows come from JSON.
- **Menu.** While it is open, the header bar sits above it (`.is-menu-open`, z 61); its button is the close control.
  - The menu footer reuses the hero eyebrow line and an Instagram link.
- **About eyebrow.** The eyebrow reads "About" above the "ABOUT / *Lorena*" lockup, as the spec says. It is visibly redundant; consider a different eyebrow if the client agrees.
- **First view (Chromium).** It fetches the 8 nearest posters, because of Chromium's own lazy-load margin (≈ 300 KB). In total it is ≈ 940 KB uncompressed, or ≈ 670 KB transferred with text gzipped (images 427 KB, fonts 121 KB, libraries ≈ 55 KB, own HTML/CSS/JS/JSON 70 KB). The content builder should watch the 700 KB budget.
- **Not done here:** the `lab/type.html` comparison panel (open question 14). It belongs to no section, so whoever finishes first should take it.
