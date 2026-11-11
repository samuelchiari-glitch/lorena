# Inbox: client files

Raw files are in `_source/drive-2/` (gitignored, downloaded from the client's Drive folder on 2026-11-11).

**Status: integrated on 2026-11-11, after the build workflow.** Every file is marked below with where it went, or why it was left out. The web masters were made from the originals with the EXIF orientation applied, converted to sRGB, the long side capped at 2400 px, saved at q86 and with the metadata stripped. `scripts/make-images.py` builds their `-480`/`-800` WebP derivatives (q76), like the others.

## Photos (originals 1365–6192 px tall)

| Original | Web master | Where it is used |
|---|---|---|
| `foto-de-capa.jpg` (cover, white robe) | `assets/img/cover.jpg` | Hero (`hero-*.webp`). Integrated during the build (spec client feedback 2). |
| `img-9196.jpg` (white shirt, wood wall, hands in her hair) | `assets/img/portrait-wood-hands.jpg` | **About** photo (`about-480/800.webp`). It replaces the kit's black-outfit portrait. `portrait-about.jpg` stays in the repo but is no longer referenced. |
| `img-9201.jpg` (white shirt, wood wall, over the shoulder) | `assets/img/portrait-wood-shoulder.jpg` | **Gallery**, group 3, right: "Portrait · Linen". It replaces `14` (pendant). |
| `img-9560.jpg` (lying on a white background) | `assets/img/portrait-white-floor.jpg` | **Gallery**, group 1, left (it opens the gallery): "Portrait · On white". It replaces `08` (glamping dome walk). |
| `dsc01358.jpg` (A-frame glass deck) | `assets/img/stays/aframe-deck.jpg` | **Stays chapter**, a new photo pair under the thumb rail, left: "Cabin · A-frame". |
| `dsc02763.jpg` (deck with an ofurô tub) | `assets/img/stays/ofuro-deck.jpg` | **Stays chapter** pair, right: "Deck · Hot tub". |
| `dsc02755.jpg` (kitchen seen from above) | `assets/img/stays/kitchen-above.jpg` | **Gallery**, group 3, single (it closes the gallery): "Stays · Kitchen". It replaces `29` (wine, black & white). |
| `img-9204.jpg` | — | Not used. It is a near-duplicate of `img-9201` (same shirt, wall and over-the-shoulder pose), and About already uses this shoot. |
| `dsc02726.jpg` (kitchen with a view) | `assets/img/stays/kitchen-view.jpg` | **Gallery**, group 2, single: "Stays · Kitchen view" (batch 2). It replaces `09` (massage), where the therapist dominated the frame. `dsc02755` has since moved to the Stays rail, so the gallery had no Stays photo left. |
| `dsc01104.jpg` (deck, parasol, couple) | — | Not used. The couple is the subject, and the site features Lorena alone. Good golden-hour light: the first pick if the client wants a couples' stays image. |
| `02.jpg`, `03.jpg` (cooking, wooden loft) | — | Not used. They are couple-centred and low-key, and `03` shows mostly her back. They are 9:16 phone frames. |
| `likeappro-3279.jpg` (bathtub, couple) | — | Not used. The focus is on the couple, and the "bath with a view" story is already told by video `stays-03`. |
| `likeappro-9669.jpg` (kitchen, couple) | — | Not used. It is an intimate couple moment, not a fit for a brand portfolio page. |

- **Stays photo pair.** It is static HTML inside `#stays`, after `[data-chapter-body]`, so it is complete at rest. It reuses the gallery's pair rhythm (56% left, 40% right, 80 px drop) and the spec's photo effects: the image curtain with the Sand wash (pair staggered by 0.12 s) and the inner parallax. The CSS is in `css/site.css` (content block, `.chapter__photos`).
- **Retired gallery crops:** `08`, `14` and `29`.
  - `08` was a low-res Canva crop (876 px wide) of a back view on the grass.
  - `14` was phone quality, and it repeated the jewellery theme of `03` (Details · Rings).
  - `29` had an Instagram carousel badge ("1/2") burned into its corner.
  - Their derivatives were deleted from `assets/img/web/`. The masters remain in `assets/img/gallery/`.
- **Gallery now.** The gallery keeps 9 photos in 3 × (pair + single), with the serif line between groups 2 and 3. Its categories are Portrait, Details, Food / Fashion, Beauty, Wellness / Fashion, Portrait, Stays.
- **This supersedes the spec.** It replaces the About photo in spec §4.3 and rows `08`, `14` and `29` of the §4.7 table.

## Videos (already encoded with `scripts/encode-video.sh`)

| File | `data/videos.json` | Notes |
|---|---|---|
| `assets/video/stays/dome-breakfast.mp4` (21 s, 4.4 MB) | **`stays-01`** "Breakfast in the dome" (the media-kit item, until now poster-only) | `src` is set, `duration` 21.1, `audio` true (about −17 LUFS, like the others). The poster and thumb are now built from the encoded first frame. The alt text was rewritten from the footage. |
| `assets/video/stays/pousada-pool.mp4` (41 s, 10.5 MB) | **new `stays-07`** "Pool, arches & a canopy bed", order 7 | `audio` is **false**: the track is only low handling rumble (about −35 LUFS, nothing above 2 kHz), so the sound button and the "Tap for sound" hint stay hidden. Set it to `true` if the client wants that ambience. Its poster and thumb are new. |
| Earlier: `aframe-one-day.mp4` (`stays-06`), `dome-bathtub.mp4` (`stays-03`), `aframe-living-room.mp4` (`stays-05`) | unchanged | |

- **Stays rail:** 7 items, of which 5 are real videos (`01`, `03`, `05`, `06`, `07`). Only `stays-02` (the one-woman band) and `stays-04` (sunset over the valley) are still placeholders, because their files have not arrived yet.
- **Feature card:** still `stays-06`.
- **The fan is unchanged.** Its stays picks (`stays-05`, `stays-03`) were already real. Its other 5 picks are other niches and still poster-only. Swapping a pick for `stays-01` or `stays-07` is the client's call (spec §10 Q4).

## Fonts
Integrated during the build: the Adobe Fonts kit `juy5uwr` (`"the-seasons"`) is linked by `scripts/wrap-site.sh` on Pages only, and serif stacks start with `"the-seasons"`. Details are in `docs/qa-report.md` §2.

## Runtime files (Artifact publish list delta)

Added:
- `assets/img/web/` `stays-aframe-deck`, `stays-ofuro-deck`, `stays-kitchen-above`, `portrait-white-floor` and `portrait-wood-shoulder`, each as `-480` and `-800`.
- `assets/video/posters/stays-07.webp` and `assets/video/thumbs/stays-07.webp`.
- `assets/video/stays/dome-breakfast.mp4` and `pousada-pool.mp4`.

Regenerated under the same names:
- `about-480/800.webp`
- `posters/stays-01.webp` and `thumbs/stays-01.webp`

Removed: `assets/img/web/gallery-{08,14,29}-{480,800}.webp`.

The publish grows by about 14.9 MB of video and 0.7 MB of images, to about 43 MB in total, under the 64 MB per-publish limit. The masters in `assets/img/` and `assets/img/stays/` are not referenced at runtime.

## Checks after the integration (2026-11-11)

The full §9 regression from `docs/qa-report.md` was re-run against the wrapped `index.html` and the Artifact-like page, and everything passes:
- no console errors;
- no horizontal scroll from 320 to 430 px, in motion and reduced modes;
- complete at rest, with no JS and in reduced motion;
- nothing armed while visible: 67 arm records, and 64 in the cross-origin iframe, including the two new Stays frames;
- the hero contexts, the fan, the video rules (27–33d), CLS 0.0001 and the contrast checks.

Item 31's poster-only swap test now taps `stays-02`, because `stays-01` has a real video.

The thumb swaps were checked in motion and reduced modes:
- `stays-01` plays with sound;
- `stays-07` plays muted, with no sound button;
- `stays-02` shows its poster only.

**First view (item 41)** still passes, at 498 KB on Pages and 471 KB on the Artifact (3× DPR, CDN excluded), against the 700 KB budget. It grew by about 140 KB. Chromium's native lazy-load margin fetches the Stays pair at load (`stays-aframe-deck-800`, `stays-ofuro-deck-480`), because before `site.js` runs, the hero is only 100svh tall and the chapter bodies are empty, so the pair sits within the margin. Other photos follow the spec's native `loading="lazy"` too. If those bytes matter, move the pair to the `data-src` lookahead that `video.js` uses for posters, with a `<noscript>` fallback.

## Signature (received 2026-11-11 18:35)
- `_source/drive-3/assinatura-lorena.svg` is Lorena's real "LM" signature: a filled outline exported from Illustrator.
- The animated kit is being built in `assets/signature/` (outline masked by pen paths drawn in writing order; see its README).
- After the polish round, the lead swaps it in for the placeholder EMS Allure signature. That means `js/signature.js` (hero scrub and the footer play-once) and `scripts/make-signature.mjs`, which then becomes obsolete.

## Restaurant videos (received 2026-11-11 19:55; encoded into assets/video/restaurants/)
Each is the original of a media-kit item:
- `pronto-gnocchi.mp4`: PRONTO Light stuffed gnocchi, from the fridge to the table (restaurants-01).
- `salad-table.mp4`: colourful salad with orange juice, a vegetarian table (restaurants-02).
- `wine-tasting.mp4`: white wine, curly hair and a white top, a dinner on blue-patterned plates (restaurants-03).
- `garden-breakfast.mp4`: outdoor breakfast among plants (restaurants-04).

Add them to `data/videos.json` (and the posters/thumbs) after the polish round, replacing the restaurant placeholders. Consider a mixed rail like the Stays one.

**Status: integrated (batch 2, 2026-11-11).** All four restaurant items play their real file, so Food has no placeholder left. Details in `docs/qa-report.md` §9.
- **Durations and audio:** 23.8 s, 24.5 s, 34.9 s and 31.0 s, all with `audio: true`.
  - Pronto, the garden breakfast and the wine are music or voice at −14 to −16 LUFS.
  - The salad track is a music fade-in: it rises from about −44 to −23 LUFS, so the first seconds are quiet. It is not noise.
- **Posters:** `restaurants-01` starts at 15.5 s (her at the table, not the fridge door) and `restaurants-03` at 3.6 s (the first sip). Each poster is that frame (`start` in the data).
- **`wine-tasting.mp4` is a screen recording of an Instagram carousel.** The picture is only the top 64% of the frame (rows 0–823 of 1280), with a white band below it and the carousel's "2/2" badge and mute icon at its right edge. `view: [0, 0.644]` crops it:
  - the poster and thumb are cut from the picture band;
  - the card scales the `<video>` 1.553× from its top centre, so the band fills the card and the badge and icon fall outside it.
  - A re-encode that crops to the band (`crop=464:824:128:0`, then scale) would make `view` unnecessary.
- **Food rail:** `restaurants-04` (feature), `-01`, `-02`, `-03`. It stays video-only. The only real food photos left are already in the gallery (`22`, `31`), or `07`, which repeats the salad video.

## Fashion videos (received 2026-11-11 20:17; encoded into assets/video/fashion/)
- `chanel-boutique.mp4` (36 s): CHANEL boutique, N°1 serum, N°5 book, trying products.
  - **CLIENT: this is THE highlight. It goes in the CENTRE card of the 7-card fan (the largest, upright card in the middle).** Feature it in Fashion too.
  - It used to be filed under skin care, but the client now puts it in Fashion.
- `burgundy-blazer.mp4` (30 s): burgundy blazer, red sneakers, street and stairs (≈ fashion-01).
- `teal-dress-deck.mp4` (27 s): teal flowing dress on a deck above the mountains (≈ fashion-02).
- `picnic.mp4` (19 s): picnic, white tank top, sandals, scarf (≈ fashion-04).
- `yellow-satin-lake.mp4` (26 s): yellow satin dress on a lakeside deck (≈ fashion-03).
- Still missing: fashion-05 (hand on a terracotta clutch) and fashion-06 (bun, gold earring). Keep their posters only if the rail needs them; otherwise drop them.

**Status: integrated (batch 2, 2026-11-11).**
- **Ids:** `fashion-01` burgundy blazer, `-02` teal dress, `-03` yellow satin, `-04` picnic, plus the new `fashion-07` CHANEL boutique.
- **Removed:** `fashion-05` and `fashion-06` (data, posters and thumbs). Their `_ref` JPGs stay.
- **CHANEL:**
  - It is the fan's centre card (index 3, z-index 10) and the Fashion feature.
  - It starts at 21.2 s (`start`), on her holding N°5 to her cheek. The first frame was a blurred shop interior.
  - It loops back to 0:00.
- **Audio:**
  - `yellow-satin-lake.mp4` is digital silence (−91 dB), so it has `audio: false`.
  - `picnic.mp4` is music at **−6.9 LUFS**, about 8–10 LU hotter than the rest, so a tap for sound is loud. iOS ignores `volume`, so the only fix is a re-encode with `loudnorm=I=-16`.
  - The rest are −14 to −16 LUFS.
- **Posters:**
  - `fashion-02` starts at 3.0 s (the full-length back view; frame 0 is a hem and feet).
  - `fashion-04` starts at 10.6 s (the picnic itself).
- **The Fashion rail is now mixed, like Stays:** 6 videos and 4 photos, alternating, 10 items:
  - `fashion-07`, gown, `-01`, zebra print, `-02`, tailoring, `-03`, boots, `-04`, `-08`;
  - the photos are real media-kit photos not used elsewhere: `gallery/21`, `26`, `12`, `25`.

## Chanel photos + 2 more videos (received 2026-11-11 20:58)
- `assets/img/fashion/chanel-chance.jpg`: holding Chance Eau Vive against her cheek, black blazer. Strong close portrait.
- `assets/img/fashion/chanel-n5-boutique.jpg`: leaning on the counter in the CHANEL boutique with N°5, the CC logo behind.
- **CLIENT: give the two Chanel photos a real spotlight**, not just a slot in the gallery. For example, a "CHANEL" editorial spread in Fashion next to or after the Chanel video (which is the fan's centre card): the two photos as an offset pair with curtain reveal and parallax, plus a short caption. Fall back to the gallery only if a spotlight doesn't work.
- `assets/video/fashion/alva-towel.mp4` (7 s): ALVA product shot, towel turban. The client files it under Fashion.
- `assets/video/stays/deck-cushions.mp4` (22 s): couple on a deck with cushions above the forest. Stays rail.

**Status: integrated (batch 2, 2026-11-11).**
- **CHANEL spotlight.** It sits in the Fashion chapter, right after its rail. It is static HTML, so it is complete without JS.
  - Head: eyebrow "Spotlight", the lockup "CHANEL / *Chance & N°5*" (h4) and the caption "Two portraits at the boutique."
  - The pair: Chance at 70% (4:5), and N°5 at 58% (2:3), overlapping its lower right by 28% of the column, cut out by a 6 px Vanilla ring. Each frame has the curtain reveal with the Sand wash (the second staggered by 0.12 s) and the inner parallax.
  - WebP: `chanel-chance-{480,800}` and `chanel-n5-boutique-{480,800}` (`PHOTOS` in `make-images.py`).
- **Note on `chanel-chance.jpg`:** the bottle's label reads "CHANCE CHANEL · PARFUM CHEVEUX / HAIR MIST", not Eau Vive. The copy only says "Chance", and no text on the page says "hair mist".
- **ALVA:** `fashion-08`, "Towel turban, ALVA in hand", 7.3 s, music at −14 LUFS. It is the last item of the Fashion rail.
- **`deck-cushions.mp4`:** `stays-08`, "Cushions above the forest", 22.8 s.
  - `audio: false`: the track is a steady hiss at about −42 LUFS, flat (LRA 3 LU), with no music or voice.
  - It sits 11th in the Stays rail, before the bath photo, so the rail alternates video and photo over 12 items.
- **Not used:** `_source/drive-6/chanel-1084.jpg` and `chanel-1102.jpg` (the originals of the two web masters).
