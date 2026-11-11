# Font licences

All three webfonts in this folder are licensed under the **SIL Open Font License 1.1** (OFL). The full licence text is at the end of this file. It applies to each font, together with that font's own copyright notice below.

The files are Latin subsets made for this site on 2026-11-11 from the official sources. Subsetting creates a "Modified Version" under the OFL. Two of the fonts have a **Reserved Font Name** (RFN), so their subsets were **renamed** inside the font, as the licence requires. The original copyright and licence records inside each file are kept unchanged.

| File | Original font | Copyright notice (verbatim) | Changes | Name inside the file |
|---|---|---|---|---|
| `lm-sans-var-latin.woff2` | **Mona Sans** variable (upright), from github.com/github/mona-sans @ `0d07d5a`, byte-identical to the google/fonts copy | Copyright 2022 The Mona Sans Project Authors (https://github.com/github/mona-sans), with Reserved Font Name "Mona" | Width axis limited to 75–100 (weight 200–900 kept); Latin subset; reduced feature set; WOFF2 | **LM Sans**, renamed because "Mona" is an RFN |
| `lm-display-regular-latin.woff2` | **Gilda Display** Regular, from github.com/google/fonts `ofl/gildadisplay` | Copyright 2012 The Gilda Display Project Authors (https://github.com/etunni/gilda-display) with Reserved Font Name 'Gilda'. | Latin subset; reduced feature set; WOFF2 | **LM Display**, renamed because "Gilda" is an RFN |
| `eb-garamond-italic-latin.woff2` | **EB Garamond** Italic variable, from github.com/google/fonts `ofl/ebgaramond` | Copyright 2017 The EB Garamond Project Authors (https://github.com/octaviopardo/EBGaramond12) | Static instance at weight 400; Latin subset; reduced feature set (`swsh` swash capitals kept); WOFF2 | EB Garamond (no RFN, name kept) |

The subset covers the Google Fonts "latin" range (U+0000–00FF, Œœ, ı, General Punctuation U+2000–206F, €, ™, −, ∕) plus the arrows ← ↑ → ↓ ↗. Hinting was removed. The OpenType features kept are `ccmp locl mark mkmk kern liga clig calt rlig rvrn frac numr dnom`, plus `tnum pnum case` (LM Sans), `case` (LM Display) and `swsh dlig tnum lnum case` (EB Garamond Italic).

**Rules that follow from the OFL**
- These files may be used, embedded and redistributed with the site, including commercially. They may not be sold on their own.
- Keep this file next to the fonts.
- Do not call the modified fonts "Mona" or "Gilda" anywhere. In CSS they are loaded as `LM Sans` and `LM Serif` (see `docs/typography.md`).

## Not included: The Seasons (the media kit's font)

Lorena's Canva media kit is set in **The Seasons** by Elena Genova / My Creative Land. It is a **commercial** font, not OFL. A Canva subscription licenses it for use inside Canva only. It does not give us font files or the right to embed the font on a website. To use The Seasons on the site, one of these is needed:
- **Adobe Fonts.** It is in the Adobe Fonts library. Anyone with a Creative Cloud plan can add it to a *Web Project*, and Adobe then hosts and serves it. Self-hosting is not included.
- **My Creative Land.** Buy a self-hosted webfont licence at mycreativeland.com. Only then can the font files be placed in this folder, together with their licence.

Never copy font files out of Canva, Adobe Fonts or the media-kit PDFs into this repo.

## Not used: reference-site fonts

The reference design system (landonorris.com, by OFF+BRAND) uses **Brier**, a commercial font. It is not used and must not be copied. Mona Sans is used here from GitHub's official OFL release, not from that site.

---

## SIL Open Font License, Version 1.1

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://openfontlicense.org


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
