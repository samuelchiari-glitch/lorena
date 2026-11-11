# Partner logos ("Brands I've worked with")

Source: Canva media kit `DAG5X2TPfyU`, page 3 "PARCERIAS". It has **46 badges**, not ~50. All 46 are delivered.

## What's delivered

- `assets/logos/<slug>.svg`: solid black (`#000`) on transparent, no badge or background, tight `viewBox`. All 46 have an SVG.
- `assets/logos/png/<slug>.png`: black on transparent, 240px tall including 8px padding.
- `data/brands.json`: the logos in media-kit order, with `name, slug, category, city?, svg, png, aspect, scale, ink, source_url, method, confidence, notes`.
- `lab/logos.html`: internal preview with a desktop grid, a 390px mobile grid and a comparison grid without scaling. Open it from a local server or from disk.

**Optical size.** Render each logo at `height = baseHeight × scale` (for example base 60px on desktop and 34px on mobile) with `max-width: 100%` of the cell. `scale` comes from the aspect ratio (`aspect^-0.7`, so wide wordmarks shrink) and from ink density (solid marks shrink a little). It was then hand-tuned after looking at the lab page. Width is already capped at about 2.6 × base.

**Methods.** `official-svg` / `logo-repo-svg`: a vector file recoloured black (9 come from the brand's site or Wikimedia; Chanel comes from worldvectorlogo). `web-png-traced`: an official hi-res PNG from the brand's site, traced to a vector (5 logos). `canva-crop-traced`: cut from a 9× export of the media kit, cleaned and traced with potrace (31 logos). White details on the originals became transparent holes, not black blobs.

## Brands

Confidence refers to the brand's **identity** (name and what it is). H = high, M = medium, L = low.

| # | Brand | Cat. | Conf. | Logo source |
|---|---|---|---|---|
| 1 | Chanel | beauty | H | logo-repo SVG (CC + wordmark) |
| 2 | Sephora | beauty | H | Wikimedia SVG |
| 3 | "3" (unidentified) | ? | **L** | media kit, blurry |
| 4 | Laces | ? | **L** | media kit |
| 5 | I Wanna Sleep | other (mattresses) | H | official PNG 2592px |
| 6 | Guardaroba | fashion | H | official SVG |
| 7 | Olga Ri | food (SP) | H | official SVG |
| 8 | Hidratei | beauty (hair) | H | official SVG (horizontal lockup) |
| 9 | Buser | travel | H | official SVG (horizontal lockup) |
| 10 | Race Bootcamp | fitness | H | official SVG |
| 11 | Velocity | fitness | H | official PNG |
| 12 | Vidya Body&Mind | fitness | M | media kit (only the icon exists online) |
| 13 | Alva Personal Care | beauty | H | official PNG 2635px |
| 14 | Pousada Lumar | hospitality | M | media kit |
| 15 | Club Haas | hospitality (SP) | H | official SVG, tagline removed |
| 16 | Zibá | ? | **L** | media kit, blurry |
| 17 | Casa Zauli | hospitality? | M | media kit |
| 18 | Casa Somar Búzios | hospitality | M | media kit |
| 19 | Sail in Rio | travel | H | media kit (site logo is tiny) |
| 20 | Pronto Light | food | H | media kit (site logo is tiny) |
| 21 | Daymakeup Professional | beauty | H | media kit |
| 22 | SIMS Swimwear | fashion | M | media kit, see below |
| 23 | "Q" monogram | ? | **L** | media kit |
| 24 | Elok | fashion | H | official PNG |
| 25 | Aragäna | ? | **L** | media kit |
| 26 | "TÔM" (?) | ? | **L** | media kit |
| 27 | bemi | ? | **L** | media kit |
| 28 | Empório Jardim | food (Rio) | H | media kit |
| 29 | Kaê Minimal Chic Jewelry | fashion | M | media kit |
| 30 | Pasta Lab | food (BH) | M | media kit |
| 31 | Verde Vício | food (Rio) | H | media kit |
| 32 | Zucco | ? | **L** | media kit |
| 33 | Almanati | beauty | H | media kit (with tagline) |
| 34 | Rango Sarado | food | M | media kit |
| 35 | L'Atelier | ? | **L** | media kit |
| 36 | Niya | ? | **L** | media kit |
| 37 | One Way | ? | **L** | media kit |
| 38 | Democrata | fashion (shoes) | H | official SVG |
| 39 | Arpoador Parafina Bronze | beauty (sun) | M | media kit |
| 40 | Bondai Praia | ? | **L** | media kit |
| 41 | Pura Rio | ? | **L** | media kit |
| 42 | Saint Studio | fashion | H | official PNG 3544px |
| 43 | "OR" monogram | ? | **L** | media kit |
| 44 | Vila Borê | hospitality? | **L** | media kit (photo of a sign) |
| 45 | Kohde | ? | **L** | media kit |
| 46 | Insider | fashion | H | official SVG |

Categories marked `other` in the JSON are unknown. Cities are filled in only where a source confirmed them.

## Needs the client's confirmation or a better file

- **Identity unknown** (the name is only read from the badge): 3, Laces, Zibá, "Q", Aragäna, "TÔM", bemi, Zucco, L'Atelier, Niya, One Way, Bondai Praia, Pura Rio, "OR", Vila Borê, Kohde. Each needs the brand name, what it does and a link or @.
- **Which business**: Pousada Lumar (there are several), Casa Zauli, Rango Sarado (city).
- **Logo version**:
  - **SIMS**: simsswimwear.com now uses a thin sans "SIMS" wordmark. The media kit has a serif "SIMS SWIMWEAR". Which logo should we use, and is it the same brand?
  - **Buser and Hidratei**: we used the official horizontal logo. The media kit shows the stacked version.
- **Low-quality source** (a vector or hi-res file would be better):
  - "3" and Zibá: blurry originals.
  - Vila Borê: the media kit has a photo of a painted sign.
  - Arpoador Parafina: the small "ARPOADOR / BRONZE" lettering is soft.
  - Pasta Lab: the small "by Simone P. Paratella" line traces roughly.
  - Casa Somar: the mark sits on a photo; we kept the mark and the text only.

## Pedir para a Lorena

1. Quais são estas marcas? Mande nome, o que fazem, cidade e @ do Instagram ou site: **"3"**, **Laces**, **Zibá**, **"Q"** (o Q em fundo laranja), **Aragäna**, **"TÔM"** (letras marrons em fundo mostarda), **bemi**, **Zucco**, **L'Atelier**, **Niya**, **One Way**, **Bondai Praia**, **Pura Rio**, **"OR"** (o monograma redondo), **Vila Borê** e **Kohde**.
2. Qual **Pousada Lumar** é (cidade)? E a **Casa Zauli**: é chalé ou hospedagem, e onde fica? O **Rango Sarado** fica em qual cidade?
3. **SIMS**: o site atual usa outro logo, só "SIMS" fino. É a mesma marca? Qual logo prefere?
4. Se tiver o logo oficial em boa qualidade (PDF, SVG ou PNG grande), mande destes: **"3"**, **Zibá**, **Vila Borê**, **Parafina (Arpoador)**, **Pasta Lab**, **Casa Somar Búzios**, **Vidya** (completo, com o nome).
5. **Buser** e **Hidratei**: tudo bem usar o logo horizontal oficial no lugar da versão empilhada?
