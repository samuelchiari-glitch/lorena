# Signature writing kit

Lorena Maruch's real signature (the calligraphic "LM"), set up so the site can make it look **written by a pen**: stroke by stroke, in writing order, at a constant pen speed.

The artwork is a filled outline, not a pen stroke, so it cannot be drawn with `stroke-dashoffset` directly. Instead, the outline is shown through a mask. Inside the mask, two hand-traced centre-line pens are drawn with the usual dash trick. The ink appears only where a pen has already passed.

- Source: `_source/drive-3/assinatura-lorena.svg` (Illustrator export, 1080 × 1080 artboard; only the visible path is kept).
- Demo: `lab/signature.html` (390 px and 900 px, slider to scrub, Replay, "Show pens").

## Files

| File | What it is |
| --- | --- |
| `lorena-signature.svg` | The kit: artwork, mask and pens (13.9 KB). |
| `README.md` | This file. |
| `../../lab/signature.html` | The demo. It also holds a copy of the recipe below. |

### Inside `lorena-signature.svg`

```
<svg viewBox="0 0 1056 598">                    tight box: ink bbox + 20 units on every side
  <defs>
    <mask id="lm-sig-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1056" height="598">
      <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
        <path class="pen" stroke-width="18.5" d="…"/>          pen 1: the L
        <path class="pen-guard" fill="#000" d="…"/>            static guards (no script needed)
        <path class="pen" stroke-width="18.5" d="…"/>          pen 2: the M
        <path class="pen-guard" data-pen="…" data-release="…" visibility="hidden" …/>   ×34 timed guards
      </g>
    </mask>
  </defs>
  <path class="ink" fill="currentColor" mask="url(#lm-sig-mask)" d="…"/>   the artwork
</svg>
```

- **`.ink`**: the original outline. It is translated by (−12, −241) from the Illustrator artboard and otherwise untouched. `fill="currentColor"`, so CSS `color` sets the ink colour.
- **`.pen`** (2 paths, in writing order): centre lines traced over the ink. They follow the medial axis to within about 0.3 units on average, with hand-placed points at every loop, crossing and fork. Each pen is stroked white, 18.5 units wide, with round caps and joins. Covering every ink pixel needs 17.1 units, so the extra 0.7 units on each side absorbs anti-aliasing. Undashed, the two pens reveal the whole artwork. That is why the file also works as a static image.

  | # | Stroke | Path | Length (viewBox units) |
  | --- | --- | --- | --- |
  | 1 | **L** | hook blob (242, 233) → up into the top loop → long diagonal → small left loop → baseline → end hook (560, 459) | 1407.5 |
  | 2 | **M** | same hook blob → thick bowl over the top (the "bump") → down into the bottom loop → up across the bowl and the baseline → M peak → down to the foot (591, 479) → back up the same line → second hump → swash, ending at (1032, 352) | 2230.7 |
  |   | | **total** | **3638.2** |

  Both letters start at the same pen-down blob: the thick stroke into the bowl is a down-stroke that leaves that blob. So the M is written from the blob, over the bump, into the bottom loop and then upward, rather than starting at the bottom loop.
- **`.pen-guard`**: black patches. A pen has to be as wide as the widest ink, so at a crossing it would also uncover a few units of the stroke that crosses it, before that stroke is written. The guards hide those bits.
  - *Static* guards (no `data-release`) sit between pen 1 and pen 2. They cover the M where the L's baseline crosses it, and the M's bowl where it leaves the shared hook. Pen 2 paints over them as it arrives, so they need no script.
  - *Timed* guards (`data-pen`, `data-release`) sit on top of everything and are `visibility="hidden"` by default. They cover the places where a stroke crosses itself: the left loop of the L, the bowl and up-stroke crossing in the M, and the fork at the M's foot. A script shows each slice while pen `data-pen` has drawn fewer than `data-release` units, so they lift progressively as the pen reaches them.
  - If a script ignores the guards, nothing breaks. The writing just shows small slivers at those crossings.

## Using it on the site

### 1. Put the SVG inline

A mask only animates when the SVG is part of the page's DOM. As `<img>`, a CSS background or `<use>`, it shows the static, fully drawn signature (fine for a no-JS fallback, but it cannot be written).

Either paste the markup into `site.html`, or fetch and inject it. Every copy on a page needs its own mask id. The hero and the footer copy, for example, would use `lm-sig-mask-hero` and `lm-sig-mask-footer`, each with a matching `mask="url(#…)"` on its `.ink`.

```js
// fetch + inject, giving the copy a unique mask id
async function mountSignature(host, suffix, url = 'assets/signature/lorena-signature.svg') {
  host.innerHTML = await (await fetch(url)).text();
  const svg = host.querySelector('svg');
  const mask = svg.querySelector('mask');
  mask.id = `${mask.id}-${suffix}`;
  svg.querySelector('.ink').setAttribute('mask', `url(#${mask.id})`);
  return svg;
}
```

- Size it with CSS, for example `.sig svg { display: block; width: 100%; height: auto; }`. The aspect ratio is 1056 : 598.
- Colour it with `color`: Mahogany `#584738` on Vanilla, Vanilla on the dark hero.
- It is decorative next to her name. Add `aria-hidden="true"` (and drop `role`/`aria-label`) where spec §8.2 asks for that.
- Never put `vector-effect: non-scaling-stroke` on the pens. The dash lengths must stay in viewBox units.

### 2. Animate the `.pen` paths: the recipe

```js
function createSignature(svg, { pause = 0.045 } = {}) {
  const ink = svg.querySelector('.ink');
  const maskRef = ink.getAttribute('mask');
  const pens = [...svg.querySelectorAll('.pen')];
  const lens = pens.map((pen) => pen.getTotalLength());
  const total = lens.reduce((a, b) => a + b, 0);
  const gap = pause * total;                       // pen lift, in length units
  const span = total + gap * (pens.length - 1);    // whole timeline, in length units
  const guards = [...svg.querySelectorAll('.pen-guard[data-release]')]
    .map((g) => [g, Number(g.dataset.pen) - 1, Number(g.dataset.release)]);
  // one dash as long as the pen, then a gap longer than the pen: no second dash can show
  pens.forEach((pen, i) => { pen.style.strokeDasharray = `${lens[i]}px ${lens[i] + 20}px`; });
  let raf = 0;

  function render(progress) {
    const p = Math.min(1, Math.max(0, Number(progress) || 0));
    let t = p * span;
    const drawn = pens.map((pen, i) => {
      const f = Math.min(1, Math.max(0, t / lens[i]));
      t -= lens[i] + gap;
      // hidden until it starts: a zero-length dash would still paint a round-cap dot
      pen.style.visibility = f > 0 ? 'visible' : 'hidden';
      pen.style.strokeDashoffset = `${lens[i] * (1 - f)}px`;
      return f * lens[i];
    });
    for (const [g, i, at] of guards) g.style.visibility = drawn[i] < at ? 'visible' : 'hidden';
    // fully written: drop the mask, so the final state is the untouched artwork
    if (p >= 1) ink.removeAttribute('mask');
    else if (ink.getAttribute('mask') !== maskRef) ink.setAttribute('mask', maskRef);
  }

  // where the pen is, in viewBox units (null at rest and during the pen lift)
  function penPoint(progress) {
    if (!(progress > 0 && progress < 1)) return null;
    let t = progress * span;
    for (let i = 0; i < pens.length; i++) {
      if (t <= lens[i]) return t >= 0 ? pens[i].getPointAtLength(t) : null;
      t -= lens[i] + gap;
    }
    return null;
  }

  function stop() { cancelAnimationFrame(raf); raf = 0; }

  // play once, linear in time = constant pen speed
  function play({ duration = 2.2, onUpdate, onComplete } = {}) {
    stop();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(1); onUpdate?.(1); onComplete?.(); return;
    }
    let t0 = 0;
    const tick = (now) => {
      t0 ||= now;
      const p = Math.min(1, (now - t0) / (duration * 1000));
      render(p); onUpdate?.(p);
      if (p < 1) raf = requestAnimationFrame(tick); else { raf = 0; onComplete?.(); }
    };
    render(0); onUpdate?.(0);
    raf = requestAnimationFrame(tick);
  }

  return { render, play, stop, penPoint, lengths: lens, length: total };
}
```

What it guarantees:

- **Constant pen speed.** One timeline measured in length units: pen 1, a pause, then pen 2. Each pen's share of the progress is its `getTotalLength()`, so a linear progress means the same speed on both pens. The pause is `pause × total length` (default 0.045 ≈ 95 ms at 2.2 s).
- **No round-cap dots.** A pen that has not started is `visibility: hidden`, and the dash gap (length + 20) is longer than the pen, so no second dash can wrap in.
- **Final frame = the artwork.** At `p >= 1` the mask is detached. Scrubbing back below 1 re-attaches it.
- **`render(p)` is idempotent and cheap**, so it can be driven by anything.

#### Scrubbed (hero, ScrollTrigger)

```js
const sig = createSignature(svg);
const state = { p: 0 };
const tween = gsap.to(state, { p: 1, ease: 'none', paused: true, onUpdate: () => sig.render(state.p) });
sig.render(0);                                    // arm: hidden until the scroll range starts
ScrollTrigger.create({
  trigger: '#top',
  start: () => `top+=${0.55 * innerHeight} top`,  // spec §4.1: 0.55 H → 1.15 H
  end:   () => `top+=${1.15 * innerHeight} top`,
  scrub: 0.5,
  animation: tween,
});
```

Keep `ease: 'none'`. The scrub smoothing (`scrub: 0.5`) already softens it.

#### Play once (footer, loader)

```js
const sig = createSignature(svg);
sig.render(0);                                    // arm on approach (not under reduced motion)
ScrollTrigger.create({ trigger: svg, start: 'top 80%', once: true, onEnter: () => sig.play({ duration: 2.2 }) });
// or with GSAP: gsap.to(state, { p: 1, duration: 2.2, ease: 'none', onUpdate: () => sig.render(state.p) })
```

#### Adapting `js/signature.js`

The current module (written for the monoline placeholder) calls `svg.querySelectorAll('path')` and dashes every path. With this kit, that would dash the `.ink` and the guards too. Build its timeline on the recipe instead. The contract stays the same: a paused timeline whose progress 0 → 1 writes the signature.

```js
export function signatureTimeline(svg, { penLift = 0.045 } = {}) {
  const sig = createSignature(svg, { pause: penLift });
  const state = { p: 0 };
  sig.render(0);
  return gsap.timeline({ paused: true })
    .to(state, { p: 1, duration: 1, ease: 'none', onUpdate: () => sig.render(state.p) });
}
// pen tip: sig.penPoint(progress) gives { x, y } in viewBox units, or null between strokes.
// The tip <circle> must sit outside the mask (a sibling of .ink), filled with currentColor.
```

`clearSignature()` becomes `sig.render(1)`: pens undashed, mask detached.

### 3. No JS and reduced motion

- Without a script, the pens are undashed and the guards hidden, so the signature shows fully drawn.
- Only call `render(0)` when you arm an animation.
- Under `prefers-reduced-motion: reduce`, do not arm it, or call `render(1)` (`play()` does this itself).

## Recommended durations

Total pen length: **3638 viewBox units**, which is about 1344 px of pen travel at 390 px wide and about 3101 px at 900 px wide (scale = width / 1056).

| Use | Setting |
| --- | --- |
| Play once | **2.2 s**, linear (good range 1.8 to 2.6 s). That is about 1650 units/s, or about 610 px/s at 390 px wide. |
| Pen lift between L and M | `pause: 0.045`, about 95 ms at 2.2 s |
| Scrub | about 0.6 viewport heights of scroll (hero: 0.55 H → 1.15 H), `scrub: 0.5`, `ease: 'none'` |

`power1.inOut` (the placeholder's footer ease) still reads as handwriting, but the pen then speeds up and slows down instead of moving at a constant speed.

## Verification (done when the kit was built)

- **Coverage.** Every anti-aliased ink pixel (rendered at 4×) lies within 8.57 units of a pen centre line. The pen half-width is 9.25.
- **Final frame.** After a play-once in `lab/signature.html`, the 390 px and 900 px copies were pixel-diffed against the plain outline at DPR 1, 2 and 3. They are identical (max difference 0). With the mask forced back on at full progress, the differences stay at anti-aliasing level: max 5/255 at 900 px DPR 1 and 2 and at 390 px DPR 2 and 3, and up to 25/255 on a few edge pixels at 390 px DPR 1. The one exception is a single-pixel Chrome mask seam at 900 px DPR 3 (6 pixels, see Known limits).
- **Writing order.** A Playwright video of the play-once was cut into frames at 12 fps and checked frame by frame. A per-pixel reveal-time analysis over 300 scrub steps found no ink appearing ahead of the pen tip, apart from:
  - the shared hook blob, which is both strokes' pen-down;
  - the fork at the M's foot, which the down-stroke shares with the up-stroke (it shows about 0.1 s early).
- **Reduced motion.** The page shows the signature fully drawn, identical to the artwork.

## Known limits

- The guards are cut for these exact pen paths and widths. If a pen is re-traced, delete the guards or regenerate them. With guards deleted, everything still works, with small slivers at the crossings.
- At crossings, the source outline has tiny fillets in the acute corners. These may show about 1 unit early, which is invisible at site sizes.
- The pen fronts at guard slices can look flat for a single frame.
- Animated masks re-rasterise every frame. That is cheap at these sizes, but avoid running both copies (hero and footer) at the same time.
- Chrome at DPR 3 and 900 px can show a one-pixel seam inside a mask while it is attached. Detaching the mask at the end removes it.
