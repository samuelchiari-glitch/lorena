#!/usr/bin/env bash
# wrap-site.sh: site.html (the Artifact fragment) -> index.html for GitHub Pages (build spec §3.3).
# index.html = the Pages skeleton + site.html byte-for-byte + </body></html>.
# There is deliberately no </head><body> before the fragment: the parser keeps the
# fragment's <title>, <meta>, <link>s and comment in <head> and opens <body> at <div class="site">.
# Pages only: the Adobe Fonts kit juy5uwr ("the-seasons", the client's serif) is linked here and never
# in site.html, because the Artifact CSP blocks use.typekit.net (spec, client feedback 3). The CSS
# serif stack starts with "the-seasons", so the Artifact falls back to the LM stand-ins.
# The share/platform meta (og:*, twitter:card, canonical, theme-color, icons) are Pages-only too.
set -euo pipefail

cd "$(dirname "$0")/.."

# Pages-only head: share card and icons (scripts/make-social.mjs), canonical URL (CNAME), Adobe Fonts preconnects
URL="https://$(tr -d '[:space:]' < CNAME)/"
TITLE='Lorena Maruch: content creator & art director'
DESC='Lorena Maruch: content creator, model, actress and art director. Stays, food and fashion.'

if [ ! -f site.html ]; then
  echo "wrap-site: site.html is missing" >&2
  exit 1
fi
if [ "$(head -c 7 site.html)" != "<title>" ]; then
  echo "wrap-site: site.html must start with <title>" >&2
  exit 1
fi

{
  printf '%s\n' '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  printf '%s\n' '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  printf '%s\n' '<meta name="color-scheme" content="light">'
  printf '%s\n' "<meta name=\"description\" content=\"${DESC}\">"
  printf '%s\n' '<meta name="theme-color" content="#4D342D">'
  printf '%s\n' "<link rel=\"canonical\" href=\"${URL}\">"
  printf '%s\n' '<link rel="icon" href="assets/img/social/icon-32.png" sizes="32x32" type="image/png">'
  printf '%s\n' '<link rel="apple-touch-icon" href="assets/img/social/apple-touch-icon.png">'
  printf '%s\n' '<meta property="og:type" content="website">'
  printf '%s\n' '<meta property="og:site_name" content="Lorena Maruch">'
  printf '%s\n' "<meta property=\"og:title\" content=\"${TITLE}\">"
  printf '%s\n' "<meta property=\"og:description\" content=\"${DESC}\">"
  printf '%s\n' "<meta property=\"og:url\" content=\"${URL}\">"
  printf '%s\n' "<meta property=\"og:image\" content=\"${URL}assets/img/social/og-cover.jpg\">"
  printf '%s\n' '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
  printf '%s\n' '<meta property="og:image:alt" content="Lorena Maruch, content creator and art director: a portrait beside her name.">'
  printf '%s\n' '<meta name="twitter:card" content="summary_large_image">'
  printf '%s\n' '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>'
  printf '%s\n' '<link rel="preconnect" href="https://use.typekit.net" crossorigin>'
  printf '%s\n' '<link rel="preconnect" href="https://p.typekit.net" crossorigin>'
  printf '%s\n' '<link rel="stylesheet" href="https://use.typekit.net/juy5uwr.css">'
  cat site.html
  printf '%s\n' '</body></html>'
} > index.html.tmp
mv index.html.tmp index.html
echo "wrap-site: wrote index.html ($(wc -c < index.html) bytes)"
