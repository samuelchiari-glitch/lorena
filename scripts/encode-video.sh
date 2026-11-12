#!/usr/bin/env bash
# Web encode for Lorena's vertical videos (9:16).
#   usage: scripts/encode-video.sh <input> <output.mp4> [poster.jpg]
#
# Standard (validated on the first 3 stays videos: SSIM >= 0.977 vs. the
# source scaled to the same size, visually identical at 2x zoom):
#   - 720x1280 (cards show at ~260-360 CSS px wide on phones; 720 covers 2-3x DPR)
#   - 30 fps (sources are often 60 fps; 30 halves the bitrate for the same quality)
#   - H.264 High, CRF 23, preset slow, keyframe every 2 s (fast seeking)
#   - bitrate cap: min(3 Mbps, what keeps the file <= 12 MB) -> always under the
#     Artifact 15 MB per-file limit and GitHub's 100 MB limit
#   - AAC 128 kbps stereo, loudness-normalised to -16 LUFS (so no clip is much
#     louder than the others when a visitor turns the sound on), +faststart.
#     LUFS=<target> overrides the loudnorm target. A track that fades in over the
#     whole clip (salad-table.mp4) comes out of loudnorm's single pass about 3.5 LU
#     above its target, with the fade flattened into a gentle swell; LUFS=-19 lands
#     it at about -15.5, in line with the other clips
#   - BT.709 / TV range (fixes full-range "yuvj420p" phone footage)
set -euo pipefail

in="$1"; out="$2"; poster="${3:-${out%.*}.jpg}"
W=720; H=1280; FPS=30; CRF=23; MAX_KBPS=3000; MAX_BYTES=$((12 * 1024 * 1024)); LUFS="${LUFS:--16}"

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
cap=$(awk -v d="$dur" -v b="$MAX_BYTES" -v m="$MAX_KBPS" 'BEGIN { k = int((b * 8 / d) / 1000) - 140; if (k > m) k = m; print k }')

# 9:16 crop-to-fill so non-9:16 sources don't letterbox
vf="fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},format=yuv420p"

has_audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$in" | head -1)
af=(); [ -n "$has_audio" ] && af=(-af "loudnorm=I=${LUFS}:TP=-1.5:LRA=11" -ar 48000)

ffmpeg -v error -y -i "$in" -map 0:v:0 -map '0:a:0?' -vf "$vf" "${af[@]}" \
  -c:v libx264 -preset slow -profile:v high -crf "$CRF" \
  -maxrate "${cap}k" -bufsize "$((cap * 2))k" -g $((FPS * 2)) \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 128k -ac 2 -movflags +faststart "$out"

# Poster = first frame (avoids a visible jump when autoplay starts)
ffmpeg -v error -y -ss 0.05 -i "$out" -frames:v 1 -q:v 4 "$poster"

printf '%s  %ss  %s  cap=%sk\n' "$out" "${dur%.*}" "$(du -h "$out" | cut -f1)" "$cap"
