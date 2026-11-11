/**
 * ui.js: header (theme band IO, backing, hide/show), menu, in-page link router, copy buttons,
 * toast and scroll indicator (spec §4.0, §4.8). Runs in every JS mode.
 *
 * Exports:
 *   boot(ctx)                 header, menu, router, copy buttons (every JS mode)
 *   ready(ctx)                scroll indicator (motion mode)
 *   scrollToTarget(target, {focus})   '#id' | Element | 0 : Lenis scrollTo in motion mode (no offset: Lenis
 *                             subtracts scroll-margin-top itself), scrollIntoView otherwise.
 *   toast(message, ms=1600)   the status pill (role=status, aria-live polite).
 *   isMenuOpen()
 */
import { getLenis, isMotion, makeIO, onFinish } from './scroll.js';

const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
let hdr, menuBtn, menu, mainEl, footerEl, toastEl;
let menuOpen = false;
let menuTl = null;
let stageH = 0;

export const isMenuOpen = () => menuOpen;

export function boot() {
  hdr = document.querySelector('.hdr');
  menu = document.getElementById('menu');
  mainEl = document.getElementById('main');
  footerEl = document.querySelector('footer.contact');
  toastEl = document.querySelector('.toast');
  if (hdr) {
    menuBtn = hdr.querySelector('.hdr__menu');
    initTheme();
    initHeaderScroll();
  }
  if (menu && menuBtn) initMenu();
  initRouter();
  initCopy();
}

export function ready(ctx) {
  if (ctx.motion && isMotion()) initScrollIndicator();
}

/* ------------------------------------------------------------------ helpers */

function debounce(fn, ms) {
  let t = 0;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ------------------------------------------------------------------ nav theme band (§4.0) */

function initTheme() {
  const targets = [...document.querySelectorAll('[data-theme]')];
  const order = new Map(targets.map((el, i) => [el, i]));
  const active = new Set();
  let io = null;
  const apply = () => {
    let best = null;
    active.forEach((el) => { if (best === null || order.get(el) > order.get(best)) best = el; });
    if (best) hdr.dataset.nav = best.dataset.theme === 'dark' ? 'dark' : 'light';
  };
  const build = () => {
    if (io) io.disconnect();
    active.clear();
    const y = Math.max(0, hdr.offsetHeight - 32); // middle of the 64px bar, below any safe-area inset
    io = makeIO((entries) => {
      entries.forEach((e) => (e.isIntersecting ? active.add(e.target) : active.delete(e.target)));
      apply();
    }, { rootMargin: `${-y}px 0px ${-(innerHeight - y - 1)}px 0px`, threshold: 0 });
    targets.forEach((t) => io.observe(t));
  };
  build();
  addEventListener('resize', debounce(build, 150));
  // the hero's dark zone only displays in motion mode: rebuild when the mode drops
  document.addEventListener('site:static', build);
}

/* ------------------------------------------------------------------ header backing + hide/show (§4.0) */

function initHeaderScroll() {
  const stage = document.querySelector('.hero__stage');
  const measure = () => { stageH = stage ? stage.offsetHeight : innerHeight; };
  measure();
  addEventListener('resize', debounce(measure, 150));
  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    const lenis = getLenis();
    const dir = lenis ? lenis.direction : Math.sign(y - lastY);
    lastY = y;
    if (menuOpen) return;
    if (!isMotion()) {
      hdr.classList.toggle('hdr--clear', y < 1);
      hdr.classList.remove('is-hidden');
      return;
    }
    if (y < 0.35 * stageH) {
      hdr.classList.add('hdr--clear');
      hdr.classList.remove('is-hidden');
      return;
    }
    hdr.classList.remove('hdr--clear');
    if (dir > 0) hdr.classList.add('is-hidden');
    else if (dir < 0) hdr.classList.remove('is-hidden');
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  hdr.addEventListener('focusin', () => hdr.classList.remove('is-hidden'));
  document.addEventListener('site:static', () => { measure(); update(); });
  update();
}

/* ------------------------------------------------------------------ menu (§4.0, Lando §7.3) */

function menuLinks() {
  return [...menu.querySelectorAll('a[href], button:not([disabled])')];
}

function initMenu() {
  menuBtn.hidden = false;
  menu.hidden = false; // from here on, hidden state = visibility:hidden + clip-path (CSS)
  menuBtn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => {
    if (!menuOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {
      const f = [menuBtn, ...menuLinks()];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      else if (i === -1) { e.preventDefault(); f[0].focus(); }
    }
  });
  onFinish(() => {
    if (menuTl) { menuTl.kill(); menuTl = null; }
    menu.style.visibility = '';
    menu.style.clipPath = '';
    menu.querySelectorAll('.menu__link').forEach((a) => { a.style.transform = ''; a.style.clipPath = ''; });
    if (menuOpen) menu.classList.add('is-open');
  });
}

function buildMenuTl() {
  const { gsap } = window;
  const links = [...menu.querySelectorAll('.menu__link')];
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(menu, { clipPath: 'ellipse(120% 0% at 50% 0%)' }, { clipPath: 'ellipse(120% 100% at 50% 20%)', duration: 0.8, ease: 'power3.out' }, 0);
  tl.fromTo(links, { y: 20, clipPath: 'ellipse(30% 0% at 50% 0%)' }, {
    y: 0, clipPath: 'ellipse(120% 100% at 50% 20%)', duration: 0.6, ease: 'back.out(1.2)', stagger: 0.08,
  }, 0.35);
  tl.eventCallback('onReverseComplete', () => {
    menu.style.visibility = '';
    gsap.set([menu, ...links], { clearProps: 'clipPath,transform' });
  });
  return tl;
}

export function openMenu() {
  if (menuOpen) return;
  menuOpen = true;
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'Close');
  hdr.classList.add('is-menu-open');
  hdr.classList.remove('is-hidden');
  document.documentElement.classList.add('menu-open');
  if (mainEl) mainEl.inert = true;
  if (footerEl) footerEl.inert = true;
  const lenis = getLenis();
  if (lenis) lenis.stop();
  if (isMotion() && window.gsap && !reduceMQ.matches) {
    if (!menuTl) menuTl = buildMenuTl();
    menu.style.visibility = 'visible';
    menuTl.timeScale(1).play(0);
  } else {
    menu.classList.add('is-open');
  }
  const first = menu.querySelector('.menu__link');
  if (first) first.focus({ preventScroll: true });
}

export function closeMenu({ restoreFocus = true } = {}) {
  if (!menuOpen) return;
  menuOpen = false;
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Menu');
  hdr.classList.remove('is-menu-open');
  document.documentElement.classList.remove('menu-open');
  if (mainEl) mainEl.inert = false;
  if (footerEl) footerEl.inert = false;
  const lenis = getLenis();
  if (lenis) lenis.start(); // a stopped Lenis ignores scrollTo
  if (menuTl && isMotion() && !reduceMQ.matches) {
    menuTl.timeScale(1.4).reverse();
  } else {
    menu.classList.remove('is-open');
    menu.style.visibility = '';
  }
  if (restoreFocus) menuBtn.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ in-page link router (§4.0) */

function focusTarget(el) {
  if (!el) return;
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1');
    el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
  }
  el.focus({ preventScroll: true });
}

export function scrollToTarget(target, { focus = false } = {}) {
  const el = typeof target === 'string' ? (target === '#top' || target === '#' ? null : document.getElementById(target.slice(1))) : target || null;
  const lenis = getLenis();
  if (lenis && isMotion()) {
    lenis.scrollTo(el || 0, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else if (el) {
    el.scrollIntoView({ block: 'start', behavior: reduceMQ.matches ? 'auto' : 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
  }
  if (focus) focusTarget(el || document.getElementById('main'));
}

function initRouter() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href !== '#top' && href !== '#' && !document.getElementById(href.slice(1))) return;
    e.preventDefault();
    if (a.classList.contains('skip')) {
      const m = document.getElementById('main');
      if (m) m.focus({ preventScroll: true });
      return;
    }
    const fromMenu = menuOpen && menu.contains(a);
    if (menuOpen) closeMenu({ restoreFocus: false });
    // keyboard activation (detail 0) also moves focus, so the next Tab continues from the target
    scrollToTarget(href, { focus: fromMenu || e.detail === 0 });
  });
}

/* ------------------------------------------------------------------ copy buttons + toast (§4.8) */

let toastTimer = 0;
export function toast(message, ms = 1600) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-on');
    toastTimer = setTimeout(() => { toastEl.textContent = ''; }, 450);
  }, ms);
}

function selectNode(node) {
  const sel = getSelection();
  const range = document.createRange();
  range.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(range);
}

function initCopy() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest && e.target.closest('[data-copy]');
    if (!btn) return;
    const value = btn.getAttribute('data-copy');
    try {
      await navigator.clipboard.writeText(value);
      toast('Copied');
      return;
    } catch (_) { /* blocked (iframe / permissions): fall back */ }
    const line = btn.closest('.contact__line');
    const valueEl = line && line.querySelector('.contact__value');
    if (valueEl) {
      selectNode(valueEl);
      try {
        if (document.execCommand('copy')) { toast('Copied'); return; }
      } catch (_) { /* fall through */ }
    }
    toast('Press and hold to copy');
  });
}

/* ------------------------------------------------------------------ scroll indicator (Lando §7.6, motion only) */

function initScrollIndicator() {
  const { gsap } = window;
  const lenis = getLenis();
  if (!lenis || !gsap || reduceMQ.matches) return;
  const bar = document.createElement('div');
  bar.className = 'scrollbar';
  bar.setAttribute('aria-hidden', 'true');
  const thumb = document.createElement('div');
  thumb.className = 'scrollbar__thumb';
  bar.appendChild(thumb);
  (document.querySelector('.site') || document.body).appendChild(bar);

  let trackH = 0, thumbH = 0, shown = false, hideT = 0;
  const yTo = gsap.quickTo(thumb, 'y', { duration: 0.3, ease: 'power2.out' });
  const measure = () => {
    const docH = document.documentElement.scrollHeight;
    const ratio = Math.min(0.25, Math.max(0.1, innerHeight / Math.max(1, docH)));
    trackH = bar.offsetHeight;
    thumbH = trackH * ratio;
    thumb.style.height = `${thumbH}px`;
  };
  measure();
  addEventListener('resize', debounce(measure, 150));
  if (window.ScrollTrigger) window.ScrollTrigger.addEventListener('refresh', measure);
  lenis.on('scroll', ({ scroll, limit }) => {
    const p = limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0;
    yTo(p * (trackH - thumbH));
    if (!shown) { shown = true; gsap.to(bar, { opacity: 1, duration: 0.5, overwrite: 'auto' }); }
    clearTimeout(hideT);
    hideT = setTimeout(() => { shown = false; gsap.to(bar, { opacity: 0, duration: 0.5, overwrite: 'auto' }); }, 500);
  });
  onFinish(() => bar.remove());
}
