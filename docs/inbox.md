# Inbox: client files waiting to be integrated

Raw files are in `_source/drive-2/` (gitignored, downloaded from the client's Drive folder on 2026-11-11). Integrate them **after** the current build workflow finishes, so the section builders aren't disturbed.

## Photos (originals 1365–6192 px tall)
- `foto-de-capa.jpg`: the client's chosen **cover photo** (portrait in a white robe). It replaces the hero image (`assets/img/web/hero-*.webp`, made by `scripts/make-images.py`).
- **Retratos (good for About and the gallery):**
  - `img-9196.jpg`, `img-9201.jpg`, `img-9204.jpg`: white shirt against a wood wall.
  - `img-9560.jpg`: lying on a white background.
- **Hospedagens (Stays chapter and gallery):**
  - `dsc01104.jpg`: deck with a parasol, couple.
  - `dsc01358.jpg`: A-frame glass deck.
  - `dsc02726.jpg`: kitchen with a view.
  - `dsc02755.jpg`: kitchen seen from above.
  - `dsc02763.jpg`: deck with an ofurô tub.
  - `02.jpg` and `03.jpg`: cooking, wooden loft.
  - `likeappro-3279.jpg`: bathtub, couple.
  - `likeappro-9669.jpg`: kitchen, couple.

## Videos (already encoded with `scripts/encode-video.sh`)
- `assets/video/stays/dome-breakfast.mp4` (+ `.jpg`): geodesic dome from above, breakfast. 21 s, 4.4 MB.
- `assets/video/stays/pousada-pool.mp4` (+ `.jpg`): pousada with pool, arches and a canopy bed. 40 s, 10.5 MB.
- Earlier: `aframe-one-day.mp4` (hospedagens-06), `dome-bathtub.mp4` (hospedagens-03), `aframe-living-room.mp4` (hospedagens-05).
- Both new videos still need entries in `data/videos.json`.

## Fonts
- Adobe Fonts kit `juy5uwr` ("Lorena Maruch site") holds The Seasons Light, Regular, Light Italic and Regular Italic. CSS family: `"the-seasons"`. Embed: `<link rel="stylesheet" href="https://use.typekit.net/juy5uwr.css">`.
- Allowed domains: www.lorenamaruch.com, lorenamaruch.com, samuelchiari-glitch.github.io, localhost.
- **Pages only:** inject the link in `scripts/wrap-site.sh`. The Artifact CSP blocks use.typekit.net, so it must not go in `site.html`.
- Put `"the-seasons"` first in the serif font stacks, before the LM Serif stand-ins.
