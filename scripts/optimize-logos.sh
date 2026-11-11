#!/usr/bin/env bash
# optimize-logos.sh: assets/logos/master/*.svg (the traced and official masters, kept unoptimized) ->
# assets/logos/*.svg (what the page loads). svgo, with the coordinate precision chosen per file so the
# rounding error stays under 0.05% of the logo's height (≈ 0.02 px at the 44 px it is drawn): a traced
# master (viewBox 1000 tall) keeps integers, a small official viewBox keeps its decimals.
#   bash scripts/optimize-logos.sh            (needs npx; svgo is pinned below)
set -euo pipefail
cd "$(dirname "$0")/.."
SVGO="npx --yes svgo@3.3.2"
for src in assets/logos/master/*.svg; do
  out="assets/logos/$(basename "$src")"
  h=$(sed -nE 's/.*viewBox="[^ "]+ [^ "]+ [^ "]+ ([^ "]+)".*/\1/p' "$src" | head -1)
  p=$(python3 -I -c "import math,sys; print(max(0, math.ceil(math.log10(1000 / float(sys.argv[1])))))" "$h")
  $SVGO --config scripts/svgo.config.mjs -p "$p" -q -i "$src" -o "$out"
done
du -ch assets/logos/*.svg | tail -1
