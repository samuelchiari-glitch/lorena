# Effects reference: landonorris.com (OFF+BRAND) → Lorena Maruch

What this is: a reverse-engineering of the motion system on Lando Norris's site (and the design-system doc the client sent), with exact parameters and a re-implementation recipe for Lorena's **mobile-first v1**. We take the **effects** (fluidity, photo choreography, signature, type interleave), not the sporty look (lime, dark green, helmets, WebGL head).

Sources used:
- `design-system.html` from the client's Drive (rendered + source), its `components.css/js`, `site-inline.css`, the Webflow stylesheet `lando-offbrand.shared.6e09a725a.css`, captured `landonorris.com/index.html` + `on-track.html`.
- Their bundle `lando-by-OFF+BRAND.05.js` (read-only, values extracted by text search; nothing copied into the repo).
- The live site at iPhone 13 (390×664 CSS px) and 1440×900, recorded and frame-extracted. Headless Chromium renders their WebGL slowly, so **timings come from code, layouts/visuals come from frames**.
- A scratch prototype that re-implements the key effects with our palette and photos (validated at 390 px and 1440 px). See §11.

> Rule reminder: never ship their JS, Rive files, images, signature or the Brier font. Everything below is a re-implementation recipe.

---

## 0. TL;DR: what to take for Lorena (v1 mobile)

| # | Effect | Lando technique | Our re-implementation | Priority |
|---|---|---|---|---|
| 1 | Buttery scroll | Lenis 1.1.20, `lerp 0.1`, `syncTouch true`, `touchMultiplier 1.25`, driven by the GSAP ticker | Same config with `lenis@1.3.27` + GSAP 3.13/3.15 | **Must** |
| 2 | Fanned 9:16 cards ("lindo") | 7 cards, hand-tuned scale/rotation/x/y table, elastic entrance, hover spreads neighbours | Port the algorithm 1:1 (tables in §2). On touch: tap or swipe moves the focus. Focused card plays its video | **Must** |
| 3 | Signature writing itself | Rive file, `scroll` input 0→1000 scrubbed by ScrollTrigger (`scrub 0.5`) | SVG single-stroke path, `stroke-dashoffset` at constant pen speed, scrubbed or timed | **Must** |
| 4 | Hero photo shrinks into a card | WebGL plane scaled from viewport to a target box over the first 100vh of a 200vh sticky track | `clip-path: inset(... round R)` + inner `scale` on a sticky photo, scrubbed | High |
| 5 | Sans/serif line interleave | Mona Sans (wdth 93, wght 750, UPPERCASE) over Brier serif. Serif about 4% larger, tighter leading | Mona Sans (OFL) + Lorena's Canva serif (or an OFL stand-in) | **Must** |
| 6 | Oval heading reveal | Per line: `clip-path: ellipse(20% 0%)` → `ellipse(100% 120%)`, 1.5s `power2.inOut`, chars from centre | Same, with GSAP SplitText (now free) | High |
| 7 | Line highlight reveal | Per line: clip-path inset wipe + colour block `scaleX 1→0` | Same, with a Tobacco block | Medium |
| 8 | Image curtain reveal | Ellipse clip opens downward, then a colour wash retracts | Same, with a Sand/Vanilla wash | High |
| 9 | Scattered photo gallery with captions | Desktop: pinned horizontal track. Mobile: vertical offset collage. Inner image parallax of 4rem | Mobile vertical collage + inner parallax | High |
| 10 | Page colour shifts while scrolling | `body` background scrubbed between section colours | Vanilla ↔ Sand ↔ Mahogany scrubs | Medium |
| 11 | Menu: oval curtain | `ellipse(120% 0% at 50% 0%)` → `ellipse(120% 100% at 50% 20%)` 0.8s `power3.out`, links `back.out(1.2)` | Same | Medium |
| 12 | Loader | Lime screen + Rive logo + "LOAD NORRIS" | Vanilla screen where the signature writes itself, then an oval lift | Optional |

---

## 1. Global stack and tokens

### 1.1 Libraries found in the bundle

| Library | Version (theirs) | Role | Ours (CDN, exact version) |
|---|---|---|---|
| Lenis | 1.1.20 (`window.lenisVersion`) | smooth scroll | `https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js` + `.../lenis.css` |
| GSAP core | 3.13.0 | all tweens/timelines | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js` (3.15.0 also on cdnjs) |
| ScrollTrigger | 3.13.0 | scroll triggers / scrub | `.../gsap/3.13.0/ScrollTrigger.min.js` |
| SplitText | 3.13.0 | lines/words/chars splits (`split-text="lines,chars"`) | `.../gsap/3.13.0/SplitText.min.js` (free since 3.13) |
| MotionPathPlugin | (bundled) | off-track hero image flight | `.../gsap/3.13.0/MotionPathPlugin.min.js` (only if we do §3.9) |
| Rive canvas-lite | 2.26.4 | signature, icons, loader, hamburger, handwritten words | **not used**: we use SVG |
| three.js r174 + Draco + p5 | | WebGL head/helmet, topographic lines | **not used** |
| taxi.js | | page transitions (1000 ms out) | not needed for a one-pager |
| Vimeo Player API | | hover-play videos in the fan | we use native `<video>` |

### 1.2 Motion tokens

```css
:root{
  --cubic-default: cubic-bezier(0.65, 0.05, 0, 1);   /* their signature ease: very slow start, long soft landing */
  --duration-default: 0.75s;
  --animation-default: var(--duration-default) var(--cubic-default); /* all CSS hover transitions */
}
```

GSAP eases used, with CSS equivalents for WAAPI/CSS:

| GSAP | CSS cubic-bezier | Used for |
|---|---|---|
| `power2.out` | `cubic-bezier(0.25,0.46,0.45,0.94)` | wipes, image reveal, fan rise |
| `power2.inOut` | `cubic-bezier(0.455,0.03,0.515,0.955)` | colour block retract, oval heading |
| `power3.out` | `cubic-bezier(0.215,0.61,0.355,1)` | text roll, menu open, eyebrow chars |
| `elastic.out(1, 0.75)` | (no CSS equivalent; use GSAP) | fan cards: the "alive" springy settle |
| `back.out(1.2)` | `cubic-bezier(0.34,1.36,0.64,1)` (approx.) | menu links |
| `none` | `linear` | every scrubbed parallax |

### 1.3 Fluid "rem" (how every size scales)

`html{font-size}` is fluid: `clamp(min, 100vw, max) / design-width * design-unit`.

| Breakpoint | min..max width | design width | unit | 1rem at… |
|---|---|---|---|---|
| Desktop ≥992 | 992..1920 | 1728 | 16 | **13.33 px @1440** |
| Tablet 768–991 | 768..991 | 1728 | 20 | 8.9–11.5 px |
| Mobile landscape 480–767 | 480..767 | 1728 | 20 | 5.6–8.9 px |
| **Mobile portrait <480** | 320..479 | 1728 | **48** | **10.83 px @390** (= 2.778vw) |

So on phones their rem is effectively `2.778vw`. **For our mobile v1 I recommend one custom property, `--r: 2.7778vw`** (and `min(0.9259vw, 17.78px)` from 480 px up). Express every Lando number as `calc(var(--r) * N)`. The tables below give both rem and px@390.

---

## 2. Smooth scroll (the "never stutters on a mouse wheel" feel)

### 2.1 Exact config (read live from `window.lenis.options`)

| Option | Value | Meaning |
|---|---|---|
| `lerp` | **0.1** | exponential damping, frame-rate independent: `value = lerp(value, target, 1 - exp(-lerp*60*dt))`. Remaining distance = `e^(-6t)`: 50% after 115 ms, 90% after 384 ms, 99% after 768 ms |
| `duration` / `easing` | unset | (lerp mode wins) |
| `smoothWheel` | **true** | wheel deltas are accumulated into `targetScroll` and glide. This is why a notched mouse wheel never feels "chunky": each 100 px notch becomes a 0.4 s exponential glide, and notches merge |
| `wheelMultiplier` | 1 | |
| `syncTouch` | **true** | touch is also taken over by Lenis: while the finger moves, `lerp = 1` (1:1 follow) |
| `touchMultiplier` | **1.25** | page moves 1.25× the finger (feels lighter and faster). Verified: a 300 px drag moved the page 372 px |
| `syncTouchLerp` | 0.075 (default) | the inertia glide after release is softer than the wheel glide |
| `touchInertiaMultiplier` | 35 (default) | fling distance = velocity × 35 |
| `infinite`, `anchors`, `autoRaf` | false | |
| `autoResize` | true | |
| wrapper/content | `documentElement` / `body` | native window scroll, so `position: sticky`, IntersectionObserver and `scrollY` all keep working |

### 2.2 Integration with GSAP (verbatim pattern from the bundle)

```js
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: true, touchMultiplier: 1.25, autoResize: true, infinite: false });
lenis.on('scroll', ScrollTrigger.update);          // ScrollTrigger reads the smoothed position
gsap.ticker.add(t => lenis.raf(t * 1000));         // one rAF loop for everything
gsap.ticker.lagSmoothing(0);                       // never "jump" after a long frame
window.lenis = lenis;
```

Other behaviour:
- `lenis.stop()` while the menu is open, and `lenis.start()` on close. On desktop they rebuild Lenis when crossing 991 px.
- `scrollTo(target, { duration: 0 })` for programmatic jumps (`immediate: true` on resize rebuild).
- Mobile hero has a "tap to lock / back to scroll" toggle that **stops Lenis and scrolls to 0** so the finger can paint the 3D helmet. Not needed for us.
- Native `scroll-behavior` is reset (`html{scroll-behavior:initial}`) and scrollbars are hidden (`::-webkit-scrollbar{display:none}`, `scrollbar-width:none`). They draw their own indicator (§7.6).
- Include `lenis.css` (sets `html.lenis{height:auto}`, `.lenis-stopped{overflow:hidden}`, `[data-lenis-prevent]{overscroll-behavior:contain}`).

### 2.3 Our recipe and cautions

- Use the exact config above. It is the feel the client fell in love with.
- Add `data-lenis-prevent` on any inner scroller (e.g. a horizontal reel, a modal with scroll).
- **iOS check:** `syncTouch:true` replaces native momentum with Lenis inertia. If testing on a real iPhone shows any jank (address-bar resize, rubber-banding), fall back to `syncTouch:false` on touch only. Keep it a single-line switch: `syncTouch: !matchMedia('(pointer:coarse)').matches || USE_SYNC_TOUCH`.
- Respect `prefers-reduced-motion`: do not start Lenis, and skip scrubs (set the final states).
- For the existing `js/motion.js` (IntersectionObserver based): nothing to change, because Lenis scrolls the real window.

---

## 3. The fanned cards section (client screenshot, "socials" section)

Markup on Lando: `section.is-callout-socials` → Rive icon → `h2[data-oval-scroll].text-title-lg-mona.split-flex.is-center` with `<span>what's up</span><span class="span-font-brier">On Socials</span>` → `[data-social-callout="wrap"].callout-socials-card-layout` with 7 × `.callout-socials-card-w` → serif intro line (`Follow Lando on social media`) → 4 text-roll links.

Refs: `12-fan-desktop-rest.png`, `13-fan-desktop-hover-card1.png`, `14-fan-desktop-hover-center.png`, `15-fan-mobile-rest.png`, `16-fan-mobile-tap.png`, and the client's screenshot.

### 3.1 Card box

| Property | Desktop (≥992) | Mobile (<480) |
|---|---|---|
| Card width | `20rem` = 266.7 px @1440 | `14rem` = **151.7 px @390** (38.9vw) |
| Card height | `35rem` = 466.7 px | `aspect-ratio: 20/35` = 265.4 px |
| Aspect | 4:7 (0.571, slightly wider than 9:16) | same |
| Radius | `3.31625rem` = **44.2 px** | **35.9 px** (9.2vw) |
| Overflow | `clip`, `backface-visibility:hidden`, `will-change:transform` | same |
| Layout box | flex centre, `width:100%`, `max-width:80rem`, `height:36rem` (480 px) | height 390 px |
| Card positioning | `position:absolute`, all stacked at the centre; transforms place them | same |
| Tablet | 17rem wide (≤991), 15rem (≤767) | |

Card content: an `img` placeholder (`position:absolute; inset:0; object-fit:cover; z-index:10`) plus a Vimeo background iframe (§3.5).

### 3.2 Per-index transform table (from the bundle, verified on the live DOM)

Index 0..6, left → right. Centre = 3. `x`/`y` are in their rem.

| i | scale | rotation | x desktop | x mobile | y (both) | z-index |
|---|---|---|---|---|---|---|
| 0 | 0.7756 | −21° | −30rem (−400 px) | −15rem (**−162.5 px**) | 7.3rem (desk 97 px / mob **79 px**) | 1 |
| 1 | 0.8498 | −14° | −22rem (−293 px) | −11rem (**−119 px**) | 4rem (53 / **43 px**) | 2 |
| 2 | 0.9346 | −7° | −11rem (−147 px) | −6rem (**−65 px**) | 1.3rem (17 / **14 px**) | 3 |
| 3 | 1 | 0° | 0 | 0 | 0 | **10** |
| 4 | 0.9346 | 7° | 11rem | 6rem | 1.3rem | 3 |
| 5 | 0.8498 | 14° | 22rem | 11rem | 4rem | 2 |
| 6 | 0.7756 | 21° | 30rem | 15rem | 7.3rem | 1 |

Arc logic: rotation steps by 7° per position. Scale drops about 8–9% per step. y drops by about 1.3 / 4 / 7.3 rem (roughly quadratic), so cards sit on a downward arc. `transform-origin: center center`. Each card overlaps its neighbour. On mobile the outer cards bleed past the viewport edges (the section clips x). This is intentional (see `15-fan-mobile-rest.png`).

### 3.3 Entrance (scroll-triggered, once)

```text
initial (gsap.set):  x 0, y 10rem, scale 1, rotation 0, opacity 1   (all 7 stacked, pushed 10rem down)
ScrollTrigger:       trigger = wrap, start "top 90%", once
step 1:  y → 0                 0.8s power2.out,          stagger { amount 0.5, from "end" }
step 2:  x/y/scale/rotation → table   1.2s elastic.out(1,0.75), stagger { amount 0.2, from "center" }, starts at "-=0.4"
onComplete: enable hover
```

Total ≈ 2.1–2.3 s. The look: the stack rises as one deck, then **springs open into the fan** with a small elastic overshoot (centre first).

### 3.4 Hover (desktop): neighbours make room

For hovered index `n`, with `mid = 3`, `d = |i − n|`, `p = 1 − |(i − mid)/mid|` (0 at the ends, 1 at the centre), `c = 1 + 0.2 · max(0, 3 − d)`:

| Card | x | y | scale | rotation |
|---|---|---|---|---|
| hovered | base | base − **2.5rem** | base × **1.08** | base |
| left of n | base − 8·p·c rem | base | base | base − 3/(d+1) |
| right of n | base + 8·p·c rem (last card: +0) | base (last card: −1rem) | base | base + 3/(d+1) |

All: `duration 0.5, ease elastic.out(1, 0.75), overwrite "auto"`, delay `d × 0.02s` (closest first). Leaving a card has a 50 ms grace period, and leaving the whole wrap tweens back to the table (stagger by distance from centre × 0.02). Verified example (hover i=1, desktop): i=2 moved from −11rem to **−3.53rem**, rotation −7° → −5.5°.

No z-index change on hover. The lifted card "reads" in front because its neighbours move away.

### 3.5 Video in the cards

Each card is `[data-video-stream-wrap]` with `data-stream-hover="true" data-stream-muted="true" data-stream-loop="true"`: a Vimeo `background=1` iframe, **paused until `mouseenter` → play**, and the placeholder image fades `opacity 1→0` in 0.3 s. `mouseleave` → pause, placeholder back. Volume is always 0. The video is "cover"-fitted by computing the wrap/video aspect. **On mobile there is no hover**, so the cards are stills (a tap emulates `mouseenter`, which spreads the deck awkwardly: see `16-fan-mobile-tap.png`).

### 3.6 Mobile behaviour on Lando

The entrance and layout table are the same (mobile x values). There are no real touch semantics: a tap fires emulated hover, which spreads cards by 8rem-based pushes that on a phone fling the neighbours off-screen. The fan bleeds about 40 px past each edge.

### 3.7 Recipe for Lorena: "Content" section (validated in the prototype, ref `29-proto-mobile-fan.png`, `30-proto-desktop-fan-hover.png`)

- 7 cards, 9:16 Lorena videos (poster = `assets/video/_ref/*` or gallery stills until the files arrive). Keep their 20:35 box or switch to true 9:16 (`aspect-ratio: 9/16`, about 2% taller). Both look right.
- Use `--r` units so the geometry is identical to Lando's at any phone width.
- Touch: **tap a side card → focus it** (lift and spread, same algorithm, push factor can be reduced from 8 to about 6 on phones so the neighbours stay on screen). **Tap the focused card → play with sound / open a full-screen 9:16 viewer.** **Horizontal swipe on the fan → focus moves ±1** (pointer events, `touch-action: pan-y` on the fan so vertical scrolling still works).
- Video logic (merges the client's other reference): only the **focused** card (centre by default) autoplays `muted playsinline loop` when the section is visible. The others show posters. Hover (desktop) or focus (touch) swaps which card plays. A small speaker icon on the focused card toggles sound.
- Below the fan: one serif line (e.g. "Stays, food, fashion & care") and the category links as text-roll links (§5.6).
- Above the heading: Lando's Rive icon cycles hobby icons (golf ball → padel → camera…: `off-icons` state machine). **Lorena version:** a 40 px line icon that morphs or cross-fades between her niches (bed/key → fork & knife → hanger → serum bottle), 1.2 s per icon. CSS cross-fade of 4 inline SVGs is enough.

Code sketch (core, from the prototype):

```js
const DESK = [[.7756,-21,-30,7.3,1],[.8498,-14,-22,4,2],[.9346,-7,-11,1.3,3],[1,0,0,0,10],[.9346,7,11,1.3,3],[.8498,14,22,4,2],[.7756,21,30,7.3,1]];
const MOB  = [[.7756,-21,-15,7.3,1],[.8498,-14,-11,4,2],[.9346,-7,-6,1.3,3],[1,0,0,0,10],[.9346,7,6,1.3,3],[.8498,14,11,4,2],[.7756,21,15,7.3,1]];
const layout = () => (innerWidth <= 991 ? MOB : DESK).map(([scale,rotation,x,y,z]) => ({scale,rotation,x,y,z}));
const R = () => probe.getBoundingClientRect().width;          // px of one Lando-rem (probe: width: var(--r))
const rem = v => v * R() + 'px';
let L = layout(); const mid = 3;
cards.forEach((c,i) => c.style.zIndex = L[i].z);
gsap.set(cards, { x:0, y:rem(10), scale:1, rotation:0, transformOrigin:'center center' });

gsap.timeline({ scrollTrigger:{ trigger:fan, start:'top 90%', once:true }, onComplete:()=>ready=true })
  .to(cards, { y:0, duration:.8, ease:'power2.out', stagger:{ amount:.5, from:'end' } })
  .to(cards, { x:i=>rem(L[i].x), y:i=>rem(L[i].y), scale:i=>L[i].scale, rotation:i=>L[i].rotation,
               duration:1.2, ease:'elastic.out(1, 0.75)', stagger:{ amount:.2, from:'center' } }, '-=0.4');

function focus(n, PUSH = 8){
  L = layout(); const tl = gsap.timeline(), last = cards.length - 1;
  cards.map((c,i)=>({c,i,d:Math.abs(i-n)})).sort((a,b)=>a.i===n?-1:b.i===n?1:a.d-b.d).forEach(({c,i,d})=>{
    const p = 1 - Math.abs((i-mid)/mid), boost = 1 + .2*Math.max(0, 3-d); let t;
    if (i===n)      t = { x:rem(L[i].x), y:rem(L[i].y-2.5), scale:L[i].scale*1.08, rotation:L[i].rotation };
    else if (i<n)   t = { x:rem(L[i].x-PUSH*p*boost), y:rem(L[i].y), scale:L[i].scale, rotation:L[i].rotation-3/(d+1) };
    else { const e = i===last; t = { x:rem(L[i].x+(e?0:PUSH*p*boost)), y:rem(L[i].y+(e?-1:0)), scale:L[i].scale, rotation:L[i].rotation+3/(d+1) }; }
    tl.to(c, { ...t, duration:.5, ease:'elastic.out(1, 0.75)', overwrite:'auto' }, d*.02);
  });
}
function rest(){ /* tween every card back to L[i], delay |i-mid|*0.02, same 0.5s elastic */ }
```

---

## 4. Photo presentation across the site

Corner conventions on Lando: **editorial photos have square corners** (gallery, otot, store). Only the **media cards are rounded** (44.2 px desktop / 35.9 px mobile). Controls use 7.2 px (`.54rem`) and the menu toggle 9.9 px (`.74rem`). The helmet cards and footer use **notched SVG masks** (a tab/notch cut into an edge).
**Lorena adaptation:** keep the contrast between square editorial photos and rounded media cards. Optionally soften the editorial photos to 6–10 px. Skip the notched masks (sporty) or replace them with a soft arch top (`border-radius: 50% 50% 0 0 / 30% 30% 0 0`) for one or two hero images.

Lando also mixes **colour photos with toned monochrome ones** (several gallery images are natively greyed/olive duotone, not a CSS effect). **Lorena:** mix colour shots with a few Tobacco/Mahogany duotones (bake them, or CSS `filter: grayscale(1) sepia(.35)` plus a Mahogany `mix-blend-mode: multiply` overlay at 20%).

### 4.1 Hero photo shrinks into a card (refs `03`, `06`, `28`)

Lando: `.sticky-track.home-hero{height:200vh}` with a `position:sticky; top:0` 100vh child. A WebGL plane (the 3D head) is scrubbed **from viewport size to a target box** (`[data-sticky-hero="target"]`: desktop `35.375rem × 22.875rem` = 472×305 px @1440; mobile `25rem × 29rem` = 271×314 px @390). `ease: power1.inOut`, scrub true, from `top top` to `+100vh`. At the same time the image desaturates/darkens (shader filter) and the page background goes from `#f8f8f3` to dark green. After 100vh the card and signature scroll away.

Mobile hero copy: centred `LANDO` (serif) + `NORRIS` (sans) wordmark on one line, with the eyebrow "MCLAREN F1 SINCE 2019". While scrolling it is wiped away with `clip-path: ellipse(110% 110% at 50% 0%) → ellipse(100% 0% at 50% 0%)` (`power3.out`, scrub, tracker 70vh → 85vh) and its chars slide `y 0 → −100%` (stagger 0.02).
"Message from Lando" eyebrow: chars `y 100% → 0`, stagger 0.02, `power3.out`, scrubbed 70vh → 100vh. The small logo/signature images fade up `y 1rem → 0`, `autoAlpha 0 → 1`, with a 0.3 s offset.

Our CSS-only version (validated):

```js
gsap.timeline({ scrollTrigger:{ trigger:'#hero', start:'top top', end:()=>'+='+innerHeight, scrub:true } })
  .to('#heroPhoto',     { clipPath:'inset(22% 16% 24% 16% round 36px)', ease:'power1.inOut' }, 0)   // card on a 390 phone ≈ 265×356
  .to('#heroPhoto img', { scale:.86, filter:'saturate(.35) brightness(.92)', ease:'power1.inOut' }, 0)
  .fromTo('.hero-sticky', { backgroundColor:'#F1EADA' }, { backgroundColor:'#4D342D', ease:'power1.inOut' }, 0)
  .to('#heroName',      { clipPath:'ellipse(100% 0% at 50% 0%)', yPercent:-20, ease:'power3.out' }, 0);
```

Animate `clip-path` (cheap, no layout) rather than width/height. Use `100svh` for the sticky height on iOS.

### 4.2 Image curtain reveal (`data-img-highlight="top, lime"`, on-track page, runs on mobile too)

```text
wrapper (overflow hidden) clip-path: ellipse(120% 0% at 50% 0%)      → ellipse(120% 120% at 50% 0%)   0.8s power2.out
colour wash (abs, z 5)    clip-path: ellipse(120% 120% at 50% 100%)  → ellipse(120% 0% at 50% 100%)   0.6s power2.out, starts at -0.4s
trigger: top 80%, once.   Variant "bottom": mirror the origins.
```

The image drops in from the top with an **oval bottom edge**, and a flat colour layer then drains downward off the photo. Lorena: wash = Sand `#CEC1A8` on Vanilla sections, Tobacco on Mahogany sections. Ref `31-proto-reveals-start-states.png`.

### 4.3 Scattered gallery with captions (home "horizontal track")

- Desktop: a section of height `trackWidth − 100vw` pins `.horizontal-pin-sticky` and tweens the track `x: -(trackWidth − innerWidth)`, `ease none`, `scrub: 1` (1 s catch-up = extra glide). The track starts with `padding-left: 75vw`. Items have different sizes and vertical offsets (`margin-top:auto`, `margin-bottom: 8.42vh`, negative margins…), producing an asymmetric editorial scatter.
- **Inner parallax:** each `img` is `calc(100% + 4rem)` in both dimensions inside an `overflow` box, and its `x` goes `0 → 4rem` as the item crosses the viewport (`containerAnimation`, `left right → right left`, scrub). The photo "slides inside its frame".
- Each photo has an **eyebrow caption above it** (`PLACE, YEAR`, Mona 700 uppercase, `.625rem` desktop / `.8rem` = 8.7 px mobile). Between photos there are serif quotes (`Brier 1.5rem/0.946`, `letter-spacing .05rem`) with a small static signature underneath.
- Captions do a line highlight reveal (lime block) as they enter (`left 95%` within the horizontal animation).
- **Mobile (<992): no pin and no horizontal motion.** The same items become a vertical collage: widths 10–20rem (108–217 px), alternating `margin-left: auto / 20% / 40%`, negative top margins (−5 to −7rem) so photos overlap rows, captions keep their position. Refs `18-mobile-signature-collage-socials.png`, `17-mobile-scroll-overview-sheet.png`.
- While the section scrolls, **the whole page background is scrubbed** from dark green to off-white (`data-gl-change-from="dark-green" … to="white"`, ScrollTrigger `top top → bottom bottom`, `ease cubic-bezier(1,0,0.37,1)`, interpolating `document.body.style.backgroundColor`).

Lorena v1 (mobile): build the vertical collage of hotel/food/fashion photos with "Place, year" captions and 1–2 short serif quotes plus a mini signature. Add a vertical inner parallax: `img{height:calc(100% + 4rem)}` and `y: 0 → -4rem` scrubbed per item (`start 'top bottom', end 'bottom top'`). Scrub the background Vanilla → Sand across the section.

### 4.4 Other photo motions (all scrubbed, all run on mobile unless noted)

| Effect | Element | From → To | Trigger range | Ease |
|---|---|---|---|---|
| Side photos slide in (On/Off track) | two tall cut-out portraits (left/right, `90.67vh` tall) | `x: −20rem / +20rem → 0` | section `top bottom → bottom bottom` | `power2.out` |
| …their headings | text columns | `x: ∓5rem → 0` | `top bottom → 60% bottom` | none |
| Full-bleed parallax | `[data-otot-bottom] img` | `y: 0 → −20vh`, `scale 1 → 1.1` | `top bottom → bottom top` | none |
| "Visor" curtain | `[data-exe-visor]` (helmet grid bottom edge) | `clip-path: ellipse(70% 0% at 50% 0%) → ellipse(70% 100% at 50% 0%)` | `top bottom → bottom center` | none |
| Store images drift | `.exe-cta-img-w img` | `y: 0 → −4rem` | `top bottom → bottom top` | none |
| Helmet grid columns (desktop only) | columns 2–4 | `y: col×5rem → 0` | grid `top bottom → bottom top` | none |
| Campaign pairs (off-track) | 2 images per row | `x: −4rem / +4rem → 0` | row `top bottom → bottom center` | `power2.out` |

### 4.5 Hover effects on photos (desktop only; for v1 mobile, map them to "on focus" or skip)

- Helmet card: reveal layer `clip-path: ellipse(100% 0% at 50% 0%)`, `scale 1.05` → `ellipse(100% 120% at 50% 0%)`, `scale 1`. Image `scale 1 → 1.1`. Frame opacity 0 → 1. All `0.75s cubic-bezier(0.65,0.05,0,1)`.
- Partner video: `clip-path: ellipse(100% 50% at 50% 50%)` → hover `ellipse(80% 50% at 50% 50%)`. The video pinches into an oval. **Nice for Lorena's video tiles.**
- Stat list: a preview image follows the cursor (`x: mouseX+20, y: mouseY−20`, 0.5 s `power2.out`), revealed with `ellipse(120% 0% at 50% 0%) → ellipse(120% 120% at 50% 0%)` 0.8 s plus a lime wash retract 0.6 s. Reverse at `timeScale 2`.

### 4.6 Off-track hero "photo flight" (optional, very aesthetic)

One image travels along a cubic-bezier **motion path** through three anchor boxes (pos1 → pos2 → pos3), resizing to each anchor's size and **swapping between N photos** as progress advances (layer opacity flipbook). Scrubbed `top top → bottom center` (mobile `20% top → bottom 80%`), `MotionPathPlugin`, `ease none`. Lorena idea: a single photo that floats down the About section and flips through hotel → food → fashion → skincare looks.

---

## 5. Typography: interleave rules and text reveals

### 5.1 Fonts

| Role | Lando | Licence | Lorena |
|---|---|---|---|
| Sans | **Mona Sans Variable** (wdth 75–125, wght 200–900) | OFL, on Google Fonts (`family=Mona+Sans:wdth,wght@75..125,200..900`) | **keep Mona Sans** |
| Serif | **Brier Bold 700** | commercial, **do not use** | Lorena's Canva display serif (fontRef `YAFdJnPX3ZE`, high-contrast, often italic: see `docs/canva-inventory.md`). Until it is identified, use an OFL stand-in: *Bodoni Moda* (prototype), *Playfair Display*, *Gloock* or *Instrument Serif* |

### 5.2 Type scale (desktop @1440 | mobile @390)

| Style | Font / axes | Size | Line-height | Tracking | Case |
|---|---|---|---|---|---|
| Impact XL (statement) | Mona `wght 660, wdth 93` | 7.9375rem = 105.8 px \| 3.5rem = **37.9 px** | 0.906 | −.0625rem | UPPER |
| …serif words inside | Brier 700 | 8.25rem = 110 px \| 3.6rem = **39 px** | 0.83 | −.1875rem | UPPER |
| Impact reg (ON / TRACK) | Mona `750 / 93` | 7rem \| 4rem | 0.816 | −.25rem | UPPER |
| …serif | Brier | 7.3125rem | 0.81 | −.21875rem | UPPER |
| Impact S (footer) | Mona `660 / 93` | 5.25rem \| 3.6rem = 39 px | 0.856 | ~0 | UPPER |
| …serif | Brier | 5.4375rem | 0.856 | −.125rem | UPPER |
| **Title L** (fan heading) | Mona `750 / 93` | 4.5rem = 60 px \| 2.6rem = **28.2 px** | 0.886 | −.125rem (−0.028em desk / −0.048em mob) | UPPER |
| …serif line | Brier (span inherits size) | same | same | same | UPPER |
| Title L serif standalone | Brier 700 | 4.6875rem \| 2.6rem | 0.886 | 0 | |
| Intro / CTA short | Brier | 2rem \| 1.7rem = **18.4 px** | 1.04 | +.05rem | Sentence |
| Body L serif | Brier | 2.25rem \| 1.9rem = 20.6 px | 1.1 | −.0625rem | Sentence |
| Gallery quote | Brier | 1.5rem \| 1.5rem = 16.3 px | 0.946 | +.05rem | Sentence |
| Body | Mona `500 / 100` | 1.25rem \| 1.3rem = 14.1 px | 1.25 | −.0125rem | |
| Button / link | Mona `800`, `wdth 86` | 1rem; nav 1.25rem (mob 1.7rem); footer 1.875rem (mob 1.6rem) | 1 | 0 | UPPER |
| Eyebrow | Mona `700 / 100` | .625rem \| .8rem = **8.7 px** | 1 | 0 | UPPER |
| Eyebrow L | Mona `812`, `wdth 81.3` | 1.125rem | 1 | −.01rem | UPPER |

### 5.3 Interleave rules (what makes it "theirs")

1. **Two stacked lines, one per family**: line 1 sans (Mona, heavy 750, slightly condensed `wdth 93`, UPPERCASE, very tight leading 0.886, negative tracking), line 2 serif (same nominal size). Centred (`display:flex; flex-direction:column; align-items:center`) for section headings, left-aligned in editorial blocks. The order alternates: "LOREM SIT / *DOLOR AMET*" and also "*SIT* / LOREM" (serif first) in split title pairs.
2. In running statements, **serif is used for single accent words** inside a sans paragraph (`<strong>` → Brier): "*REDEFINING* LIMITS, FIGHTING FOR *WINS*…". The serif word gets the accent colour (lime-off on dark, tint on light).
3. The serif is set **about 4% larger** than the sans (8.25 vs 7.9375rem, 5.4375 vs 5.25rem) with **tighter leading** (0.83 vs 0.906) and **stronger negative tracking**, so the cap heights optically match.
4. Small text: the sans is used for UI (eyebrows, buttons, labels). The serif is used for "voice" lines (intros, quotes, captions).

**Lorena:** keep rules 1–4 with Mahogany (sans) + Tobacco (serif accent) on Vanilla, and Vanilla + Sand on Mahogany. More feminine variant (as in the prototype): the serif line in **italic sentence case** instead of UPPERCASE ("MY CONTENT / *in motion*"). Test both with the real Canva font. For Mona at small mobile sizes, ease the tracking to −0.02em.

### 5.4 Oval line reveal (`data-oval-scroll`): used on the fan heading

Per line (SplitText `lines`, each line wrapped in `.oval-line-clip-wrap`, all wrapped in an `overflow: clip` box):

```text
set:  wrap clip-path ellipse(20% 0% at 50% 0%);  line y −40%;  chars y −40%     ("top" variant; "bottom" mirrors to 100% and +40%)
play: wrap → ellipse(100% 120% at 50% 0%)  1.5s power2.inOut, stagger 0.15 per line
      line → y 0                            1.5s power2.inOut, delay 0.15 + 0.1·lineIndex
      chars → y 0                           1.5s power2.inOut, delay 0.15·lineIndex, stagger { amount 0.015·nChars, from "center" }
trigger: top 95%, once   (inside the hero container it plays on page load instead)
```

The lines open from a **tiny oval at the top centre that swells into the full line**, while the letters settle down from the centre outward. It is slow (1.5 s) and soft. Very fitting for Lorena.

### 5.5 Line highlight reveal (`data-anim-high="right, lime[, delayMs]"`) (ref `21-line-highlight-reveal-frames.png`)

```text
per line i (SplitText lines):  line clip-path inset(0 100% 0 0) → inset(0 0% 0 0)   0.6s power2.out   at i·0.15
                               colour block (abs, inset 0, z 5, origin right) scaleX 1 → 0   0.6s power2.inOut   at i·0.15 + 0.3
trigger: top 90%, once.  "left" mirrors the inset and origin. Colours: lime, lime-off, dark-green, dark-green-tint-1, black, white.
```

A solid bar wipes in carrying the line, then retracts toward the right to uncover the text. Used on eyebrows, the impact statement, footer links and captions. The same pattern is applied to stat items with a 0.05 s stagger. Lorena: block = Tobacco on light, Sand on Mahogany. Use it sparingly (captions and numbers), with the oval reveal for headings.

### 5.6 Text roll on hover (buttons/links, desktop) (ref `22-text-roll-hover-frames.png`)

Chars `translateY 0 → −100%`, 0.6 s `power3.out`, stagger 0.02. The second copy comes from `text-shadow: 0 var(--text-offset) currentColor` on the same glyphs (no DOM duplicate), inside a `.text-clip-w{overflow:hidden}`. On mobile there is no hover, so for v1 use it only on desktop, or play it once on tap as feedback.

### 5.7 Counters

`[data-car-counter]`: 0 → value in 1 s `power1.out` at `top 90%`, zero-padded to the final digit count, thousands separators kept. Our `js/motion.js` `data-count` already covers this for Lorena's Instagram numbers.

### 5.8 Important: on Lando, text reveals are desktop-only

The home init runs `ovalScroll`, `lineHighlight` and `textRoll` **only if `innerWidth >= 992`**. On phones the headings are simply static, and the mobile "motion" comes from the hero scrub, the signature, photo parallax, the fan and the marquees. Since Lorena's v1 *is* mobile and the client wants the effects, **we run the oval and image reveals on mobile too** (they are cheap clip-path/transform). Keep line highlights to a few elements.

---

## 6. The signature

### 6.1 How Lando builds it

- **Rive** file `signature.riv`, artboard `signature`, two state machines:
  - `signature_scroll` (hero): number input **`scroll` 0..1000** driven by a GSAP timeline whose progress is scrubbed by ScrollTrigger: `trigger .hero-rive-tracker` (a 100vh-tall marker at the bottom of the 200vh hero track), `start "top center"`, `end "bottom 80%"`, **`scrub: 0.5`**. So the signature writes itself between scrollY ≈ 50vh and 120vh, while the photo card has finished shrinking. If Lenis velocity is above 100 near either end, it snaps to 0 or 1000 so it never freezes half-drawn. A boolean input `color_lime` sets the colour.
  - `signature_play` (footer): plays **once** when its canvas hits `top 80%` (canvas is hidden for the first 50 ms to avoid a flash).
- Look (refs `04`, `05`): a **uniform-width, round-capped lime stroke** (~12 px at 1440, i.e. a monoline pen) drawn in writing order, with a visible "pen tip" moving along the path. It spans up to `70rem / max 800px` wide (`aspect 70/50`; mobile `80vw`) and is laid **over** the shrunk photo and a text marquee. It is bigger than the card, so it overflows it.
- Static versions: an SVG (lime) and a WebP (dark) signature sit under the gallery quotes and in callouts (DS "Closing statement": signature above the Impact S line).

### 6.2 Lorena: SVG stroke-draw (works without Rive and looks the same)

A monoline signature is exactly what `stroke-dasharray/dashoffset` draws well.

1. **Get the real signature as centre-line strokes.** Ask Lorena to sign "Lorena" (and optionally "Lorena Maruch") 3–5 times with an Apple Pencil in a vector app that exports **strokes, not fills** (Linearity Curve / Vectornator, Concepts, Illustrator with a pencil brush). Or sign on white paper → we trace the centre line. Requirements: SVG, one `<path>` per pen stroke, **in the order she wrote them**, direction = writing direction.
2. **Placeholder until then (already working in the prototype):** the OFL single-stroke font **EMS Allure** (a centre-line version of Google's Allura, from the `hersheytext@2.0.0` npm package, `svg_fonts/EMSAllure.svg`, licence SIL OFL). Each glyph is a polyline (y-up, units-per-em 1000). Compose "Lorena" by x-advance, flip y, and smooth with Catmull-Rom → cubic Bézier. It reads as a pretty feminine script (ref `28-proto-mobile-hero-shrink-signature.png`). Credit OFL in the footer or source if it ships.
3. **Draw at constant pen speed** (what makes it feel written rather than wiped):

```js
function signatureTimeline(svg){
  const paths = [...svg.querySelectorAll('path')];
  const lens = paths.map(p => p.getTotalLength()), total = lens.reduce((a,b)=>a+b,0);
  paths.forEach((p,i) => { p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i]; });
  const tl = gsap.timeline({ paused:true }); let at = 0;
  paths.forEach((p,i) => { const d = lens[i]/total; tl.to(p, { strokeDashoffset:0, duration:d, ease:'none' }, at); at += d; /* add +0.04 here for a tiny pen-lift pause */ });
  return tl;   // progress 0..1
}
// Hero (scrubbed, like Lando):
ScrollTrigger.create({ trigger:'#hero', start:()=>innerHeight*.5+' top', end:()=>innerHeight*1.0+' top', scrub:.5, animation:signatureTimeline(sig) });
// Loader / footer (timed, like signature_play): tl.duration(1.8) with ease 'power1.inOut', played at top 80%.
```

CSS: `fill:none; stroke-linecap:round; stroke-linejoin:round; stroke-width` ≈ 1–1.5% of the signature width (Lando ≈ 1.5%: 12 px on an 800 px signature, a bold marker. The prototype uses ≈ 0.9% for a finer, more feminine pen). Colour: Vanilla over the Mahogany hero (the prototype shifts the hero background Vanilla → `#4D342D` while the card shrinks, mirroring Lando's light → dark), or Mahogany/Tobacco on Vanilla.

4. **If the signature only exists as a filled outline** (scanned and auto-traced): keep the filled art and animate a **mask** instead. Put a thick (`stroke-width` ≈ 1.5× the max ink width) centre-line path inside `<mask>`, draw that path with the same dashoffset technique, and the ink appears in writing order. A simple left-to-right `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` wipe with an angled edge is the low-effort fallback, but it reads as "revealed", not "written".

### 6.3 Handwritten accent words (Rive `phrases.riv`)

On "ON / TRACK" a lime handwritten "ON" is scribbled over the type, and on "PARTNERS & CAMPAIGNS" a handwritten "Collabs" is written across it. Both play once at `top 80%` (refs `10`, `19`). **Lorena:** the same SVG technique with words written by her ("stays", "taste", "style", "glow") over the category headings, in Tobacco. This is a strong feminine signature move.

---

## 7. Loader, navigation, buttons, footer, cursor, misc

### 7.1 Loader and page transitions

- First load: full-screen **lime** panel (Rive `page-transition`, `Fit.Cover`) where the LN4 logo assembles stroke by stroke, with a small "LOAD NORRIS" label at the bottom centre (refs `01`, `02`). When assets are ready, input `transition-in` plays the reveal. The label fades out (`opacity` 300 ms) at +100 ms, and the overlay is hidden at +500 ms. Desktop shows the hero about 9–11 s after navigation in headless, about 2–4 s on real hardware (estimate).
- Page changes (taxi.js): `transition-out` covers (1000 ms), the old page is cleaned up, then `transition-in` reveals.
- **Lorena:** a Vanilla panel where **her signature writes itself** (1.6–2.0 s, `power1.inOut`), then the panel lifts with the menu's oval clip (`ellipse(120% 100% at 50% 20%)` → `ellipse(120% 0% at 50% 0%)`, 0.8 s `power3.in`). Show it only on the first visit of a session (wrap `sessionStorage` in try/catch) and cap it at about 2.5 s total.

### 7.2 Navbar

- Fixed, `pointer-events:none` on the bar (buttons re-enable). Padding = `--gap` (1.25rem). Brand wordmark left, LN4 mark centre (hidden/offset on mobile), buttons right. Mobile: lime "STORE" pill left, menu toggle right, both 4.7rem (51 px) tall, radius .74rem.
- **Theme switches per section:** sections carry `data-nav-theme-target="light|dark"`. A ScrollTrigger per section (`top top → bottom top`, onEnter/onEnterBack) sets `data-nav-theme` on the nav. Colours transition with `0.75s cubic-bezier(.65,.05,0,1)`. Lorena: Mahogany nav on Vanilla sections, Vanilla nav on Mahogany sections.
- Desktop only: brand and buttons start at `scale 1.2` and scrub to 1 over the first 10vh.

### 7.3 Menu (mobile)

Lenis is stopped while open. Panel: `clip-path: ellipse(120% 0% at 50% 0%) → ellipse(120% 100% at 50% 20%)` in 0.8 s `power3.out`. Two image columns follow the same clip with `y 25 → 0`, stagger 0.06, from 0.15 s. Links: `clip-path ellipse(30% 0% at 50% 0%), y 20 → ellipse(120% 100% at 50% 20%), y 0`, 0.6 s `back.out(1.2)`, stagger 0.08, from 0.35 s. Current-page marker: an SVG underline drawn via `strokeDashoffset`, 0.6 s `power2.inOut`, at 0.4 s. Background tint `autoAlpha 0 → 0.12`. Close = timeline reverse. Desktop also moves the image columns ±6rem with mouse Y (2 s `power2.out`). The hamburger is a Rive icon (the line morphs to an X).

### 7.4 Buttons

Lime fill and 1 px lime border, radius `.54rem` (7.2 px), height `3rem` (40 px), or `3.75rem` for nav/icon. Label Mona 800 `wdth 86` UPPERCASE 1rem with the text roll on hover. A Rive arrow icon animates on hover (`hover` input). Tertiary: transparent with a `currentColor` border, radius .41rem, height 2.5rem.
**Lorena:** Mahogany or Tobacco pill buttons (radius 999px or 10 px), the same text roll, and an inline SVG arrow that slides 4 px on hover. Same 0.75 s token.

### 7.5 Marquees (partner logos, footer)

GSAP `xPercent: -100, repeat: -1, ease: linear` on duplicated collections. Duration = `speed × (collectionWidth / viewportWidth) × k`, with `k = 0.25` (<479 px), `0.5` (<991), `1` (desktop). `data-marquee-speed="40"` (logos, direction right) and `30` (footer, left). **Direction follows scroll direction** (`timeScale ±1` via a ScrollTrigger `onUpdate`). In addition the whole row drifts `x: ±10vw` (logos) or `±5vw` (footer), scrubbed across its pass. Desktop ≥1920 adds an edge-fade mask (`linear-gradient(90deg, transparent, #fff 7.5%, #fff 92.5%, transparent)`).
**Lorena's partner wall (46 logos):** two rows in opposite directions, speed tuned so a logo crosses a 390 px screen in about 6–8 s, direction flips with scroll. Use the edge-fade mask on mobile too.

### 7.6 Scroll indicator (replaces the hidden scrollbar)

Fixed at right, `top: 10vh; height: 80vh; width: .4em; border-radius: 1em; mix-blend-mode: difference`. Bar is `rgba(255,255,255,.75)`, height = `clamp(10%, viewport/document, 25%)`. Fades in (0.5 s) on scroll, moves with 0.3 s `power2.out`, and fades out 500 ms after scrolling stops. Cheap and elegant: recommended for Lorena.

### 7.7 Footer

A dark panel shaped by an SVG **notched mask** (`footer-layout-clip`, a tab notch at the top centre). Mobile uses its own mask with `aspect-ratio 381.94/627.49`. It contains a topographic pattern at 12%, a lime radial glow behind the panel, link groups (eyebrow + stacked uppercase links with line highlight), the **signature (play once)** above "ALWAYS *BRINGING* THE *FIGHT*." (Impact S + serif accents, line highlight `lime-off`), a cut-out helmet image, a CTA button, a logo marquee, and a legal row (`© 2026 **Lando Norris**.` + small links). Ref `11`, `19`.
**Lorena:** a Mahogany rounded panel (24–32 px radius, or a soft arch notch) with a Tobacco glow, her signature writing itself above a 2-line sans/serif statement ("LET'S CREATE / *something beautiful*"), contact buttons (email, WhatsApp, Instagram) and a partner marquee.

### 7.8 Cursor

There is **no custom cursor**. Pointer effects: the WebGL head reveals the helmet under the cursor (a fluid trail; on touch you "paint" with the finger), and the stat-list image follows the cursor (§4.5). Nothing to port for mobile v1. On desktop later, the "image follows cursor" preview could be used on Lorena's partner list.

### 7.9 Misc

- `mob-landscape` overlay: a Rive phone-rotate icon plus "Please rotate your device, *This is a vertical drive.*" on landscape phones. Lorena could do the same, reusing the sans/serif interleave.
- `::selection` uses the brand colour (lime). Lorena: Tobacco background with Vanilla text.
- Topographic line backgrounds: a WebGL shader in dark/light tints (`#363b25` on dark, `#dde1d2`-ish on light). Optional for Lorena as a very faint static SVG line pattern; skip for v1.

---

## 8. Mobile vs desktop on Lando (what actually runs at 390 px)

| Effect | Desktop | Mobile (<992) |
|---|---|---|
| Lenis smooth scroll | wheel smoothing | **touch synced**, ×1.25 and inertia |
| Hero shrink + signature scrub + eyebrow chars | yes | yes (mobile target box 25×29rem, mobile title clip-away) |
| Oval heading / line highlight / text roll | yes | **no** (static text) |
| Horizontal pinned gallery + inner parallax | yes | **no**: vertical offset collage, no parallax |
| Helmet column offset parallax | yes | no (2-column grid) |
| On/Off track side slides, full-bleed parallax, visor, store drift | yes | yes |
| Fanned cards entrance | yes | yes (tighter x table) |
| Fan hover spread / video hover-play | yes | tap emulates hover (awkward) / no video |
| Image curtain reveal (on-track) | yes | yes |
| Marquees | speed ×1 | speed ×0.25 |
| Nav scale-down on top | yes | no |
| Menu oval curtain | yes | yes (100svh) |
| Helmet touch paint + "tap to lock" | n/a | yes |

---

## 9. Implementation plan for Lorena v1 (mobile, 390×844)

Order of build (each step is self-contained):

1. **Boot:** Mona Sans (Google Fonts) and the serif; tokens (`--r`, palette, `--cubic-default`); Lenis + GSAP + ScrollTrigger + SplitText (CDN URLs in §1.1). `prefers-reduced-motion` → no Lenis, all `gsap.set` to final states.
2. **Hero (200svh sticky):** full-bleed portrait → rounded card (clip-path scrub) while the background goes Vanilla → Mahogany. Name lockup "LORENA / *Maruch*" clips away upward. "A note from Lorena" chars rise. **Signature draws (scrub 0.5)** over the card.
3. **Statement:** 3–4 line sans paragraph with serif accent words (Impact XL mobile 3.5rem / serif 3.6rem); line highlight reveal in Tobacco.
4. **Numbers (Instagram):** existing `insights` screens + `data-count`. Captions with line highlight.
5. **Collage gallery:** vertical scatter with "Place, year" captions, image curtain reveal (Sand wash) and vertical inner parallax; background scrub Vanilla → Sand.
6. **Content fan (videos):** §3.7, focused card autoplays muted, tap focused card → sound or full-screen viewer, swipe to move focus. Heading with oval reveal and the cycling niche icon.
7. **Partners:** heading with a handwritten accent word drawn over it; two-row logo marquee (direction follows scroll).
8. **Footer / contact:** Mahogany panel, signature play-once at top 80%, sans/serif statement, buttons.
9. **Chrome:** nav theme switching, menu oval curtain, scroll indicator, optional signature loader.

Performance budget: animate only `transform`, `opacity`, `clip-path`, `stroke-dashoffset`. Set `will-change` on the fan cards and the hero photo only. Use `loading="lazy"` and `decoding="async"` on photos. Use `preload="none"` posters on videos, and play only the focused one. `ScrollTrigger.config({ ignoreMobileResize: true })` to avoid iOS address-bar refresh jumps. Use `100svh` units for sticky sections.

---

## 10. Reference screenshots and frames

Folder: `/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/understand/lando/ref/`

| File | Shows |
|---|---|
| `01-loader-lime-desktop.png` | lime loader with "LOAD NORRIS" |
| `02-loader-exit-sequence-desktop.png` | LN4 mark assembling → hero |
| `03-desktop-loader-hero-sheet.png` | contact sheet: loader, hero head, helmet paint, first shrink |
| `04-signature-draw-sequence-desktop.png` | **signature writing itself** over the shrunk card (6 steps) |
| `05-signature-full-desktop.png` | finished signature, monoline stroke width, marquee behind |
| `06-desktop-hero-shrink-signature-statement-sheet.png` | shrink → signature → impact statement |
| `07-horizontal-gallery-desktop.png` | scattered gallery, captions, serif quote + mini signature, colour + toned photos |
| `08-desktop-statement-to-gallery-sheet.png` | statement scroll-out, gallery entry |
| `09-desktop-gallery-otot-helmets-sheet.png` | gallery, background colour scrub, On/Off track slides, full-bleed parallax |
| `10-desktop-helmets-store-collabs-socials-sheet.png` | visor curtain, store, handwritten "Collabs", fan entrance |
| `11-desktop-socials-footer-sheet.png` | fan → notched footer with signature |
| `12-fan-desktop-rest.png` | fan at rest (desktop table) |
| `13-fan-desktop-hover-card1.png` | hover on card 1: neighbours spread |
| `14-fan-desktop-hover-center.png` | hover on centre card |
| `15-fan-mobile-rest.png` | fan at 390 px (outer cards bleed) |
| `16-fan-mobile-tap.png` | tap on mobile = emulated hover (too wide) |
| `17-mobile-scroll-overview-sheet.png` | whole home page at 390 px, every 480 px of scroll |
| `18-mobile-signature-collage-socials.png` | mobile signature, vertical collage, fan heading |
| `19-mobile-hero-statement-otot-helmets-footer.png` | mobile hero lockup, statement, handwritten "ON", helmets grid, footer |
| `20-mobile-loader-and-hero-touch-paint.png` | mobile loader + finger-paint helmet hero |
| `21-line-highlight-reveal-frames.png` | line highlight reveal frame by frame |
| `22-text-roll-hover-frames.png` | text roll on a button |
| `23-ds-typography-impact.png` | DS: Impact XL sans/serif interleave |
| `24-ds-closing-statement-signature.png` | DS: signature above Impact S |
| `25-ds-social-heading.png` | DS: social heading (icon, sans over serif, intro, links) |
| `26-ds-motion-specs.png` | DS: motion specs |
| `27-ds-media-card.png` | DS: media card radius |
| `28-proto-mobile-hero-shrink-signature.png` | **our** hero shrink + EMS Allure "Lorena" drawing (390 px) |
| `29-proto-mobile-fan.png` | **our** fan at 390 px with Lorena's photos |
| `30-proto-desktop-fan-hover.png` | **our** fan desktop rest vs hover |
| `31-proto-reveals-start-states.png` | **our** oval heading / line highlight / image curtain start → end |

Raw material (videos, 1 fps frame sheets): `…/understand/lando/raw/` (`vid-desktop/*.webm`, `vid-mobile2/*.webm`, `fr-desk/`, `mob/`, `soc/`).

## 11. Prototype (scratch, not in the repo)

`/tmp/claude-0/-home-user-lorena/c832ad17-6cd8-58af-aaaa-5c402c797f09/scratchpad/understand/lando/proto/proto.html` (open over `file://`; it uses repo images by absolute path). It contains working versions of: the Lando Lenis config + GSAP ticker, the sticky hero shrink, the EMS Allure "Lorena" signature at constant pen speed, the oval heading reveal, the line highlight, the image curtain, and the 7-card fan with desktop hover and touch tap/swipe. No console errors at 390 px or 1440 px. Treat it as a reference for whoever builds `index.html`. It is a scratch file and may not persist.

## 12. Open questions for the client

- Can Lorena send her **real signature** as vector strokes in writing order (Apple Pencil export or several signatures on white paper)? Also: "Lorena" only, or "Lorena Maruch"?
- **Which Canva serif** does she use (name), and is its licence web-embeddable? If not, which OFL look-alike does she prefer?
- Serif line style: **UPPERCASE** like the reference, or **italic sentence case** (softer, as in the prototype)?
- Fan content: 7 videos (one per card) or a mix of photos and videos? Should a tap play inline with sound, or open a full-screen viewer?
- Loader with the signature: wanted on every visit or only the first one?
