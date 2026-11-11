# Build spec: lorenamaruch.com, mobile v1

The single document the builder follows to build the **mobile** site (iPhone, 390 × 844 first). Wider screens must not break, but desktop polish comes later.

Read with it (they hold the measurements this spec cites by section number):
- `docs/effects-lando.md`: reference motion system, exact tables and eases ("Lando §n").
- `docs/effects-conectaa.md`: vertical video behaviour and the video module sketch ("Conectaa §n").
- `docs/typography.md` + `lab/type.html`: fonts, type tokens and the lockup CSS ("Type §n").
- `docs/animations.md`: the Instagram screens (`js/insights.js`, `js/motion.js`, `css/insights.css`).

Rules for the builder: re-implement effects in our own code. Never copy the reference's JS, Rive files, images, signature or the Brier font. Do not run git.

This is **revision 2** (2026-11-11). §11 lists what changed from revision 1 and why.

> **CLIENT FEEDBACK, 2026-11-11 (overrides everything below):**
> 1. **No arch.** Remove the hero arch and the `.about__arch`. The hero works like the Lando reference. At scroll 0 the cover photo is full-bleed, filling the whole first screen. On scroll it shrinks into a centred rounded-rectangle card (corner radius ≈ 28–36 px), the background turns dark, and the signature draws.
> 2. **Hero image** = the client's cover photo `_source/drive-2/foto-de-capa.jpg`, delivered as `assets/img/cover.jpg`. `scripts/make-images.py` builds the `hero-*.webp` files from it.
> 3. **Fonts:** the real Lorena serif "The Seasons" ships via Adobe Fonts kit `juy5uwr` on GitHub Pages only. The link is injected by `scripts/wrap-site.sh`, never put in `site.html`, because the Artifact CSP blocks use.typekit.net. Serif stacks start with `"the-seasons"`, then the LM stand-ins.
> 4. More client files (photos, 2 more stays videos) are listed in `docs/inbox.md`. They are integrated after this build. **Done 2026-11-11:** the About photo (§4.3) is now `portrait-wood-hands.jpg`; gallery rows `08`, `14` and `29` (§4.7) were replaced by client originals; the Stays chapter gained a photo pair under its rail; `stays-01` and the new `stays-07` play real video. `docs/inbox.md` has the details.
> 6. **Remove the Skin & Hair care chapter for now (client decision, 2026-11-11).** Take everything skin/hair-care off the page:
>    - the `#care` chapter;
>    - its menu and in-page links;
>    - any skincare cards in the fan (refill the fan from the other categories);
>    - every copy mention of "skin & hair care", including the hero/about lines, the eyebrows, the footer and the `<meta name="description">` in `scripts/wrap-site.sh`.
>
>    The site's categories are now Stays, Food and Fashion. **Keep the skincare data and assets in the repo** (e.g. mark the category disabled in `data/videos.json`) so the chapter can come back later with a one-line change. Reviewers: if `#care` or any skincare mention is still visible, that is a **must** finding.
> 7. **Stays gets a mixed photo + video rail (client request, 2026-11-11).** The client sent many stays photos and wants them used in Stays.
>    - **The rail:** turn the Stays chapter's rail/carousel into a MIXED rail. Interleave the 5 real stays videos with the client's stays photos: cabin, A-frame, dome, deck/ofurô, kitchen and couple shots (`assets/img/stays/*` and the web derivatives). About 8–12 items, starting with a video.
>    - **Photo cards:** same card frame and size as the video cards, cover-cropped to the card ratio with good framing, no sound button. Tapping one may open it larger if that's cheap.
>    - **Video rules stay as they are:** autoplay muted on arrival, one sound owner.
>    - **Duplicates:** if the two standalone photos under the chapter now duplicate rail items, replace them with different shots or remove them.
>    - **Reviewers:** if Stays doesn't show a mixed photo + video rail using the client's stays photos, that is a **must** finding.
> 5. **Note for the integrator:** a second copy of the hero builder applied items 1–2 at 16:40–16:50 UTC (it touched `js/hero.js`, `js/signature.js`, `css/hero.css`, the hero and about blocks, `assets/img/cover.jpg`, `scripts/make-images.py` and `hero-*.webp`). Meanwhile the workflow's hero builder deliberately left the full-bleed framing and the theme-zone work unfinished. Consolidate the two, finish the full-bleed → rounded-card hero, and re-test every hero context in §9.E.

---

## 1. Design direction

1. **Feminine editorial, warm and quiet:** a fashion-magazine layout on Vanilla paper, with Mahogany ink, Tobacco and Sand details, and lots of air.
2. **The reference's effects, not its look:** buttery Lenis scrolling, a photo that shrinks into a card while her signature writes itself, the 7-card fan with its elastic deal, oval text reveals, curtain image reveals and scroll-led marquees. No lime, no heavy caps and no sporty notches.
3. **Show, don't read:** her 9:16 videos are already playing when they land, and sound is one tap away. Numbers count up in recreated Instagram screens, and logos drift past. Copy stays to one line wherever possible.
4. **Typography interleaves a light, narrow sans in caps with a swash serif italic** at the same size, as the reference does. That is our feminine adaptation of its bold-sans and bold-serif pairing. The client asked for the reference's *bold* pairing, so the sans weight is a token (`--sans-lockup-wght`, 480 today) and the choice is open question 14 (§10): her answer is a one-line change.
5. **Soft geometry:** an arch window on the cover, round 28 px media cards, softly squared (10 px) editorial photos and pill buttons. The motion is slow and elastic, never snappy.

---

## 2. Tokens

All tokens live in `:root` in `css/site.css`. The site has **one deliberate light theme**. `html`, `body` and every section set their background and text colour explicitly from tokens. Nothing relies on browser defaults.

### 2.1 Palette and roles (contrast measured, WCAG 2.x)

```css
:root{
  color-scheme: light;
  /* client-approved palette */
  --vanilla:#F1EADA; --sand:#CEC1A8; --tobacco:#B59E7D; --mountain:#AAA396;
  --mahogany:#584738; --mahogany-deep:#4D342D; --moss:#6A6A53;

  /* light roles */
  --bg:        var(--vanilla);
  --surface:   #E6DECB;                 /* Sand 30% over Vanilla: brands band, chips, gallery scrub end */
  --ink:       var(--mahogany);
  --ink-strong:var(--mahogany-deep);
  --muted:     var(--moss);             /* captions, only on --bg */
  --line:      rgba(88,71,56,.18);      /* hairlines, decorative */
  --accent:    var(--tobacco);          /* rules, icons, highlight blocks, washes: never text on light */
  --wash:      var(--sand);             /* image-curtain wash on light sections */

  /* dark roles (hero end, Instagram block, menu, contact) */
  --bg-dark:        var(--mahogany-deep);
  --ink-on-dark:    var(--vanilla);
  --muted-on-dark:  var(--sand);
  --accent-on-dark: var(--tobacco);     /* large text only (≥ 24 px) */
  --line-on-dark:   rgba(241,234,218,.2);
  --wash-on-dark:   var(--tobacco);
}
```

| Text pair | Ratio | Allowed use |
|---|---|---|
| Mahogany on Vanilla | **7.38** | all text (default ink) |
| Mahogany-deep on Vanilla | 9.50 | emphasis, buttons |
| Moss on Vanilla | **4.61** | captions and secondary labels, **only on Vanilla** |
| Mahogany on Surface `#E6DECB` | 6.60 | brands band, gallery |
| Moss on Surface | 4.13 | **not allowed** (below 4.5) |
| Mahogany on Sand | 4.98 | allowed, but avoid large Sand areas behind text |
| Moss on Sand | 3.11 | **not allowed** |
| Vanilla on Mahogany-deep | **9.50** | all text on dark |
| Sand on Mahogany-deep | 6.41 | secondary text on dark |
| Tobacco on Mahogany-deep | 4.42 | **large text only** (≥ 24 px, e.g. a serif line in a lockup) |
| Vanilla on Mahogany (button) | 7.38 | primary pill button label |
| Tobacco / Mountain / Sand on Vanilla | 2.15 / 2.09 / 1.48 | **never text**: decoration only |

`::selection { background: var(--mahogany); color: var(--vanilla); }`.

### 2.2 Type (from `docs/typography.md`, plus one weight token)

Copy the `@font-face` rules (Type §5) and the tokens and primitives (Type §6) **verbatim** from `lab/type.html` into `css/site.css`. Font paths in `css/` are `../assets/fonts/…`.

```css
:root{
  --font-sans:  "LM Sans", "Helvetica Neue", Arial, sans-serif;
  --font-serif: "LM Serif", "Iowan Old Style", Georgia, serif;
  --fs-display: clamp(3.75rem, 19vw, 7.5rem);       /* 74px  hero lockup */
  --fs-h2:      clamp(2.375rem, 11.6vw, 5rem);      /* 45px  section lockup */
  --fs-h3:      clamp(1.625rem, 7.4vw, 2.5rem);     /* 29px  chapter lockup */
  --fs-statement: clamp(1.75rem, 8.6vw, 3.25rem);   /* 33.5px  About statement (new) */
  --fs-number:  clamp(3.25rem, 16.4vw, 6.5rem);     /* 64px  stat numerals */
  --fs-intro:   clamp(1.3125rem, 5.8vw, 1.875rem);  /* 22.6px serif intro */
  --fs-body:    clamp(0.9375rem, 3.9vw, 1.0625rem); /* 15.2px */
  --fs-caption: clamp(0.75rem, 3.1vw, 0.875rem);    /* 12.1px */
  --fs-eyebrow: clamp(0.6875rem, 2.8vw, 0.8125rem); /* 10.9px */
}
```

Classes: `.t-lockup` (+ `--display`, `--sm`, `--start`, `--offset`), `.t-sans`, `.t-serif`, `.t-accent`, `.t-eyebrow`, `.t-intro`, `.t-body`, `.t-caption`, `.t-number` (+ `.u`). Set `body{font-synthesis:none}`. Follow the usage rules in Type §7: the sans line is caps and ≤ 12 characters, the serif line is italic in sentence case, both lines use the same size, swash only inside lockups, `--offset` at most once (About), and no Poppins.

**Lockup weight token (open question 14).** After copying Type §6, replace its three literal sans weights with one token, so the client's answer changes one line:

```css
:root{ --sans-lockup-wght: 480; }    /* 480 = current light feminine version; ~650 = closer to the reference's bold */
.t-sans{ font-weight: var(--sans-lockup-wght); }                                  /* was 480 */
.t-lockup--display .t-sans, .t-statement{ font-weight: calc(var(--sans-lockup-wght) - 40); }   /* was 440 */
```

New: `.t-statement` = `.t-sans` at `--fs-statement`, weight `calc(var(--sans-lockup-wght) - 40)` (440 today), `font-stretch:80%`, `line-height:.95`, caps, with `.t-accent` words inside (no swash).

Utility: `.sr-only{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}`.

### 2.3 Spacing, layout, radii, shadows, z-index

```css
:root{
  --gutter: 16px;
  --pad-x-l: max(var(--gutter), env(safe-area-inset-left, 0px));
  --pad-x-r: max(var(--gutter), env(safe-area-inset-right, 0px));
  --space-2xs:4px; --space-xs:8px; --space-sm:12px; --space-md:16px; --space-lg:24px;
  --space-xl:32px; --space-2xl:48px; --space-3xl:64px; --space-4xl:96px;
  --section-pad: clamp(88px, 24vw, 160px);        /* 94px at 390, used as padding-block */
  --content-max: 640px;                           /* column cap on wide screens */
  --header-h: 64px;
  --anchor-offset: calc(var(--header-h) + 8px + env(safe-area-inset-top, 0px));  /* scroll-margin-top of every in-page target (§4.0) */

  --radius-xs: 8px;        /* chips, small controls */
  --radius-sm: 14px;       /* rail thumbs */
  --radius-photo: 10px;    /* editorial photos (soft squared, Lando §4) */
  --radius-card: 28px;     /* 9:16 video cards and fan cards (≈ 15.6% of a 179px card) */
  --radius-shot: 26px;     /* Instagram screens (read by css/insights.css) */
  --radius-panel: 32px;    /* contact panel, menu */
  --radius-pill: 999px;

  /* Instagram "screenshot" shadow (read by css/insights.css); warm, tuned for Vanilla */
  --shadow-shot:
    0 0 0 1px rgba(64,44,22,.06), 0 1px 1px rgba(64,44,22,.04),
    0 2px 4px -1px rgba(64,44,22,.05), 0 6px 12px -3px rgba(64,44,22,.06),
    0 14px 28px -6px rgba(64,44,22,.08), 0 32px 64px -14px rgba(64,44,22,.14);
  --shadow-card: 0 24px 48px -26px rgba(77,52,45,.55);   /* video cards */
  --shadow-soft: 0 10px 30px -18px rgba(77,52,45,.35);   /* photos, pills */

  --z-card-max: 10; --z-header: 50; --z-menu: 60; --z-toast: 70;
}
.on-dark{ --shadow-shot: 0 0 0 1px rgba(255,255,255,.06), 0 18px 40px -16px rgba(0,0,0,.45), 0 40px 80px -30px rgba(0,0,0,.5); }
```

Wrapper: `.wrap{ width:100%; max-width:calc(var(--content-max) + 32px); margin-inline:auto; padding-left:var(--pad-x-l); padding-right:var(--pad-x-r); }`. **Every section's inner content sits in `.wrap`.** Full-bleed bands (hero stage, fan, marquees) put their own content in `.wrap`, or clip deliberately (the fan and the marquees bleed on purpose, see §4). Vertical spacing uses `padding-block` only.

`main [id], footer[id]{ scroll-margin-top: var(--anchor-offset); }` so every in-page jump (native or Lenis) lands below the fixed header (§4.0 "In-page links").

**Frosted surfaces.** Every `backdrop-filter` declaration is preceded by the same `-webkit-backdrop-filter` declaration (Safari before 18 needs the prefix). This applies to the header backing, the sound/pause buttons, the hint pill and the play glyph.

### 2.4 Motion tokens (from the reference)

```css
:root{
  --ease-default: cubic-bezier(.65,.05,0,1);        /* Lando signature ease; all CSS hover/state transitions */
  --dur-default: .75s;
  --ease-out:     cubic-bezier(.25,.46,.45,.94);    /* = power2.out */
  --ease-out-3:   cubic-bezier(.215,.61,.355,1);    /* = power3.out */
  --ease-in-out:  cubic-bezier(.455,.03,.515,.955); /* = power2.inOut */
  --ease-expo-out:cubic-bezier(.16,1,.3,1);         /* motion.js, Conectaa menu */
  --ease-back:    cubic-bezier(.34,1.36,.64,1);     /* ≈ back.out(1.2) */
}
```

In JS (GSAP names): `power2.out`, `power2.inOut`, `power3.out`, `power1.inOut` (hero scrub), `elastic.out(1, 0.75)` (fan), `back.out(1.2)` (menu links), `none` (scrubbed parallax). Lando durations to reuse: oval reveal 1.5 s, line highlight 0.6 s, image curtain 0.8 s + wash 0.6 s, fan rise 0.8 s + spread 1.2 s, fan focus 0.5 s, menu 0.8 s.

---

## 3. File structure

```
site.html                  ← THE page (HTML fragment; the Artifact publishes this file)
index.html                 ← generated by scripts/wrap-site.sh for GitHub Pages; never hand-edited, not committed (add /index.html to .gitignore)
css/site.css               ← tokens, @font-face, base, lenis rules, components, sections
css/insights.css           ← existing, reused unchanged
js/site.js                 ← entry (type="module"): boot, mode switch, orchestration
js/scroll.js               ← Lenis + ScrollTrigger setup, onApproach()/armReveal() helpers, watchdog
js/reveals.js              ← oval lockup reveal, line highlight, image curtain, parallax, dealt cards, bg scrubs
js/hero.js                 ← hero timeline + arch→card geometry
js/signature.js            ← constant-pen-speed draw timelines (hero scrub, footer play-once)
js/fan.js                  ← 7-card fan (layout tables, entrance, focus carousel, swipe)
js/video.js                ← video cards: scheduler, sound owner, posters (Conectaa §5 adapted)
js/brands.js               ← logo marquee rendered from data/brands.json
js/ui.js                   ← header (theme IO, backing, hide/show), menu, in-page link router, copy buttons, toast, scroll indicator
js/motion.js, js/insights.js ← existing, reused (do not fork; see §4.2 for how we drive them)
data/videos.json           ← NEW (schema in §6.6)
data/metrics.json, data/brands.json, data/content.json ← existing (read-only; labels and values come from here)
assets/fonts/*             ← existing 3 WOFF2 + LICENSES.md
assets/fonts/LICENSES.md   ← CHANGED: reword line 30, add the EMS Allure credit (§4.8, item 6)
assets/img/web/…           ← NEW responsive WebP derivatives (§8.1), incl. hero-{828,1242,1527}.webp
assets/video/<category>/<name>.mp4 + .jpg ← real videos + first-frame posters
assets/video/posters/<id>.webp, assets/video/thumbs/<id>.webp ← NEW derivatives (§6.7)
scripts/make-images.py     ← NEW: builds assets/img/web/* and video posters/thumbs (run with python3 -I)
scripts/make-signature.mjs ← NEW: emits the static signature SVG paths (§7)
scripts/wrap-site.sh       ← NEW: site.html → index.html with the Pages skeleton (§3.3)
scripts/encode-video.sh    ← existing (§6.7)
.github/workflows/pages.yml ← CHANGED: "Wrap site" step before "Assemble site"; site.html never published (§3.3)
.gitignore                 ← CHANGED: add /index.html
lab/type.html              ← CHANGED: add the weight × serif comparison panel for open question 14 (§10)
```

`js/*` modules are ES modules loaded with relative `import` paths. No bundler and no npm runtime dependencies.

### 3.1 `site.html` (fragment) skeleton, in this exact order

```html
<title>Lorena Maruch</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preload" href="assets/fonts/lm-sans-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/eb-garamond-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/insights.css">
<link rel="stylesheet" href="css/site.css">
<!-- Type: Mona Sans (as "LM Sans"), Gilda Display (as "LM Display"), EB Garamond: SIL OFL 1.1.
     Placeholder signature drawn from EMS Allure (SIL OFL 1.1). Details: assets/fonts/LICENSES.md -->

<div class="site" lang="en">
  <a class="skip" href="#main">Skip to content</a>
  <header class="hdr" data-nav="light">… <button class="hdr__menu" type="button" hidden …>…</button></header>
  <div class="menu" id="menu" hidden>…</div>
  <main id="main" tabindex="-1">
    <section id="top" class="hero">…</section>
    <section id="instagram" class="ig on-dark">…</section>
    <section id="about" class="about">…</section>
    <section id="content" class="content">…fan…
      <article id="stays" class="chapter">…</article> … #food, #fashion, #care
    </section>
    <section id="numbers" class="numbers">…</section>
    <section id="brands" class="brands">…</section>
    <section id="gallery" class="gallery">…</section>
  </main>
  <footer id="contact" class="contact on-dark">…</footer>
  <div class="toast" role="status" aria-live="polite"></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js" integrity="sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly" crossorigin="anonymous" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/ScrollTrigger.min.js" integrity="sha384-wl5TeDVvOWt30Pbf8aSo2ZrzsOjddu3avOBvHe+p+OhJt9gP6w9YXmDkN5DK2/dF" crossorigin="anonymous" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/SplitText.min.js" integrity="sha384-SWJ0lLVRoipvHh59xj0pL7uC7Ih51F+5smaFtrG+2nr+TlDZU5SYJHmxfolbeNTr" crossorigin="anonymous" defer></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js" integrity="sha384-R18XzqnxvVLEF+BYfhpmDx30v7eP83fAckyfoRzK7/Uf6nGqufcmsk0eAKo7S3RU" crossorigin="anonymous" defer></script>
<script type="module" src="js/site.js"></script>
```

- **No** `<!doctype>`, `<html>`, `<head>` or `<body>` tags. Nothing may come before `<title>`. The page has no inline `<script>`.
- Deferred classic scripts and the module run in document order after parsing, so `window.gsap`, `ScrollTrigger`, `SplitText` and `Lenis` exist when `site.js` runs. `site.js` must still check for each one (§4.1).
- `lang="en"` sits on `.site` because the fragment cannot set `<html lang>` (the Pages wrapper does).
- The menu button ships `hidden`; `ui.js` unhides it in every JS mode. Without JS the header shows only the wordmark and the "Contact" pill, which are plain links.

### 3.2 External libraries (verified 2026-11-11, re-verified for revision 2: HTTP 200 + sha384 of the served bytes, identical on the jsdelivr and unpkg Lenis mirrors)

| Library | Exact URL | Published | Size |
|---|---|---|---|
| GSAP core 3.15.0 | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/gsap.min.js` | 2026-04-13 | 72.9 KB |
| ScrollTrigger 3.15.0 | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/ScrollTrigger.min.js` | 2026-04-13 | 44.6 KB |
| SplitText 3.15.0 (free since 3.13) | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/SplitText.min.js` | 2026-04-13 | 7.7 KB |
| Lenis 1.3.27 (UMD, sets `globalThis.Lenis`) | `https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js` (mirror: `https://unpkg.com/lenis@1.3.27/dist/lenis.min.js`) | 2026-10-15 | 18.8 KB |

- **Do not link `lenis.css`.** Only `fonts.googleapis.com` stylesheets are allowed, so inline its rules into `css/site.css`:
  ```css
  html.lenis, html.lenis body { height:auto; }
  .lenis:not(.lenis-autoToggle).lenis-stopped { overflow:clip; }
  .lenis [data-lenis-prevent], .lenis [data-lenis-prevent-wheel], .lenis [data-lenis-prevent-touch],
  .lenis [data-lenis-prevent-vertical], .lenis [data-lenis-prevent-horizontal] { overscroll-behavior:contain; }
  ```
- No Google Fonts request is needed (all fonts are self-hosted). There must be no other external host, no iframes and no embeds.
- Re-verify the hashes if a URL changes: `curl -sS URL | openssl dgst -sha384 -binary | openssl base64 -A`.
- Lenis 1.3 vs the reference's 1.1.20: `touchInertiaMultiplier` is gone (replaced by `touchInertiaExponent`, default 1.7), and `data-lenis-prevent-horizontal` and `respectReducedMotion` are new (§5).

### 3.3 GitHub Pages wrapper (`scripts/wrap-site.sh`)

`index.html` = the skeleton below + `site.html` **byte-for-byte**, so the Artifact and Pages run identical markup.

```html
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="description" content="Lorena Maruch: content creator, model, actress and art director. Stays, food, fashion and skin & hair care.">
<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<!-- site.html inserted here, then: -->
</body></html>
```

- There is deliberately **no `</head><body>`** before the fragment. The HTML parser then keeps the fragment's `<title>`, `<meta>`, `<link>`s and comment in `<head>`, and opens `<body>` implicitly at `<div class="site">`. (Both end tags are optional in HTML. With an explicit `<body>`, the `<title>` would be inserted inside the body.)
- `scripts/wrap-site.sh` (`set -euo pipefail`): print the skeleton, then `cat site.html`, then `</body></html>`, into `index.html` at the repo root. Exit non-zero if `site.html` is missing or does not start with `<title>`.

**Workflow (`.github/workflows/pages.yml`, part of this build).** The current workflow copies an `index.html` that does not exist in the repo, so Pages would serve a 404 at the root. Change the steps to:

```yaml
      - uses: actions/checkout@v4

      - name: Wrap site                       # site.html -> index.html (Pages skeleton + fragment)
        run: bash scripts/wrap-site.sh

      # Publish only the public site files (raw sources and docs stay out; site.html is never published)
      - name: Assemble site
        run: |
          mkdir -p _site
          for p in index.html 404.html CNAME robots.txt sitemap.xml favicon.ico favicon.svg css js assets data lab; do
            if [ -e "$p" ]; then cp -R "$p" _site/; fi
          done
          test ! -e _site/site.html
          head -c 15 _site/index.html | grep -qi '^<!doctype html>'
          ls -la _site
```

The rest of the workflow (configure-pages, upload-pages-artifact, deploy-pages, triggers) stays as it is. The builder runs the same two steps locally to test (§9, item 6a).

---

## 4. Section-by-section plan

Order: **Hero → Instagram profile → About → Content (fan + 4 chapters) → Numbers → Brands → Gallery → Contact/footer.** The media kit puts Partners before Content. We show the work first, then the proof (numbers and brands), then the photos, then contact.

Background rhythm: light cover → dark (signature + profile) → light (About, Content, Numbers) → Surface band (Brands) → light to Surface (Gallery) → dark (Contact).

### 4.0 Global mechanics (read before the sections)

**Modes.** CSS defaults are the **static, final** layout. It must be complete and readable with no JS, with reduced motion, or if a CDN fails.
- `site.js` adds `html.motion` only when: reduced motion is off, and `gsap`, `ScrollTrigger`, `SplitText` and `Lenis` are all present.
- Every pre-animation state is scoped under `.motion`, or set by JS just before it is used.
- If boot throws, remove `.motion` and call `finishAll()`.

**Lookahead observers must use `root: document`.** Inside any iframe (the claude.ai Artifact is one), an IntersectionObserver with the implicit root **ignores `rootMargin`**, because the iframe's viewport clips its content. Verified in Chromium with a cross-origin iframe: `rootMargin:'0px 0px 75% 0px'` with the implicit root did not fire for a target 1.4 viewports down, and fired only once the target was visible; the same observer with `root: document` fired at load. So every observer that needs a margin is created with `root: document` (in a top-level page this behaves exactly like the implicit root):
- `onApproach` (75% lookahead), the video warm-up (`100% 0px`, §6.3), the brands eager-load (§4.6), the poster-only Ken Burns and icon replays, and the nav theme band (below).
- Wrap the constructor in `try/catch` (`root: Document` needs Safari 14.1+); on failure, fall back to the implicit root. The arming guard below keeps that fallback safe.
- Observers without a margin (the video visibility ratios in §6.2, motion.js's own play triggers) may keep the implicit root.

**Arm on approach (the "complete at rest" contract).** Below-the-fold elements are never hidden at load, and **nothing is ever armed while any part of it is in the viewport**.
- `onApproach(el, arm, {ahead:.75})`: `new IntersectionObserver(cb, {root: document, rootMargin: '0px 0px 75% 0px'})`. It fires once when the element is within ¾ of a viewport below the fold.
- Guard: when `arm` would run, read `el.getBoundingClientRect().top`. If it is `< innerHeight` (already visible, or above: reload mid-page, anchor jump, fast fling), **do not arm**; leave the element in its final state.
- `arm()` sets the from-state (`gsap.set`), marks `el.dataset.armed = ''`, and creates the play trigger (ScrollTrigger `once`, or IO).
- On play complete, remove `data-armed`.

**Watchdog** (`scroll.js`): on every Lenis/ScrollTrigger `scrollEnd`, and every 1 s, scan `[data-armed]`. If an element has intersected the viewport for more than 1200 ms without playing, force its final state (`tl.progress(1)`, `clearProps`). Also on `beforeprint`, and when `matchMedia('(prefers-reduced-motion: reduce)')` changes: run `finishAll()` (progress 1 on every timeline, kill ScrollTriggers, destroy Lenis, remove `.motion`, call `finish(document)` from `motion.js`).

**Text splitting.** Wait for `Promise.race([document.fonts.ready, sleep(1500)])`, then split, then `ScrollTrigger.refresh()`.
- Use `SplitText.create(el, {type:'chars', aria:'none'})` on **`.t-sans` lines only**. The serif italic line moves as a whole, so its kerning, ligatures and swashes stay intact.
- **Do not keep SplitText's default `aria:'auto'`.** It puts `aria-label` on the split element (confirmed in the served 3.15.0 `SplitText.min.js`). Here that element is a `<span>`, where `aria-label` is prohibited, so VoiceOver/NVDA may announce nothing for that line. Instead, for every heading (`h1`/`h2`/`h3`) whose lines get split:
  1. before splitting, set `aria-label` on the **heading itself** to its full text with single spaces (e.g. `aria-label="My content in motion"`);
  2. split with `aria:'none'`;
  3. after the split, set `aria-hidden="true"` on the heading's visual line spans (`.t-sans`, `.t-serif`).
  On `finishAll()`/revert, remove those attributes again. Static mode never splits, so headings are named by their text.
- Line splits for the line highlight (`type:'lines'`, on `<p>` eyebrows and the statement) also use `aria:'none'`. Lines keep whole words, so the text still reads correctly, and `aria-label` is prohibited on `<p>` too.

**Clip-path tweens.** Chrome serializes a computed `clip-path` compactly (measured: `inset(20% 14% 22% 14% round 10% 10% 10% 10% / 5.7% 5.7% 5.7% 5.7%)` reads back as `inset(20% 14% 22% round 10% / 5.7%)`). A `gsap.to()` that takes its start from computed style then has a different number count than its target and interpolates the wrong numbers. So:
- **Every clip-path tween is a `gsap.fromTo()` with explicit from and to strings of identical structure and units** (ellipse curtains, the About arch, the menu, the hero copy).
- Every `inset()` string comes from `boxToInset()` (§4.1): 12 numbers, all in px (4 insets + 4 horizontal radii + 4 vertical radii).

**Nav theme (every JS mode; it is not motion).** Sections carry `data-theme="light|dark"`. One IntersectionObserver in `ui.js`, `root: document`, observes every `[data-theme]` element through a **1 px band at the header line**:
- header line `y = hdr.offsetHeight − 32` (the middle of the 64 px bar, below any safe-area inset; `offsetHeight` ignores the hide transform, so the line stays put while the bar is hidden);
- `rootMargin: \`${-y}px 0px ${-(innerHeight - y - 1)}px 0px\``; rebuild the observer on `resize` (debounced 150 ms);
- of the elements currently intersecting the band, the **last in document order** wins and sets `.hdr[data-nav]` (so the hero's dark zone, a child of `.hero`, beats `.hero`).
- The hero's switch to dark at 0.5 × stage height (§4.1) is a motion-only child element `.hero__dark-zone` (`data-theme="dark"`, `display:none` unless `.motion`, `position:absolute; left:0; width:1px; top:calc(50svh + 32px + env(safe-area-inset-top, 0px)); bottom:0`), so its top crosses the header line at scroll = 0.5 H.
- Header colours transition with `var(--dur-default) var(--ease-default)` (instant under reduced motion).

**In-page links.** Lenis keeps `anchors:false` (§5). `ui.js` routes **every** `a[href^="#"]` click (skip link, wordmark, "Contact" pill, menu links, "More stays ↓", "Back to top ↑") through one delegated handler:
- `preventDefault()`; resolve the target (`#top` → scroll position 0).
- Motion mode: `lenis.scrollTo(target, {duration:1.2, easing:t=>1-Math.pow(1-t,4)})` with **no `offset`**: Lenis 1.3.27 already subtracts the target's computed `scroll-margin-top` (read from its source), so `--anchor-offset` applies once. Adding `offset:-64` would double it.
- Static modes: `target.scrollIntoView({block:'start'})`, which also honours `scroll-margin-top`. Without JS, the native jump does the same.
- Focus: the skip link focuses `#main` (`tabindex="-1"`) with `focus({preventScroll:true})`; menu links focus the target section (add `tabindex="-1"` just before focusing, remove it on `blur`).
- Lenis's own `anchors` option is not used: in 1.3.27 its click handler calls `scrollTo` without `preventDefault()`, so the browser also performs its native fragment jump and history update.

#### Header (fixed) and menu

- `.hdr`: `position:fixed; top:0; left:0; right:0; z-index:var(--z-header)`. Its padding uses the safe-area insets: top `env(safe-area-inset-top,0px)`, left `var(--pad-x-l)`, right `var(--pad-x-r)`. Its content height is `--header-h`, and `pointer-events:none` is set on the bar (its controls re-enable it).
- Left: wordmark link "Lorena Maruch" (`.t-eyebrow`, 12px, tracking .18em) → `#top`.
- Right: a pill link "Contact" (height 44, padding 0 18px, 1px `currentColor` border, radius pill) → `#contact`, and a menu button (44 × 44, two 1.5px lines morphing to an ×, label "Menu"/"Close" via `aria-label`, `aria-expanded`, `aria-controls="menu"`). The button ships `hidden` and `ui.js` unhides it (§3.1).
- Light theme: ink Mahogany. Dark theme: ink Vanilla. The theme comes from the IO band in every JS mode (§4.0).
- **Backing (contrast-safe).** The frosted backing is the **CSS default**: `.hdr{ background: color-mix(in srgb, var(--bg) 85%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }`, and on dark: `.hdr[data-nav="dark"]{ background: color-mix(in srgb, var(--bg-dark) 85%, transparent); }`. 85%, not 72%: with 72%, Mahogany ink over the light backing on top of Mahogany-deep content measures 4.50:1, and over black photo pixels 3.75:1. With 85% it is 5.73 and 5.25, and Vanilla ink over the dark backing on top of Vanilla content is 6.31.
  - `.hdr--clear` removes the backing (`background:none; backdrop-filter:none`).
  - **No JS:** the backing is always on and the ink stays Mahogany (5.73:1 over the dark sections). The menu button stays hidden.
  - **Static JS modes (reduced motion, CDN failure):** `ui.js` adds `.hdr--clear` only while `scrollY < 1`. The bar never hides.
  - **Motion mode:** `.hdr--clear` while `scrollY < 0.35 × H` (hero cover: Mahogany ink on Vanilla). From `0.35 H` on, the bar **hides on scroll down and returns on scroll up** (Conectaa §4.7): `translateY(-100%)` in .45s `--ease-default`, driven by `lenis.direction`. Whenever it is shown there, it has the backing. So the bar is never visible without a backing over the mid-hero colour blend, where neither ink colour reaches 4.5:1.
- **Menu (Lando §7.3):**
  - A full-screen panel `position:fixed; inset:0; z-index:var(--z-menu)`, `background:var(--bg-dark)`, with padding from the safe-area insets.
  - Hidden state: `visibility:hidden` + `clip-path: ellipse(120% 0% at 50% 0%)`. Never an off-canvas translate (that blew up the layout viewport on Conectaa).
  - Open, 0.8 s `power3.out`: panel clip `fromTo` `ellipse(120% 0% at 50% 0%)` → `ellipse(120% 100% at 50% 20%)`.
  - Links, from 0.35 s with stagger .08, `back.out(1.2)`, 0.6 s: `y 20 → 0`, clip `ellipse(30% 0% at 50% 0%)` → `ellipse(120% 100% at 50% 20%)`.
  - Close = reverse at `timeScale(1.4)`.
  - **Reduced motion:** open and close are instant (`visibility` and `clip-path:none` set directly; no tweens, no link rise). Everything else (inert, focus, Esc) is the same.
  - Links in lockup style, alternating sans caps and serif italic, `--fs-h3`, Vanilla: CONTENT · *Numbers* · BRANDS · *Gallery* · CONTACT.
  - While open: `lenis.stop()` (motion mode), `inert` on `main` and `footer`, focus moves to the first link, Esc closes, and focus returns to the button.
  - Link tap: close, then the in-page link router (§4.0) scrolls to the target. Lenis is started again first: a stopped Lenis ignores `scrollTo`.

#### Scroll indicator (Lando §7.6, nice-to-have)

A fixed bar at `right: max(4px, env(safe-area-inset-right))`, `top:12svh`, `height:76svh`, width 3px, radius 3px, colour `rgba(255,255,255,.75)` with `mix-blend-mode:difference`, thumb height `clamp(10%, vh/docH, 25%)`.
- It fades in (0.5 s) on scroll and moves with 0.3 s `power2.out`.
- It fades out 500 ms after scrolling stops.
- `aria-hidden`. Hidden under reduced motion. Hide the native scrollbar only when Lenis is active (`html.lenis{scrollbar-width:none}` plus `::-webkit-scrollbar{display:none}`).

### 4.1 Hero `#top` (`data-theme="light"`, switches dark mid-scroll)

**Content:**
- `assets/img/portrait-cover.jpg` (served as `assets/img/web/hero-{828,1242,1527}.webp`, §8.1).
- An H1 lockup.
- The signature SVG (§7), with `aria-hidden`.

**Copy:**
- Eyebrow (above the lockup): **Content creator & art director**
- H1 `.t-lockup--display`: `<span class="t-sans">Lorena</span> <span class="t-serif">Maruch</span>` → "LORENA / *Maruch*"
- Rising eyebrow (scroll phase 2): **@lorena_maruch**

**Structure:**

```html
<section id="top" class="hero" data-theme="light" aria-labelledby="hero-title">
  <i class="hero__dark-zone" data-theme="dark" aria-hidden="true"></i>      <!-- nav theme switch, motion only (§4.0) -->
  <div class="hero__stage">
    <div class="hero__copy wrap"><p class="t-eyebrow">Content creator &amp; art director</p>
      <h1 id="hero-title" class="t-lockup t-lockup--display"><span class="t-sans">Lorena</span> <span class="t-serif">Maruch</span></h1></div>
    <div class="hero__arch" aria-hidden="true"></div>                          <!-- geometry probe, never painted -->
    <div class="hero__photo">
      <img src="assets/img/web/hero-1242.webp"
           srcset="assets/img/web/hero-828.webp 828w, assets/img/web/hero-1242.webp 1242w, assets/img/web/hero-1527.webp 1527w"
           sizes="(max-aspect-ratio: 1527/1600) 101vh, 106vw" width="1527" height="1600"
           alt="Lorena Maruch, close-up portrait looking over her bare shoulder" fetchpriority="high" decoding="async">
      <div class="hero__shade" aria-hidden="true"></div>
    </div>
    <p class="hero__handle t-eyebrow" aria-hidden="true">@lorena_maruch</p>
    <svg class="sig sig--hero" …aria-hidden="true">…9 paths…</svg>
  </div>
</section>
```

**Resting layout (static mode = motion mode at scroll 0), derived in CSS from the copy, at any viewport height.** Revision 1 fixed the arch top at `inset(33% …)` while the copy block was fixed px. That only worked at 844 px tall: at 664 (iPhone 13 Safari's `100svh`), 548 (iPhone SE) or in the shorter Artifact pane, the photo painted over "Maruch" by 30–70 px. Now the arch top is computed from the same tokens that lay out the copy:

```css
.hero{ --hero-bg: var(--vanilla); background: var(--hero-bg); position:relative;
       margin-top: calc(-1 * env(safe-area-inset-top, 0px)); }      /* stage runs under the status bar */
.hero__stage{ position:relative; height:100svh; overflow:clip; background: var(--hero-bg);
  --hero-copy-top: calc(env(safe-area-inset-top, 0px) + var(--header-h) + 28px);   /* 92px without an inset */
  --arch-top: calc(var(--hero-copy-top) + 1.2 * var(--fs-eyebrow) + 12px + 1.84 * var(--fs-display) + 24px);
                                                     /* 277px at 390; 1.84em ≥ the lockup's 1.78em (.86 + .98 − .06), the rest is swash room */
  --arch-x:  max(var(--gutter), calc(50vw - 280px)); /* side inset: 16px on phones; caps the arch at 560px wide */
  --arch-rx: calc(50vw - var(--arch-x));             /* full-width dome: rx = arch width / 2 */
  --arch-ry: calc(.62 * (100vw - 2 * var(--arch-x)));/* 222px at 390 */
  --eye-drop: 110px;                                 /* eye line sits this far below the arch top */
  --hero-img-y: 0px;                                 /* landscape default; desktop polish later */
}
.hero__copy{ position:relative; z-index:2; padding-top: var(--hero-copy-top); text-align:center; color:var(--ink); }
.hero__copy .t-eyebrow{ margin:0 0 12px; }
.hero__arch{ position:absolute; top:var(--arch-top); left:var(--arch-x); right:var(--arch-x); bottom:0;
  border-radius: var(--arch-rx) var(--arch-rx) 0 0 / var(--arch-ry) var(--arch-ry) 0 0;
  padding-top: var(--hero-img-y);                    /* not layout: hero.js reads it back as the image's rest translateY */
  box-sizing:border-box; visibility:hidden; pointer-events:none; }
.hero__photo{ position:absolute; inset:0; z-index:1; transform-origin: 50% var(--arch-top);
  clip-path: inset(var(--arch-top) var(--arch-x) 0px var(--arch-x)
                   round var(--arch-rx) var(--arch-rx) 0px 0px / var(--arch-ry) var(--arch-ry) 0px 0px); }
.hero__photo img{ display:block; width:100%; height:100%; object-fit:cover; object-position: 39% 30%;
  transform: translateY(var(--hero-img-y)) scale(1.06); }   /* the scrub's start state, in both modes */
.hero__shade{ position:absolute; inset:0; background:var(--mahogany-deep); opacity:0; pointer-events:none; }
@media (max-aspect-ratio: 1527/1600){                /* portrait: cover-fit is height-limited; after the base rules so it wins */
  .hero__stage{ --hero-img-y: max(0px, var(--arch-top) + var(--eye-drop) - .347 * 100svh); }   /* ≥ 0: padding cannot be negative */
  .hero__photo img{ object-position: calc(50% + 10.2svh) 50%; }
}
.hero__dark-zone, .sig--hero, .hero__handle{ display:none; }   /* scroll effects only */
.motion .hero__dark-zone{ display:block; }
.motion .sig--hero, .motion .hero__handle{ display:block; position:absolute; z-index:3; }   /* above photo (1) and copy (2) */
```

- **Where the numbers come from.** The iris centres in `portrait-cover.jpg` (1527 × 1600) are at (430, 560) and (770, 578), so the eye midpoint is (600, 569) = (.393, .356) of the image. In portrait, cover-fit shows the image at `.954 × H` wide. `calc(50% + 10.2svh)` puts the eye midpoint on the stage centre line ((W − .954H)/2 + .102H = W/2 − .393 × .954H). `scale(1.06)` about the centre moves the eye line from .356 H to .347 H, hence `.347 * 100svh` in `--hero-img-y`. If the client sends a new original (open question 11), re-measure these two numbers.
- **The arch** spans from `--arch-top` to the bottom edge, 16 px in from each side (358 px wide at 390). Its top corners form one elliptical dome (179 × 222 px at 390).
- **The `.hero__arch` probe** holds the whole rest geometry: its box is the arch rectangle, its computed `border-top-left-radius` is "rx ry" in px, and its computed `padding-top` is the image's rest translateY in px. It is never animated, so `hero.js` can read it at any time.
- Computed for this revision (a script mapping the eye points through object-fit, object-position and the transform):

| Viewport (W × 100svh, top inset) | H1 bottom | Arch top | Gap | Image shift | Eye line below arch top | Eye x extent | Eyes inside dome and end card |
|---|---|---|---|---|---|---|---|
| 390 × 844, 0 (emulation) | 249 | 277 | 28 | 95 px | 110 | 61–337 | yes |
| 390 × 664, 0 (iPhone 13 Safari) | 249 | 277 | 28 | 157 px | 110 | 89–307 | yes |
| 390 × 664, 47 (real iPhone 13) | 296 | 324 | 28 | 204 px | 110 | 89–307 | yes |
| 375 × 548, 0 / 20 (iPhone SE) | 244 / 264 | 272 / 292 | 28 | 192 / 212 px | 110 | 100–280 | yes |
| 390 × 700, 0 (Artifact pane) | 249 | 277 | 28 | 145 px | 110 | 84–313 | yes |

  With revision 1's fixed `yPercent 12`, at 390 × 664 the eye line sat only 38 px under the arch top, on the dome's edge.
- Static mode shows no signature and no handle in the hero (they are scroll effects).

**Effect: the photo shrinks into a card while the signature writes itself** (adapts Lando §4.1 + §6.1; validated in `understand/lando/ref/28-proto-mobile-hero-shrink-signature.png`):
- `.motion .hero{height:220svh}` and `.motion .hero__stage{position:sticky; top:0}`. **Use CSS sticky, not ScrollTrigger `pin`.** Lenis scrolls the real window, so sticky just works.
- `H` = `stage.offsetHeight` (100svh). Read it in function-based ScrollTrigger values, never `innerHeight`, so the iOS address bar cannot move the ranges.
- Do not put `overflow:hidden` on any ancestor of `.hero` (it breaks sticky). `html, body {overflow-x: clip}` is fine.
- **Background:** the scrub tweens the custom property `--hero-bg` **on `.hero`**, and both `.hero` and `.hero__stage` paint it. When the iOS toolbars collapse mid-scroll, the viewport grows to `lvh` while the sticky stage stays `100svh`, so a strip of `.hero` shows under the stage. With the background scrubbed on the stage alone, that strip stayed Vanilla while the stage turned Mahogany-deep.

| Scroll (from hero top) | Target | From → To | Ease / scrub |
|---|---|---|---|
| 0 → 1.0 H | `.hero__photo` clip-path | `fromTo(boxToInset(rest), boxToInset(card))`: arch → card (≈ 281 × 489 px at 844, 28 px corners) | `power1.inOut`, `scrub:true` |
| 0 → 1.0 H | `.hero__photo img` | `fromTo({y: rest.imgY, yPercent:0, scale:1.06}, {y:0, scale:.92})` | `power1.inOut`, scrub |
| 0 → 1.0 H | `.hero__shade` | `opacity 0 → .12` (replaces revision 1's `filter: brightness()`, which is not compositor-only, §8.1) | `power1.inOut`, scrub |
| 0 → 1.0 H | `.hero` `--hero-bg` | `fromTo('#F1EADA', '#4D342D')` | `power1.inOut`, scrub |
| 0 → 0.6 H | `.hero__copy` | clip `fromTo` `ellipse(110% 110% at 50% 0%)` → `ellipse(100% 0% at 50% 0%)`; sans chars `yPercent 0 → -100` (stagger .02); `yPercent 0 → -20` on the block | `power3.out`, scrub |
| from 0.35 H | header | backing on; hides on scroll down, returns on scroll up (§4.0) | |
| at 0.5 H | header | `data-nav` light → dark (`.hero__dark-zone` reaches the theme band) | IO |
| 0.55 → 1.15 H | signature | draw progress 0 → 1 at constant pen speed (§7.3) | `scrub: .5` |
| 0.7 → 1.0 H | `.hero__handle` (Sand) | chars `yPercent 100 → 0`, stagger .02 | `power3.out`, scrub |
| 1.0 → 1.2 H | — | hold (card + signature + handle), then the stage scrolls away | |

- The image's start values are explicit: GSAP reads a CSS `transform` back from the matrix as a px `y`, so a `.to()` would keep that px offset and tween a separate `yPercent`. `rest.imgY` comes from the probe, so the from-state equals the CSS rest exactly.
- **Geometry in JS (`hero.js`) is read from the rendered CSS, never recomputed:**

```js
function restGeometry(stage) {                      // from the .hero__arch probe
  const s = stage.getBoundingClientRect(), arch = stage.querySelector('.hero__arch');
  const a = arch.getBoundingClientRect(), cs = getComputedStyle(arch);
  const [rx, ry = rx] = cs.borderTopLeftRadius.split(' ').map(parseFloat);    // "179px 222px"
  return { W: s.width, H: s.height, imgY: parseFloat(cs.paddingTop),
           box: { top: a.top - s.top, left: a.left - s.left, right: a.right - s.left, bottom: a.bottom - s.top },
           r: { rx, ry, rxb: 0, ryb: 0 } };
}
function cardGeometry({ W, H }) {                   // ≈ 9:16, top at 20% so the centre sits at 49%
  const h = .58 * H, w = .575 * h, left = (W - w) / 2, top = .2 * H;
  return { box: { top, left, right: left + w, bottom: top + h }, r: { rx: 28, ry: 28, rxb: 28, ryb: 28 } };
}
const px = n => n.toFixed(2) + 'px';
function boxToInset({ box, r }, { W, H }) {         // always 12 numbers, all px, same order
  return `inset(${px(box.top)} ${px(W - box.right)} ${px(H - box.bottom)} ${px(box.left)} round `
       + `${px(r.rx)} ${px(r.rx)} ${px(r.rxb)} ${px(r.rxb)} / ${px(r.ry)} ${px(r.ry)} ${px(r.ryb)} ${px(r.ryb)})`;
}
```

  - **Radii are px.** Percentages inside `inset(… round …)` resolve against the reference box (the whole stage), not the inset rectangle. Measured: revision 1's `round 10% / 5.7%` drew 39 × 48 px elliptical corners, not 28 px.
  - Use function-based values (`clipPath: () => boxToInset(restGeometry(stage), …)`) with `invalidateOnRefresh:true`, so every `ScrollTrigger.refresh` re-reads the probe.
  - At scroll 0 the motion string draws the same box and radii as the static CSS (on phones `100vw` equals the stage width; in motion mode Lenis hides any classic scrollbar). So the modes match (item 19).
- Signature: Vanilla stroke, `width: 84%` of the stage (max 520 px), centred over the lower half of the card. It deliberately overflows the card (Lando ref `05`).
- The Lando snap: if `lenis.velocity > 100` when the signature trigger leaves its range, jump the timeline to 0 or 1, so it never freezes half-drawn.
- **Load (no hiding):** the wrapper **`.hero__photo`** (not the `img`) settles `scale 1.06 → 1` over 1.8 s `power2.out` on first paint, from `transform-origin: 50% var(--arch-top)`, so the arch top stays put under the lockup while the photo breathes. The `img` transform belongs to the scrub alone, so the first scroll after the settle cannot jump. It is visible throughout. The lockup is never hidden at load. No settle under reduced motion.

**Interaction:** none in the hero (scroll only). Tap targets live in the header.

**Complete at rest:** static mode is a 100svh cover with the eyebrow, the H1 and the arch photo, all visible and not overlapping at any viewport height (the copy is `z-index:2`, and the arch top is ≥ the H1 bottom + 16 px by construction). In motion mode at scroll 0, once the 1.8 s settle has finished, it is identical: same clip box and radii, same image transform.

### 4.2 Instagram profile `#instagram` (`.on-dark`, `data-theme="dark"`)

**Content:** the recreated profile screen `[data-ig-screen="profile"]` (`js/insights.js`, data from `data/metrics.json`).

**Copy:**
- Eyebrow (Sand): **On Instagram**. It is the section's heading: `<h2 id="ig-title" class="t-eyebrow">On Instagram</h2>` (styled as an eyebrow), and the section has `aria-labelledby="ig-title"`. Every section has exactly one `h2` (§8.2).
- Under the screen, `.t-intro` (Vanilla, centred): "Eight years of sponsored content, *one point of view.*" (`.t-accent` on the italic part)
- Link: **Follow @lorena_maruch ↗** → `https://www.instagram.com/lorena_maruch/` (`target="_blank" rel="noopener"`)

**Layout:**
- `background: var(--bg-dark)` and `padding-block: 24px var(--section-pad)`. It starts right where the hero stage ends, on the same colour, so the card visually hands over to the screen.
- The screen is 358 px wide (`--ig-shot-width: 358px`; max 430 on wide screens), centred, using the default 430pt device layout (≈ 358 × 280).
- Reserve its box before render: `[data-ig-screen="profile"]:not([data-ig-rendered]){aspect-ratio:358/280}`. Do the same for the other screens: summary 358/364, performance 358/747, audience 358/780.

**Effect (adapts `docs/animations.md` §4 "screenshot drop-in" + Lando eyebrow chars):**
- **How we drive `insights.js`/`motion.js` without breaking "complete at rest":** every placeholder starts with `data-ig-static`. `insights.js` auto-renders it on import with final values and no motion. That is the resting state.
- `onApproach(placeholder, upgrade)` (`root: document`, §4.0): remove `data-ig-static`, then call `renderScreen(el, metrics)` (exported) again. It rebuilds the card with `data-shot`/`data-count`, and `initMotion` arms it while it is still below the fold (up to ¾ of a viewport ahead). `motion.js` then plays it on entry: lift 34 px, overshoot 1.006, 1 s expo-out, then count-ups.
- The arming guard applies: if the placeholder's top is already `< innerHeight` when `upgrade` would run, skip the upgrade, so a visible screen is never re-rendered in view. Add `data-ig-flash` to this one screen only.
- motion.js's own play observers use the implicit root with a negative bottom margin. In the Artifact iframe that margin is ignored, so a screen plays as soon as it touches the viewport instead of 6% inside. That is harmless, and motion.js is not forked.
- The eyebrow does a line-highlight reveal (§4.3) with a Tobacco block.

**Interaction:** the link (44 px tall hit area). The screen has no interaction on touch; `data-ig-tilt` is desktop-only, so leave it off in v1.

**Complete at rest:** the static render shows every number. If `metrics.json` fails, the placeholder keeps its reserved box and `.ig__fallback` text appears below it ("39.2K followers · 1.9M views in the last 30 days", written in the HTML, shown when `[data-ig-rendered]` is missing after boot).

### 4.3 About `#about` (`data-theme="light"`)

**Content:** `assets/img/portrait-about.jpg` (sitting in black on a wooden ledge, the kit's About photo). Text from `data/content.json` → `about`.

**Copy:**
- Lockup `.t-lockup--offset` (the kit homage, used once on the page): "ABOUT / *Lorena*" (`<span class="t-sans">About</span> <span class="t-serif">Lorena</span>`)
- `.t-body`: "Film graduate. Eight years creating sponsored content on Instagram, and creative direction for national and international brands in fashion, beauty, food and fitness."
- Roles (`.t-caption` in `--ink`, one line, `·` separators): **Content creator · Model · Actress · Art director**
- Statement `.t-statement` (line-highlight reveal): "I make *slow,* warm stories about *places,* food, style *&* self-care." The accent words are `.t-accent`, serif italic at 1.04em. **Copy for client approval.**

**Layout:**
- The section starts with an **arch** that rises over the dark block: `.about__arch`, `position:absolute; top:0; left:0; right:0; height:12svh; transform:translateY(-99%); background:var(--bg); clip-path:ellipse(70% 100% at 50% 100%)`.
- The section itself has `background:var(--bg)`, `position:relative` and `padding-block: var(--space-2xl) var(--section-pad)`.
- Stacking order:
  1. Eyebrow "About".
  2. The offset lockup, left-aligned, with the italic pushed right.
  3. The photo frame: 78% wide (279 px), right-aligned, `aspect-ratio:4/5`, `--radius-photo`, `--shadow-soft`, `margin-top: -24px` so it tucks under the italic.
  4. The body text at max 32ch.
  5. The roles line.
  6. 64 px of space.
  7. The statement (full width, left-aligned, 4–5 lines).

**Effects:**
- Arch (Conectaa §4.3): scrub `clip-path` with `fromTo` from `ellipse(55% 100% at 50% 100%)` to `ellipse(100% 100% at 50% 100%)` while the section top travels from `bottom` to `top 40%`, `scrub:true`. The dome widens as it rises. Resting CSS is `ellipse(70% …)`.
- **Oval lockup reveal (Lando §5.4)** applies to every `.t-lockup` below the hero (h2 and h3):
  - On arm, wrap each line in an `overflow:clip` div. Set wrap `clip-path: ellipse(20% 0% at 50% 0%)`, line `yPercent -40`, sans chars `yPercent -40`.
  - Play at `top 90%`:
    - wraps → `ellipse(100% 120% at 50% 0%)`, 1.5 s `power2.inOut`, stagger .15 per line;
    - lines → `yPercent 0`, 1.5 s `power2.inOut`, delay `.15 + .1·line`;
    - sans chars → 0, 1.5 s, stagger `{amount: .015·n, from:'center'}`;
    - the serif line moves as a block, offset +0.1 s (Type §7.7).
  - On complete, unwrap or leave the wraps in place, with no clip-path left on them.
- **Image curtain (Lando §4.2)** on the photo frame:
  - frame clip `fromTo` `ellipse(120% 0% at 50% 0%)` → `ellipse(120% 120% at 50% 0%)`, 0.8 s `power2.out`;
  - a child wash `div` (Sand on light, Tobacco on dark), `position:absolute; inset:0; z-index:5`: clip `ellipse(120% 120% at 50% 100%) → ellipse(120% 0% at 50% 100%)`, 0.6 s `power2.out`, starting 0.4 s in;
  - play at `top 85%`.
- Inner parallax on the photo: `img{height:calc(100% + 48px)}`, `y 0 → -48px`, from `top bottom` to `bottom top`, `ease:none`, `scrub:true`.
- **Line highlight (Lando §5.5)** on the statement:
  - SplitText `{type:'lines', mask:'lines', autoSplit:true, aria:'none'}` (§4.0). With `autoSplit`, build the tween inside `onSplit(self)` and return it, so a re-split after a resize or font load stays in sync;
  - per line i, the line clip goes (`fromTo`) `inset(0px 100% 0px 0px)` → `inset(0px 0% 0px 0px)`, 0.6 s `power2.out` at `i·.15`;
  - a Tobacco block (`position:absolute; inset:0; transform-origin:right`) goes `scaleX 1 → 0`, 0.6 s `power2.inOut` at `i·.15 + .3`;
  - play at `top 85%`.
  - Use the same effect on section eyebrows and stat labels. Keep it to those; headings use the oval reveal.

**Complete at rest:** all text and the photo are visible. The arch is a static shape.

### 4.4 Content `#content` (`data-theme="light"`)

The heart of the site: the client's favourite fanned-cards section, then one chapter per niche with the Conectaa-style vertical video.

#### 4.4a The fan (adapts Lando §3 + the client's screenshot)

**Content:** 7 highlight videos, `data/videos.json → fan` (§6.6). The default focus is index 3, `stays-03` (a real video).

**Copy:**
- A niche icon (decorative): 4 inline 40 px line icons in Tobacco, stroke 1.5: a key or bed (stays), fork and knife (food), hanger (fashion), serum bottle (care). They cross-fade through **one** 4.8 s cycle (1.2 s each, 0.3 s fades) that ends back on the first icon, then rest there. The cycle replays each time the fan section re-enters the viewport (`root: document` IO toggling `.is-cycling`; CSS `animation-iteration-count: 1`). Each run is under 5 s, so it needs no pause control (WCAG 2.2.2). Static first icon under reduced motion. `aria-hidden`.
- H2 lockup: "MY CONTENT / *in motion*" (`<span class="t-sans">My content</span> <span class="t-serif">in motion</span>`)
- `.t-caption` (Moss): **Swipe to browse<span class="fan__soundhint"> · tap for sound</span>** ("click for sound" on fine pointers). `.fan__soundhint` is hidden while the focused card has no playable sound (poster-only, or `audio:false`).
- Live caption under the fan (`aria-live="polite"`): an eyebrow with the focused card's category ("Stays") + a `.t-intro` with its title ("A bath with a view") + a text link "More stays ↓" → the chapter.
- Controls row: prev button (←), counter "04 / 07" (`.t-caption`, tabular), next button (→).

**Layout at 390:**
- One fan unit: `--r: clamp(8.9px, 2.7778vw, 13.33px)` (Lando's mobile rem = 10.83 px at 390), `--fan-k: 1.18` below 992 px, and `--u: calc(var(--r) * var(--fan-k))` = **12.78 px at 390**.
- Card: `width: calc(var(--u) * 14)` = **179 px**, `aspect-ratio: 9/16` (318 px tall), radius `--radius-card`, `overflow:clip`, `--shadow-card`, `backface-visibility:hidden`, `will-change:transform` (fan cards and hero photo only).
- Fan box: full-bleed, `height: calc(var(--u) * 36)` = 460 px, cards `position:absolute` at the centre.
- The section clips x (`overflow-x:clip`). **The outer cards bleed past the screen edges on purpose**, as on Lando mobile.
- The section's top padding holds the icon, lockup and hint (~260 px). The caption and controls sit below the fan.

**Slot table** (Lando's per-index table used as slots; mobile x; desktop ≥ 992 uses Lando's DESK x values with k = 1). Values in `u`, px at 390:

| slot | scale | rotation | x | y | z |
|---|---|---|---|---|---|
| 0 | .7756 | −21° | −15u (−191.7) | 7.3u (93.3) | 1 |
| 1 | .8498 | −14° | −11u (−140.6) | 4u (51.1) | 2 |
| 2 | .9346 | −7° | −6u (−76.7) | 1.3u (16.6) | 3 |
| 3 (focus) | 1 | 0° | 0 | 0 | 10 |
| 4 | .9346 | 7° | 6u | 1.3u | 3 |
| 5 | .8498 | 14° | 11u | 4u | 2 |
| 6 | .7756 | 21° | 15u | 7.3u | 1 |

- **Static/rest CSS** already places the cards in their slots: `.fan__card{transform: translate(calc(var(--x)*var(--u)), calc(var(--y)*var(--u))) rotate(var(--rot)) scale(var(--s)); z-index:var(--z)}`. `fan.js` renders the 7 cards from `videos.json` at boot (not on an observer) and writes each card's custom properties for its slot, so the arc is complete without GSAP. GSAP takes over transforms in motion mode. Without JS, the fan box holds only the lockup and a `<noscript>` line, "Videos need JavaScript."
- **Entrance** (Lando §3.3, once, armed on approach, plays at `top 85%`):
  - from-state: every card at slot-3 position with `y: +10u`, `scale 1`, `rotation 0`. Visible, just stacked lower.
  - step 1: `y → 0`, 0.8 s `power2.out`, stagger `{amount:.5, from:'end'}`;
  - step 2: to its slot, 1.2 s `elastic.out(1, 0.75)`, stagger `{amount:.2, from:'center'}`, at `-=0.4`.
  - The focused card becomes video-eligible as soon as the fan is ≥ 35% visible, so **its footage is already playing while the deck springs open** (the Conectaa feel).
- **Focus carousel (our touch adaptation; Lando's tap-as-hover is awkward on phones, see their ref `16`):** card `i` sits in slot `s = mod(i − focus + 3, 7)`, so the arc is always full.
  - On a focus change, every card tweens to its new slot: 0.5 s `elastic.out(1, 0.75)`, `overwrite:'auto'`, delay `0.02 × |Δslot|`. Its z-index is set at tween start.
  - **A card that wraps around** (from slot 0 to 6 or back) goes `opacity → 0` in 0.15 s, jumps to the opposite park position (±19u, y 11u, ∓28°, scale .7), then tweens into its slot with `opacity → 1`.
  - Input:
    - **Swipe** horizontally on the fan with pointer events. `touch-action: pan-y` and `data-lenis-prevent-horizontal` on the fan box. `|dx| > 40 px` and `|dx| > 1.2 |dy|` gives `focus ±1` (swipe left = next).
    - **Tap a side card** → focus that card. If the fan owns sound, the new focused card inherits it inside that handler (§6.4); if the new card is poster-only, the old one is muted and nobody owns sound.
    - **Tap the focused card** → `video.toggleSound(card)` (§6.4) when it has a `<video>` with sound. A focused poster-only card (or `audio:false`) does nothing on tap.
    - Prev/next buttons and ← → keys when the fan region has focus.
  - Each focus change updates the caption, the counter and `aria-label`s.
- **Desktop (≥ 992, `(hover:hover) and (pointer:fine)`, later polish but the logic ships):** Lando §3.4 hover lift-and-spread on the current arrangement (hovered card `y − 2.5u`, `scale × 1.08`, neighbours pushed `8·p·c` u), 0.5 s elastic; click a side card to focus it.

**Click ownership (one owner per tap, so sound never toggles twice).**
- **`fan.js` owns every click on a fan card.** Fan cards carry `data-fan`, and `video.js` binds its card-level click only on `[data-vcard]:not([data-fan])` (§6). `fan.js` calls `video.toggleSound(card)` and `video.setEligible(card, bool)`; it never touches `muted`/`play()` itself.
- Stacking inside each card: media (`.vcard__media`, z 0) < `.fan__hit` (z 1) < `.vcard__sound` / `.vcard__pause` (z 2). The two buttons call `event.stopPropagation()`, so a tap on them is never also a tap on the card. Both stay reachable: `elementFromPoint` at their centres returns the button (item 26a).
- Sound and pause buttons are only shown (and only focusable) on the focused card.

**Interaction and accessibility:**
- The fan box is `role="group" aria-roledescription="carousel" aria-label="Content highlights" tabindex="0"`.
- Each card has an invisible full-size `<button class="fan__hit">`. Its label depends on the card:
  - side card: `aria-label="Show: {title}"`, no `aria-pressed`;
  - focused card with video and sound: `aria-label="Sound for {title}"`, `aria-pressed` = the card has sound;
  - focused poster-only card: `aria-label="{title}, video coming soon"`, no `aria-pressed`; tapping does nothing to sound;
  - focused card with `audio:false`: `aria-label="{title}, no sound"`, no `aria-pressed`.
- The sound button on the focused card is 40 px visual with a 48 px hit area.
- Prev/next are 44 × 44.

**Complete at rest:** static mode shows the full arc with posters, the caption and the controls. Posters are images and are always visible.

#### 4.4b Category chapters `#stays`, `#food`, `#fashion`, `#care`

There are four `<article class="chapter">` blocks, rendered from `data/videos.json → categories` at boot (the heading copy is also static in the HTML).

**Copy** (the eyebrow, then an h3 `.t-lockup--sm`, then a one-line `.t-caption` in Moss):

| id | Eyebrow | Lockup (sans / *serif*) | Subtitle |
|---|---|---|---|
| `#stays` | 01 · Stays | HOTELS & / *Stays* | Hotels, cabins and glamping, filmed like a short escape. |
| `#food` | 02 · Food | RESTAURANTS / *& food* | Tables, tastings and slow breakfasts. |
| `#fashion` | 03 · Fashion | FASHION / *& style* | Looks in motion, from details to full outfits. |
| `#care` | 04 · Skin & hair | SKIN & / *Hair care* | Rituals, textures and real routines. |

**Layout at 390 (each chapter ≈ 1,100 px):**
- `padding-block: var(--space-4xl) 0`, then centred heading text.
- **Feature card** (Conectaa §5.2): `width:min(78vw, 320px)` = **304 × 540**, centred, radius `--radius-card`, `--shadow-card`. Its caption is below it: the title in `.t-intro` at 18 px, plus "Stays · 0:22" in `.t-caption` when a duration is known.
- **Thumb rail** under it: `display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-padding-inline:var(--pad-x-l); overscroll-behavior-x:contain; scrollbar-width:none`, with `data-lenis-prevent-horizontal`.
  - It is full-bleed with gutter padding.
  - The thumbs are `<button type="button">`s, 120 × 213, radius `--radius-sm`, holding a thumb image only (`alt=""`). Each button carries its own name: `aria-label="Play: {title}"`, or `aria-label="Show: {title}"` for a poster-only item.
  - Edge fade: `mask-image: linear-gradient(90deg, #000 85%, transparent)`.
  - The active thumb has a 2 px Mahogany ring and `aria-current="true"`; every other thumb has no `aria-current`.

**Effects:**
- The lockup gets the oval reveal and the eyebrow gets the line highlight.
- **Dealt entrance on the feature card** (Conectaa §4.1/§5.3, scrubbed): from `y:110, scale:.94, rotation:[-2.5, 2, -1.5, 2.5][chapterIndex]` to rest, `power3.out`, trigger the card, `start:'top 100%'`, `end:'top 55%'`, `scrub:.5`.
  - **No opacity in this tween**: the card is never transparent.
  - Playback starts at 35% visibility of the transformed card, so the clip is already running while the card lands.
- Rail thumbs rise once (`y 24 → 0`, stagger .06, 0.6 s `power3.out`, at `top 92%`).

**Interaction:**
- Tapping the feature card, or its sound button, toggles sound (§6.4). The feature card is a plain `[data-vcard]` (no `data-fan`), so `video.js` owns its card-level click.
- The feature card always contains a `<video>` element, even while it shows a poster-only item (then the video is `hidden`, has no `src`, and `data-has-video="false"`).
- Tapping a thumb **swaps the feature card** with `video.swapSource(card, item)` (§6), called **synchronously inside the thumb's `click` handler**. iOS only allows unmuted `play()` inside the gesture, and assigning `src` reloads the element and stops any playback started before it, so the order is fixed:
  1. put the new poster on the `<img class="vcard__poster">` layer at opacity 1 (remove `.is-live`);
  2. assign `video.poster` and `video.src` for the new item;
  3. `video.muted = false`, then `video.play()`;
  4. run the unmute safety check (§6.4);
  5. make this card the sound owner (the previous owner is muted);
  6. update the caption, the thumb `aria-current` and the labels.
  - **No timer gates any of these calls.** The 0.35 s cross-fade is visual only: the poster fades out on the new source's first `playing` event (guard with a swap token, so a late event from the old source is ignored).
- A thumb whose item has no `src` yet: steps 1 and 6 only. The video is paused, its `src` removed, `data-has-video="false"`; the sound and pause buttons hide, the card releases sound if it owned it, and the still gets the single Ken Burns pass (§6.1).

**Complete at rest:** every chapter heading, feature poster and rail of posters is visible after boot render. Static fallback: the headings are in the HTML, and the boot render runs at load (not on an observer).

### 4.5 Numbers `#numbers` (`data-theme="light"`)

**Content:** `data/metrics.json` (single source).

**Copy:**
- Eyebrow: **Instagram · last 30 days**
- Lockup: "BY THE / *numbers*"
- Three stats, each a `.t-number` + `.t-eyebrow` label (line highlight). **Labels come from `metrics.json`, never typed by hand**, because these are metrics shown to brands:
  - `1.9` + `<span class="u">M</span>`: **Views** (`kpis.views.label`)
  - `39.2` + `<span class="u">K</span>`: **Followers** (`kpis.followers.label`)
  - `+7,696`: **Net followers** (`kpis.netFollowers.label`). Revision 1 said "New followers", but +7,696 is the *net* figure; new follows were +8,919 (`kpis.follows`, flagged `verify`).
- Screen captions (`.t-eyebrow`, Moss): **Home**, **Performance**, **Audience**
- Footnote `.t-caption`: "Recreated from Lorena's Instagram insights, Oct 10 – Nov 8, 2026." Render the dates from `metrics.period`.

**Layout:**
- `padding-block: var(--section-pad)`, Vanilla.
- The stats stack centred with 32 px gaps.
- Then the three screens `[data-ig-screen="summary|performance|audience"][data-ig-static]`, each with its caption above, 358 px wide and 64 px apart.

**Data binding:**
- Number markup: `<p class="t-number"><span data-count data-metric="profile.dashboardCard.value">1.9</span><span class="u">M</span></p>`.
- At boot, `bindMetric()` reads the path, splits `/^([+\-]?[\d.,]+)(.*)$/` into number and unit, and writes both. That keeps the `.u` span intact: `motion.js` count-up replaces the counted element's text only.
- Paths: `profile.dashboardCard.value`, `profile.stats[1].value`, `kpis.netFollowers.value`.
- Labels: `<p class="t-eyebrow" data-metric-label="kpis.netFollowers.label">Net followers</p>`. `bindMetric()` writes the label text from the path too. The static HTML carries the same strings, so the page is right without JS.

**Effects:**
- Arm on approach: call `initMotion(statsEl)` from `onApproach`. It counts up (easeOutExpo, 1.6 s) at entry, with no layout shift (ghost copy).
- Labels get the line highlight. Screens upgrade from static to animated exactly as in §4.2 (drop-in, chart draws, bars grow, rail glide).

**Complete at rest:** final values are in the HTML and the static screens render at load.

### 4.6 Brands `#brands` (`data-theme="light"`, Surface band)

**Content:** `data/brands.json`, 46 logos in media-kit order. The files are solid-black SVGs, and **they are shown black, as delivered** (black on Surface is 15.7:1).

**Copy:**
- Eyebrow: **Partnerships**
- Lockup: "BRANDS I'VE / *worked with*"
- Caption `.t-caption` (in `--ink`, because Moss fails on Surface): "**46** brands across beauty, fashion, food, travel and fitness." The categories match `brands.json`. The count comes from `brands.length` and counts up via `<span data-count>46</span>`.
- Pause control: a 44 × 44 button, "Pause logos" / "Play logos", `aria-pressed`.

**Layout:**
- `background: var(--surface)`, `padding-block: var(--section-pad)`.
- Three full-bleed marquee rows, each **72 px** tall and 16 px apart. Logos are distributed `i % 3` across the rows and centred vertically in the row.
- Logo `<img>` height = **`44px × scale`** (the mobile base that `brands.json → _about.scale` recommends), `width:auto`, `margin-inline: 20px`. The tallest logos (Pousada Lumar, Vila Borê, scale 1.45) are 63.8 px, so every logo fits a 72 px row with ≥ 4 px to spare. The thinnest wordmarks are Guardaroba (8.8 px of ink height, 105 px wide) and Saint Studio (9.1 px). Both are all-caps wordmarks with tight bounds, so that is roughly 12–13 px type. Revision 1's 32 px base left nine wordmarks 6–12 px tall.
- **No recolouring.** Revision 1's full-row `mix-blend-mode: lighten` overlay is removed: it changed the delivered black logos, and it forced a non-composited blend over three continuously moving rows on every frame. A warm tint is open question 15. If the client wants it, bake tinted SVG copies at build time; never blend at runtime.
- **Accessible names:**
  - `alt` = `name` for every entry whose name does not contain "unidentified" (42 logos; e.g. "L'Atelier" keeps its apostrophe).
  - The 4 unidentified entries (`three`, `q-monogram`, `tom`, `or-monogram`, names like `"Q" monogram (unidentified)`) get `alt=""`, and their `<li>` gets `aria-hidden="true"`. They stay visible but are left out of the accessible list. Otherwise the page would publish names like '"3" (unidentified)'.
  - The first `<ul>` of each row has `aria-label="Brand partners, row n"`. Each row's `<ul>` is rendered twice; the second copy is `aria-hidden="true"`, and its images have `alt=""`.
- Row mask: `mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)` (with the `-webkit-` prefix).

**Effects (Lando §7.5):**
- WAAPI `track.animate([{transform:'translateX(0)'},{transform:'translateX(-50%)'}], {duration, iterations:Infinity})`, with `duration = halfTrackWidth / 56 px·s⁻¹` (a logo crosses 390 px in about 7 s).
- Rows 1 and 3 move left and row 2 moves right.
- **Direction follows scroll:** on Lenis scroll, if `lenis.direction` changes, ramp `playbackRate` to ±1 over 400 ms (rAF lerp).
- The whole row also drifts `x: ±6vw` (opposite per row), scrubbed across the section's pass.
- Pause the animations when the section is off-screen (IO).
- Load: one viewport ahead (`new IntersectionObserver(cb, {root: document, rootMargin: '0px 0px 100% 0px'})`, §4.0), set `loading="eager"` on all logo images. They start with `loading="lazy"`, which would not fetch horizontally clipped items. This hides nothing, so the arming guard does not apply.

**Reduced motion or paused:**
- Reduced motion: rows stop and become one centred, wrapping grid (`flex-wrap:wrap; justify-content:center; gap:20px 28px`, the same 44 px × scale heights) showing all 46 once, with the duplicates hidden.
- Paused: freeze in place.

**Complete at rest:** the rows render at boot (from JSON, not on an observer) and are visible immediately.

### 4.7 Gallery `#gallery` (`data-theme="light"`)

**Content:** 9 photos from `assets/img/gallery/` (WebP derivatives, §8.1), as static HTML `<figure>`s.

**Copy:**
- Eyebrow: **Selected photos**
- Lockup: "PHOTO / *Diary*"
- A serif line between groups 2 and 3, `.t-intro` centred: "*Light, texture and a little slowness.*" (for client approval)
- Captions: a `.t-eyebrow` in `--ink` above each photo (never Moss here, because the background scrubs toward Surface).

| Group | Left (56%, 200 px) | Right (40%, 143 px, `margin-top:80px`) | Single (74%, 265 px, centred) |
|---|---|---|---|
| 1 | `08` Stays · Glamping dome (frame 4/5) | `03` Details · Rings (4/5) | `22` Food · Breakfast bowl (3/4) |
| 2 | `17` Fashion · Yellow satin (3/5) | `02` Beauty · Chanel (4/5) | `09` Wellness · Massage with a view (3/4) |
| 3 | `18` Fashion · Garden dress (3/4) | `14` Jewelry · Pendant (4/5) | `29` Food · Wine, in black & white (3/4) |

- `alt` text comes from `data/inventory.json → photos.gallery[].description`.
- Layout: each group is a two-column pair, so items never overlap horizontally, followed by a centred single. Groups are 48 px apart, and the radius is `--radius-photo`.

**Effects:**
- Image curtain (as About; Sand wash) on every frame at `top 85%`. Pairs are staggered 0.12 s.
- Inner parallax (`img` 48 px taller, `y 0 → -48`, `scrub:true`).
- **Section background scrub** (Lando §4.3): `backgroundColor` Vanilla → Surface from `top 60%` to `bottom bottom`. CSS rest is Vanilla.

**Complete at rest:** every photo and caption is visible (the curtain arms only on approach). Images use `loading="lazy" decoding="async"` with `width`/`height`.

### 4.8 Contact and footer `#contact` (`.on-dark`, `data-theme="dark"`)

**Content:** `data/content.json → contact`, copied into the HTML. The signature (§7) and `assets/img/contact/06.jpg` (rust knit portrait, optional small card).

**Copy:**
- Signature (draws once)
- Eyebrow (Sand): **Contact**
- Lockup: "LET'S / *work together*" (Vanilla; the serif line may be Tobacco, which is large text, 4.42:1)
- `.t-intro` (Vanilla): "Campaigns, stays and creative direction. Based in Brazil, now travelling in Europe." The Europe part needs client confirmation (§10).
- Rows, each with an eyebrow label and the value as **selectable text** in `.t-body` 18 px:
  - **Email**: `lorenamaruch@gmail.com` + `[Copy]`
  - **WhatsApp**: `+55 31 99302-3248` + `[Copy]` + `[Open ↗]` → `https://wa.me/5531993023248`
  - **Instagram**: `@lorena_maruch ↗` → `https://www.instagram.com/lorena_maruch/`
  - **TikTok**: `@lorena_maruch ↗` → `https://www.tiktok.com/@lorena_maruch`
- **Every external link** on the page (these four, "Follow @lorena_maruch ↗" in §4.2, and any brand link) has `target="_blank" rel="noopener"`. Inside the Artifact iframe, a same-frame navigation to wa.me, Instagram or TikTok is refused by those sites' frame protections and leaves the viewer a broken frame; a new tab always works.
- Legal row (`.t-caption`, Sand): "© 2026 Lorena Maruch" · "Back to top ↑" (in-page router, §4.0). Optionally "Type: Mona Sans, Gilda Display, EB Garamond (SIL OFL)", and nothing more.
  - **No visible signature credit.** A public "Signature lettering: EMS Allure" line would tell brands that her signature is a font, and the OFL does not require crediting artwork made with a font. The EMS Allure credit lives in `assets/fonts/LICENSES.md` and in the source comment in `site.html` (§3.1).
  - **`assets/fonts/LICENSES.md`:** add a short "Signature placeholder" section (EMS Allure, SIL OFL 1.1, glyph centre-lines from `hersheytext@2.0.0`, used as drawn artwork). Reword line 30 to: "The reference site's commercial serif is not used and must not be copied. Mona Sans is used here from GitHub's official OFL release." As published, line 30 names the reference site, its agency and its font, which fails item 6.

**Layout:**
- The footer has `background: var(--bg-dark)`, a top radius of `--radius-panel` (an arch-like softened top edge) and `margin-top:-32px` so it overlaps the gallery's end.
- `padding-block: var(--section-pad) calc(32px + env(safe-area-inset-bottom,0px))` and `margin-bottom: calc(-1 * env(safe-area-inset-bottom,0px))`, so the colour runs under the home indicator.
- Signature: 70% wide, centred, Vanilla stroke. Then the lockup, the intro and the rows.
- Rows: a 1 px `--line-on-dark` divider and a min height of 64 px each. Copy buttons are 44 px tall pills with a 1 px Vanilla 40% border.
- **No `mailto:`/`tel:` as the only path** (both are unreliable in the Artifact). The visible value plus Copy is the primary path. You may wrap the email in a plain `mailto:` link as a convenience, but the Copy button must exist.

**Effects:**
- The signature plays once at `top 80%`: a 1.8 s timeline, `power1.inOut` over the constant-pen-speed path set (§7.3). It is armed on approach and drawn statically at rest.
- The lockup gets the oval reveal; the rows rise `y 16 → 0`, stagger .06, at `top 90%`.

**Copy button:**
1. Call `navigator.clipboard.writeText(value)`.
2. If that fails (blocked in an iframe), select the text node, call `document.execCommand('copy')`, and show the toast "Copied".
3. If both fail, leave the text selected and show "Press and hold to copy".

The toast is fixed at `bottom: calc(16px + env(safe-area-inset-bottom))`, centred, Vanilla on Mahogany, and stays for 1.6 s.

**Complete at rest:** everything is static text; the signature is fully drawn without JS.

---

## 5. Smooth scroll plan (must-have)

```js
// js/scroll.js (motion mode only)
const isIOS = /iP(hone|ad|od)/.test(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
const SYNC_TOUCH = new URLSearchParams(location.search).has('synctouch') ? true : !isIOS;
const lenis = new Lenis({
  lerp: 0.1, smoothWheel: true, wheelMultiplier: 1,      // the reference feel: 90% of a notch in ~384 ms, notches merge
  syncTouch: SYNC_TOUCH, touchMultiplier: 1.25, syncTouchLerp: 0.075,
  autoResize: true, infinite: false, autoRaf: false,
  anchors: false,                                        // in-page links go through ui.js (§4.0): Lenis 1.3.27's anchor handler does not preventDefault
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));               // one rAF loop for everything
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true });
window.lenis = lenis;                                     // tests read it
```

- **Wheel:** this is the exact reference configuration (Lando §2.1). The exponential glide is what makes a notched mouse wheel never feel chunky.
- **ScrollTrigger sync:** Lenis drives the native window scroll, so ScrollTrigger needs no `scrollerProxy`.
  - Do not use `ScrollTrigger.normalizeScroll()`.
  - Use `scrub:true` for parallax and colour scrubs (Lenis already smooths), and `scrub:.5` for the signature and dealt cards.
  - Never use `pin` on mobile: the hero uses CSS sticky.
  - Call `ScrollTrigger.refresh()` after fonts load and after the boot render of videos and brands.
- **Touch:** the reference uses `syncTouch:true` with `touchMultiplier:1.25`. We keep that **everywhere except iOS**, where native momentum stays: syncTouch can fight the iOS address bar and rubber-banding, and the client's must-have is the wheel. `?synctouch=1` forces it on for a device test (open question).
  - Horizontal scrollers (fan, thumb rails) carry `data-lenis-prevent-horizontal`, so horizontal gestures stay native and vertical ones stay Lenis.
- **Programmatic jumps:** `lenis.scrollTo(target, { duration:1.2, easing:t=>1-Math.pow(1-t,4) })`, with **no `offset`**: Lenis subtracts the target's `scroll-margin-top` (`--anchor-offset`) itself. All in-page links use this through the router in §4.0. Stop and start Lenis around the menu (a stopped Lenis ignores `scrollTo`).
- **Reduced motion:** **do not construct Lenis at all**. Lenis 1.3.27's `respectReducedMotion` (default on) makes programmatic jumps and wheel steps instant, but Lenis would still intercept every wheel event (`preventDefault`) and re-dispatch it as its own scroll. Native scroll is simpler and keeps the browser's own behaviour.
  - Native scroll, no scrubs, every effect in its final state, `html{scroll-behavior:auto}`.
  - If the preference turns on mid-session, `lenis.destroy()` inside `finishAll()`.
- **Inside the claude.ai Artifact (iframe):** Lenis runs on the iframe's own window. The wheel over the page is consumed by Lenis (`preventDefault`), so the parent never scrolls (expected).
  - `position:fixed` and `svh` refer to the iframe viewport. Safe-area insets are 0.
  - `IntersectionObserver` works, **but an implicit root ignores `rootMargin` in the iframe** (verified with a cross-origin iframe in Chromium). Every lookahead observer therefore uses `root: document` (§4.0). Item 42 tests this cross-origin.
  - Wrap any `sessionStorage`/`localStorage` access in try/catch. Not needed in v1: there is no loader.
  - Do not use the Fullscreen API.
  - Links: every external link opens in a new tab (`target="_blank" rel="noopener"`, §4.8); in-page links go through the router (§4.0).
  - Test in a sandboxed, **cross-origin** iframe (§9, item 42).
- Native `scroll-behavior:smooth` must stay off while Lenis runs (CSS `html.lenis{scroll-behavior:auto}`).

---

## 6. Video cards plan (Conectaa behaviour, adapted)

Implement `js/video.js` from Conectaa §5.9, with the deltas below. The rules in Conectaa §5.4–5.6 apply as written unless this section overrides them.

**Public API (`fan.js` and the chapter renderer use only these):**

```js
export function register(card)               // idempotent; see bindings below
export function toggleSound(card)            // the card's tap action and the only path that unmutes; call it synchronously inside a click / pointerup / keydown handler.
                                             // Autoplay allowed: toggle sound (Conectaa toggle). Reduced motion / data saver / blocked: play with sound, or pause (Conectaa userPlayPause).
export function setEligible(card, eligible)  // fan focus (§6.2); non-fan cards are eligible by default
export function swapSource(card, item)       // thumb swap (§4.4b): synchronous, inside the thumb's click handler
```

`register(card)` binds:
- `.vcard__sound` `click` → `e.stopPropagation(); toggleSound(card)`;
- `.vcard__pause` `click` → `e.stopPropagation()`, pause or resume, set `userPaused`;
- a card-level `click` **only on `[data-vcard]:not([data-fan])`** (chapter feature cards): `toggleSound(card)`. Fan cards get no card-level listener: `fan.js` owns those clicks (§4.4a), so one tap can never toggle twice;
- `pointerenter`/`pointerleave` (mouse only) for hover-to-hear (§6.4), on fan cards only while they are focused.
- **Cards without a `<video>` are skipped for all media logic.** Conectaa's sketch would throw on `c.v === null`, and 19 of today's 22 items are poster-only. For those cards, `register()` only attaches the Ken Burns in-view observer (§6.1).

### 6.1 Card markup (rendered by `fan.js` and the chapter renderer from `videos.json`)

```html
<figure class="vcard" data-vcard data-id="stays-03" data-has-video="true" data-audio="true">
  <div class="vcard__media">
    <img class="vcard__poster" src="assets/video/posters/stays-03.webp" alt="" width="540" height="960" decoding="async" loading="lazy">
    <video class="vcard__video" muted playsinline loop preload="none" disablepictureinpicture disableremoteplayback
           controlslist="nodownload noplaybackrate nofullscreen"
           aria-label="Lorena relaxing in a freestanding bathtub inside a geodesic dome with green mountain views."></video>
  </div>
  <button class="vcard__sound" type="button" aria-pressed="false" aria-label="Turn sound on">…2 icons…</button>
  <button class="vcard__pause" type="button" aria-pressed="false" aria-label="Pause video">…</button>
  <span class="vcard__hint" aria-hidden="true">Tap for sound</span>
</figure>
```

- Fan cards add `data-fan` and the full-size `<button class="fan__hit">` between the media and the buttons (§4.4a).
- Set the `muted` attribute **and** `video.muted = true` **before** assigning `src` (iOS autoplay).
- `src` **and `poster`** are set at warm-up (§6.3), not in the HTML. The `poster` attribute is not lazy: every `<video poster>` created at boot fetches its image at once, whatever `preload` says. With up to 11 boot-rendered video cards × ≤ 70 KB, that alone would break the 700 KB first-view budget. The `<img class="vcard__poster">` (lazy) covers the card until `playing`.
- `data-has-video="false"` (no `src` yet): fan cards have no `<video>` (the chapter feature card keeps a hidden one, §4.4b). The sound and pause buttons are hidden, and the poster gets **one Ken Burns pass**: `scale 1 → 1.06`, `translate 0 → -1% -1%`, 4.5 s ease-in-out, `animation-iteration-count:1; animation-fill-mode:forwards`. It starts when the card enters the viewport and replays only after the card has fully left and comes back (`root: document` IO toggling `.kb-run`). Each run is under 5 s, so no pause control is needed (WCAG 2.2.2); revision 1's infinite alternate drift had none. None under reduced motion.
- `data-audio="false"`: hide the sound button.
- Styles per Conectaa §5.2 with our tokens:
  - radius `--radius-card` with `clip-path: inset(0 round var(--radius-card))` for Safari;
  - background `--mahogany` while nothing is decoded;
  - sound button bottom-right, 40 px + 48 px hit area, frosted Vanilla; in the `on` state, solid Vanilla with a Mahogany icon and 3 equaliser bars.
- **Pause button** (WCAG 2.2.2, Conectaa open question 2): bottom-left, mirroring the sound button, same size, shown whenever the card is playing. It pauses or resumes that card and sets `userPaused`, which the scheduler respects.
- Hint pill: top-left, 11 px caps, Vanilla on `rgba(77,52,45,.55)` with a 10 px backdrop blur. "Tap for sound" on coarse pointers, "Click for sound" on fine ones. It shows once on the first card that starts playing and fades after 2.5 s.

### 6.2 Who may play

| Card | Eligible to autoplay |
|---|---|
| Fan | **only the focused card** (`fan.js` calls `setEligible(card, bool)` on focus change) |
| Chapter feature | yes |
| Rail thumbs | never (images only) |

- Scheduler: the Conectaa `reconcile()` logic. Play at ratio ≥ .35, pause below .15 (keep `currentTime`).
- **Max 2 playing on mobile** (`(pointer:coarse)` or width < 768) and 3 on desktop. The most visible cards win, and the sound owner always counts.
- `visibilitychange` pauses everything. `navigator.connection?.saveData` means no autoplay (poster + play glyph).
- A rejected `play()` (iOS Low Power Mode) adds `.is-blocked`: the poster stays and a 52 px play glyph appears. A tap plays the video (the tap goes through `toggleSound`, so it plays with sound). Tested in item 33a.

### 6.3 Loading

- Warm-up IO `new IntersectionObserver(cb, {root: document, rootMargin: '100% 0px'})` (§4.0; with the implicit root, the Artifact iframe would assign `src` only once the card is already visible): set `muted`, then assign `poster` and `src` together, and set `preload='metadata'` once.
- On the first `playing` event, add `.is-live`; the poster fades out over 0.45 s.
- Fan side cards never get `src` until they become focused (or reach slot 2/4, to pre-warm the next swipe).

### 6.4 Sound

**There is one `soundOwner` page-wide.**

**Touch (the v1 target):**
- A tap on the sound button **or anywhere on the card** (focused fan card or feature card) toggles sound, always through `toggleSound(card)`: `fan.js` calls it for fan cards (§4.4a), and `video.js`'s card-level listener for feature cards. Use `click`, which is not fired after a scroll drag.
- Inside the handler, synchronously: `muted=false`, `play()`, then the unmute safety check from Conectaa §5.5. If the video paused, re-mute, replay and show the hint.
- **Fan delta:** if the fan owns sound and the focus moves (swipe `pointerup` or button `click`, both user activations), the new focused card inherits sound inside that handler. The old one is muted and paused. This is Reels-like.
- **Owner scrolls away** (ratio < .15): fade, mute and release (Conectaa's deliberate change). No resume with sound.

**Desktop (fine pointer):** ships the Conectaa table (Conectaa §5.5). Hover reveals the controls and the "Click for sound" hint while sound is locked, and the video keeps playing muted (never `muted=false` on hover while locked). The first click on a video card unmutes and pins the sound, and a successful unmute safety check unlocks the page. From then on, hover-to-hear works after a 180 ms intent delay with volume fades (300 ms in, 200 ms out); leaving re-mutes temporary sound, and clicking pins it. There are no volume fades on iOS (`volume` is read-only). Tested in items 33c–33d.

**Unmute blocked:** if the safety check finds the video paused after `muted=false` (or `play()` rejects), re-mute, replay muted, mark sound as locked and show the hint (`.needs-gesture`). Tested in item 33b.

**Artifact:** sound needs a tap or click **inside** the page; activation does not propagate down from claude.ai. Muted autoplay works.

### 6.5 Reduced motion and data saver

- No autoplay. Poster + centred 52 px play glyph.
- A tap plays **with sound** (that card becomes the owner); a second tap pauses.
- No equaliser animation, no Ken Burns, no icon cycle, no hint animation.
- Card entrances are reduced to their final state.

### 6.6 `data/videos.json` (new; the single source for every video card)

```jsonc
{
  "version": 1,
  "categories": [
    { "key": "stays",       "anchor": "stays",   "eyebrow": "01 · Stays",        "sans": "Hotels &",    "serif": "Stays",     "subtitle": "Hotels, cabins and glamping, filmed like a short escape.", "feature": "stays-06" },
    { "key": "restaurants", "anchor": "food",    "eyebrow": "02 · Food",         "sans": "Restaurants", "serif": "& food",    "subtitle": "Tables, tastings and slow breakfasts.",                    "feature": "restaurants-03" },
    { "key": "fashion",     "anchor": "fashion", "eyebrow": "03 · Fashion",      "sans": "Fashion",     "serif": "& style",   "subtitle": "Looks in motion, from details to full outfits.",           "feature": "fashion-03" },
    { "key": "skincare",    "anchor": "care",    "eyebrow": "04 · Skin & hair",  "sans": "Skin &",      "serif": "Hair care", "subtitle": "Rituals, textures and real routines.",                     "feature": "skincare-03" }
  ],
  "fan": ["fashion-01", "restaurants-04", "stays-05", "stays-03", "skincare-03", "restaurants-03", "fashion-03"],
  "fanFocus": 3,
  "videos": [
    {
      "id": "stays-03",                       // stable id = docs/media-request.md code (hospedagens-03 → stays-03)
      "category": "stays",                    // categories[].key
      "title": "A bath with a view",          // ≤ 32 chars, shown in captions
      "alt": "Lorena relaxing in a freestanding bathtub inside a geodesic dome with green mountain views.",
      "src": "assets/video/stays/dome-bathtub.mp4",   // null until the file arrives → poster-only card
      "poster": "assets/video/posters/stays-03.webp", // 540×960 WebP; first frame of src when src exists
      "thumb": "assets/video/thumbs/stays-03.webp",   // 240×427 WebP
      "duration": 22.2,                       // seconds or null
      "audio": true,                          // false → no sound button; null = unknown (treated as true when src exists)
      "brand": null,                          // brand slug from data/brands.json, optional
      "order": 3                              // order inside its category rail
    }
  ]
}
```

**Validation, run in `site.js` at boot, with `console.warn` and never a throw:**
- ids are unique;
- every `fan[]` and `feature` id exists;
- `src` ends in `.mp4`;
- `poster` exists for every item.

**Adding a real video later = encode it (§6.7) + set `src`, `poster`, `duration` and `audio`.** No HTML or JS change.

**Initial content.** Three files exist and are encoded (720 × 1280, H.264 + AAC):

| id | title | src (now) | duration |
|---|---|---|---|
| stays-03 | A bath with a view | `assets/video/stays/dome-bathtub.mp4` (3.4 MB) | 22.2 s |
| stays-05 | Inside the A-frame | `assets/video/stays/aframe-living-room.mp4` (9.8 MB) | 29.1 s |
| stays-06 | One day in an A-frame | `assets/video/stays/aframe-one-day.mp4` (11.1 MB) | 51.3 s |

These 19 are poster-only (`src: null`, poster from `assets/video/_ref/<id>.jpg` → WebP), with titles:
- **stays:** 01 Breakfast in the dome · 02 The one-woman band · 04 Sunset over the valley
- **restaurants:** 01 Gnocchi night with Pronto Light · 02 A colorful plate · 03 A glass of white · 04 Breakfast among plants
- **fashion:** 01 Soft light, brown jacket · 02 Silk on the deck · 03 Yellow satin by the lake · 04 Sandals & white linen · 05 The terracotta clutch · 06 Gold earrings, black blazer
- **skincare:** 01 A slow morning ritual · 02 Brushes & glow · 03 Chanel, after the bath · 04 At the beauty counter · 05 Hair care, mirror time · 06 Espresso by the window

Take the `alt` for each from `data/inventory.json → videos.*[].description`.

**Caveat:** the `_ref` thumbnails are low-res (≈ 600 px wide) and about 3:4. As 9:16 posters they crop about 24% of their width and look soft on 3× screens. They are acceptable as interim posters only.

### 6.7 Encoding and posters

- Videos: `scripts/encode-video.sh in out.mp4 poster.jpg` (720 × 1280, 30 fps, CRF 23, ≤ 3 Mbps, capped at 12 MB, AAC 128k, `+faststart`, first-frame poster).
- `scripts/make-images.py` builds from that poster JPEG (or the `_ref` JPG): `posters/<id>.webp` (540 × 960, q 78, cover-crop to 9:16) and `thumbs/<id>.webp` (240 × 427, q 72).
- Run Python with `python3 -I`. PIL 12 and ffmpeg's libwebp are available.

---

## 7. Signature

### 7.1 What we build now (placeholder)

A **monoline SVG "Lorena"** built from the OFL single-stroke font **EMS Allure** (a centre-line version of Allura; glyph polylines from the `hersheytext@2.0.0` package, `svg_fonts/EMSAllure.svg`).
- The prototype's glyph data for `L o r e n a` plus its Catmull-Rom smoothing is in `…/scratchpad/understand/lando/proto/proto.html` (lines 100–137) and is the reference implementation.
- `scripts/make-signature.mjs`:
  1. Embeds those 6 glyph polylines (credited OFL).
  2. Composes the word by x-advance and flips y.
  3. Smooths with Catmull-Rom → cubic Bézier.
  4. Prints **9 `<path>`s in writing order** plus a tight `viewBox` (≈ 2,840 × 980 units for "Lorena", padded by one stroke width so round caps are not clipped).
  5. Emits `stroke-width` **in viewBox units**, ≈ 0.95% of the viewBox width (≈ 27 units: 3.1 px at the hero's 328 px, 2.6 px at the footer's 273 px), on the `<svg>` or on each path. The stroke then scales with the SVG.
- Paste the output **inline twice** in `site.html` (hero and footer). Each needs its own paths, because `<use>` instances cannot be drawn independently.
- Attributes: `fill:none; stroke:currentColor; stroke-linecap:round; stroke-linejoin:round`, plus the emitted `stroke-width`. No CSS `stroke-width`. Colour: Vanilla on dark, Mahogany on light. `overflow:visible` on the `<svg>`.
- **Never `vector-effect: non-scaling-stroke`.** With it, Chromium applies `stroke-dasharray`/`stroke-dashoffset` in screen pixels, not user units. Verified: a 2,800-unit path drawn 280 px wide with `dashoffset = 0.5 × getTotalLength()` rendered fully inked (280 px), and the same path without `vector-effect` rendered exactly half (140 px). With revision 1's attributes, each stroke would appear in the first ~10% of its tween and then hold, so the hero scrub and the footer play would pop instead of writing at constant pen speed. With the stroke in user units, the dash lengths from `getTotalLength()` are correct at any size, and nothing needs rebuilding on resize.

### 7.2 Static state

Without JS or under reduced motion, the paths are fully drawn (no dash properties in CSS). The hero copy is hidden in static mode (§4.1), so only the footer shows it.

### 7.3 Draw (both placements)

```js
export function signatureTimeline(svg, { penLift = 0.04 } = {}) {
  const paths = [...svg.querySelectorAll('path')];
  const lens = paths.map(p => p.getTotalLength()), total = lens.reduce((a, b) => a + b, 0);
  const tl = gsap.timeline({ paused: true });
  let at = 0;
  paths.forEach((p, i) => {
    gsap.set(p, { strokeDasharray: lens[i], strokeDashoffset: lens[i] });    // set only when armed
    const d = lens[i] / total;                                                // constant pen speed
    tl.to(p, { strokeDashoffset: 0, duration: d, ease: 'none' }, at);
    at += d + penLift;
  });
  return tl;                                                                 // hero: scrubbed; footer: tl.duration(1.8) + power1.inOut
}
```

- Hero: `ScrollTrigger.create({ trigger:'#top', start:()=>'top+=' + .55*H + ' top', end:()=>'top+=' + 1.15*H + ' top', scrub:.5, animation: tl })`.
- Footer: armed on approach, played at `top 80%`.
- Optional pen-tip: a 6 px Vanilla dot that follows the active path end via `getPointAtLength` (Lando's look).

### 7.4 Flag: a real signature is better

Ask Lorena to sign "Lorena" 3–5 times with an Apple Pencil, in an app that exports **strokes, not fills**: Procreate → SVG is fills, so use Linearity Curve, Concepts, or Illustrator with a pencil brush. Alternatively, sign with a fine felt pen on white paper and we trace the centre line. We need one `<path>` per pen stroke, in writing order. If only a filled scan exists, use the mask technique (Lando §6.2 step 4). Replacing the placeholder only changes the paths (keep `stroke-width` in viewBox units). Then drop the EMS Allure credit from `LICENSES.md` and the `site.html` source comment.

---

## 8. Performance, accessibility, reduced motion

### 8.1 Budget

| Item | Budget | How |
|---|---|---|
| Fonts | 3 WOFF2, 118 KB total; preload 2 (sans 76 KB, italic 29 KB) | `font-display:swap`, self-hosted, no Google Fonts call |
| Libraries | ≈ 144 KB raw / ≈ 55 KB gzip | 4 pinned CDN scripts, `defer` |
| Own CSS + JS | ≤ 40 KB CSS, ≤ 70 KB JS (unminified OK) | no frameworks |
| First view (before scrolling) | **≤ 700 KB transferred, 0 video bytes, no `<video poster>` fetch** | estimate: fonts ≈ 121 KB + libraries ≈ 55 KB gz + own CSS/JS/JSON ≈ 60 KB gz + hero ≈ 131 KB ≈ 370 KB; everything else lazy |
| Hero image | `hero-828.webp` / `hero-1242.webp` / `hero-1527.webp` (q 78; measured 56 / 97 / 131 KB), `sizes="(max-aspect-ratio: 1527/1600) 101vh, 106vw"`, `fetchpriority="high"`, **not lazy** | from `portrait-cover.jpg` (1527 × 1600). In portrait, cover-fit shows the image ≈ 1.01 × H CSS px wide (≈ 806 px at 844 tall, × 1.06), so a 3× phone picks the full 1527 px; that is still only ≈ 1.9×. Ask for the original (open question 11) |
| Other photos | `-480` / `-800` WebP (q 76), correct `sizes` (e.g. gallery single `74vw`, pair `56vw`/`40vw`, About `78vw`), `loading="lazy" decoding="async"`, `width`/`height` always set | `scripts/make-images.py` → `assets/img/web/` |
| Posters / thumbs | 540w ≤ 70 KB, 240w ≤ 20 KB; fetched lazily by `<img>` only, never by a `<video poster>` at boot | §6.1, §6.3, §6.7 |
| Logos | 46 SVG, 1.3 MB total; fetched only 1 viewport ahead | §4.6 (`loading` lazy → eager on approach) |
| Videos | `preload="none"`, `src` set 1 viewport ahead, **≤ 2 playing at once on mobile** | §6 |
| Per file | ≤ 12 MB by encode cap (hard limit 15 MB) | |
| Per Artifact publish | ≤ 64 MB | v1 today ≈ 24 MB of video + ≈ 6 MB of everything else. When more videos arrive, publish in batches to the same URL (≤ 256 MB per version), or trim card loops to ≤ 30 s (≈ 4–6 MB each) |

- Publish only referenced files: the original JPEGs in `assets/img/*` are not referenced once the WebP derivatives exist. They remain in the repo, and Pages copies them; that is harmless.
- Rendering:
  - animate only `transform`, `opacity`, `clip-path`, `stroke-dashoffset`, and one background colour per section (the gallery's `backgroundColor`; the hero's `--hero-bg`, painted by `.hero` and its stage);
  - no `filter` animation (the hero darkening is a `.hero__shade` overlay's opacity) and no large-area `mix-blend-mode` over moving content (the logo recolour overlay is gone, §4.6; the 3 px scroll indicator is the only blended element);
  - no layout reads inside scroll callbacks;
  - `will-change` only on the hero photo and fan cards;
  - marquees pause off-screen; Ken Burns and the icon cycle run once per entry (§6.1, §4.4a);
  - target CLS < 0.05, with reserved aspect boxes for every image, card and IG screen.

### 8.2 Accessibility

- **Landmarks and headings:** skip link (moves focus to `#main`, `tabindex="-1"`); `header`, `main` and `footer`; one `h1` (hero), exactly one `h2` per section (the Instagram section's is its "On Instagram" eyebrow, §4.2), `h3` per chapter. Lockups keep a space between their two spans, so screen readers read "My content in motion".
- **Split headings:** in motion mode, each split heading carries `aria-label` with its full text, and its visual line spans are `aria-hidden="true"`. SplitText runs with `aria:'none'`, so no `aria-label` ever lands on a `<span>` or `<p>` (§4.0).
- **Contrast:** text pairs only from the §2.1 table. The serif line on dark may be Tobacco only at ≥ 24 px.
- **Tap targets ≥ 44 × 44:** header controls, fan prev/next, sound and pause (48 px hit), thumbs (120 × 213), copy and open buttons, menu links (≥ 56 px rows), marquee pause. Inline text links get `padding-block` to reach 44 px.
- **Focus:** `:focus-visible{outline:2px solid currentColor; outline-offset:3px}`. Never remove outlines.
- **Controls:**
  - the menu traps focus;
  - Esc closes it;
  - the fan is reachable by keyboard (Tab to the region, ← →);
  - every toggle has `aria-pressed` and an accurate `aria-label` (fan hit labels per card state, §4.4a);
  - rail thumbs are named `Play: {title}` / `Show: {title}`, and the active one has `aria-current="true"`;
  - the fan caption is `aria-live="polite"`;
  - videos have descriptive `aria-label`s, and posters `alt=""` (the video carries the label);
  - logos use `alt` = brand name; the 4 unidentified logos and every duplicate are `alt=""` inside `aria-hidden` items (§4.6).
- **Links:** every external link has `target="_blank" rel="noopener"`; in-page links land below the header and move focus where needed (§4.0).
- **Moving content (WCAG 2.2.2):** anything that starts automatically and moves for more than 5 s has a visible pause control; everything else stops within 5 s.
  - every looping video has a visible pause button;
  - the marquee has a pause button;
  - the poster-only Ken Burns is a single 4.5 s pass per viewport entry, and the niche icon runs one 4.8 s cycle per entry and rests on its first icon;
  - the equaliser bars only move while that card has sound, and its sound button stops them;
  - nothing flashes more than 3 times per second (the IG flash is once).
- **Language:** `lang="en"` on `.site`, and the Pages wrapper sets `<html lang="en">`.

### 8.3 Reduced motion (`prefers-reduced-motion: reduce`)

| Feature | Behaviour |
|---|---|
| Scroll | no Lenis; native scroll; in-page links jump (`scrollIntoView`, honouring `scroll-margin-top`) |
| Header | theme IO still runs (it is not motion); backing on whenever `scrollY ≥ 1`; never hides; colour changes instant |
| Menu | opens and closes instantly (no clip tween, no link rise); inert, focus and Esc unchanged |
| Hero | 100svh static cover; no pin; no hero signature; no load settle |
| Reveals | none: everything rendered final; no armed states |
| Fan | static arc; focus changes instant (`duration:0`); no elastic |
| Videos | no autoplay; tap = play with sound (§6.5) |
| Instagram screens / counters | final values (motion.js does this natively) |
| Marquee | static wrapped grid of all 46 logos |
| Gallery and section colour scrubs | final colours; no parallax |
| Icon cycle, equaliser, Ken Burns, scroll indicator, hint pill | off |

---

## 9. Acceptance checklist

Run against the wrapped `index.html` (item 6a builds it), in Playwright Chromium (this build plays H.264/AAC: `canPlayType` answers "probably").

**Server.** Serve the repo root with a **Range-capable** static server: `npx --yes http-server@14.1.1 . -p 8080 -c-1`. Verified: it answers `Range: bytes=0-1` with `206 Partial Content` and `Content-Range`. Do not use `python3 -m http.server`: it ignores `Range` and returns 200 with the whole file, and iOS Safari will not play an MP4 from a server that cannot answer 206.

**Contexts:**
- Mobile: `{...devices['iPhone 13'], viewport:{width:390,height:844}, screen:{width:390,height:844}}`. Note that `devices['iPhone 13']` alone is 390 × 664.
- Short phones (hero items 19–22): `devices['iPhone 13']` as is (390 × 664, the iPhone 13 Safari visible area) and `{...devices['iPhone SE (3rd gen)'], viewport:{width:375,height:548}}`.
- Artifact-like: the site in a 390 × 700 and a 390 × 844 **cross-origin** iframe (item 42).
- Desktop sanity: 1440 × 900.

**Reading video state without granting activation:**
- Read state through `const cdp = await ctx.newCDPSession(page); cdp.send('Runtime.evaluate', {expression, returnByValue:true, userGesture:false})`. `page.evaluate` grants user activation.
- Taps use `page.tap()` (a real gesture).
- Touch swipes use CDP `Input.dispatchTouchEvent`.

**Arming probe (items 13, 14 and 42).** An init script (`context.addInitScript`, which also runs in iframes) installs a `MutationObserver` on `document` (subtree; attributes `data-armed`, `class`, `src`). Whenever an element gains `data-armed` or the `mo-armed` class, or a `<video>` gains `src`, it pushes `{what, id, top: el.getBoundingClientRect().top, ih: innerHeight}` to `window.__arms` (for a video, `top` is its card's).

Each item is pass/fail.

### A. Fragment and hosting
- **1.** `site.html` starts with `<title>Lorena Maruch</title>`, and the next element is `<meta name="claude:viewport-fit-sides" content="cover">`. A grep finds no `<!doctype`, `<html`, `<head` or `<body`.
- **2.** Every `src`/`href`/`url()`/`fetch()` path in `site.html`, `css/` and `js/` is relative and resolves (HTTP 200).
- **3.** Network log: the only external hosts are `cdnjs.cloudflare.com` and `cdn.jsdelivr.net`. There are no other hosts, no iframes and no stylesheet from any host other than self.
- **4.** CDN scripts carry exact versions (`gsap/3.15.0`, `lenis@1.3.27`) and `integrity`. `html.motion` is present after boot (proves they loaded) in **both** the Pages build and the published Artifact preview. If the Artifact host rejects the SRI, drop `integrity` (decision recorded in the PR).
- **5.** No console errors, page errors or failed requests during load and a full scroll-through.
- **6.** Published files name no reference site: `grep -rniE 'landonorris|itsoffbrand|off\+brand|\bbrier\b|\brive\b|\.riv\b' site.html index.html css js data lab assets --include='*.html' --include='*.css' --include='*.js' --include='*.json' --include='*.md' --include='*.svg'` prints nothing. The patterns are word-bounded so that "derive" and "driven" do not match. No font other than the 3 WOFF2 files is published. This needs the reworded `assets/fonts/LICENSES.md` line 30 (§4.8). `docs/` is not published and may keep naming the reference.
- **6a.** Wrapped build: in a fresh copy of the repo (`cp -r` to a temp dir, then delete any `index.html` and `_site`), run `bash scripts/wrap-site.sh`, then the "Assemble site" commands from `.github/workflows/pages.yml`. Pass if all of these hold:
  - `_site/index.html` starts with `<!doctype html>`;
  - it contains `site.html` byte-for-byte (`python3 -I -c "import sys; a=open(sys.argv[1],'rb').read(); b=open(sys.argv[2],'rb').read(); sys.exit(b not in a)" _site/index.html site.html`);
  - `_site/site.html` does not exist;
  - served, its parsed DOM has `document.title === 'Lorena Maruch'` with the `<title>` inside `<head>`;
  - items 1–5 pass against `_site` served by the Range-capable server.
- **6b.** Range requests: `curl -sS -o /dev/null -D - -r 0-1 <base>/assets/video/stays/dome-bathtub.mp4` shows status `206` and `content-range: bytes 0-1/<file size>`, on **both** the GitHub Pages URL and the published Artifact URL.
  - Use a GET as written, not `curl -I`: in our check, GitHub Pages answered a HEAD range request with 200 but a GET range request with 206.
  - If the Artifact host answers 200, record it in the PR: iOS Safari would then not play the videos in the Artifact preview (Pages is unaffected).

### B. Layout at 390 (and 320 / 360 / 375 / 414 / 430)
- **7.** `document.documentElement.scrollWidth === innerWidth` at load and at every 400 px of scroll (fan open, menu open and closed).
- **8.** Every `.wrap` has a computed `padding-left`/`padding-right` ≥ 16 px. No text box extends past `innerWidth − 16`; only the fan cards and marquee rows bleed, and they are clipped.
- **9.** The header's computed `padding-top` includes `env(safe-area-inset-top)` (check the stylesheet), and the toast's `bottom` includes the bottom inset.
- **10.** Lockup lines don't wrap: each `.t-sans`/`.t-serif` line has exactly one line box at 320 px.

### C. Complete at rest
- **11.** With `javaScriptEnabled:false`, a full-page screenshot shows the hero (H1 + photo, not overlapping), About text and photo, all chapter headings, the Numbers stats with final values and labels, the gallery photos and captions, and the contact info. Nothing in it has computed `opacity < 1`. The header shows the wordmark and the "Contact" pill with its backing, and no menu button.
- **12.** With `reducedMotion:'reduce'` + JS: `window.lenis === undefined`, `html.motion` is absent, and no element has `[data-armed]`, inline `opacity:0`, a `clip-path` with `0%`, or a transform offset. The full-page screenshot matches the no-JS one plus the JS-rendered parts (videos, brands, IG screens), the menu button and the cleared header backing at scroll 0.
- **13.** Motion mode, **before any scroll**: no element below the fold is hidden. `[data-armed]` count = 0 and `.mo-armed` count = 0 outside one viewport + 75% below the fold. Every arming-probe record so far has `top ≥ ih`.
- **14.** Motion mode, after scrolling to the bottom in 120 px wheel steps (60 ms apart) and then back to the top: `[data-armed]` = 0, `.mo-armed` = 0, and every `h2`, `h3`, `p`, `img` and `.ig-shot__card` has computed opacity 1. Every arming-probe record has `top ≥ ih`.

### D. Smooth scroll
- **15.** Desktop: `window.lenis.options` has `lerp: 0.1`, `smoothWheel: true`, `touchMultiplier: 1.25`, `anchors: false`.
- **16.** Wheel glide (desktop, from mid-page): send 5 × `mouse.wheel(0,100)` 50 ms apart and sample `scrollY` every rAF for 1.2 s.
  - The samples are monotonic non-decreasing.
  - No single frame moves more than 60 px, and no frame moves exactly 100 px (a native jump). The simulated lerp-0.1 glide peaks at ≈ 29 px per frame at 60 fps; the limit leaves room for slower headless frame rates.
  - The final displacement is 500 ± 5.
  - 90% of the displacement is reached within 650 ms of the last wheel event.
- **17.** Mobile emulation: a CDP touch drag of 300 px scrolls the page (native on iOS-UA or Lenis elsewhere) with no console errors. `?synctouch=1` turns `lenis.options.syncTouch` true.
- **18.** A horizontal swipe on a thumb rail scrolls the rail (`scrollLeft` > 0) and not the page (`scrollY` unchanged ± 2).

### E. Hero (in every hero context: 390 × 844, 390 × 664, 375 × 548, and the 390 × 700 cross-origin iframe)
- **19.** At scroll 0, after a 2.5 s settle:
  - the H1 is visible, and the `.hero__arch` probe's top is ≥ the H1's bottom + 16 px;
  - the photo's painted top edge equals the probe's top ± 1 px;
  - the header ink is Mahogany;
  - a stage screenshot in motion mode matches the reduced-motion screenshot (header area excluded): < 0.5% of pixels differ by more than 8/255.
- **19a.** Eyes inside the arch at scroll 0. Map the source iris centres (430, 560) and (770, 578) of the 1527 × 1600 image to the screen:
  - from the img's layout box `w × h` (`offsetWidth`/`offsetHeight`): `s = max(w/1527, h/1600)`, `ox = (w − 1527·s)/2 + 0.102·h` and `oy = (h − 1600·s)/2` (the portrait CSS of §4.1);
  - with `r = img.getBoundingClientRect()` and `k = r.width / w`: `x = r.left + k·(ox + px·s)`, `y = r.top + k·(oy + py·s)`.
  - Both points lie inside the arch: `y ≥ archTop + 24`, and inside the dome ellipse (centre `(archLeft + rx, archTop + ry)`, radii from the probe) wherever `y < archTop + ry`. At 1.0 H, both lie inside the card box.
- **20.** At scroll = 1.0 × H (after settle):
  - the visible card box is `.575·(.58·H)` × `.58·H` ± 2% (281 ± 6 × 489 ± 10 px at 844) with 28 ± 1 px corners (from the inline clip-path string);
  - `.hero` and `.hero__stage` both compute `backgroundColor` = `rgb(77, 52, 45)`; at 0.5 H their colours are equal to each other;
  - `.hero__shade` opacity is .12, and no hero element has a `filter` other than `none`.
- **20a.** Sample the inline `clip-path` of `.hero__photo` at 0, .25, .5, .75 and 1.0 H. Each matches `^inset\((-?[\d.]+px ){3}-?[\d.]+px round ([\d.]+px ){3}[\d.]+px \/ ([\d.]+px ){3}[\d.]+px\)$` (12 px values), and each of the 12 values changes monotonically across the samples.
- **21.** Signature:
  - at 1.15 H, the last path's `strokeDashoffset` ≈ 0; at 0.55 H, the first path's is ≈ its length;
  - **at 0.85 H** (the midpoint of the range, after 1 s for `scrub:.5`), the inked length `Σ(len − dashoffset)` is **50% ± 10%** of `Σ len`;
  - every `.sig path` has computed `vector-effect: none`;
  - footer: 0.9 s after its play starts, the inked length is 50% ± 15%.
- **22.** Screenshots at 0, 0.5 H and 1.0 H in each hero context show both eyes inside the visible photo window and nothing covering "Maruch" (manual review).

### F. Fan
- **23.** 7 `.fan__card`. After scrolling the fan into view and waiting 2.5 s, the cards in slots 0 and 6 have rotation −21° and 21° (from the computed matrix, ± 0.5°), and the focus card has z-index 10 and scale 1.
- **24.** The centre card's video (stays-03) is playing and muted while the fan is ≥ 35% visible. No other fan video is playing.
- **25.** A CDP touch swipe left of 120 px → focus index +1, the counter reads "05 / 07", the caption updates, and the previous card's video is paused. Tapping a side card focuses it. Prev and next are ≥ 44 × 44 and work.
- **26.** Tapping the focused card → `muted === false` and `paused === false` after 300 ms (CDP read). The sound button has `aria-pressed="true"`.
- **26a.** Click ownership, counting `volumechange` events on the focused video:
  - one tap on its `.fan__hit` toggles sound exactly once, and a second tap toggles it back;
  - one tap on its `.vcard__sound` also toggles exactly once (no double toggle through the card);
  - `document.elementFromPoint` at the centres of `.vcard__sound` and `.vcard__pause` returns those buttons, not `.fan__hit`;
  - tapping a side card focuses it and unmutes nothing unless the fan already owned sound (then the new focus inherits it, §6.4).
- **26b.** Poster-only focus: focus index 0 (`fashion-01`, poster-only today). Its `.fan__hit` is labelled "Soft light, brown jacket, video coming soon" with no `aria-pressed`, `.fan__soundhint` is hidden, and tapping it changes no video's `muted` or `paused`.

### G. Video rules
- **27.** At load:
  - 0 bytes of `.mp4` are requested;
  - no `<video>` has a `src` **or `poster`** attribute before the warm-up observer reaches it;
  - before the first scroll, no `assets/video/posters/*` or `assets/video/thumbs/*` WebP is requested except for `<img>`s that were within one viewport of the fold. Allow Chromium's native lazy-load margin: an image whose top was more than `innerHeight + 1250` px down must not be fetched.
- **28.** Sampled every 250 ms during a scroll-through: the number of `video` elements with `!paused` is ≤ 2.
- **29.** A chapter feature video starts playing while its card is still transforming (its `translateY` > 0 at the first `playing` event).
- **30.** Moving sound: tapping feature B while A has sound → A is muted and B is not. Scrolling B away (ratio < .15) → B is muted and the owner is released.
- **31.** Thumb swap, in the stays rail (feature `stays-06`): tap the `stays-03` thumb, then read over CDP after 300 ms:
  - the feature video's `currentSrc` ends with `dome-bathtub.mp4`, `paused === false` and `muted === false`;
  - the card owns sound (`aria-pressed="true"`), and the tapped thumb has `aria-current="true"`.
  - A poster-only thumb swaps the poster; the card then shows no sound button, and its video is paused with no `src`.
- **32.** Reduced motion: no video plays on scroll; tap → plays unmuted; second tap → pauses.
- **33.** Every playing card shows a pause button; pausing sets `paused === true`, and the scheduler does not restart it.
- **33a.** Blocked autoplay: with an init script that makes `HTMLMediaElement.prototype.play` reject with a `NotAllowedError` unless `navigator.userActivation.isActive` (otherwise it calls the original), scroll a feature card into view.
  - It gets `.is-blocked`, the poster stays, and the play glyph renders at 52 × 52.
  - `page.tap()` on the card → after 300 ms, `paused === false`.
- **33b.** Blocked unmute: with an init script that, when `play()` is called on an unmuted element without transient activation, pauses the element and rejects, dispatch a synthetic `click` on a playing card's `.vcard__sound` through CDP (`userGesture:false`). After 300 ms:
  - `muted === true` and `paused === false` (replayed muted);
  - the card has `.needs-gesture` and shows the hint;
  - the button still has `aria-pressed="false"`.
- **33c.** Desktop (1440 × 900), before any click: move the mouse onto a playing feature card and hold it there. "Click for sound" is visible, and after 500 ms a CDP read gives `paused === false`, `muted === true`.
- **33d.** Desktop hover-to-hear:
  - click the card: `muted === false`, and it stays unmuted after the mouse leaves (pinned); click again: muted;
  - move the mouse off and back onto the card and hold 300 ms: `muted === false`; move away: `muted === true` within 400 ms;
  - pass over the card in 100 ms: it never unmutes;
  - hover, then click: the sound stays after leaving (pinned).

### H. Content, data and contact
- **34.** Numbers: the stat values equal the `metrics.json` strings ("1.9" + "M", "39.2" + "K", "+7,696"). Count-ups end on those exact strings. The labels equal `kpis.views.label`, `kpis.followers.label` and `kpis.netFollowers.label` ("Views", "Followers", "Net followers").
- **34a.** Headings: one `h1`; every `section` that is a direct child of `main`, and the footer, has exactly one `h2` (the Instagram section's is "On Instagram"); every chapter has an `h3`.
- **35.** Brands:
  - the first copy holds 46 logo `img`s: 42 with a non-empty `alt`, and 4 (the unidentified ones) with `alt=""` inside `aria-hidden="true"` items;
  - no `alt` contains "unidentified" or a double quote (`"`, `“`, `”`); apostrophes, as in "L'Atelier", are fine;
  - plus 46 duplicates with `alt=""` in `aria-hidden` lists;
  - every logo renders at `44 × scale` ± 0.5 px tall and fits its 72 px row;
  - no element in the section has a `mix-blend-mode` other than `normal`;
  - after approach, every logo `img.complete && naturalWidth > 0`;
  - the pause button stops the WAAPI animations (`playState === 'paused'`).
- **36.** Contact:
  - the email and phone are visible text with `user-select` not `none`;
  - Copy (with `clipboard-read/write` permissions granted) puts the exact value on the clipboard and shows the toast "Copied";
  - links: `https://wa.me/5531993023248`, `https://www.instagram.com/lorena_maruch/`, `https://www.tiktok.com/@lorena_maruch`, each with `target="_blank"` and a `rel` containing `noopener`. The same holds for **every** `a[href^="http"]` on the page.
- **37.** Menu: it opens with `aria-expanded="true"`, Lenis is stopped (`lenis.isStopped`), focus is inside the menu, Esc closes it and returns focus, and a link scrolls to its section (section top 72 ± 8 px below the viewport top after 1.6 s, i.e. at `--anchor-offset`, not doubled).
- **37a.** In-page links, in motion mode and in reduced motion:
  - from mid-page, the "Contact" pill and "More stays ↓" land their target 72 ± 8 px below the viewport top, and the wordmark and "Back to top ↑" land at `scrollY` 0, within 1.6 s (immediately under reduced motion);
  - after the skip link (Tab from the top, Enter), `document.activeElement` is `#main`;
  - `location.hash` is unchanged.

### I. Quality gates
- **38.** Tap targets: every `button` and every `a` outside running text measures ≥ 44 × 44, including the `::after` hit area for sound and pause.
- **39.** Contrast: for every text node, the computed colour/background pair is in the allowed list in §2.1. Check with a small script that maps computed RGB to tokens per section.
  - **Header,** in motion, reduced-motion and no-JS modes: bring each section's top to the header line and compute the ink against the composited backing (85% of the backing colour over the section background; over photos, use black and white as the worst cases). Every pair is ≥ 4.5:1. In motion mode, also check scroll 0 and every 0.1 H from 0.35 H to 1.2 H with the bar shown (scroll up 10 px first).
- **40.** CLS < 0.05, measured with a `PerformanceObserver('layout-shift')` from load through a full scroll.
- **41.** First view transfer ≤ 700 KB (sum of responses before the first scroll, excluding the CDN cache).
- **42.** Cross-origin sandboxed iframe (as in the Artifact). Serve a host page from `http://localhost:8090/` containing `<iframe sandbox="allow-scripts allow-same-origin allow-popups" src="http://127.0.0.1:8080/index.html" style="width:390px;height:844px;border:0">`, so the site runs on another origin (repeat with `height:700px` for the hero items). With the arming probe in the frame, wheel-scroll top to bottom in 120 px steps:
  - every arming record has `top ≥ ih`: no element is ever armed while it intersects the viewport;
  - the lookahead really works, not just the guard: the profile IG screen, the fan, the footer signature and at least 5 lockups were armed (their records exist);
  - each chapter feature `<video>` got its `src` while its card's top was > `innerHeight`;
  - the wheel scrolls inside, nothing throws (storage access is guarded), and videos autoplay muted;
  - clicking the Instagram link opens a popup (`page.waitForEvent('popup')`), and the frame's own URL is unchanged.
  - (Revision 1 used a same-origin iframe and never checked arming timing, so it could not catch the `rootMargin` problem of §4.0.)
- **43.** Desktop 1440 × 900: no horizontal scroll; the content column is ≤ 672 px and centred; the fan uses the desktop table (slot 0 x ≈ −30 rem); hover on a card spreads its neighbours; no console errors.
- **44.** Accessible names, read with CDP `Accessibility.getFullAXTree` in motion mode after the reveals:
  - the h1 is named "Lorena Maruch", the content h2 "My content in motion", and every heading's name equals its text with single spaces;
  - no `span`, `p` or `div` without a role carries `aria-label`;
  - every rail thumb's name starts with "Play: " or "Show: ", and exactly one thumb per rail has `aria-current="true"`.
- **45.** Moving content: with the fan and a poster-only chapter card in view and no interaction for 6 s, every CSS animation on the niche icon and on poster-only posters has `playState === 'finished'`. The only infinite animations still running are the marquee rows, and the marquee pause button stops them.

---

## 10. Open questions for the client

1. **Signature:** can Lorena send her real signature as vector strokes in writing order (§7.4)? Should it be "Lorena" or "Lorena Maruch"?
2. **The Seasons (her Canva font):** to use it on the site we need a **self-hosted web licence from My Creative Land**. An Adobe Fonts Web Project loads from `use.typekit.net`, which the Artifact preview does not allow (only Google Fonts stylesheets are permitted there), so the preview would fall back to our stand-ins. Is buying the licence an option?
3. **Videos:** please send the remaining 19 originals (`docs/media-request.md`). Which of them have sound worth hearing? Is it fine to trim card versions to the best 15–30 s to keep the site light?
4. **Fan highlights:** do you approve the 7 picks (`fashion-01, restaurants-04, stays-05, stays-03, skincare-03, restaurants-03, fashion-03`), with the dome bathtub in the centre?
5. **Full-screen viewer:** should tapping a video only toggle sound in place (v1), or open a full-screen 9:16 Reels-style viewer?
6. **Desktop sound:** true hover-to-hear after the first click, or exactly Conectaa's "hover shows the button, click turns sound on"?
7. **Europe:** can we say "Based in Brazil, now travelling in Europe"? Which cities and dates, if any, should appear?
8. **Phone number:** is it OK to publish the WhatsApp number on the open web (spam risk), or should the site show email + Instagram only?
9. **Copy approval:** the About statement ("I make *slow,* warm stories about *places,* food, style *&* self-care."), the chapter subtitles, the gallery line and the video titles in §6.6.
10. **Brands:** 16 logos are unidentified or low-confidence (`docs/logos.md`). Show all 46 now, or hide the low-confidence ones until confirmed? Until she names them, the 4 unidentified marks ("3", the "Q" and "OR" monograms, "TÔM") are shown but left out of the accessible list (§4.6).
11. **Photos:** can we get the original cover portrait (the hero shows it full-screen, and a 3× phone needs ≈ 2,400 px of width; we have 1,527) and her Instagram profile picture in high resolution? A new cover means re-measuring the eye line in §4.1.
12. **Instagram numbers:** are we allowed to show the full insights screens (views, audience gender and age)? Please also confirm the flagged values (`docs/animations.md` §6).
13. **TikTok:** is `@lorena_maruch` on TikTok active and worth linking?
14. **Heading weight (typography direction):** the brief asked for the reference's interleave of a *bold* sans line with a serif line. We ship a lighter feminine version: a 480-weight narrow sans over a swash italic. Show her a side-by-side from `lab/type.html` (a new panel the builder adds) with "MY CONTENT / *in motion*" in four versions: sans 480 vs ≈ 650 weight, each with the italic serif vs the roman serif (LM Display). Which does she prefer? The answer is a one-line change of `--sans-lockup-wght` (§2.2), plus `.t-serif{font-style:normal}` if she picks the roman.
15. **Logo colour:** the partner logos ship black, as delivered. Does she want them warm-tinted (e.g. Mahogany) to sit softer on the page? If yes, we bake tinted SVG copies at build time; we will not tint them with a runtime blend.

---

## 11. Revision notes (revision 2, 2026-11-11)

Each numbered note answers one review gap. "Verified" means it was checked in headless Chromium or against the served file for this revision.

1. **IntersectionObserver lookahead in the Artifact iframe.** Verified with a cross-origin iframe: an implicit-root observer ignores `rootMargin`, while the same observer with `root: document` fires as expected. Every lookahead observer now uses `root: document`: `onApproach`, the video warm-up, the brands eager-load, the Ken Burns/icon replays and the nav theme band (§4.0, §4.6, §6.3, §5). The arming guard is now "never arm while `top < innerHeight`" (revision 1 used `0.92 × innerHeight`). Item 42 is now cross-origin (localhost ↔ 127.0.0.1) with an arming probe; items 13 and 14 assert the same invariant.
2. **Signature draw.** `vector-effect: non-scaling-stroke` is removed. Verified: with it, a half dashoffset renders fully inked. `make-signature.mjs` now emits `stroke-width` in viewBox units (≈ 0.95% of the viewBox width), and the CSS stroke-width clamp is gone (§7.1). Item 21 checks 50% ± 10% inked at 0.85 H.
3. **Hero resting layout at any height.** The arch top is now derived in CSS from the copy tokens (`--arch-top`); the copy is `position:relative; z-index:2`. A `.hero__arch` probe carries the rest box, radii and image shift, and `hero.js` reads them back instead of recomputing (§4.1). The image is positioned from the measured eye line, so the eyes sit 110 px under the arch top at 390 × 844 / 664 / 548 / 700 (table in §4.1). The background scrub moved to `--hero-bg` on `.hero`, painted by both `.hero` and the stage, so no Vanilla strip shows when the iOS toolbars collapse. New hero contexts are 390 × 664, 375 × 548 and a 390 × 700 iframe (items 19–22, 19a).
4. **Hero motion parameters.**
   - The load settle runs on `.hero__photo`, from `transform-origin: 50% var(--arch-top)`.
   - The scrub's start transform is the base CSS in both modes, and the scrub uses explicit `fromTo` values, including the px `y`.
   - `brightness()` is replaced by a `.hero__shade` overlay (opacity 0 → .12).
   - Every clip-path tween is a `fromTo`; `inset()` strings come from `boxToInset()` with 12 px values. Verified: Chrome serializes computed clip-paths compactly.
   - Radii are in px, because percentages resolve against the stage.
   - A full-width `hero-1527.webp` (131 KB) is added, with `sizes="(max-aspect-ratio: 1527/1600) 101vh, 106vw"`.
   - Items 20 and 20a.
5. **Fan click ownership.** `video.js` now has a stated API (`register`, `toggleSound`, `setEligible`, `swapSource`). Its card-level click binds only on `[data-vcard]:not([data-fan])`, and cards without `<video>` are skipped. `fan.js` owns fan clicks. The z-order is media < `.fan__hit` < sound/pause, and the buttons stop propagation. Poster-only and `audio:false` focus labels are defined, and the "tap for sound" hint hides for them (§4.4a, §6). Items 26a and 26b.
6. **Thumb swap on iOS.** The poster, `src`, `muted=false`, `play()`, the safety check and the owner change all happen synchronously in the click handler; the cross-fade is visual only, on `playing` (§4.4b). Item 31 reads state over CDP after 300 ms.
7. **Lazy posters.** `<video>` is rendered without `poster`, and `poster` is set together with `src` at warm-up (§6.1, §6.3, §8.1). Item 27 checks it.
8. **Logos.** Logos are shown black, as delivered; the runtime blend overlay is removed. The base height is 44 px, the rows are 72 px, and the 4 "unidentified" entries get `alt=""` inside `aria-hidden` items (§4.6). A warm tint is now open question 15. Item 35 is extended.
9. **Data and semantics.** Stat labels come from `metrics.json`; the third stat reads "Net followers", not "New followers". "On Instagram" is the section's `h2` (§4.2, §4.5). Items 34 and 34a.
10. **Header without motion.**
    - The theme IO runs in every JS mode.
    - The frosted backing is the CSS default, raised from 72% to 85% opacity. Contrast was measured: at 72%, ink sits at 4.50:1 over Mahogany-deep and 3.75:1 over black.
    - Static JS modes clear the backing only at scroll 0. Motion mode clears it below 0.35 H and hides the bar on scroll down from there.
    - The menu button ships `hidden`, and the reduced-motion menu is instant.
    - `-webkit-backdrop-filter` is required (§2.3, §4.0, §8.3).
    - Item 39 checks the header in motion, reduced-motion and no-JS modes.
11. **Video acceptance beyond touch.**
    - The test server must answer Range requests: `http-server@14.1.1`, verified to answer 206; `python3 -m http.server` answers 200.
    - A hosting check for Pages and the Artifact (item 6b) uses GET. Verified: GitHub Pages answers a GET range request with 206 but a HEAD range request with 200.
    - Added: a blocked-autoplay test (33a), a blocked-unmute test (33b) and desktop hover-to-hear tests (33c, 33d).
12. **WCAG 2.2.2.** The poster-only Ken Burns is now a single 4.5 s pass per viewport entry. The niche icon runs **one** 4.8 s cycle per entry, not two: two cycles would last 9.6 s, which is over the 5 s limit (§4.4a, §6.1, §8.2). Item 45 checks it.
13. **Links in the iframe.** Every external link gets `target="_blank" rel="noopener"` (§4.8); item 36 checks `target` on all of them. In-page links go through one router in `ui.js` (§4.0) instead of Lenis `anchors`. Two things were verified in the 1.3.27 source: its anchor handler does not `preventDefault()`, and `scrollTo` already subtracts `scroll-margin-top`. So `--anchor-offset` is applied once, with no `offset:-64`. The skip link moves focus to `#main`. Items 37 and 37a.
14. **SplitText accessibility.** Splits use `aria:'none'`. Split headings carry `aria-label` on the `h1`/`h2`/`h3`, with `aria-hidden` on the visual lines. Rail thumbs are named "Play: {title}" or "Show: {title}" and use `aria-current` (§4.0, §4.4b, §8.2). Item 44.
15. **Reference names and credits.** `LICENSES.md` line 30 is reworded. The EMS Allure credit moves from the visible footer to `LICENSES.md` and a source comment in `site.html` (§3.1, §4.8). Item 6 now gives an exact, word-bounded grep over the published folders.
16. **Pages and Artifact in sync.**
    - `pages.yml` is part of the build: a "Wrap site" step runs before "Assemble site", `site.html` is never published, and the step fails fast if `_site/index.html` lacks a doctype (§3, §3.3).
    - The wrapper now omits `</head><body>`, so the fragment's `<title>` lands in `<head>`.
    - Item 6a checks the wrapped build in a fresh copy.
17. **Typography question.** The sans weight is now the `--sans-lockup-wght` token (§2.2). Open question 14 asks the client to choose between the 480 and ≈ 650 weights and between the italic and roman serif, using a new comparison panel in `lab/type.html`. §1 says plainly that the shipped version is a lighter adaptation of the requested bold pairing.

Also corrected while verifying:
- Lenis 1.3.27's `respectReducedMotion` also makes wheel steps instant. Lenis is still not constructed under reduced motion, because it would keep intercepting the wheel (§5).
- The menu restarts Lenis before scrolling, because a stopped Lenis ignores `scrollTo`.
- The CDN URLs and SRI hashes in §3.1 were re-verified, unchanged; the unpkg Lenis mirror serves identical bytes.
