/**
 * motion.js — tiny, dependency-free, scroll-triggered motion for static pages.
 *
 * Everything is declared with data-attributes; call `initMotion(root)` once the
 * markup is in the DOM (it is safe to call again on the same root).
 *
 *   data-reveal[="up|fade|scale"]   fade (+ rise / settle) into view
 *   data-count                      count up to the element's own text, e.g. "1,873,567",
 *                                   "+7,696", "44.0%", "39.2K", "1.5M"
 *   data-draw                       SVG <path>/<polyline>: draw the stroke (stroke-dashoffset)
 *   data-draw-fill                  SVG area under a drawn line: fades in behind it
 *   data-grow[="x|y"]               bar grows from 0 (transform scale, origin left/bottom)
 *   data-shot[="flash"]             "screenshot drop-in" entrance for a card (+ optional flash)
 *   data-tilt[="glare"]             gentle pointer tilt on desktop (pointer: fine) only
 *
 *   Modifiers (any element above):
 *   data-delay="ms"  data-duration="ms"  data-count-from="n"  data-count-align="end"
 *   data-stagger="ms" (on a parent: children animate one after another, in DOM order)
 *   data-motion-scope (on a parent: its descendants start together when IT enters the
 *                      viewport, instead of each one waiting for itself). A scope receives
 *                      a `motion:enter` CustomEvent (detail.delay = ms) each time it plays.
 *   data-motion-repeat (on a trigger: play again every time it re-enters)
 *
 * Animations run once per element by default, use only transform / opacity /
 * stroke-dashoffset, and are skipped entirely under prefers-reduced-motion
 * (final values are in the markup, so nothing has to "catch up").
 */

const SEL = '[data-reveal],[data-count],[data-draw],[data-draw-fill],[data-grow],[data-shot]';
const EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
const EASE_IN_OUT = 'cubic-bezier(.65,0,.35,1)';
const SHOT_LEAD = 380; // ms the content waits for its screenshot card to land

const DEFAULTS = {
  reveal: 700,
  count: 1600,
  draw: 1500,
  fill: 900,
  grow: 950,
  shot: 1000,
};

const reduceMQ = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const fineMQ = typeof matchMedia === 'function' ? matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };

const items = new WeakMap(); // el -> item state
const triggers = new Map(); // trigger el -> Set(items)
const shotState = new WeakMap(); // shot el -> { playedAt, queue: [] }
const counters = new Set(); // running count-ups (shared rAF ticker)
let rafId = 0;
let ioShots = null;
let ioScopes = null;
let styleInjected = false;

export const prefersReducedMotion = () => reduceMQ.matches;

/* ------------------------------------------------------------------ */
/* Bootstrapping                                                       */
/* ------------------------------------------------------------------ */

function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  styleInjected = true;
  const css = `
.mo-armed[data-reveal],.mo-armed[data-shot],.mo-armed[data-draw-fill]{opacity:0}
.mo-armed[data-grow]{scale:0 1}
.mo-armed[data-grow="y"]{scale:1 0}
[data-grow]{transform-origin:left center}
[data-grow="y"]{transform-origin:center bottom}
.mo-count{display:inline-grid;font-variant-numeric:tabular-nums}
.mo-count>.mo-count__ghost,.mo-count>.mo-count__live{grid-area:1/1;white-space:nowrap}
.mo-count>.mo-count__ghost{visibility:hidden}
.mo-count[data-count-align="end"]>.mo-count__live{justify-self:end}
.mo-count[data-count-align="center"]>.mo-count__live{justify-self:center}
.mo-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.mo-flash,.mo-glare{position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:10}
.mo-flash{background:#fff;opacity:0}
.mo-glare{opacity:0;transition:opacity .45s ease;background:radial-gradient(60% 45% at 50% 50%,rgba(255,255,255,.38),rgba(255,255,255,0) 70%);mix-blend-mode:normal}
[data-tilt].mo-tilting .mo-glare{opacity:1}
@media print{.mo-armed{opacity:1!important;scale:none!important;translate:none!important}}
`;
  const style = document.createElement('style');
  style.setAttribute('data-motion', '');
  style.textContent = css;
  document.head.appendChild(style);
}

function getIO() {
  if (ioShots || typeof IntersectionObserver === 'undefined') return;
  const onEntries = (entries, observer) => {
    // Screenshots first, so their content can line up behind them.
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (b.target.hasAttribute('data-shot') ? 1 : 0) - (a.target.hasAttribute('data-shot') ? 1 : 0))
      .forEach((e) => {
        if (!e.target.hasAttribute('data-motion-repeat')) observer.unobserve(e.target);
        playTrigger(e.target);
      });
    entries
      .filter((e) => !e.isIntersecting && e.target.hasAttribute('data-motion-repeat'))
      .forEach((e) => rearmTrigger(e.target));
  };
  ioShots = new IntersectionObserver(onEntries, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
  ioScopes = new IntersectionObserver(onEntries, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
}

/**
 * Register every motion element under `root` (root included) and start observing.
 * Re-entrant: elements already registered are skipped.
 */
export function initMotion(root = document, options = {}) {
  if (typeof document === 'undefined') return;
  injectStyle();
  getIO();
  const scope = root.nodeType === 9 ? root.documentElement : root;
  const els = [];
  if (scope.matches && scope.matches(SEL)) els.push(scope);
  scope.querySelectorAll(SEL).forEach((el) => els.push(el));
  scope.querySelectorAll('[data-tilt]').forEach(setupTilt);
  if (scope.matches && scope.matches('[data-tilt]')) setupTilt(scope);

  const reduced = reduceMQ.matches || options.reduced === true;
  const newTriggers = new Set();

  els.forEach((el) => {
    if (items.has(el)) return;
    const item = { el, kinds: kindsOf(el), played: false, anims: [] };
    items.set(el, item);
    if (reduced) {
      item.played = true;
      return;
    }
    if (item.kinds.includes('count')) prepareCount(item);
    const trigger = triggerOf(el);
    item.trigger = trigger;
    if (!triggers.has(trigger)) triggers.set(trigger, new Set());
    triggers.get(trigger).add(item);
    arm(item);
    newTriggers.add(trigger);
  });

  newTriggers.forEach(observe);
}

function observe(trigger) {
  if (!ioShots) {
    // No IntersectionObserver: just play.
    requestAnimationFrame(() => playTrigger(trigger));
    return;
  }
  (trigger.hasAttribute('data-shot') ? ioShots : ioScopes).observe(trigger);
}

function kindsOf(el) {
  const k = [];
  if (el.hasAttribute('data-shot')) k.push('shot');
  if (el.hasAttribute('data-reveal')) k.push('reveal');
  if (el.hasAttribute('data-count')) k.push('count');
  if (el.hasAttribute('data-draw')) k.push('draw');
  if (el.hasAttribute('data-draw-fill')) k.push('fill');
  if (el.hasAttribute('data-grow')) k.push('grow');
  return k;
}

/** The element whose visibility starts this element's animation. */
function triggerOf(el) {
  if (el.hasAttribute('data-shot') || el.hasAttribute('data-motion-scope')) return el;
  const scope = el.parentElement && el.parentElement.closest('[data-motion-scope]');
  return scope || el;
}

/* ------------------------------------------------------------------ */
/* Arming (initial, pre-animation state)                               */
/* ------------------------------------------------------------------ */

function arm(item) {
  const { el, kinds } = item;
  if (kinds.includes('shot') || kinds.includes('reveal') || kinds.includes('grow') || kinds.includes('fill')) {
    el.classList.add('mo-armed');
  }
  if (kinds.includes('count') && item.count && item.count.animatable) {
    item.count.live.textContent = item.count.format(item.count.from);
  }
  if (kinds.includes('draw')) {
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch (_) {
      len = 0;
    }
    item.len = len;
    if (len > 0) {
      const sw = parseFloat(el.getAttribute('stroke-width')) || 4;
      el.style.strokeDasharray = `${len} ${len * 2 + sw * 4}`;
      el.style.strokeDashoffset = `${len + sw * 2}`;
    }
  }
  if (kinds.includes('shot')) {
    if (!shotState.has(el)) shotState.set(el, { playedAt: 0, queue: [] });
    const st = shotState.get(el);
    st.playedAt = 0;
  }
  item.played = false;
}

function prepareCount(item) {
  const el = item.el;
  const finalText = (el.getAttribute('data-count-to') || el.textContent).trim();
  const fmt = parseFormat(finalText, el.getAttribute('data-count-locale') || 'en-US');
  const from = el.hasAttribute('data-count-from') ? parseFloat(el.getAttribute('data-count-from')) : 0;
  const animatable = fmt && fmt.value !== from;
  item.count = { finalText, from, animatable, ...(fmt || {}) };
  if (!animatable) return;
  // Reserve the final width with an invisible "ghost" copy, so nothing shifts.
  el.classList.add('mo-count');
  el.textContent = '';
  const sr = document.createElement('span');
  sr.className = 'mo-sr';
  sr.textContent = finalText;
  const ghost = document.createElement('span');
  ghost.className = 'mo-count__ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.textContent = finalText;
  const live = document.createElement('span');
  live.className = 'mo-count__live';
  live.setAttribute('aria-hidden', 'true');
  live.textContent = finalText;
  el.append(sr, ghost, live);
  item.count.live = live;
}

/**
 * "1,873,567" -> {prefix:'', value:1873567, decimals:0, suffix:''}
 * "+1,794.9%" -> {prefix:'+', value:1794.9, decimals:1, suffix:'%'}
 * "39.2K"     -> {prefix:'', value:39.2, decimals:1, suffix:'K'}
 */
export function parseFormat(text, locale = 'en-US') {
  const m = /^([^\d]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text);
  if (!m) return null;
  const [, prefix, num, suffix] = m;
  const decimals = num.includes('.') ? num.split('.')[1].length : 0;
  const grouping = num.includes(',');
  const value = parseFloat(num.replace(/,/g, ''));
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  });
  return { prefix, suffix, value, decimals, format: (v) => prefix + nf.format(v) + suffix };
}

/* ------------------------------------------------------------------ */
/* Playing                                                             */
/* ------------------------------------------------------------------ */

function playTrigger(trigger, extraDelay = 0) {
  const set = triggers.get(trigger);
  if (!set) return;

  // Content inside a screenshot card waits for the card to land.
  const shot = trigger.hasAttribute('data-shot') ? null : trigger.closest('[data-shot]');
  if (shot && shotState.has(shot)) {
    const st = shotState.get(shot);
    const shotItem = items.get(shot);
    if (shotItem && !shotItem.played) {
      st.queue.push(trigger);
      return;
    }
    const since = performance.now() - st.playedAt;
    if (since < SHOT_LEAD) extraDelay += SHOT_LEAD - since;
  }

  const list = [...set].filter((it) => !it.played);
  list.forEach((it) => {
    it.played = true;
    const delay = extraDelay + delayOf(it.el, trigger);
    run(it, delay);
  });

  trigger.dispatchEvent(new CustomEvent('motion:enter', { detail: { delay: extraDelay } }));

  if (trigger.hasAttribute('data-shot')) {
    const st = shotState.get(trigger);
    st.playedAt = performance.now();
    const queued = st.queue.splice(0);
    queued.forEach((t) => playTrigger(t, SHOT_LEAD));
  }
}

function delayOf(el, trigger) {
  let d = num(el.getAttribute('data-delay'), 0);
  const staggerParent = el.parentElement && el.parentElement.closest('[data-stagger]');
  if (staggerParent && (trigger === staggerParent || trigger.contains(staggerParent))) {
    const step = num(staggerParent.getAttribute('data-stagger'), 80);
    const siblings = [...staggerParent.querySelectorAll(SEL)].filter((s) => items.has(s) && kindsOf(s).join() === kindsOf(el).join());
    const i = siblings.indexOf(el);
    if (i > 0) d += i * step;
  }
  return d;
}

function run(item, delay) {
  const { el, kinds } = item;
  const dur = (kind) => num(el.getAttribute('data-duration'), DEFAULTS[kind]);

  if (kinds.includes('shot')) {
    const a = el.animate(
      [
        { opacity: 0, translate: '0 34px', scale: '0.955' },
        { opacity: 1, translate: '0 -3px', scale: '1.006', offset: 0.62 },
        { opacity: 1, translate: '0 0', scale: '1' },
      ],
      { duration: dur('shot'), delay, easing: EASE_OUT, fill: 'backwards' }
    );
    item.anims.push(a);
    if (el.getAttribute('data-shot') === 'flash') flash(el, delay + dur('shot') * 0.38);
  }

  if (kinds.includes('reveal')) {
    const mode = el.getAttribute('data-reveal') || 'up';
    const from =
      mode === 'fade'
        ? { opacity: 0 }
        : mode === 'scale'
          ? { opacity: 0, scale: '0.96' }
          : { opacity: 0, translate: '0 14px' };
    const to = mode === 'fade' ? { opacity: 1 } : mode === 'scale' ? { opacity: 1, scale: '1' } : { opacity: 1, translate: '0 0' };
    item.anims.push(el.animate([from, to], { duration: dur('reveal'), delay, easing: EASE_OUT, fill: 'backwards' }));
  }

  if (kinds.includes('grow')) {
    const y = el.getAttribute('data-grow') === 'y';
    item.anims.push(
      el.animate([{ scale: y ? '1 0' : '0 1' }, { scale: '1 1' }], {
        duration: dur('grow'),
        delay,
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'backwards',
      })
    );
  }

  if (kinds.includes('fill')) {
    item.anims.push(
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur('fill'), delay, easing: 'ease-out', fill: 'backwards' })
    );
  }

  if (kinds.includes('draw') && item.len > 0) {
    const sw = parseFloat(el.getAttribute('stroke-width')) || 4;
    const a = el.animate([{ strokeDashoffset: item.len + sw * 2 }, { strokeDashoffset: 0 }], {
      duration: dur('draw'),
      delay,
      easing: EASE_IN_OUT,
      fill: 'backwards',
    });
    a.onfinish = () => {
      el.style.strokeDasharray = '';
      el.style.strokeDashoffset = '';
    };
    item.anims.push(a);
  }

  if (kinds.includes('count') && item.count && item.count.animatable) {
    startCount(item, delay, dur('count'));
  }

  // Animations with fill:'backwards' hold their first frame during the delay,
  // so the armed (hidden) class can go right away without a flash.
  el.classList.remove('mo-armed');
}

/* Shared rAF ticker for count-ups: one write per counter per frame, no reads. */
function startCount(item, delay, duration) {
  const c = item.count;
  c.t0 = performance.now() + delay;
  c.duration = duration;
  counters.add(item);
  if (!rafId) rafId = requestAnimationFrame(tick);
}

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function tick(now) {
  counters.forEach((item) => {
    const c = item.count;
    if (now < c.t0) return;
    const t = Math.min(1, (now - c.t0) / c.duration);
    if (t >= 1) {
      c.live.textContent = c.finalText;
      counters.delete(item);
      return;
    }
    const v = c.from + (c.value - c.from) * easeOutExpo(t);
    const step = Math.pow(10, -c.decimals);
    const text = c.format(Math.floor(v / step + 1e-9) * step);
    if (text !== c.lastText) {
      c.live.textContent = text;
      c.lastText = text;
    }
  });
  rafId = counters.size ? requestAnimationFrame(tick) : 0;
}

function flash(el, delay) {
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const f = document.createElement('div');
  f.className = 'mo-flash';
  f.setAttribute('aria-hidden', 'true');
  el.appendChild(f);
  const a = f.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.18 }, { opacity: 0 }], {
    duration: 520,
    delay,
    easing: 'ease-out',
  });
  a.onfinish = a.oncancel = () => f.remove();
}

/* ------------------------------------------------------------------ */
/* Pointer tilt (desktop only)                                         */
/* ------------------------------------------------------------------ */

const tilted = new WeakSet();

function setupTilt(el) {
  if (tilted.has(el) || !fineMQ.matches || reduceMQ.matches) return;
  tilted.add(el);
  const max = num(el.getAttribute('data-tilt-max'), 5); // degrees
  let glare = null;
  if (el.getAttribute('data-tilt') === 'glare') {
    glare = document.createElement('div');
    glare.className = 'mo-glare';
    glare.setAttribute('aria-hidden', 'true');
    el.appendChild(glare);
  }
  let rect = null;
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.14;
    cy += (ty - cy) * 0.14;
    const settled = Math.abs(tx - cx) < 0.001 && Math.abs(ty - cy) < 0.001;
    if (settled) {
      cx = tx;
      cy = ty;
    }
    if (cx === 0 && cy === 0 && settled) {
      el.style.transform = '';
    } else {
      el.style.transform = `perspective(1100px) rotateX(${(-cy * max).toFixed(3)}deg) rotateY(${(cx * max).toFixed(3)}deg)`;
    }
    if (glare) glare.style.transform = `translate(${(cx * 30).toFixed(2)}%, ${(cy * 30).toFixed(2)}%)`;
    raf = settled ? 0 : requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const invalidate = () => (rect = null);
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    rect = el.getBoundingClientRect();
    el.classList.add('mo-tilting');
    window.addEventListener('scroll', invalidate, { passive: true });
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!rect) rect = el.getBoundingClientRect();
    tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    tx = Math.max(-1, Math.min(1, tx));
    ty = Math.max(-1, Math.min(1, ty));
    kick();
  });
  el.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
    el.classList.remove('mo-tilting');
    window.removeEventListener('scroll', invalidate);
    kick();
  });
}

/* ------------------------------------------------------------------ */
/* Public helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Run `cb(detail)` every time `el` (a data-motion-scope or data-shot) plays,
 * including after replay(). detail.delay = ms the content is held back for its
 * screenshot card to land. Returns an unsubscribe function.
 */
export function onEnter(el, cb) {
  const h = (e) => cb(e.detail || {});
  el.addEventListener('motion:enter', h);
  return () => el.removeEventListener('motion:enter', h);
}

/** Reset everything under `root` and play it again as it (re-)enters the viewport. */
export function replay(root = document) {
  if (reduceMQ.matches) return;
  const scope = root.nodeType === 9 ? root.documentElement : root;
  const all = [...(scope.matches && scope.matches(SEL) ? [scope] : []), ...scope.querySelectorAll(SEL)];
  const ts = new Set();
  all.forEach((el) => {
    const it = items.get(el);
    if (!it || !it.trigger) return;
    stop(it);
    arm(it);
    ts.add(it.trigger);
  });
  ts.forEach((t) => {
    if (ioShots) {
      ioShots.unobserve(t);
      ioScopes.unobserve(t);
    }
    observe(t);
  });
}

/** Jump everything under `root` to its final state. */
export function finish(root = document) {
  const scope = root.nodeType === 9 ? root.documentElement : root;
  const all = [...(scope.matches && scope.matches(SEL) ? [scope] : []), ...scope.querySelectorAll(SEL)];
  all.forEach((el) => {
    const it = items.get(el);
    if (!it) return;
    stop(it);
    it.played = true;
    el.classList.remove('mo-armed');
  });
}

function stop(it) {
  it.anims.forEach((a) => a.cancel());
  it.anims = [];
  counters.delete(it);
  if (it.count && it.count.live) it.count.live.textContent = it.count.finalText;
  if (it.kinds.includes('draw')) {
    it.el.style.strokeDasharray = '';
    it.el.style.strokeDashoffset = '';
  }
}

function rearmTrigger(trigger) {
  const set = triggers.get(trigger);
  if (!set) return;
  set.forEach((it) => {
    stop(it);
    arm(it);
  });
}

function num(v, d) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
}

// If the user switches reduced motion on mid-session, settle everything.
if (reduceMQ.addEventListener) {
  reduceMQ.addEventListener('change', (e) => {
    if (e.matches && typeof document !== 'undefined') finish(document);
  });
}
