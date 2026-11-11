# Canva media kit: extraction inventory

Source: Canva design `DAG5X2TPfyU`, "- Midia Kit - Lorena Maruch." (10 pages, 794 × 1123 units).
Extracted 2026-11-11, **read-only**. The design was never edited, copied, resized or moved. An editing transaction was opened only to read the structured element data, and nothing was committed.

Machine-readable versions: `data/inventory.json` (assets) and `data/content.json` (all text, PT + EN).
Partner brands: `data/brands.json` (logo specialist). Metrics: `data/metrics.json` (insights specialist).

## What was produced

| Output | Count | Notes |
|---|---|---|
| `assets/img/avatar.jpg` / `avatar.png` | 1 (+ transparent PNG) | 294 × 294, from the IG profile-header screenshot. **Low-res**: native is about 220 px, so display at 150 px or less |
| `assets/img/portrait-cover.jpg` | 1 | 1527 × 1600, cover photo, cropped above the burned-in "LORENA MARUCH" title |
| `assets/img/portrait-about.jpg` | 1 | 1187 × 1600, About-page photo |
| `assets/img/gallery/01–33.jpg` | 33 | page 9, row-major order, long side 1240–1600 px, q82 progressive (4.5 MB total) |
| `assets/img/contact/01–09.jpg` | 9 | page 10 3×3 grid, about 1440 × 1600 each (2.4 MB total) |
| `assets/video/_ref/<category>-NN.jpg` | 22 | identification thumbnails only (no video files, see below) |
| `_source/canva-pages/page-NN-<slug>.png` | 10 | all pages at 2382 × 3369 (3×), lossless PNG |
| `_source/canva-pages/hires/` | 4 + 1 | page 1 @6×, page 2 @4×, page 9 @10×, page 10 @8×, plus `portrait-cover-with-title.png` |
| `_source/canva-structure/*.json` | 12 | raw element data per page, `get-assets.json` (124 assets), `design-metadata.json` |

All photo crops use the Canva element bounds (page units × export scale) with a 0.4-unit inset. Photos inside the tablet mock-up are cropped to the measured screen area: frame viewBox 1152 × 1500, visible screen x 55.4–1099 and y 50.6–1450.7, corner radius ≈ 24. The crop uses x 64.5–1090 and y 59.5–1441.5 so that no bezel or rounded corner is included.
**Verified:** contact sheets checked visually, an automated edge check found no background or bezel colour on any crop edge, and portrait corners were checked at 1:1 zoom.
**Photo quality is good.** At 8–10× export, Canva renders the photos from the original uploads, and 1:1 detail is sharp (skin texture, lettering on product labels). The photos can be used as-is on the site.

## Asset access (what didn't work)

- `get-assets` returns **`permission_denied` for every asset Lorena uploaded**. That covers all 22 videos, all photos, all 46 logo images, the IG screenshots and the cover/about photos. The connected Canva account can read the design but does not own its uploads.
- Only Canva-library stock assets resolve: the tablet frame `MAE49sxTLnc` ("Gadget Mockup Frames Tablet"), backgrounds `MAD6Gko8JmE` (B&W ocean, pages 3–10) and `MAElXc3plho` ("ocean view", page 2), and the contact icons.
- So there is **no route to original files, durations, resolutions or filenames** through the API. Making a design copy to re-crop the media was not attempted, because the design is read-only by rule.

## Videos (22): inventory only

Decision (lead, 2026-11-11): **the client supplies the original video files.** No MP4 was exported or rendered and nothing was written to `assets/video/` apart from `_ref/` thumbnails. The ref images are the poster frames from the page PNG export, cropped inside the bezel, and are meant for identification only.

Findings that matter if anyone revisits the Canva route:
- Each video sits in a tablet mock-up whose screen is about 3:4. The 9:16 sources are scaled to the screen width, so **only about the middle 75% of each video's height is visible** in the kit. A page-MP4 export plus crop would therefore never give the full vertical frame, which is another reason to use the originals.
- Exceptions: `restaurants-03` has a source aspect of about 0.87 (cropped left/right in the kit). `fashion-06` and `skincare-06` are about 0.65. `fashion-04` and `skincare-06` show black bands in their poster frames, which are part of the clip.
- Durations, audio and resolution are unknown because asset metadata is permission-denied.

| ID | Page / position | Canva video ID | What it shows | Ref |
|---|---|---|---|---|
| stays-01 | p4, row 1 left | VAHKzCTviU4 | Geodesic glamping dome interior: freestanding tub by a panoramic window, breakfast being set | `assets/video/_ref/stays-01.jpg` |
| stays-02 | p4, row 1 right | VAG5X4H_q5I | Elderly one-woman-band musician (keyboard, washboard, cymbal, red pot) | `…/stays-02.jpg` |
| stays-03 | p4, row 2 left | VAHL_XXHbBc | Lorena in a freestanding tub inside a geodesic dome, mountain view | `…/stays-03.jpg` |
| stays-04 | p4, row 2 right | VAG5YmAPCS4 | Wooden deck over a misty mountain valley at sunset, firewood basket | `…/stays-04.jpg` |
| stays-05 | p4, row 3 left | VAHL_UHiIhk | A-frame cabin interior, tall curtained glass front, orange sofa | `…/stays-05.jpg` |
| stays-06 | p4, row 3 right | VAHL_cqUXVQ | Black A-frame glass cabin exterior with barrel sauna; overlay "1 DIA EM" | `…/stays-06.jpg` |
| restaurants-01 | p5, row 1 left | VAG5X3J2w9k | PRONTO Light ready meal ("Nhoque recheado de mussarela") taken from the fridge | `…/restaurants-01.jpg` |
| restaurants-02 | p5, row 1 right | VAG5X9u5NR4 | Top-down colourful salad (tomato, mango, egg, cashews, edible flowers, couscous) | `…/restaurants-02.jpg` |
| restaurants-03 | p5, row 2 left | VAG5YATQrYM | Lorena (curly hair, white halter) tasting white wine at a restaurant | `…/restaurants-03.jpg` |
| restaurants-04 | p5, row 2 right | VAG5pGNfdBI | Outdoor breakfast among plants: fruit/chia cup, juice, patterned bowls | `…/restaurants-04.jpg` |
| fashion-01 | p6, row 1 left | VAG5XZvbaf8 | Close-up portrait, hand to lips, chocolate-brown jacket | `…/fashion-01.jpg` |
| fashion-02 | p6, row 1 right | VAHMAP6VUxw | Barefoot on a wooden deck in a flowing teal silk skirt | `…/fashion-02.jpg` |
| fashion-03 | p6, row 2 left | VAG5X2W_Sx8 | Back view, open-back yellow satin dress on a lakeside deck | `…/fashion-03.jpg` |
| fashion-04 | p6, row 2 right | VAHL_XuEewg | Split-screen: brown buckle sandals / white maxi dress under a cloudy sky | `…/fashion-04.jpg` |
| fashion-05 | p6, row 3 left | VAG5YuG2L2Q | Hand with white manicure on a terracotta leather clutch | `…/fashion-05.jpg` |
| fashion-06 | p6, row 3 right | VAG5Yn31ry8 | Messy bun, putting on a gold earring, black blazer | `…/fashion-06.jpg` |
| skincare-01 | p7, row 1 left | VAG5YK_RhDk | Top-down: hand with a cup of dark drink on a green ceramic saucer (no product visible) | `…/skincare-01.jpg` |
| skincare-02 | p7, row 1 right | VAG5YerM_e8 | Picking up makeup brushes beside a beauty sponge | `…/skincare-02.jpg` |
| skincare-03 | p7, row 2 left | VAG5opkHVzM | In a robe in the bathroom holding a white CHANEL skincare tube | `…/skincare-03.jpg` |
| skincare-04 | p7, row 2 right | VAG5X6f2xaU | Split frame at a beauty counter / applying product in a mirror | `…/skincare-04.jpg` |
| skincare-05 | p7, row 3 left | VAG5YtMbdnQ | Navy robe at the bathroom mirror, hair-care bottles on the counter | `…/skincare-05.jpg` |
| skincare-06 | p7, row 3 right | VAG5o7WlEZw | Lifting an espresso cup by a window (no product visible) | `…/skincare-06.jpg` |

Descriptions come from the single poster frame only. Brand or product identification inside the clips is limited to what is legible in that frame (PRONTO Light, CHANEL).

## Photos

- **Gallery (page 9, 33 photos):** lifestyle, travel, fashion and beauty shots, in row-major order (rows of 5/6/6/6/5/5). Visible brands: Sephora (01), Chanel Chance hair mist (02), "Parafina" jars (27). Per-photo descriptions are in `data/inventory.json → photos.gallery[].description`, ready to use as alt text.
- **Contact (page 10, 9 photos):** a cohesive editorial/studio portrait set (neutral tones, brown/black/white outfits), the best "model" material in the kit.
- **Portraits:** `portrait-cover.jpg` (beauty close-up over the shoulder, grey backdrop) and `portrait-about.jpg` (black outfit on a wooden ledge). The full cover crop *with* the "LORENA MARUCH" title overlay is kept at `_source/canva-pages/hires/portrait-cover-with-title.png`.
- **Avatar:** taken from the IG screenshot, so it is low-res. The same photo does not appear elsewhere in the kit.

## Text

Everything is in `data/content.json`, verbatim PT + EN translation. Highlights:
- Tagline: "Criadora de conteúdo, modelo, atriz e diretora de arte." → "Content creator, model, actress and art director."
- About: film/audiovisual graduate, 8 years of sponsored Instagram content, creative direction for major national and international brands in fashion, beauty, food and fitness.
- IG header screenshot (capture date unknown): 2,828 posts · 39.2K followers · 3,262 following · verified · "Artista" · bio "diretora de arte @maruch.arte / vegetariana formada em teatro e cinema que ama viajar 🌱".
- Contact: IG @lorena_maruch · TikTok @lorena_maruch · WhatsApp (31) 9 9302-3248 (+55 31 99302-3248) · lorenamaruch@gmail.com.
- Source quirks kept verbatim: "c0ntato" (with a zero), trailing spaces in "Meus Conteúdos " / "Restaurantes ", and a double space in the bio.

## Design notes observed (for the design-system specialist)

Colours `#efefec` (off-white), `#121212` (near-black), `#ffffff`, `#08304a` (navy, partner-logo rings), `#a2a2a2`. Two families carry the kit: a high-contrast display serif (fontRef `YAFdJnPX3ZE`, often italic for category names) and a geometric sans (`YAFdJjbTu24`). Font names are not exposed by the API. Pages 3–10 sit on a B&W ocean photo with an off-white panel, and media appear inside tablet mock-ups.

## Recommendation

- **Photos:** no originals needed. The extracted crops are sharp at up to 1600 px.
- **Videos:** originals required (the client is supplying them). See `docs/media-request.md` for the checklist.
- **Avatar:** ask for the original profile photo if the site shows it larger than about 150 px.
