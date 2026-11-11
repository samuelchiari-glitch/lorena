# Conectaa case page: vertical video and effects (reverse-engineered)

Source: the client's own case page, https://flow.grupoconectaa.com.br/portfolio/clientes/forro-da-lua-cheia-xeque-mate/forro-da-lua-cheia-xeque-mate.html

The client wants its video behaviour reused for Lorena: *"um vídeo vertical que já começa a aparecer e com hover pra você poder ligar o som"* (a vertical video that is already playing as it appears, with hover so you can turn the sound on).

**How this was studied (2026-11-11).** I read the page's HTML, CSS and inline JS, then loaded it in headless Chromium 153 through Playwright 1.63, at 1440×900 desktop and with `devices['iPhone 13']`. I recorded scroll videos, pulled frames with ffmpeg, logged `<video>` events, and ran autoplay/unmute experiments with and without a prior user gesture. I also probed the MP4 with ffprobe. Every number marked *measured* below comes from these runs. Safari/iOS and Firefox could not be run here; where they matter, the behaviour is marked *expected* (known browser policy, not tested).

**Stack.** One static HTML file with inline CSS and JS, [GSAP 3.12.5 + ScrollTrigger 3.12.5](https://gsap.com) and a native IntersectionObserver. There is no video library and **no smooth-scroll library**: the page has no Lenis, only `html{scroll-behavior:smooth}` for anchor jumps. The "fluid" feel comes from `scrub: 1` on every ScrollTrigger. The page was adapted from a reference site called "Aurello", according to its own header comment.

---

## TL;DR

1. **There is no hover-to-unmute.** Hovering the video only *reveals* a round, frosted sound button (bottom-right). A **click on that button** toggles the sound. On touch screens the button is always visible and a tap toggles it.
2. **"Already starts appearing"** comes from two things together:
   - the card rises into place with a scroll-scrubbed GSAP entrance (`y: 210 → 0`, `scale: .92 → 1`);
   - an IntersectionObserver at **25 %** visibility calls `play()`. It measures the *transformed* box, so the video is already moving while the card is still sliding up.
3. Videos are `muted loop playsinline preload="metadata"`, with **no `autoplay` attribute and no `poster`**. JS starts and pauses them: they play on enter and pause on leave, and resume where they stopped.
4. **One sound at a time.** Turning one video's sound on mutes the others (*measured*). A video with sound that scrolls away is paused but stays unmuted, and it **resumes with sound** when it comes back (*measured*).
5. **The browser rule that matters:** in Chromium, setting `video.muted = false` without a prior user gesture does not throw. **It pauses the video on the spot**, leaving a frozen frame (*measured*). After any click on the page, unmuting on hover works (*measured*). So true hover-to-hear can only be an *upgrade* that switches on after the first click. The spec in §5 is built on that.
6. Effects worth taking for Lorena, in order of value:
   - the scroll-"dealt" photo cards (rise + small rotation + scale, staggered, scrubbed);
   - the scrubbed headline reveal;
   - the pinned hero stage with an **arched panel** that rises to cover it;
   - the rolling-text CTA button;
   - the header that hides on scroll down and returns on scroll up.

---

## 1. The vertical video component

### 1.1 Markup (as shipped, SVG paths shortened)

```html
<div class="can-collection__row can-collection__row--videos">
  <div class="can-video can-video--vertical">
    <video loop muted playsinline preload="metadata"
           src="assets/videos/xeque-mate-vertical.mp4"></video>
    <button type="button" class="cf-sound-btn"
            aria-label="Ativar som do vídeo" aria-pressed="false">
      <svg class="cf-sound-off" viewBox="0 0 24 24"><!-- speaker + "x" --></svg>
      <svg class="cf-sound-on"  viewBox="0 0 24 24"><!-- speaker + 2 waves --></svg>
    </button>
  </div>
  <div class="can-video can-video--horizontal"> …same, 16:9 file… </div>
</div>
```

| Attribute | Value | Note |
|---|---|---|
| `autoplay` | **absent** | Nothing plays without JS; playback is driven by the IntersectionObserver. |
| `muted` | present (HTML attribute) | Required for autoplay. `defaultMuted` is true (*measured*). |
| `playsinline` | present | Stops iOS from going fullscreen. |
| `loop` | present | |
| `preload` | `metadata` | Chromium still buffered both files to `readyState 4` before they played (~0.6–0.7 s of media, *measured*). |
| `poster` | **absent** | The card shows `#000` until the first frame decodes. *Expected* on iOS, which ignores `preload`: a black card until playback starts. |
| `controls` | absent | No native controls. The only UI is the sound button. |
| source | single `src` MP4 | No `<source>` list, no WebM/HEVC alternatives. |

**The file** (`xeque-mate-vertical.mp4`, *measured* with ffprobe):
- video: H.264 High, 608×1080, 23.976 fps, yuv420p, ~1.62 Mb/s;
- audio: AAC-LC 48 kHz stereo at ~131 kb/s;
- 34.9 s and 7.7 MB in total;
- `moov` atom before `mdat` (faststart), served with `accept-ranges: bytes`.

The 16:9 companion is 18.5 MB.

### 1.2 Size, aspect, radius, shadow

```css
.can-collection__row--videos{display:grid;grid-template-columns:1fr 3.16fr;gap:22px;align-items:center}
.can-video{position:relative;border-radius:48px;overflow:hidden;background:#000}
.can-video--vertical{aspect-ratio:1080/1920}
.can-video--horizontal{aspect-ratio:1920/1080}
.can-video video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
@media(max-width:900px){.can-collection__row--videos{grid-template-columns:1fr}}
```

- **Desktop (1440):** the 9:16 card is **282×501 px**, next to a 16:9 card of 890×501. The `1 : 3.16` columns are calculated so that both cards have the same height.
- **Mobile (390):** one column, with section padding of 6vw (23.4 px). The 9:16 card is **316×561 px** and the 16:9 card is 316×178 (*measured*).
- **Radius:** 48 px at every size. On a 316 px-wide card that is very round, about 15 % of the width.
- **Shadow:** none. The card sits on a flat `#1D1C1E` background.

### 1.3 When and how it starts playing

```js
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) e.target.play().catch(()=>{}); else e.target.pause();
}), { threshold: .25 });
document.querySelectorAll('.can-video video').forEach(v => io.observe(v));
```

- The observer watches the `<video>` itself. It reports 25 % visibility, and on leaving it pauses the video. `currentTime` is **not** reset, so the video resumes where it stopped (*measured*: paused at 0.75 s, resumed at 0.80 s).
- `play()` errors are swallowed. If muted autoplay is blocked (*expected*: iOS Low Power Mode, data saver), the card stays black because there is no poster.

**The entrance animation** is a scroll-scrubbed GSAP `from`:

```js
gsap.from('.can-collection__row--videos > .can-video', {
  y: 210, scale: .92, stagger: .14, ease: 'power3.out',
  scrollTrigger: { trigger: '.can-collection__row--videos',
                   start: 'top 94%', end: 'top 38%', scrub: 1 }
});
```

- At 900 px of viewport height, the rise maps to about 500 px of scroll. `scrub: 1` adds a 1 s catch-up lag, which is what makes it feel "liquid".
- *Measured* on desktop: the vertical video fired `play` while its card was still at `scale(.975) translateY(65px)`. On mobile it fired while the card was still at `translateY(210px) scale(.92)`; that is partly caused by the layout-viewport bug in §4.7, which delays the scrubbed rise. Either way, **the footage is already moving while the card lands**. That is the effect the client describes.

## 2. Sound: "hover to turn the sound on"

### 2.1 What is actually implemented

**UI**
- A 44×44 round button, 16 px from the right and bottom edges.
- Frosted look: `background: rgba(220,220,220,.28)` with `backdrop-filter: blur(6px)`, and a white icon of 20 px.
- The icon swaps between two SVGs: a speaker with an "×" when off, a speaker with two sound waves when on.
- No text label. The cursor is `pointer` on the button only; the video keeps the default arrow.

```css
.cf-sound-btn{opacity:0;pointer-events:none;transition:opacity .25s ease,background-color .25s ease,transform .25s ease}
.cf-sound-btn:hover{background:rgba(235,235,235,.45);transform:scale(1.06)}
.cf-sound-btn:focus-visible{opacity:1;outline:2px solid #fff;outline-offset:2px}
@media(hover:hover){.can-video:hover .cf-sound-btn,.cf-sound-btn.is-on,.cf-sound-btn:focus-visible{opacity:1;pointer-events:auto}}
@media(hover:none){.cf-sound-btn{opacity:1;pointer-events:auto;background:rgba(220,220,220,.32)}}
```

Two details are worth keeping:
- `pointer-events:none` while the button is hidden, so it never becomes an invisible tap target;
- `:focus-visible` reveals it for keyboard users.

**Behaviour** (click handler on the button):
1. Read `turnOn = video.muted`.
2. If turning on, mute every other video first.
3. Set `video.muted = !turnOn`.
4. Toggle `.is-on`, `aria-pressed`, and the `aria-label` between "Ativar/Desativar som do vídeo".
5. Call `video.play()` in case it was paused.

The handler also calls `preventDefault()` and `stopPropagation()`. There is no volume fade: the sound switches on and off instantly.

**On `mouseleave`:** nothing changes. If the sound is on, it keeps playing and the button stays visible through `.is-on`. If it is off, the button fades out in .25 s.

### 2.2 Autoplay rules: what really happens in Chromium (*measured*)

All runs used a fresh profile in headless Chromium 153.

Test-method note: Playwright's `page.evaluate()` runs with `userGesture: true`, which **grants user activation** and corrupts this kind of test. Page state was therefore read through a raw CDP `Runtime.evaluate` with `userGesture: false`. Use the same trick when testing Lorena's site.

| # | Situation | Result |
|---|---|---|
| A | `play()` on an **unmuted** video, no prior interaction | Rejected with `NotAllowedError`. |
| B | IO-driven `play()` on the **muted** video, no prior interaction (only wheel scrolling, which is not an activation) | Allowed; plays. |
| C | Experiment: `mouseenter` sets `muted = false` (true hover-to-unmute), **no prior click** | `volumechange` is followed **immediately by `pause`**. The video freezes, unmuted and silent. Hover-unmute alone **breaks the video**. |
| D | Same as C, but after **one click anywhere** on the page (sticky activation) | Unmute works and the video keeps playing; `mouseleave` re-mutes cleanly. |
| E | Real implementation: hover reveals the button, click it | Unmuted and keeps playing, because the click itself is the activation. |
| F | After E: scroll away, then back | Paused off-screen (still unmuted), then **resumes with sound** on return. Sticky activation allows it. |

*Expected* in other browsers (policy, not tested here):
- **Safari (macOS and iOS):** a muted-autoplaying video that is unmuted outside a gesture is paused, as in C. On iOS, `video.volume` is read-only (always 1), so volume fades do nothing. Low Power Mode blocks even muted autoplay: `play()` rejects.
- **Firefox:** blocks audible playback without activation.

So any hover-to-hear must check after unmuting and **fall back to "click for sound"**.

### 2.3 Mobile / touch (iPhone 13 emulation, *measured*)

- `(hover:none)` matches, so the button is **always visible**. Its background is slightly more opaque, `rgba(220,220,220,.32)`.
- Tapping the button toggles the sound. The video keeps playing, and turning on the second video mutes the first.
- **Tapping the video itself does nothing**: there is no listener on it.
- Both stacked videos played at the same time while both were at least 25 % visible.

## 3. Several videos

| Concern | Conectaa page |
|---|---|
| One sound at a time | **Yes.** Turning one on mutes all the others (*measured*, desktop and mobile). |
| Pause off-screen | **Yes**, through the IO at `threshold: .25`. It resumes without resetting. |
| Max simultaneous playback | **No limit.** Both videos played together on desktop and on mobile. |
| Poster / lazy source | None. `preload="metadata"` only. |
| `visibilitychange`, data-saver, reduced motion | Not handled for the videos. Reduced motion only disables the GSAP timelines and the falling particles. |
| Error handling | `play().catch(()=>{})`, so failures are silent and show a black card. |
| Encoding | Faststart MP4 at about 1.6 Mb/s for the 9:16 file, which is good for quick first frames. |

## 4. Other effects on the page worth bringing over

All of these are scroll-scrubbed (`scrub: 1`) GSAP `from`/`to` tweens. Values are copied from the page's JS and CSS. For each one, the "Lorena" note gives a softer, more feminine tuning.

### 4.1 Photo cards "dealt" onto the page (best one)

```js
gsap.from('.can-collection__grid > .can-product-card', {
  y: 210, rotation: i => [-5, 4, -3][i], scale: .88, stagger: .14, ease: 'power3.out',
  scrollTrigger: { trigger: '.can-collection__grid', start: 'top 94%', end: 'top 38%', scrub: 1 } });
// 2-up row: rotation [4, -4]; video row: no rotation, scale .92
```

- The cards rise from 210 px below, slightly rotated and shrunk. They settle one after another and "land" in sync with the scroll.
- The cards use radius 48 px and `overflow:hidden`. The photo inside has a hover zoom: `transform: scale(1.06)` over `.5s cubic-bezier(.2,.8,.2,1)`.
- **Lorena:** use it for the photo gallery and the video cards. Suggested values:
  - `y: 90–120` on mobile;
  - `rotation: [-2.5, 2, -1.5]`;
  - `scale: .94`;
  - `stagger: .1`;
  - start at `top 100%`, end at `top 55%`;
  - add a short opacity ramp (0 → 1 over the first 30 %).

### 4.2 Scrubbed headline reveal

```js
gsap.timeline({ scrollTrigger: { trigger: '.can-collection', start: 'top 88%', end: 'top 28%', scrub: 1 } })
  .from('.can-collection__intro h2', { opacity: 0, y: 120, scale: .92, duration: .62 })
  .from('.can-collection__intro > p:last-child', { opacity: 0, y: 50, duration: .38 }, '<.24');
// range section: h2 {opacity:0, y:95, scale:.94} then p {y:35} at '<.24', info pills {y:35} at '<.15'
// contact section: same as range, start 'top 85%' end 'top 40%'
```

**Lorena:** pair it with the sans/serif alternating headline. The bold sans line comes first, and the serif line follows with an offset of `'<.18'`.

### 4.3 Pinned hero "stage" and arched cover panel

The `.gas` section is 350vh tall. Its `.gas-stage` is `position:sticky; top:0; height:100vh` and runs one scrubbed timeline from `top top` to `bottom bottom`:

1. The big title drifts left: `xPercent: -34`, then `-128` while fading to 0.
2. The secondary title holds at `scale 1.02, opacity .65`, then exits right (`xPercent: 56`, opacity 0, `power1.in`).
3. The product image rises from `bottom:-70vh` to `-8vh`. It rotates −6° with scale 1.05, then +7° with `yPercent: 5`.
4. A **dark arched panel** rises from below (`yPercent: -100`). It is 106 % wide and 9vh tall, with `border-radius: 50% 47% 0 0 / 46% 36% 0 0`, and its colour matches the next section, so the cut feels organic.

**Lorena:**
- Use it for the hero: her portrait rises and turns slightly while the name lines drift apart.
- Close with an arched **Vanilla→Sand** panel. That is a soft, very feminine section transition.
- On mobile, keep the pin short, around 200vh.

### 4.4 Floating particle layer (falling lime slices)

- A `position:fixed` layer with `pointer-events:none` and `contain:strict`.
- **10 particles on mobile and 16 on desktop**, each set up with random CSS custom properties:
  - size 42–116 px (mobile) / 52–170 px (desktop);
  - duration 17–37 s, with a negative delay so the layer starts already populated;
  - horizontal drift of ±72 px;
  - rotation of ±55°, ending another ±120° further;
  - opacity .34–.76 and blur 0–1.1 px;
  - `mix-blend-mode: multiply` on every third particle.
- Keyframes go from `translate3d(0,-18vh)` to `translate3d(dx,148vh)` with `scale .82 → 1.08`.
- It is visible only while the first section is on screen (an `.is-visible` toggle with a .65 s fade) and hidden under reduced motion.

**Lorena:** optional, and only if very subtle (4–6 tiny soft shapes, slow, low opacity). It is the most "radical" effect on the page, and the client asked for effects, not loudness.

### 4.5 Horizontal pinned gallery (desktop only, later)

- `.range` is 360vh tall with a sticky 100vh stage. The track moves `x: -innerWidth * 1.68`, scrubbed. Each photo also does `from {yPercent: 12}` with a stagger of .12.
- The "Client / Year / text" pills switch from outline to **solid fill** (`.is-crossed`) once the first photo slides under them. This is checked with `getBoundingClientRect()` on every update.
- **At ≤900 px it turns into a vertical list:** cards `from {y:120, opacity:0}`, `stagger .12`, start `top 88%`, end `top 35%`.

**Lorena:** only for desktop v2, e.g. her metrics pills inverting as photos pass under them.

### 4.6 Rolling-text CTA button (`.tp-btn`)

- A pill (`padding: 13px 26px`, `radius: 40px`) holding two stacked copies of the label.
- On hover, both copies move `translateY(-100%)` over `.45s cubic-bezier(.65,0,.35,1)`.
- The 11 px diagonal arrow swaps the same way: the first arrow exits to the top-right, and the second arrives from the bottom-left.
- **Lorena:** perfect for "Let's work together" and "Email me". On touch there is no hover, so the button simply stays static.

### 4.7 Header and mobile menu

- The header sits `position:absolute` at the top. Scrolling **up** past 80 px adds `position:fixed` (`.header--sticky`), and scrolling down removes it.
- It uses a translucent dark bar, `rgba(29,28,30,.6)` with `backdrop-filter: blur(6px)`.
- The mobile burger panel slides from `right:-100%` to `0` over `.35s cubic-bezier(.16,1,.3,1)`.
- **Pitfall (*measured*):** that off-canvas `position:fixed` panel at `right:-100%` makes the page 780 px wide on a 390 px phone. In Chromium's iPhone emulation, `innerWidth` becomes **780** and `innerHeight` becomes **1328** (twice 664). ScrollTrigger's `start: 'top 94%'` is then computed against 1328 px, so mobile entrances run late or off-screen.
- **For Lorena:**
  - build off-canvas panels with `transform: translateX(100%)` plus `visibility:hidden`;
  - put `overflow-x: clip` on `html, body`;
  - assert in tests that `document.documentElement.scrollWidth === innerWidth`.

### 4.8 Not on this page

Smooth wheel scrolling (Lenis) comes from the Lando Norris reference, not from Conectaa. When Lenis drives the scroll, lower ScrollTrigger's `scrub` from 1 to about `.5`, because Lenis already smooths the motion. Also drive `lenis.raf` from `gsap.ticker` and call `ScrollTrigger.update` on Lenis' `scroll` event.

---

## 5. Re-implementation spec: Lorena's 9:16 video cards (mobile-first)

The goal: footage is already alive as each card lands, sound is one gesture away, it never stutters, and it stays kind to an iPhone's battery and data.

All code here is ours. Nothing from the Conectaa page has to be copied; the logic below supersedes it.

### 5.1 Markup

```html
<figure class="vcard" data-vcard>
  <div class="vcard__media">
    <img class="vcard__poster" src="assets/video/posters/stays-01.webp" alt=""
         loading="lazy" decoding="async" width="720" height="1280">
    <video class="vcard__video"
           src="assets/video/stays-01.mp4" poster="assets/video/posters/stays-01.webp"
           muted playsinline loop preload="none"
           disablepictureinpicture disableremoteplayback
           controlslist="nodownload noplaybackrate nofullscreen"
           aria-label="Lorena in a glamping dome bathtub with a mountain view"></video>
  </div>
  <button class="vcard__sound" type="button" aria-pressed="false" aria-label="Turn sound on">
    <svg class="i-off" viewBox="0 0 24 24" aria-hidden="true">…speaker + ×…</svg>
    <svg class="i-on"  viewBox="0 0 24 24" aria-hidden="true">…speaker + 3 bars…</svg>
  </button>
  <span class="vcard__hint" aria-hidden="true">Tap for sound</span>
  <figcaption class="vcard__caption">Glamping · Serra da Mantiqueira</figcaption>
</figure>
```

- `muted` must be in the HTML. Setting only the property is too late for iOS autoplay.
- `preload="none"`: the JS warms the file up when the card gets near (§5.4). This avoids the Conectaa behaviour where Chromium buffers every file at page load. With 22 videos, that matters.
- The `<img>` poster layer crossfades out on the first `playing` event. The same URL in `poster=` is a cache hit and covers iOS.
- File names follow `docs/media-request.md`, e.g. `hospedagens-01` → `stays-01.mp4`, matching `assets/video/_ref/stays-01.jpg`.

### 5.2 Layout and style (iPhone 390 × ~844)

| Variant | Width | Size (CSS px) | Radius |
|---|---|---|---|
| Feature card (single, centred) | `min(78vw, 320px)` | 304×540 | 22 px |
| 2-column grid | `(100vw − 2·16 − 10) / 2` | 174×309 | 16 px |
| Fan (content section, 7 cards) | centre card about 62vw, sides smaller | per the fan spec | 18 px |

The radius stays at about 7 % of the card width: rounded, never pill-like.

```css
.vcard{--r:22px;position:relative;margin:0}
.vcard__media{position:relative;aspect-ratio:9/16;border-radius:var(--r);overflow:hidden;
  clip-path:inset(0 round var(--r));            /* keeps corners round on Safari during transforms */
  background:#584738;                           /* Mahogany while nothing is decoded */
  box-shadow:0 24px 48px -26px rgba(77,52,45,.55)}
.vcard__video,.vcard__poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vcard__poster{z-index:1;transition:opacity .45s ease}
.vcard.is-live .vcard__poster{opacity:0}
.vcard__sound{position:absolute;z-index:2;right:10px;bottom:10px;width:40px;height:40px;
  display:grid;place-items:center;border:0;border-radius:999px;cursor:pointer;
  color:#F1EADA;background:rgba(241,234,218,.22);
  -webkit-backdrop-filter:blur(10px) saturate(1.2);backdrop-filter:blur(10px) saturate(1.2);
  box-shadow:inset 0 0 0 1px rgba(241,234,218,.38);
  transition:opacity .25s ease,background-color .25s ease,color .25s ease,transform .25s cubic-bezier(.2,.8,.2,1)}
.vcard__sound::after{content:"";position:absolute;inset:-4px}          /* 48px hit area */
.vcard__sound[aria-pressed="true"]{background:#F1EADA;color:#584738}  /* state readable at a glance */
.vcard__sound .i-on,.vcard__sound[aria-pressed="true"] .i-off{display:none}
.vcard__sound[aria-pressed="true"] .i-on{display:block}
@media (hover:hover) and (pointer:fine){
  .vcard__sound{opacity:0;pointer-events:none}
  .vcard:hover .vcard__sound,.vcard__sound:focus-visible,.vcard__sound[aria-pressed="true"]{opacity:1;pointer-events:auto}
  .vcard__sound:hover{transform:scale(1.06)}
}
.vcard__sound:focus-visible{outline:2px solid #F1EADA;outline-offset:3px}
```

- **Sound icon states.**
  - *Off:* a Vanilla speaker with a small "×", on frosted Vanilla glass.
  - *On:* the colours invert (solid Vanilla, Mahogany speaker), and three equalizer bars beside the speaker move. The bars use `scaleY(.35 → 1)` over `.9s ease-in-out infinite alternate`, with delays of 0, .15 and .3 s.
  - The bars hold still under reduced motion.
- **Hint pill** (`.vcard__hint`): Vanilla text on 30 % Mahogany glass, 11 px uppercase, top-left of the card.
  - It reads "Tap for sound" on touch and "Click for sound" on desktop.
  - It shows once on the first card that starts playing and fades after 2.5 s.
  - It shows again on hover when the sound is still locked (§5.5).
- **Small grid cards:** a 32 px visual button with the same 48 px hit area, inset by 8 px.
- **Caption:** below the card in the serif face. No text over the footage.

### 5.3 Entrance ("already playing as it lands")

- Use the site's scroll engine: GSAP + ScrollTrigger with Lenis, as recommended for the Lando-style smooth scroll.
- Values for each card or row:
  - `from { y: 110, scale: .94, rotation: [-2.5, 2, -1.5][i % 3], opacity: 0 }`;
  - opacity reaches 1 by 30 % of the tween;
  - `ease: 'power3.out'`, `stagger: .1`;
  - trigger on the card, `start: 'top 100%'`, `end: 'top 55%'`;
  - `scrub: .5` with Lenis, or `1` without it.
- Playback starts once **35 %** of the transformed card is visible (§5.4), so it begins during the last third of the rise. That reproduces the Conectaa feel.
- Fallback without GSAP: `data-reveal="up"` from `js/motion.js` (time-based, 700 ms).

### 5.4 Playback rules

| Rule | Value |
|---|---|
| Warm-up | IO with `rootMargin: '100% 0px'` (one screen ahead or behind): set `preload = 'metadata'` once, so the moov atom and first frames arrive before entry. |
| Play when | intersection ratio **≥ .35** |
| Pause when | ratio **< .15**. The hysteresis avoids flicker at the edges. Keep `currentTime`, because a resumed loop feels natural. |
| Max playing at once | **2 on mobile** (`(pointer:coarse)` or `innerWidth < 768`) and **3 on desktop**. The most visible cards win (largest ratio, then closest to the viewport centre). The card with sound always counts as one of them. In the fan, only the centre card autoplays. |
| Tab hidden | `visibilitychange`: pause everything when hidden, re-run the scheduler when visible. |
| Data saver | If `navigator.connection?.saveData`, do not autoplay; use the same poster + play glyph as reduced motion. |
| `play()` rejected | Typical cause: iOS Low Power Mode. Add `.is-blocked`, keep the poster, show a small play glyph. A tap plays the video, because the tap is a gesture. |
| First frame shown | On the first `playing` event, add `.is-live` (the poster fades out). |

### 5.5 Sound rules

There is a single `soundOwner`: at most one card has sound, and giving sound to a card mutes the previous one.

**Touch** (`(hover:none)` or `(pointer:coarse)`; the iPhone v1 target):
- The button is always visible.
- A **tap on the button or anywhere on the card** toggles the sound. Use the `click` event: browsers do not fire it after a scroll drag.
- Inside that handler, synchronously: set `muted = false`, then call `play()`.

**Pointer:fine** (desktop, later; the logic ships now):

| Situation | Hover | Click on card or button | Mouse leaves |
|---|---|---|---|
| Sound **locked** (no successful unmute yet in this page) | Controls fade in, plus the "Click for sound" hint. **Never** set `muted=false` on hover (case C: Chromium freezes the video). | Unmute and play (the click is the gesture), *pin* the sound, mark sound as unlocked. | Pinned sound stays on. |
| Sound **unlocked** | After a 180 ms intent delay (ignores a cursor just passing over while scrolling), unmute and fade the volume 0 → 1 over 300 ms. This is temporary sound. | Toggle the pin: pinned sound stays on after leaving; clicking again mutes. | Temporary sound fades 1 → 0 over 200 ms, then `muted = true`. |

**Unmute safety check.** After every `muted = false`, run `requestAnimationFrame(() => …)`:
- If the video got paused, or `play()` rejected, treat it as blocked: set `muted = true`, call `play()` again, mark sound as locked, and show the "Click for sound" hint.
- This catches Chromium without activation (*measured*) and Safari/Firefox (*expected*).
- Only set `unlocked = true` after a successful check. `navigator.userActivation.hasBeenActive` is a hint, not proof: Safari can still pause an element that was not unmuted by a gesture.

**Other rules**
- **Owner scrolls away** (ratio < .15): fade out, mute and release the owner, so the button returns to "off".
  - This is a deliberate change from Conectaa, which resumes with sound when the video returns (§2.2 F). Sound from something off-screen, or audio coming back unexpectedly during a fast scroll, feels wrong on a portfolio.
  - Optional opt-in: `data-sound-resume`.
- **Volume fades:**
  - Animate `video.volume` with rAF, which works on desktop and Android.
  - iOS ignores `volume`. Detect it once (`v.volume = .5; ios = v.volume !== .5`) and switch instantly there.
- **Accessibility:**
  - The button keeps `aria-pressed` and an `aria-label` of "Turn sound on" / "Turn sound off" (English site).
  - `Enter`/`Space` work natively on the button.
  - Each video gets a descriptive `aria-label`.
  - **Moving content longer than 5 s needs a pause mechanism** (WCAG 2.2.2). Conectaa has none. Proposal: a second, small play/pause button that only appears on `:focus-visible`, plus the reduced-motion mode below. Whether to make it visible for everyone is open question 2.

### 5.6 prefers-reduced-motion

- **No autoplay.** Show the poster with a centred play glyph: a 52 px Vanilla glass circle.
- A tap or click plays **with sound**: the gesture allows it, and the person has chosen to watch. That card becomes the sound owner. A second tap pauses it.
- Entrances: no translate, scale or rotate. At most a 200 ms opacity fade.
- The equalizer bars are static, and there is no hint animation.

### 5.7 Posters, encoding, preload budget

**Poster**
- The **exact first frame of the encoded file**, so the swap to video does not jump.
- 720×1280 WebP at quality ~75, about 50–90 KB.
- Interim posters until the originals arrive: the 22 low-res `assets/video/_ref/*.jpg` files.

**Video**
- H.264 High, yuv420p, **720×1280**. A 304 px card at 3× DPR is about 912 px, so 720 is plenty.
- 30 fps (or the source rate), with a GOP of about 2 s for a fast first frame.
- CRF 24–26 with `maxrate 2.5M` / `bufsize 5M`.
- AAC 128 kb/s stereo: **keep the audio**, since sound is the feature.
- `-movflags +faststart`.
- Target about 1.5–2 Mb/s, so a 15 s clip weighs about 3–4 MB.

```bash
ffmpeg -i in.mov -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 25 -maxrate 2.5M -bufsize 5M -g 60 \
  -c:a aac -b:a 128k -ac 2 -movflags +faststart out.mp4
ffmpeg -i out.mp4 -frames:v 1 -c:v libwebp -quality 75 poster.webp
```

**Budget**
- 22 videos × ~3–5 MB is about 66–110 MB in total, but a visitor only downloads what comes within one screen of the viewport. At most 2 decode at once on a phone.
- Later option: a 6–8 s muted preview file for the loop, switching to the full file when sound is turned on. Not for v1, because switching `src` loses the playback position.

### 5.8 Inside a claude.ai Artifact

- Muted autoplay works.
- Sound can only start **after the viewer clicks or taps inside the artifact page**. User activation propagates up to parent frames, not down into the artifact's iframe, so a click on claude.ai itself does not unlock it. The hint must therefore say "Click for sound" / "Tap for sound".
- Hover-to-hear only switches on after that first click.
- The 16 MB page limit means videos must be published as separate assets (≤15 MB each), never as `data:` URIs.

### 5.9 Module sketch (`js/video-cards.js`, ES module, no dependencies)

```js
const qCoarse = matchMedia('(hover: none), (pointer: coarse)');
const qReduce = matchMedia('(prefers-reduced-motion: reduce)');
const PLAY_AT = .35, STOP_BELOW = .15;
const maxPlaying = () => (qCoarse.matches || innerWidth < 768 ? 2 : 3);
const saveData = !!navigator.connection?.saveData;
const autoplayOK = () => !qReduce.matches && !saveData && !document.hidden;

const cards = new Map();            // element -> state
let owner = null, unlocked = false, raf = 0;

export function initVideoCards(root = document) {
  root.querySelectorAll('[data-vcard]').forEach(el => {
    if (cards.has(el)) return;
    const c = { el, v: el.querySelector('video'), btn: el.querySelector('.vcard__sound'),
                ratio: 0, pinned: false, viaHover: false, userPlay: false, t: 0 };
    cards.set(el, c);
    c.v.addEventListener('playing', () => el.classList.add('is-live'), { once: true });
    c.btn.addEventListener('click', e => { e.stopPropagation(); toggle(c); });
    el.addEventListener('click', () => (autoplayOK() ? toggle(c) : userPlayPause(c)));
    el.addEventListener('pointerenter', e => e.pointerType === 'mouse' && hoverIn(c));
    el.addEventListener('pointerleave', e => e.pointerType === 'mouse' && hoverOut(c));
    near.observe(el); vis.observe(el);
  });
}

const near = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const v = cards.get(e.target).v; if (v.preload === 'none') v.preload = 'metadata';
  near.unobserve(e.target);
}), { rootMargin: '100% 0px' });

const vis = new IntersectionObserver(es => {
  es.forEach(e => { cards.get(e.target).ratio = e.isIntersecting ? e.intersectionRatio : 0; });
  schedule();
}, { threshold: [0, STOP_BELOW, PLAY_AT, .6, 1] });

function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; reconcile(); }); }

function reconcile() {
  const all = [...cards.values()];
  if (owner && owner.ratio < STOP_BELOW) sound(owner, false);           // owner left: release
  let keep;
  if (autoplayOK()) {
    keep = all.filter(c => c.ratio >= PLAY_AT || (!c.v.paused && c.ratio >= STOP_BELOW))
              .sort((a, b) => (b === owner) - (a === owner) || b.ratio - a.ratio)
              .slice(0, maxPlaying());
  } else keep = all.filter(c => (c.userPlay || c === owner) && c.ratio >= STOP_BELOW);
  all.forEach(c => keep.includes(c) ? play(c) : c.v.paused || c.v.pause());
}

function play(c) {
  if (!c.v.paused) return;
  c.v.play().then(() => c.el.classList.remove('is-blocked'))
            .catch(() => c.el.classList.add('is-blocked'));
}

function sound(c, on, { viaHover = false } = {}) {
  if (on) {
    if (owner && owner !== c) sound(owner, false);
    owner = c; c.viaHover = viaHover;
    c.v.muted = false; fade(c.v, 1);
    c.v.play().catch(() => locked(c));                                   // still inside the gesture
    requestAnimationFrame(() => (owner === c && c.v.paused ? locked(c) : (unlocked = true)));
  } else {
    fade(c.v, 0, () => { c.v.muted = true; });
    if (owner === c) owner = null; c.pinned = c.viaHover = false;
  }
  render(c); schedule();
}

function locked(c) {                                                     // browser refused the unmute
  c.v.muted = true; if (owner === c) owner = null; unlocked = false;
  c.el.classList.add('needs-gesture'); render(c); c.v.play().catch(() => {});
}

function toggle(c) {                                                     // tap / click = a real gesture
  if (owner === c && (c.pinned || qCoarse.matches)) return sound(c, false);
  if (owner === c) { c.pinned = true; return render(c); }                // hover sound -> pin it
  sound(c, true); c.pinned = true;
}

function hoverIn(c) {
  c.el.classList.add('is-hover');
  if (!unlocked) return c.el.classList.add('needs-gesture');             // never unmute on hover while locked
  clearTimeout(c.t); c.t = setTimeout(() => owner !== c && sound(c, true, { viaHover: true }), 180);
}
function hoverOut(c) {
  clearTimeout(c.t); c.el.classList.remove('is-hover', 'needs-gesture');
  if (owner === c && c.viaHover && !c.pinned) sound(c, false);
}

function userPlayPause(c) {                                              // reduced motion / data saver
  c.userPlay = c.v.paused;
  if (c.userPlay) sound(c, true); else { c.v.pause(); sound(c, false); }
}

function render(c) {
  const on = owner === c;
  c.btn.setAttribute('aria-pressed', on);
  c.btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  c.el.classList.toggle('has-sound', on);
}

function fade(v, to, done) { /* rAF tween of v.volume over 300ms (in) / 200ms (out); instant on iOS */ }

document.addEventListener('visibilitychange', () =>
  document.hidden ? cards.forEach(c => c.v.pause()) : schedule());
```

### 5.10 Test checklist (Playwright)

- Read state through `ctx.newCDPSession(page)` + `Runtime.evaluate({ userGesture: false })`, never `page.evaluate`, which grants activation.
- **iPhone 13:**
  - no autoplay before the card is 35 % visible;
  - at most 2 playing at once;
  - tapping a card unmutes it and it keeps playing (`paused === false`);
  - tapping another card moves the sound to it;
  - scrolling the owner away mutes it and releases ownership;
  - `scrollWidth === innerWidth` (no layout-viewport blow-up);
  - with `reducedMotion: 'reduce'`, nothing autoplays and a tap plays with sound.
- **Desktop:**
  - hovering before any click shows "Click for sound" and the video **keeps playing muted**;
  - after one click, hovering unmutes and leaving re-mutes;
  - clicking pins the sound.
- Record a scroll video and check the frames: the footage should already be moving before the card settles.

---

## Open questions for the client

1. **Hover-to-hear or hover-to-reveal?** Conectaa only reveals the button on hover, and a click turns the sound on. The spec adds real hover-to-hear on desktop *after the first click*. Is that the feel you want, or exactly Conectaa's behaviour?
2. **Visible pause control?** Conectaa has none. Accessibility guidelines (WCAG 2.2.2) ask for a way to pause looping footage longer than 5 s. Is a small pause button visible to everyone acceptable?
3. **Sound after scrolling away:** keep Conectaa's behaviour (the video comes back still unmuted) or auto-mute (the proposal)?
4. **Full videos or short loops on the cards?** Should a tap open a full-screen 9:16 viewer for the complete video with sound, Reels-style?
5. **Which videos have sound worth hearing?** Conectaa's have professional soundtracks. Lorena's should be checked once the originals arrive (`docs/media-request.md`).
6. **Floating particles** like the lime slices: wanted at all? If so, what motif fits Lorena (petals, soft light bokeh), and only in the hero?
