#!/usr/bin/env python3
"""Build the responsive WebP derivatives the site references (build spec §8.1, §6.7).

    python3 -I scripts/make-images.py            # from the repo root
    python3 -I scripts/make-images.py --force    # rebuild even if the output is newer

Outputs (all WebP, sRGB, metadata stripped):
  assets/img/web/hero-{828,1242,1527}.webp           q78  from assets/img/cover.jpg (client cover, 1600x2400)
  assets/img/web/about-{480,800}.webp                q76  from assets/img/portrait-wood-hands.jpg (client original img-9196)
  assets/img/web/gallery-NN-{480,800}.webp           q76  the Canva-extracted gallery photos still on the page
                                                         (landscape ones cover-cropped to 5:6: GALLERY_CROP)
  assets/img/web/<name>-{480,800}.webp               q76  the client's originals in PHOTOS (gallery, CHANEL spotlight)
  assets/img/web/contact-06-{320,480}.webp           q76  the contact card (assets/img/contact/06.jpg)
  assets/video/posters/<id>.webp   540x960 (9:16)    q78  cover-crop from the encoded first frame, else the _ref JPG
  assets/video/thumbs/<id>.webp    240x427 (9:16)    q72  same source
    `start` (s): the item plays from there (js/video.js adds #t=start), so its poster is that frame (ffmpeg)
    `view` [top, bottom] (0..1 of the frame height): only that band is picture (wine-tasting.mp4 is a screen
    recording with a white band under it); the poster is cover-cropped from the band, and video.js scales
    the <video> so the same band fills the card
  photo items (type "photo" in data/videos.json, the mixed rails): `poster` 720x1280 q78 and `thumb`
  240x427 q72, cover-cropped to 9:16 from `master` around the horizontal centre `crop` (0..1)

A "-800" file is never upscaled: if the original is narrower, it keeps the original
width (the printed manifest gives the real width for srcset descriptors).
Video ids and sources come from data/videos.json (poster path = the target, source =
the mp4's sibling .jpg when `src` is set, else assets/video/_ref/<id>.jpg; photo items use `master`).
"""
import io
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
FORCE = '--force' in sys.argv

# The Canva-extracted gallery photos the page still shows (spec §4.7), in page order.
# 08, 14 and 29 were retired for the client's originals (docs/inbox.md, 2026-11-11); 17 (it repeated the
# fan's yellow satin), 02 (a hair-mist product, client feedback 6) and the kitchen single (now in the
# Stays rail) were replaced by 04, 20 and 07 in polish round 1, 07 (the same salad plate as the Food
# rail's restaurants-02) by 31 in round 2, and 09 (the massage: the therapist dominated) by the client's
# dsc02726 in batch 2 (docs/qa-report.md). The Fashion rail's photo items also use masters from this
# folder (21, 26, 12, 25: see data/videos.json).
GALLERY = ['03', '22', '04', '20', '18', '31']
# Landscape originals, cover-cropped to 5:6 around this horizontal centre so their frame never upscales.
GALLERY_CROP = {'31': 0.52}

# Web masters made from the client's high-res originals (_source/drive-2, EXIF-oriented, sRGB,
# long side <= 2400 px, q86): output name -> master. Used by the gallery. (The Stays photos in
# assets/img/stays/ are photo items in data/videos.json: see the loop at the end of main().)
PHOTOS = {
    'portrait-white-floor': 'assets/img/portrait-white-floor.jpg',  # img-9560
    'portrait-wood-shoulder': 'assets/img/portrait-wood-shoulder.jpg',  # img-9201
    'stays-kitchen-view': 'assets/img/stays/kitchen-view.jpg',  # dsc02726 (gallery, batch 2)
    'chanel-chance': 'assets/img/fashion/chanel-chance.jpg',  # CHANEL spotlight (Fashion chapter)
    'chanel-n5-boutique': 'assets/img/fashion/chanel-n5-boutique.jpg',
}


def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')
    if im.mode == 'RGBA':
        im = im.convert('RGB')
    return im


def fresh(src, out):
    return (not FORCE) and out.exists() and out.stat().st_mtime >= src.stat().st_mtime


def save(im, out, q):
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, 'WEBP', quality=q, method=6)


def resize_w(src, out, width, q):
    """Resize to `width` (never upscale). Returns the (w, h) written."""
    im = load(src)
    w = min(width, im.width)
    h = round(im.height * w / im.width)
    if not fresh(src, out):
        save(im.resize((w, h), Image.LANCZOS) if w != im.width else im, out, q)
    return w, h


def cover(src, out, size, q, cx=0.5):
    """Cover-crop to `size` around the horizontal centre cx (0..1; vertically centred)."""
    if fresh(src, out):
        return size
    im = load(src)
    save(ImageOps.fit(im, size, Image.LANCZOS, centering=(cx, 0.5)), out, q)
    return size


def video_frame(mp4, t):
    """The decoded frame at t seconds (ffmpeg input seek, frame-accurate)."""
    png = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t}', '-i', str(mp4), '-frames:v', '1',
                          '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGB')


def main():
    web = ROOT / 'assets/img/web'
    manifest = {}

    cover_src = ROOT / 'assets/img/cover.jpg'
    for w in (828, 1242, 1527):
        manifest[f'hero-{w}'] = resize_w(cover_src, web / f'hero-{w}.webp', w, 78)

    about_src = ROOT / 'assets/img/portrait-wood-hands.jpg'
    for w in (480, 800):
        manifest[f'about-{w}'] = resize_w(about_src, web / f'about-{w}.webp', w, 76)

    for n in GALLERY:
        src = ROOT / f'assets/img/gallery/{n}.jpg'
        for w in (480, 800):
            out = web / f'gallery-{n}-{w}.webp'
            if n in GALLERY_CROP:
                manifest[f'gallery-{n}-{w}'] = cover(src, out, (w, round(w * 6 / 5)), 76, GALLERY_CROP[n])
            else:
                manifest[f'gallery-{n}-{w}'] = resize_w(src, out, w, 76)

    for name, master in PHOTOS.items():
        for w in (480, 800):
            manifest[f'{name}-{w}'] = resize_w(ROOT / master, web / f'{name}-{w}.webp', w, 76)

    # contact card (spec §4.8, optional small card): the rust knit portrait
    contact_src = ROOT / 'assets/img/contact/06.jpg'
    for w in (320, 480):
        manifest[f'contact-06-{w}'] = resize_w(contact_src, web / f'contact-06-{w}.webp', w, 76)

    vids_path = ROOT / 'data/videos.json'
    if vids_path.exists():
        vids = json.loads(vids_path.read_text(encoding='utf-8'))
        for v in vids.get('videos', []):
            vid = v['id']
            if v.get('type') == 'photo':
                src, cx = ROOT / v['master'], float(v.get('crop', 0.5))
                manifest[f'card-{vid}'] = cover(src, ROOT / v['poster'], (720, 1280), 78, cx)
                manifest[f'thumb-{vid}'] = cover(src, ROOT / v['thumb'], (240, 427), 72, cx)
                continue
            mp4 = ROOT / v['src'] if v.get('src') else None
            src = mp4.with_suffix('.jpg') if mp4 else ROOT / f'assets/video/_ref/{vid}.jpg'
            if not src.exists():
                print(f'warn: no poster source for {vid} ({src})', file=sys.stderr)
                continue
            poster = ROOT / (v.get('poster') or f'assets/video/posters/{vid}.webp')
            thumb = ROOT / (v.get('thumb') or f'assets/video/thumbs/{vid}.webp')
            start, view = v.get('start'), v.get('view')
            if not (mp4 and (start or view)):
                manifest[f'poster-{vid}'] = cover(src, poster, (540, 960), 78)
                manifest[f'thumb-{vid}'] = cover(src, thumb, (240, 427), 72)
                continue
            refs = (mp4, vids_path)  # `start` / `view` live in the JSON: rebuild when either changes
            if not all(fresh(r, o) for r in refs for o in (poster, thumb)):
                im = video_frame(mp4, start) if start else load(src)
                if view:
                    im = im.crop((0, round(view[0] * im.height), im.width, round(view[1] * im.height)))
                save(ImageOps.fit(im, (540, 960), Image.LANCZOS), poster, 78)
                save(ImageOps.fit(im, (240, 427), Image.LANCZOS), thumb, 72)
            manifest[f'poster-{vid}'] = (540, 960)
            manifest[f'thumb-{vid}'] = (240, 427)
    else:
        print('warn: data/videos.json missing, video posters skipped', file=sys.stderr)

    for k, (w, h) in manifest.items():
        print(f'{k:24s} {w}x{h}')


if __name__ == '__main__':
    main()
