# Typography

**In short.** Lorena's Canva media kit is set in **The Seasons** (My Creative Land) plus **Poppins**. The Seasons is a commercial font: our Canva access does not license it for the web. So the site ships with OFL stand-ins chosen by side-by-side comparison:

- **LM Sans** = Mona Sans. Used for the caps line, labels, body text and numbers.
- **LM Serif** = Gilda Display (roman) + EB Garamond Italic with swash capitals (italic). Stands in for The Seasons.

Headings interleave a sans caps line with a serif italic line, the same way the reference site (landonorris.com) does. The difference is that our sans is lighter and narrower, and our serif line is a swash italic instead of bold caps.

To switch to the real font, see section 8. It takes about four lines of CSS.

- Specimen: `lab/type.html`, best viewed at 390 × 844.
- Font files and licences: `assets/fonts/` and `assets/fonts/LICENSES.md`.

---

## 1. What the media kit uses

Source: `_source/canva-structure/page-*.json`. Every text element has `textRegions[].formatting.fontRef`.

| fontRef | Font | Where it is used (page: text, size in Canva units, style) |
|---|---|---|
| `YAFdJnPX3ZE,0` | **The Seasons** (Elena Genova / My Creative Land) | p1 cover title "lORENA / mARUCH", 54, **bold**, white, centred, shown in capitals<br>p2 "sobre", 48, regular, shown in capitals + "*Lorena*", 48, **italic**<br>p3 "parcerias", 48, regular, shown in capitals<br>p4–p7 "Meus Conteúdos", 56, regular, then the italic line offset to the right below it: "*Hospedagens*", "*Restaurantes*", "*Moda*", "*Skin/Hair Care*", 48 |
| `YAFdJjbTu24,1` | **Poppins** Regular | p1 "@LORENA_MARUCH" 14.9, "MIDIA KIT" 31.5, tagline 17.5<br>p2 bio paragraph, 17.2, justified, line-height 1.55<br>p10 "c0ntato" 23, "@lorena_maruch" ×2, phone and e-mail, 23–26 |
| `YADK3w_fTc4,0` | humanist sans, probably **Alegreya Sans** | p8 "Métricas" only (24.6, white, on the Instagram screenshot) |

That is 12 uses of `YAFdJnPX3ZE`, 9 of `YAFdJjbTu24` and 1 of `YADK3w_fTc4`.

The `,0` / `,1` suffix is not the style. Roman, italic and bold all share `YAFdJnPX3ZE,0`, and the style comes from `fontStyle` and `fontWeight`. The suffix is a variant index inside Canva's font family.

**The kit already interleaves type.** It pairs The Seasons roman ("SOBRE", "Meus Conteúdos") with The Seasons italic ("*Lorena*", "*Hospedagens*"), and puts the italic line lower and to the right. This is her own version of the reference's sans/serif alternation, and the site keeps it. The `.t-lockup--offset` variant reproduces it.

### Evidence and confidence

- **The Seasons: very high confidence (~97%).** The kit words were rendered in the real The Seasons webfont (inside the fonts.adobe.com specimen page in headless Chromium) and compared with crops from the 3× and 4× exports. Every distinctive glyph matches:
  - Italic: the "d" curls back over itself like a delta (*Hospedagens*), the swash "H" has a looped entry stroke, and the "i" dots are drawn like acute accents (*Skín/Haír*). The solidus is long and drops below the baseline, the "L" in *Lorena* is a swash, and the "S" has a long tail.
  - Roman: the "R" has a long leg that kicks out past the bowl. The "M" is wide, the x-height is low, and the terminals are softly sheared.
  - Adobe's description agrees: "companion calligraphic italics … written using a Pilot Parallel Pen". The kit's bold caps on the cover are The Seasons Bold.
- **Poppins: high confidence (~95%).** It has a geometric single-storey "a" with a straight stem, a single-storey "g", and a round "@" containing an "a". The caps in "MIDIA KIT" match. It was rendered side by side with Montserrat, Questrial, Jost and Outfit.
- **Alegreya Sans for "Métricas": low–medium confidence (~50%).** It was compared with 40 Google sans fonts. It is used once on an image and does not matter for the site.
- The Canva help tool confirms that fontRefs are not readable names. It also confirms that having a font in Canva or Canva Pro is **not** a website licence.

## 2. Licences and the decision

| Font | Licence | Web use |
|---|---|---|
| The Seasons | Commercial (My Creative Land). In Adobe Fonts, Adobe says: "Website Publishing: Create a Web Project…". Self-hosting, apps and so on must be bought from My Creative Land. | **Not shipped.** Possible later via an Adobe Fonts Web Project or a purchased self-hosted licence (section 8). |
| Poppins | OFL | Allowed, but not needed: LM Sans covers its role. |
| Mona Sans | OFL, RFN "Mona" | **Shipped** as LM Sans (renamed subset) |
| Gilda Display | OFL, RFN "Gilda" | **Shipped** as LM Serif roman (internal name "LM Display") |
| EB Garamond | OFL | **Shipped** as LM Serif italic |
| Brier (reference serif) | Commercial | **Never use** |

**How the stand-ins were chosen.** About 30 OFL serifs were rendered with the kit's own words: Cormorant (×3), Bodoni Moda, Playfair, Instrument Serif, Fraunces, Bona Nova, Linden Hill, Sorts Mill Goudy, Noto Serif Display, Newsreader, Petrona, Alegreya, Bellefair, Italiana, Marcellus, Prata, Forum and others.

- **Roman → Gilda Display.** It has the closest wedge serifs, contrast, width and figures to The Seasons Regular.
- **Italic → EB Garamond Italic + `swsh`.** No OFL italic reproduces The Seasons' pen-written chancery. EB Garamond is the only candidate with true swash capitals (`A.swsh`–`Z.swsh`), and those give the same flourish on *Stays*, *Hair care* and *Maruch*. Cormorant Italic is lovely but has no swashes.

In our test the Google Fonts CSS API served EB Garamond without a working `swsh` feature. That is one reason we self-host subsets made from the full TTFs.

## 3. How the reference interleaves type

Values were measured with `getComputedStyle` in the reference `design-system.html` and its shared CSS. The reference scales the root font size: on phones, `html` = clamp(320px, 100vw, 479px) / 1728 × 48, which is **1rem = 10.83px at 390**.

| Role (class) | Font and axes | Size at 390 (1440) | Line height | Tracking | Notes |
|---|---|---|---|---|---|
| Sans line, Title L (`text-title-lg-mona`) | Mona Sans **wght 750, wdth 93**, caps | 28.2px (60) | .886 | −0.125rem (≈ −0.048em mobile) | |
| Serif line (`text-title-lg-brier` / `span-font-brier`) | **Brier 700**, caps | 26–28.2px (60–62.5) | .886 | same as sans | **same size as the sans line**; often lime (`#b2c73a`) on dark backgrounds |
| Social heading ("LOREM SIT / DOLOR AMET", the client's favourite section) | `split-flex is-center`: two spans | 28.2px (60) | .886 | −0.048em | `display:flex; flex-direction:column; align-items:center` |
| Impact pair ("SIT" / "LOREM") | Mona 750/93 + Brier 700, caps | 43.3px (93–97) | .816 / .81 | −0.1rem | stacked, left-aligned |
| Impact statement | Mona **660**/93, caps | 37.9px (106) | .906 | −0.0625rem | serif accent words inline, coloured |
| Eyebrow | Mona 700, wdth 100, caps | 8.7px | 1 | 0 | large: 812 / wdth 81.3 |
| Body | Mona 500, wdth 100 | 14.1px (16.7) | 1.25 | −0.0125rem | |
| CTA intro / callout | Brier 400 | 18.4px (26.7) | 1.04 | +0.05rem | |
| Buttons and links | Mona 800, wdth 86, caps | 17.3px (25) | 1 | — | |

The pattern is two lines **at the same font size**: a heavy, slightly condensed sans in caps on top, a contrasting serif below, and tight negative leading so the two lines lock together. The lines sit in separate spans so they can be revealed one after another.

## 4. Lorena's adaptation, and why

| | Reference (F1) | Lorena |
|---|---|---|
| Sans line | 750 / wdth 93 / −0.03 to −0.05em | **480 / wdth 82 / −0.01em** (hero **440 / wdth 80 / −0.015em**) |
| Serif line | Bold serif **caps** | **Italic in sentence case with swash capitals**, same font size, line-height .98, pulled up −0.06em so the swash cap meets the line above |
| Accent colour | lime on the serif | none. The italic carries the accent; the ink stays Mahogany |
| Eyebrow | 700, tracking 0, 8.7px | **520, tracking +0.18em, 10.9px** |
| Body | 500, 14.1px, lh 1.25 | **380, 15.2px, lh 1.55** |
| Numbers | heavy sans | **300 / wdth 76, tabular figures**, unit (K, M, %) in the serif italic |
| Scaling | fluid root font size | `clamp()` tokens on a normal 16px rem, so the user's text-size setting still works |

Why these changes:

- **A lighter, narrower sans.** It reads tall and slender, closer to fashion magazine cover lines than to motorsport. Weights 400–560 were compared on the real lockups. At 480 the caps keep enough colour to contrast with the italic. At 400 that contrast collapses, and at 560 or more the caps look athletic.
- **A swash italic instead of bold serif caps.** It is the kit's own move (*Hospedagens*). It brings a handwritten note that ties in with the signature reveal. And it is the softest possible contrast to the caps while keeping the reference's two-line rhythm, size and tight lock.
- **Wide-tracked eyebrows, airy body text, light numerals.** These are the usual luxury and editorial cues, and they give each block more room.
- **Same structure and timing hooks as the reference.** Separate line spans, the same size for both lines, and a column flex that can be centred or left-aligned. The motion effects therefore carry over unchanged.

## 5. Files and `@font-face`

| File | Size | Contents |
|---|---|---|
| `assets/fonts/lm-sans-var-latin.woff2` | 76 KB | Mona Sans variable: wght 200–900, wdth 75–100 |
| `assets/fonts/eb-garamond-italic-latin.woff2` | 29 KB | EB Garamond Italic 400, with `swsh` |
| `assets/fonts/lm-display-regular-latin.woff2` | 13 KB | Gilda Display Regular |

Use this in a stylesheet in `css/` (the paths are relative to the CSS file). In a `<style>` block in the root `index.html`, use `assets/fonts/…` instead.

```css
@font-face {
  font-family: "LM Sans";            /* Mona Sans subset (OFL, RFN "Mona" → renamed) */
  src: url("../assets/fonts/lm-sans-var-latin.woff2") format("woff2");
  font-weight: 200 900;
  font-stretch: 75% 100%;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "LM Serif";           /* roman: Gilda Display subset (OFL, RFN "Gilda" → renamed) */
  src: url("../assets/fonts/lm-display-regular-latin.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "LM Serif";           /* italic: EB Garamond Italic 400 subset (OFL) */
  src: url("../assets/fonts/eb-garamond-italic-latin.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  size-adjust: 112%;                 /* optical match to The Seasons Italic; ignored before Safari 17 */
}
```

Preload the two fonts that are visible above the fold, in the `<head>` (paths relative to the page):

```html
<link rel="preload" href="assets/fonts/lm-sans-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/eb-garamond-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
```

Always set the axes with `font-weight` and `font-stretch`, not `font-variation-settings`. Those properties inherit and animate cleanly. Set `font-synthesis: none` on `body` so the browser never fakes bold or italic.

## 6. Tokens and the mobile type scale

The px values are at 390px. The upper bounds are placeholders until the desktop design is done.

```css
:root {
  --font-sans:  "LM Sans", "Helvetica Neue", Arial, sans-serif;
  --font-serif: "LM Serif", "Iowan Old Style", Georgia, serif;

  --fs-display: clamp(3.75rem, 19vw, 7.5rem);      /* 74px   hero lockup ("LORENA / Maruch") */
  --fs-h2:      clamp(2.375rem, 11.6vw, 5rem);     /* 45px   section lockup */
  --fs-h3:      clamp(1.625rem, 7.4vw, 2.5rem);    /* 29px   small lockup, card title */
  --fs-number:  clamp(3.25rem, 16.4vw, 6.5rem);    /* 64px   stat numerals */
  --fs-intro:   clamp(1.3125rem, 5.8vw, 1.875rem); /* 22.6px serif intro / callout */
  --fs-body:    clamp(0.9375rem, 3.9vw, 1.0625rem);/* 15.2px */
  --fs-caption: clamp(0.75rem, 3.1vw, 0.875rem);   /* 12.1px */
  --fs-eyebrow: clamp(0.6875rem, 2.8vw, 0.8125rem);/* 10.9px */
}
```

| Token / class | Font | Weight / width | Line height | Tracking | Case / features |
|---|---|---|---|---|---|
| `--fs-display`, `.t-lockup--display` | sans + serif italic | 440 / 80 | .86 / .98 | −0.015em | caps / `swsh` |
| `--fs-h2`, `.t-lockup` | sans + serif italic | 480 / 82 | .86 / .98 | −0.01em / −0.012em | caps / `swsh` |
| `--fs-h3`, `.t-lockup--sm` | same as above | 480 / 82 | .86 / .98 | same | same |
| `--fs-number`, `.t-number` | sans (unit in serif italic at .9em) | 300 / 76 | .9 | −0.03em | `tabular-nums lining-nums` |
| `--fs-intro`, `.t-intro` | serif roman | 400 | 1.22 | −0.005em | `text-wrap: balance` |
| `--fs-body`, `.t-body` | sans | 380 / 100 | 1.55 | 0 | `text-wrap: pretty` |
| `--fs-caption`, `.t-caption` | sans, Moss | 420 / 100 | 1.4 | +0.01em | |
| `--fs-eyebrow`, `.t-eyebrow` | sans | 520 / 100 | 1.2 | +0.18em | caps |

Checked at 320, 360, 390 and 430px. The longest caps line, "RESTAURANTS", is 189–248px wide, and the widest line of all, *work together*, is 231–311px. Both stay inside the 16px side gutters, and there is no horizontal scroll.

### The lockup (interleaved heading)

```html
<h2 class="t-lockup">
  <span class="t-sans">Hotels &amp;</span>
  <span class="t-serif">Stays</span>
</h2>
```

Keep whitespace between the two spans so screen readers say "Hotels & Stays". It is not rendered, because the lockup is a flex container.

```css
.t-lockup { display:flex; flex-direction:column; align-items:center; text-align:center; font-size:var(--fs-h2); margin:0; }
.t-lockup--display { font-size: var(--fs-display); }
.t-lockup--sm      { font-size: var(--fs-h3); }
.t-lockup--start   { align-items:flex-start; text-align:left; }
.t-lockup--offset  { align-items:flex-start; text-align:left; }            /* media-kit homage */
.t-lockup--offset .t-serif { align-self:flex-end; margin-top:-.2em; }
.t-sans  { display:block; font-family:var(--font-sans); font-weight:480; font-stretch:82%;
           text-transform:uppercase; letter-spacing:-.01em; line-height:.86; }
.t-serif { display:block; font-family:var(--font-serif); font-style:italic; font-weight:400;
           font-feature-settings:"swsh" 1, "liga" 1; letter-spacing:-.012em; line-height:.98; margin-top:-.06em; }
.t-lockup--display .t-sans { font-weight:440; font-stretch:80%; letter-spacing:-.015em; }
.t-accent { font-family:var(--font-serif); font-style:italic; font-weight:400; font-size:1.04em; letter-spacing:0; } /* no swash */
```

The full set of rules (eyebrow, intro, body, caption, number) is in the `<style>` block of `lab/type.html`. Copy it from there.

## 7. Usage rules

1. **One idea per line.** The sans line is always CAPS and short (12 characters or fewer at `--fs-h2`). The serif line is always sentence case and italic. Never set the italic in caps, and never bold the serif.
2. **Both lines use the same `font-size`.** The italic's optical size comes from `size-adjust` in `@font-face`. A single-line heading ("FASHION") is allowed: use the sans alone, with an eyebrow above.
3. **Swash capitals only in lockups.** `.t-serif` turns `swsh` on. Inline accents (`.t-accent`) and numeral units do not. A swash in running text looks busy.
4. **Centred by default.** This mirrors the client's favourite fanned-cards section. Use `--start` next to left-aligned media, and `--offset` at most once or twice per page as a nod to the kit.
5. **Colour.** Set type in Mahogany `#584738` on Vanilla `#F1EADA` (7.4:1), or Vanilla on Mahogany. Captions and secondary labels use Moss `#6A6A53` (4.6:1). **Tobacco, Mountain and Sand are not text colours** on Vanilla (2.2, 2.1 and 1.5:1). Use them for rules, cards and decoration.
6. **Numbers** use `.t-number`, which has tabular figures so count-ups do not jitter. Put the unit in `<span class="u">`. Real values live in `data/metrics.json`; do not type them into the HTML.
7. **Motion hooks.** Animate the lines of a lockup separately (mask or clip reveal, the italic about 80–120ms after the caps). The fonts use `font-display: swap`, so wait for `document.fonts.ready` before splitting text into lines.
8. Do not use Poppins. LM Sans covers labels and body text, and three families is the limit.

## 8. Switching to The Seasons (the font Lorena uses in Canva)

Only do this once a licence exists, either an Adobe Fonts Web Project or a purchased self-hosted licence. The CSS is built so that only `--font-serif` and the italic size change.

- **Adobe Fonts (Creative Cloud).**
  1. Create a Web Project with The Seasons Regular, Italic and Light Italic.
  2. Add the project's `<link rel="stylesheet" href="https://use.typekit.net/XXXXXXX.css">`.
  3. Set `--font-serif: "the-seasons", "LM Serif", Georgia, serif;`. Check the exact family name in the project.
  4. Optionally add `font-weight: 300` to `.t-serif` for the more delicate Light Italic.
  5. Adobe hosts the files; never copy them into this repo.
- **Self-hosted, after buying from mycreativeland.com.**
  1. Put the WOFF2 files in `assets/fonts/` and add their licence to `LICENSES.md`.
  2. Point the two `LM Serif` `@font-face` rules at them.
  3. Change `size-adjust` to `100%`.
- In both cases:
  - Remove or re-check `font-feature-settings: "swsh"`. The Seasons has its own alternates; check the lockups visually.
  - Re-check line lengths, because The Seasons italic is about 12% wider.
  - Re-run the 320–430px overflow check.

## 9. How the subsets were built (for reference)

The sources are the official TTFs from `github.com/google/fonts` (`ofl/monasans`, `ofl/gildadisplay`, `ofl/ebgaramond`). The Mona Sans file is byte-identical to `github/mona-sans@0d07d5a/googlefonts/variable`. They were processed with fontTools 4.68:

1. `instancer`: Mona Sans `wdth` limited to 75–100; EB Garamond Italic fixed at `wght` 400.
2. `subset`: Latin unicodes plus ← ↑ → ↓ ↗, a reduced feature set, no hinting, WOFF2 output.
3. Renaming for the RFN rule: nameIDs 1, 3, 4, 6, 16, 17, 18, 21, 22 and 25 were changed from "Mona Sans" to "LM Sans" and from "Gilda Display" to "LM Display". Copyright (ID 0) and licence (IDs 13 and 14) were left untouched.

Full details are in `assets/fonts/LICENSES.md`.
