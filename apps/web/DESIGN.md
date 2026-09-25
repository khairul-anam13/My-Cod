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

## v3 — Site-wide spacing & layout system

v2 redesigned the shell + Explore. This pass extends the same rules to every
remaining page — the point is one consistent system, not per-page taste.

**Gap scale, by relationship (not vibes):**

| Relationship | Gap | Example |
|---|---|---|
| Icon + label inside one control | `gap-1.5`–`gap-2` | badge, nav item |
| Distinct controls of different weight, same cluster | `gap-3` (never `gap-2`) | primary CTA next to a ghost icon button |
| Form field → its input | `gap-1.5` | `<Label>` to `<Input>` |
| Field stack → next field stack | `gap-5` | two `<Label>+<Input>` pairs |
| Major sections on a page | `gap-6`–`gap-8` | hero → content → footer actions |

A cluster of unrelated interactive controls at `gap-2` was the concrete bug
that started this pass (`DesktopHeader`'s Jual/chat/account group) — same
gap as an icon hugging its own label, so a filled CTA read as glued to the
ghost button next to it. Fixed there; audited for the same mistake
everywhere else a `flex` groups multiple controls.

**Hard edges everywhere, still.** v2 called this out for cards but a few
pages (profile edit, forms) had already shipped with `rounded-xl`/`rounded-2xl`
soft panels before the brutalist language was established — this pass
converts those to `border-2 border-border` + `rounded-none`, matching
`ListingCard`. Chat bubbles are the one deliberate exception (rounded is the
correct, legible convention for a message bubble; brutalist-everything would
just be dogma over usability there).

**Buttons.** `variant="brutalist"` for the one primary action per screen
(hard shadow, filled orange) — several forms had fallen back to the
unstyled `default` button variant pre-redesign; unified to `brutalist` for
primary submits, `outline` for secondary, `ghost` for tertiary/dismiss,
matching what `ListingForm`/`BottomNav` already did correctly.

**Section rhythm over margin soup.** Prefer a parent `flex flex-col gap-N`
over sibling `mt-3`/`mt-4`/`mt-5` sprinkled ad hoc — one declared gap reads
as "this is one rhythm," scattered margins read as accumulated patches
(which several pages literally were, from iterative feature additions this
project went through).

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
