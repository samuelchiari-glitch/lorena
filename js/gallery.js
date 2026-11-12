/**
 * gallery.js: the pinned horizontal gallery (docs/desktop-spec.md §4.8, Lando §4.3). OWNER: proof builder.
 *
 * Desktop (>= 992) and motion mode only, through the js/desktop.js lifecycle (registered in ready(); torn down when
 * the viewport drops below 992, on finishAll() and on reduced motion; set up again when it comes back). Below 992,
 * without JS and in static mode the section is the static layout of css/site.css (mobile groups / desktop grid).
 *
 * While set up:
 *   - #gallery gets .gallery--track (css/proof.css): the section is 100svh + the track's overflow (--gal-x, measured
 *     at every ScrollTrigger refreshInit) + 5 dr tall; its .wrap is a CSS-sticky pin (never a ScrollTrigger pin) and
 *     .gallery__track lays the photos out as one row of stacks on the pin's svh row lines.
 *   - one scrubbed tween moves the track x: 0 -> -(trackWidth - pinWidth), ease none, scrub 1 (the glide), from the
 *     section's `top top-=hold` (a lead-in hold of .35 pin heights: the head reads, still, before it moves) over the
 *     overflow's length (the last 5 dr is bare background under the contact panel's overlap); will-change:
 *     transform only while that range is active. The head's title reveal is played early, from its `top bottom`.
 *   - each photo slides inside its frame (img 4 dr wider, x -4 dr -> 0 while its frame crosses the view, so the photo
 *     lags its frame; a containerAnimation scrub). Global scrubs on the section (background) or its photos (vertical
 *     parallax) are disabled meanwhile and handed back on teardown; the background is scrubbed Vanilla -> Surface
 *     across the pin instead. No curtain in the track (reveals.js buildCurtain skips frames in .gallery--track).
 *   - captions get the line highlight and the serif line the oval line reveal (reveals.js builders): the ones in view
 *     left of their start line when the pin starts play on the way in (vertical approach, top 85%); the others are
 *     armed while still off to the right and play as they cross 92 % (captions) / 85 % (the line) of the view
 *     (containerAnimation), once
 *     (never again after a resize round trip). Nothing is armed while in view; on teardown an unplayed reveal is put
 *     in its final state.
 *   - the photos load eagerly one viewport ahead (native lazy loading never fetches images clipped by the pin).
 *
 * Exports: ready(ctx).
 */
import { onDesktop } from './desktop.js';
import { buildHighlight, buildOvalLines } from './reveals.js';
import { isMotion, playArmed } from './scroll.js';

const dr = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dr')) || innerWidth / 108;
const HOLD = 0.35; // the lead-in hold: the pin stays still for .35 of its height before the track moves (the title reads)
const TITLE_SPEED = 1.8; // the track title's oval reveal runs 1.8x (.83 s a line): landed before the track moves, even at a brisk wheel
const LINE_SPEED = 1.5; // the serif line's sideways reveal runs 1.5x (1.2 s in all): it lands in view at a brisk wheel
const playedSideways = new WeakSet(); // horizontal reveals that played: never armed again after a resize round trip

function setupTrack(d, section, pin, track) {
  const { gsap, ScrollTrigger } = window;
  const frames = [...track.querySelectorAll('.gallery__item .frame')];
  const imgs = frames.map((f) => f.querySelector(':scope > img')).filter(Boolean);
  const line = track.querySelector('.gallery__line');

  section.classList.add('gallery--track');
  d.cleanup(() => {
    section.classList.remove('gallery--track');
    section.style.removeProperty('--gal-x');
    track.style.removeProperty('will-change');
  });

  // the scroll length: the section is 100svh + the lead-in hold + the track's overflow (refreshInit runs before
  // ScrollTrigger measures). The hold: the pin engages with the head and the first photo still, so the title's oval
  // reveal has landed before the track starts moving it away (played early, from the title's `top bottom`, below).
  const dist = () => Math.max(0, track.offsetWidth - pin.clientWidth);
  const hold = () => Math.round(pin.clientHeight * HOLD);
  const measure = () => { section.style.setProperty('--gal-x', `${dist() + hold()}px`); };
  measure();
  ScrollTrigger.addEventListener('refreshInit', measure);
  d.cleanup(() => ScrollTrigger.removeEventListener('refreshInit', measure));

  // hand the global scrubs on this section (background) and its photos (vertical parallax) over to the track
  const own = (t) => t === section || (t && t.tagName === 'IMG' && section.contains(t));
  const foreign = ScrollTrigger.getAll().filter((st) => {
    const a = st.animation;
    return a && typeof a.targets === 'function' && a.targets().some(own);
  });
  foreign.forEach((st) => st.disable(false));
  d.cleanup(() => queueMicrotask(() => {
    // after this registration's context has reverted its own tweens: GSAP leaves a zero translate on the track and
    // the photos (and, after finishAll(), the background it found inline)
    [track, ...imgs].forEach((el) => ['transform', 'translate', 'rotate', 'scale'].forEach((k) => el.style.removeProperty(k)));
    if (!isMotion()) { section.style.removeProperty('background-color'); return; }
    // then hand the foreign scrubs back (skip any trigger already killed)
    const live = new Set(ScrollTrigger.getAll());
    foreign.forEach((st) => {
      if (!live.has(st)) return;
      // no reset and no individual refresh: a solo refresh() would scroll back to the position this trigger saw when
      // the pin last started (its private max scroll, frozen while disabled): a jump of thousands of px on an iPad
      // rotation or a narrowed window. desktop.js's one coalesced refresh() after the teardown re-measures it.
      st.enable(false, false);
      const a = st.animation;
      if (a) { a.invalidate(); a.progress(st.progress); }
    });
  }));

  // photos clipped by the pin are never fetched by native lazy loading: load them one viewport ahead
  const lazy = imgs.filter((img) => img.loading === 'lazy');
  d.io((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    lazy.forEach((img) => { img.loading = 'eager'; });
  }, { rootMargin: '0px 0px 100% 0px', threshold: 0 }).observe(section);
  d.cleanup(() => lazy.forEach((img) => { img.loading = 'lazy'; }));

  const bgTo = section.dataset.bgScrub || '#E6DECB';
  const bgFrom = getComputedStyle(section).getPropertyValue('--bg').trim() || '#F1EADA';

  let tween = null;
  d.add(() => {
    gsap.set(imgs, { y: 0 });
    tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: section, start: () => `top top-=${hold()}`, end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true,
        onToggle: (self) => { track.style.willChange = self.isActive ? 'transform' : ''; },
      },
    });
    gsap.fromTo(section, { backgroundColor: bgFrom }, {
      backgroundColor: bgTo, ease: 'none',
      scrollTrigger: { trigger: section, start: () => `top top-=${hold()}`, end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true },
    });
    frames.forEach((frame) => {
      const img = frame.querySelector(':scope > img');
      if (!img) return;
      gsap.fromTo(img, { x: () => -4 * dr() }, {
        x: 0, ease: 'none',
        scrollTrigger: { trigger: frame, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true, invalidateOnRefresh: true },
      });
    });
  });

  // the head's title (reveals.js data-oval, armed on approach at every width, plays at its own `top 90%`): on the
  // track it plays as soon as it shows (its `top bottom`), a little faster, so it has landed before the track moves
  // it away (no-op if it is not armed: already played, or skipped because it was in view)
  const title = track.querySelector(':scope > .t-lockup[data-oval]');
  if (title) d.add(() => ScrollTrigger.create({ trigger: title, start: 'top bottom', once: true, onEnter: () => playArmed(title, TITLE_SPEED) }));

  // reveals: the captions (line highlight) and the serif line (oval lines)
  const reveals = [...track.querySelectorAll('.gallery__item figcaption')].map((el) => ({ el, build: (n) => buildHighlight(n), start: 'left 92%' }));
  if (line) reveals.push({ el: line, build: buildOvalLines, start: 'left 85%', speed: LINE_SPEED });
  const vw = pin.clientWidth;
  const trackLeft = track.getBoundingClientRect().left;
  // where the track is now: the pin's progress at this scroll position (the tween renders there on its first refresh)
  const top = section.getBoundingClientRect().top;
  const span = dist();
  const shift = span > 0 ? Math.min(1, Math.max(0, (-top - hold()) / span)) * span : 0;
  const pending = new Set();
  reveals.forEach(({ el, build, start, speed = 1 }) => {
    const left = el.getBoundingClientRect().left - trackLeft; // in the track, independent of its current x
    // left of its sideways start line when the pin starts (that trigger would fire at once): it plays on the way in
    // (vertical approach; skipped, i.e. final, if already in view). Further right (the serif line peeking in at the
    // right edge) it waits for the track to bring it to its start line.
    const at = (parseFloat(start.split(' ')[1]) || 100) / 100;
    if (left < at * vw) {
      d.arm(el, build, { start: 'top 85%' });
      return;
    }
    if (playedSideways.has(el)) return;
    if (top < innerHeight && left - shift < vw) return; // already in view (or passed) inside the pin: stays final
    d.add(() => {
      const res = build(el);
      if (!res) return;
      const tl = res.tl || res;
      const entry = { tl, cleanup: res.cleanup, done: false };
      const finish = () => {
        if (entry.done) return;
        entry.done = true;
        pending.delete(entry);
        if (entry.cleanup) entry.cleanup();
      };
      tl.eventCallback('onComplete', finish);
      entry.finish = finish;
      pending.add(entry);
      if (speed !== 1) tl.timeScale(speed);
      ScrollTrigger.create({ trigger: el, containerAnimation: tween, start, once: true, onEnter: (self) => { playedSideways.add(el); self.kill(); tl.play(); } });
    });
  });
  // torn down before they played: final state (runs before the context reverts the splits)
  d.cleanup(() => pending.forEach((entry) => { try { entry.tl.progress(1); } catch (_) { /* ignore */ } entry.finish(); }));
}

export function ready(ctx) {
  if (!ctx.motion || !isMotion() || !window.ScrollTrigger) return;
  const section = document.querySelector('#gallery');
  const pin = section && section.querySelector(':scope > .wrap');
  const track = pin && pin.querySelector(':scope > .gallery__track');
  if (!track) return;
  onDesktop((d) => setupTrack(d, section, pin, track), { motion: true, name: 'gallery' });
}
