#!/usr/bin/env python3
"""Build the responsive WebP derivatives the site references (build spec §8.1, §6.7).

    python3 -I scripts/make-images.py            # from the repo root
    python3 -I scripts/make-images.py --force    # rebuild even if the output is newer

Outputs (all WebP, sRGB, metadata stripped):
  assets/img/web/hero-{828,1242,1527}.webp           q78  from assets/img/portrait-cover.jpg
  assets/img/web/about-{480,800}.webp                q76  from assets/img/portrait-about.jpg
  assets/img/web/gallery-NN-{480,800}.webp           q76  the 9 gallery photos used on the page
  assets/video/posters/<id>.webp   540x960 (9:16)    q78  cover-crop from the encoded first frame, else the _ref JPG
  assets/video/thumbs/<id>.webp    240x427 (9:16)    q72  same source

A "-800" file is never upscaled: if the original is narrower, it keeps the original
width (the printed manifest gives the real width for srcset descriptors).
Video ids and sources come from data/videos.json (poster path = the target, source =
the mp4's sibling .jpg when `src` is set, else assets/video/_ref/<id>.jpg).
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
FORCE = '--force' in sys.argv

# The gallery photos the page shows (spec §4.7), in page order.
GALLERY = ['08', '03', '22', '17', '02', '09', '18', '14', '29']


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


def cover(src, out, size, q):
    """Cover-crop to `size` (centre)."""
    if fresh(src, out):
        return size
    im = load(src)
    save(ImageOps.fit(im, size, Image.LANCZOS, centering=(0.5, 0.5)), out, q)
    return size


def main():
    web = ROOT / 'assets/img/web'
    manifest = {}

    cover_src = ROOT / 'assets/img/portrait-cover.jpg'
    for w in (828, 1242, 1527):
        manifest[f'hero-{w}'] = resize_w(cover_src, web / f'hero-{w}.webp', w, 78)

    about_src = ROOT / 'assets/img/portrait-about.jpg'
    for w in (480, 800):
        manifest[f'about-{w}'] = resize_w(about_src, web / f'about-{w}.webp', w, 76)

    for n in GALLERY:
        src = ROOT / f'assets/img/gallery/{n}.jpg'
        for w in (480, 800):
            manifest[f'gallery-{n}-{w}'] = resize_w(src, web / f'gallery-{n}-{w}.webp', w, 76)

    vids_path = ROOT / 'data/videos.json'
    if vids_path.exists():
        vids = json.loads(vids_path.read_text(encoding='utf-8'))
        for v in vids.get('videos', []):
            vid = v['id']
            if v.get('src'):
                src = (ROOT / v['src']).with_suffix('.jpg')
            else:
                src = ROOT / f'assets/video/_ref/{vid}.jpg'
            if not src.exists():
                print(f'warn: no poster source for {vid} ({src})', file=sys.stderr)
                continue
            poster = ROOT / (v.get('poster') or f'assets/video/posters/{vid}.webp')
            thumb = ROOT / (v.get('thumb') or f'assets/video/thumbs/{vid}.webp')
            manifest[f'poster-{vid}'] = cover(src, poster, (540, 960), 78)
            manifest[f'thumb-{vid}'] = cover(src, thumb, (240, 427), 72)
    else:
        print('warn: data/videos.json missing, video posters skipped', file=sys.stderr)

    for k, (w, h) in manifest.items():
        print(f'{k:24s} {w}x{h}')


if __name__ == '__main__':
    main()
