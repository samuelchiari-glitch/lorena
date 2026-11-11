#!/usr/bin/env bash
# wrap-site.sh: site.html (the Artifact fragment) -> index.html for GitHub Pages (build spec §3.3).
# index.html = the Pages skeleton + site.html byte-for-byte + </body></html>.
# There is deliberately no </head><body> before the fragment: the parser keeps the
# fragment's <title>, <meta>, <link>s and comment in <head> and opens <body> at <div class="site">.
# Pages only: the Adobe Fonts kit juy5uwr ("the-seasons", the client's serif) is linked here and never
# in site.html, because the Artifact CSP blocks use.typekit.net (spec, client feedback 3). The CSS
# serif stack starts with "the-seasons", so the Artifact falls back to the LM stand-ins.
set -euo pipefail

cd "$(dirname "$0")/.."

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
  printf '%s\n' '<meta name="description" content="Lorena Maruch: content creator, model, actress and art director. Stays, food, fashion and skin & hair care.">'
  printf '%s\n' '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>'
  printf '%s\n' '<link rel="stylesheet" href="https://use.typekit.net/juy5uwr.css">'
  cat site.html
  printf '%s\n' '</body></html>'
} > index.html.tmp
mv index.html.tmp index.html
echo "wrap-site: wrote index.html ($(wc -c < index.html) bytes)"
