# My COD — Design System v2

Scope note: this pass redesigns UI/UX only. Every hex value below already
exists in `src/app/globals.css` (Urban Neo-Brutalism theme) and is kept
byte-for-byte identical — nothing here introduces a new color.

## Visual concept

My COD sudah lahir dengan palet rambu jalan (aspal, oranye keselamatan, hijau
listrik) — konsep ini menyelesaikan apa yang setengah jalan: setiap permukaan
jadi terasa seperti papan pengumuman pasar kaget di pinggir jalan, bukan
dashboard SaaS yang kebetulan gelap.

## Why the existing fonts stay

Bricolage Grotesque (display) + DM Sans (body) are already in place and
already distinctive — swapping in a third, "data label" monospace face would
just be reaching for the generic AI-signage cliché (mono for small labels) the
brief explicitly warns against. Instead, contrast comes from pushing the
*scale* gap harder: display type goes bigger and blacker where it leads a
screen (page `<h1>`), body/label type stays small and quiet. Two families,
used more decisively, beat three.

## Color — roles, not new values

| Role | Token | Hex | Used for |
|---|---|---|---|
| Dominant | `--background` | `#0D0F12` Asphalt Black | base surface everywhere |
| Primary accent | `--primary` | `#FF5A00` Safety Orange | CTAs, price, the one active state |
| Secondary accent | `--accent` | `#CCFF00` Electric Lime | trust/verification signals only — rating stars, "COD Aman", verified check |
| Neutral surface | `--surface` / `--surface-muted` | `#171A1F` / `#22262D` | cards, panels, dividers |
| Neutral text | `--foreground` | `#F4F5F0` Paper White | body text |

Lime was leaking into decorative use in a few places pre-redesign; this pass
tightens it back to *only* trust signals so it stays meaningful (a green tick
means something) instead of decorative.

## Layout rule: round vs. square is a signal, not a style

Round shapes are reserved for **touch affordances**: the search pill, the
primary "Jual" CTA, avatars, the radar signal ring. Everything that holds
*content* — cards, category tiles, badges, list rows — is hard-edged
(`rounded-none`, `border-2`), matching `ListingCard` and `brutalist-card`,
which already got this right. Before this pass, the mobile Beranda surface
(`CategoryHighlights`, `RecommendedCard`) had drifted into soft
`rounded-2xl` + gradient-wash tiles — the generic SaaS-card default — while
the desktop grid stayed on-brand. This pass brings mobile back in line with
the desktop language instead of inventing a third one.

No blur-shadow, no gradient washes as decoration. Elevation is the existing
hard 4px offset shadow (`brutalist-shadow` / `shadow-[4px_4px_0px_var(--x)]`)
only.

## Signature element: the radar ping

My COD's actual differentiator is distance-sorted discovery, not a logo mark.
The signature element makes that literal: a single radar-sweep ring
(`--animate-radar-ping`, new keyframe in `globals.css`) plays once around the
location pin when the feed's distance source resolves — not a looping
decoration, one orchestrated "we just found what's near you" moment. It
appears in exactly one place: the location status badge, now shown on mobile
too (previously desktop-only).

A secondary, much quieter motif — a 4px diagonal hazard-stripe bar
(`.hazard-edge`, safety-orange/asphalt, same visual grammar as the palette's
namesake) — marks exactly one structural seam (top of the mobile header)
instead of being sprinkled as decoration.

## Self-critique

- The uppercase-tracking-wide labels throughout could read as the generic
  "tracked-out eyebrow" tell — but here they're inherited from the existing
  stencil/signage identity (safety-orange + asphalt = hazard signage
  vernacular), not a decoration bolted onto a neutral template, so they stay.
  Trimmed where a label didn't earn its place (see `CategoryHighlights`).
- Considered adding icon-only numbered steps to the category rail — rejected,
  categories aren't a sequence, so numbering them would be the "01/02/03
  where nothing is a sequence" tell.
- The radar ping is the one place motion is allowed to be a little
  indulgent; everywhere else (hover, tap) motion stays a fast, functional
  100–200ms response, not a flourish.
