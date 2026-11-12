/**
 * reveals.js: the generic, data-attribute driven reveals and scrubs (motion mode only).
 * Everything is armed on approach (scroll.js armReveal), so nothing is hidden at load and
 * nothing is ever armed while it is in the viewport. Static modes never touch these elements.
 *
 * Attributes (put them in the markup; call scan(root) for markup you insert after boot):
 *   data-oval                     .t-lockup heading: oval line reveal (Lando §5.4), plays at top 90%.
 *                                 Sets aria-label on the heading + aria-hidden on its line spans while split.
 *   data-highlight[="sand"]       <p>/<h2> eyebrow, statement, stat label: line highlight (Lando §5.5),
 *                                 Tobacco block by default, plays at top 85%.
 *   data-curtain                  photo frame (position:relative; overflow hidden): image curtain + wash
 *                                 (Lando §4.2; Sand on light, Tobacco inside .on-dark), plays at top 85%.
 *     data-curtain-delay=".12"    seconds of delay (pairs).
 *   data-reveal-trigger="<sel>"   (any reveal) use el.closest(sel) as the ScrollTrigger trigger.
 *   data-parallax                 frame whose direct child <img> drifts y 0 -> -48px, scrubbed top bottom -> bottom top.
 *                                 (.motion makes that img 48px taller in site.css.)
 *   data-deal="0..3"              card dealt onto the page, scrubbed (Conectaa §4.1): from y 110, scale .94,
 *                                 rotation [-2.5, 2, -1.5, 2.5][i], start top 100% -> end top 55%, scrub .5.
 *   data-rise[="24"]              container whose children rise y N -> 0 once (stagger .06, .6s power3.out).
 *     data-rise-start="top 92%"   ScrollTrigger start (default top 90%).
 *   data-bg-scrub="#E6DECB"       section background: computed colour -> this colour, top 60% -> bottom bottom.
 *     data-bg-from="#4D342D"      start colour instead of the computed one (a hand-off from the section above).
 *     data-bg-range="top bottom|top 72%"   ScrollTrigger start|end instead of the default.
 *
 * Desktop only (≥ 992, motion; armed by scanDesktop() from the js/desktop.js lifecycle, docs/desktop-spec.md §3.2):
 *   data-d-oval                   any multi-line text (intro, big serif line): oval reveal per SplitText line, top 90%.
 *   data-d-highlight[="sand"]     line highlight, desktop only (captions, subtitles, footnotes), top 85%.
 *   data-d-drift="N"              y: N·dr -> 0, scrubbed top bottom -> bottom top (column offsets that close up).
 *     data-d-drift-end="center center"   the scrub's end instead (settled while still in view).
 *   data-d-slide="N"              x: N·dr -> 0, power2.out, scrubbed top bottom -> bottom bottom (side glide-in).
 *   (data-reveal-trigger works for all of them.)
 *
 * Exports: boot(ctx), ready(ctx), scan(root), scanDesktop(d, root), splitLockup(heading), buildOval(heading),
 *          buildOvalLines(el), buildHighlight(el), buildCurtain(frame).
 */
import { armReveal, isMotion, onFinish, scope } from './scroll.js';
import { isDesktop } from './desktop.js';

const done = new WeakSet();
const DEAL_ROT = [-2.5, 2, -1.5, 2.5];

export function boot() {}

export function ready(ctx) {
  if (!ctx.motion || !isMotion()) return;
  onFinish(restoreAria);
  scan(document);
}

/** Arm every reveal under root (idempotent). */
export function scan(rootEl = document) {
  if (!isMotion()) return;
  const all = (sel) => {
    const list = [...rootEl.querySelectorAll(sel)];
    if (rootEl.nodeType === 1 && rootEl.matches(sel)) list.unshift(rootEl);
    return list.filter((el) => !done.has(el) && (done.add(el), true));
  };
  const trig = (el) => (el.dataset.revealTrigger ? el.closest(el.dataset.revealTrigger) : null) || undefined;

  all('[data-oval]').forEach((el) => armReveal(el, buildOval, { start: 'top 90%', trigger: trig(el) }));
  all('[data-highlight]').forEach((el) => armReveal(el, buildHighlight, { start: 'top 85%', trigger: trig(el) }));
  // desktop (chosen at boot): the big frames start as they enter (top 95%) and their wash wipes sooner (buildCurtain),
  // so they never rise into view as a flat Sand slab; phones keep top 85%
  const curtainAt = isDesktop() ? 'top 95%' : 'top 85%';
  all('[data-curtain]').forEach((el) => armReveal(el, buildCurtain, { start: curtainAt, trigger: trig(el) }));
  all('[data-rise]').forEach((el) => armReveal(el, buildRise, { start: el.dataset.riseStart || 'top 90%', trigger: trig(el) }));

  const { gsap } = window;
  scope(() => {
    all('[data-parallax]').forEach((frame) => {
      const img = frame.querySelector(':scope > img');
      if (!img) return;
      gsap.fromTo(img, { y: 0 }, {
        y: -48, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    all('[data-deal]').forEach((card) => {
      const i = parseInt(card.dataset.deal, 10) || 0;
      gsap.fromTo(card, { y: 110, scale: 0.94, rotation: DEAL_ROT[i % 4] }, {
        y: 0, scale: 1, rotation: 0, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 100%', end: 'top 55%', scrub: 0.5 },
      });
    });
    all('[data-bg-scrub]').forEach((sec) => {
      const [start, end] = (sec.dataset.bgRange || 'top 60%|bottom bottom').split('|');
      gsap.fromTo(sec, { backgroundColor: sec.dataset.bgFrom || getComputedStyle(sec).backgroundColor }, {
        backgroundColor: sec.dataset.bgScrub, ease: 'none',
        scrollTrigger: { trigger: sec, start, end, scrub: true },
      });
    });
  });
}

/* ------------------------------------------------------------------ split headings (aria per §4.0) */

const ariaTouched = new Set();

/**
 * Split a .t-lockup heading for animation: aria-label on the heading (full text, single spaces),
 * aria-hidden on its .t-sans/.t-serif lines, SplitText chars on the .t-sans line only
 * (the serif italic moves as a whole, keeping its kerning and swashes).
 * Returns { lines, sans, serif, chars, split, revert() }. Call inside scope().
 */
export function splitLockup(h) {
  const lines = [...h.querySelectorAll(':scope > .t-sans, :scope > .t-serif')];
  h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  lines.forEach((l) => l.setAttribute('aria-hidden', 'true'));
  ariaTouched.add(h);
  const sans = lines.find((l) => l.classList.contains('t-sans')) || null;
  const serif = lines.find((l) => l.classList.contains('t-serif')) || null;
  const split = sans ? window.SplitText.create(sans, { type: 'chars', aria: 'none' }) : null;
  return {
    lines, sans, serif, split, chars: split ? split.chars : [],
    revert() {
      if (split) split.revert();
      unAria(h);
    },
  };
}

function unAria(h) {
  h.removeAttribute('aria-label');
  h.querySelectorAll(':scope > .t-sans, :scope > .t-serif').forEach((l) => l.removeAttribute('aria-hidden'));
  ariaTouched.delete(h);
}

function restoreAria() {
  ariaTouched.forEach(unAria);
}

/* ------------------------------------------------------------------ oval lockup reveal (Lando §5.4) */

export function buildOval(h) {
  const { gsap, SplitText } = window;
  const lines = [...h.querySelectorAll(':scope > .t-sans, :scope > .t-serif')];
  if (!lines.length) return null;
  h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  lines.forEach((l) => l.setAttribute('aria-hidden', 'true'));
  ariaTouched.add(h);
  // each line span is the clip "wrap"; its content moves inside an inner .rv-line
  const inners = lines.map((l) => {
    const inner = document.createElement('span');
    inner.className = 'rv-line';
    while (l.firstChild) inner.appendChild(l.firstChild);
    l.appendChild(inner);
    return inner;
  });
  const sansIdx = lines.findIndex((l) => l.classList.contains('t-sans'));
  const split = sansIdx >= 0 ? SplitText.create(inners[sansIdx], { type: 'chars', aria: 'none' }) : null;
  const chars = split ? split.chars : [];

  const from = 'ellipse(20% 0% at 50% 0%)';
  const to = 'ellipse(100% 120% at 50% 0%)';
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(lines, { clipPath: from }, { clipPath: to, duration: 1.5, ease: 'power2.inOut', stagger: 0.15 }, 0);
  inners.forEach((inner, i) => {
    tl.fromTo(inner, { yPercent: -40 }, { yPercent: 0, duration: 1.5, ease: 'power2.inOut' }, 0.15 + 0.1 * i);
  });
  if (chars.length) {
    tl.fromTo(chars, { yPercent: -40 }, {
      yPercent: 0, duration: 1.5, ease: 'power2.inOut',
      stagger: { amount: 0.015 * chars.length, from: 'center' },
    }, 0.15 * Math.max(0, sansIdx));
  }
  const cleanup = () => {
    if (split) split.revert();
    inners.forEach((inner, i) => {
      const l = lines[i];
      while (inner.firstChild) l.insertBefore(inner.firstChild, inner);
      inner.remove();
    });
    gsap.set(lines, { clearProps: 'clipPath' });
    unAria(h);
  };
  return { tl, cleanup };
}

/* ------------------------------------------------------------------ oval line reveal for any text (desktop) */

/**
 * Lando §5.4 for running text: SplitText lines (aria none; the lines keep whole words, so the text reads the
 * same), each line is the clip "wrap" and its words move inside an inner .rv-line. Unsplit on complete.
 */
export function buildOvalLines(el) {
  const { gsap, SplitText } = window;
  const split = SplitText.create(el, { type: 'lines', aria: 'none', linesClass: 'rv-oline' });
  const lines = split.lines || [];
  if (!lines.length) { split.revert(); return null; }
  const inners = lines.map((l) => {
    const inner = document.createElement('span');
    inner.className = 'rv-line';
    while (l.firstChild) inner.appendChild(l.firstChild);
    l.appendChild(inner);
    return inner;
  });
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(lines, { clipPath: 'ellipse(20% 0% at 50% 0%)' }, { clipPath: 'ellipse(100% 120% at 50% 0%)', duration: 1.5, ease: 'power2.inOut', stagger: 0.15 }, 0);
  inners.forEach((inner, i) => {
    tl.fromTo(inner, { yPercent: -40 }, { yPercent: 0, duration: 1.5, ease: 'power2.inOut' }, 0.15 + 0.1 * i);
  });
  return { tl, cleanup: () => split.revert() };
}

/* ------------------------------------------------------------------ desktop scan (js/desktop.js lifecycle) */

/**
 * Arm the desktop-only attributes under root inside the registration context d (desktop.js): reveals through
 * d.arm (disposable, never re-armed after they played), scrubs through d.add (reverted on teardown).
 * Idempotent per registration.
 */
export function scanDesktop(d, rootEl = document) {
  if (!isMotion() || !d) return;
  if (!d.seen) d.seen = new WeakSet();
  const all = (sel) => {
    const list = [...rootEl.querySelectorAll(sel)];
    if (rootEl.nodeType === 1 && rootEl.matches(sel)) list.unshift(rootEl);
    return list.filter((el) => !d.seen.has(el) && (d.seen.add(el), true));
  };
  const trig = (el) => (el.dataset.revealTrigger ? el.closest(el.dataset.revealTrigger) : null) || undefined;
  const dr = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dr')) || window.innerWidth / 108;

  all('[data-d-oval]').forEach((el) => d.arm(el, buildOvalLines, { start: 'top 90%', trigger: trig(el) }));
  all('[data-d-highlight]').forEach((el) => d.arm(el, (node) => buildHighlight(node, node.dataset.dHighlight), { start: 'top 85%', trigger: trig(el) }));

  const { gsap } = window;
  d.add(() => {
    all('[data-d-drift]').forEach((el) => {
      const n = parseFloat(el.dataset.dDrift) || 0;
      gsap.fromTo(el, { y: () => n * dr() }, {
        y: 0, ease: 'none', immediateRender: true,
        scrollTrigger: { trigger: trig(el) || el, start: 'top bottom', end: el.dataset.dDriftEnd || 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
    });
    all('[data-d-slide]').forEach((el) => {
      const n = parseFloat(el.dataset.dSlide) || 0;
      gsap.fromTo(el, { x: () => n * dr() }, {
        x: 0, ease: 'power2.out', immediateRender: true,
        scrollTrigger: { trigger: trig(el) || el, start: 'top bottom', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
      });
    });
  });
}

/* ------------------------------------------------------------------ line highlight (Lando §5.5) */

export function buildHighlight(el, value = el.dataset.highlight) {
  const { gsap, SplitText } = window;
  const colour = value === 'sand' ? 'var(--sand)' : value === 'tobacco' || !value ? 'var(--tobacco)' : value;
  // A real timeline (the "outer") is what armReveal plays; it drives the current split's
  // timeline by progress, so an autoSplit re-split (resize, late font) stays in sync.
  let inner = null;
  const outer = gsap.timeline({ paused: true });
  const driver = { p: 0 };
  const split = SplitText.create(el, {
    type: 'lines', autoSplit: true, aria: 'none',
    onSplit(self) {
      const tl = gsap.timeline({ paused: true });
      self.lines.forEach((line, i) => {
        const wrap = document.createElement('span');
        wrap.className = 'rv-hl';
        while (line.firstChild) wrap.appendChild(line.firstChild);
        const block = document.createElement('span');
        block.className = 'rv-hl__block';
        block.setAttribute('aria-hidden', 'true');
        block.style.background = colour;
        wrap.appendChild(block);
        line.appendChild(wrap);
        tl.fromTo(wrap, { clipPath: 'inset(-12px 100% -12px 0px)' }, { clipPath: 'inset(-12px 0% -12px 0px)', duration: 0.6, ease: 'power2.out' }, i * 0.15);
        tl.fromTo(block, { scaleX: 1 }, { scaleX: 0, duration: 0.6, ease: 'power2.inOut' }, i * 0.15 + 0.3);
      });
      tl.progress(driver.p);
      inner = tl;
      return tl;
    },
  });
  const total = inner ? inner.duration() : 0.9;
  outer.to(driver, {
    p: 1, duration: total, ease: 'none',
    onUpdate: () => { if (inner) inner.progress(driver.p); },
  });
  const cleanup = () => {
    split.revert();
  };
  return { tl: outer, cleanup };
}

/* ------------------------------------------------------------------ image curtain (Lando §4.2) */

export function buildCurtain(frame) {
  // the desktop gallery track (js/gallery.js) brings its photos in sideways instead: no curtain there (stays final)
  if (frame.closest('.gallery--track')) return null;
  const { gsap } = window;
  const wash = document.createElement('div');
  wash.className = 'rv-wash';
  wash.setAttribute('aria-hidden', 'true');
  frame.appendChild(wash);
  const d = parseFloat(frame.dataset.curtainDelay) || 0;
  const washAt = isDesktop() ? 0.2 : 0.4; // desktop: the wash clears sooner (big frames read as a grey slab otherwise)
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(frame, { clipPath: 'ellipse(120% 0% at 50% 0%)' }, { clipPath: 'ellipse(120% 120% at 50% 0%)', duration: 0.8, ease: 'power2.out' }, d);
  tl.fromTo(wash, { clipPath: 'ellipse(120% 120% at 50% 100%)' }, { clipPath: 'ellipse(120% 0% at 50% 100%)', duration: 0.6, ease: 'power2.out' }, d + washAt);
  const cleanup = () => {
    wash.remove();
    gsap.set(frame, { clearProps: 'clipPath' });
  };
  return { tl, cleanup };
}

/* ------------------------------------------------------------------ rise (rail thumbs, contact rows) */

function buildRise(box) {
  const { gsap } = window;
  const kids = [...box.children];
  if (!kids.length) return null;
  const y = parseFloat(box.dataset.rise) || 24;
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(kids, { y }, { y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 });
  return { tl, cleanup: () => gsap.set(kids, { clearProps: 'transform' }) };
}
