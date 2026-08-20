# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page personal portfolio for Adam Atienza — Computer Engineer, UW Bothell
BS Computer Engineering (June 2025), background in embedded systems and software.

## Tech stack

Plain HTML, CSS, and JavaScript. **No frameworks, no build tools, no package
manager, no bundler.** There is no `package.json` and none should be added
without the owner asking. Edit a file, refresh the browser.

The only external dependency is Google Fonts (Inter + JetBrains Mono) loaded via
`<link>` in the head. Everything else is local.

## Commands

There is no build, lint, or test tooling — no test suite exists.

Serve locally (needed for the resume `download` link to behave correctly;
`file://` opens the PDF in a tab instead of saving):

```
python -m http.server 8000
```

Verification is visual — serve, open http://localhost:8000, and check both a
desktop width and a narrow mobile width.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All markup — hero, about, projects, skills, contact |
| `style.css` | Design tokens, layout, responsive rules |
| `script.js` | Mobile nav, header state, scrollspy, reveal-on-scroll |
| `assets/Adam-Atienza-Resume.pdf` | Linked from Contact; replace in place, keep the filename |
| `assets/drive-by-wire.jpg` | Capstone hardware photo, used by the featured project |
| `assets/adam-atienza.jpg` | Portrait in the About sidebar |
| `assets/og-card.png` | 1200×630 social card; renamed on change, see Deploying |

Keep it to these three source files. The owner asked for exactly this structure
for simplicity — resist splitting into partials or modules.

## Design direction

Dark theme, clean modern typography, **minimal color accent**. The restraint is
the point: one accent color, used sparingly.

- All color lives in CSS custom properties at the top of `style.css` under
  `:root`. Never hardcode a hex value in a rule — add or reuse a token.
- Surfaces: `--bg` → `--bg-elev` → `--bg-elev-2`, borders `--border` /
  `--border-strong`. Text: `--text` → `--text-muted` → `--text-dim`.
- The accent is four tokens (`--accent`, `--accent-dim`, `--accent-soft`,
  `--accent-line`); recoloring the whole site means editing only those. It is
  reserved for section numbers, icon tiles, active nav, tags on hover, and the
  single primary button. Adding more accent surfaces works against the design.
- Inter for prose; JetBrains Mono only for small labels, tags, badges, and
  section numbers.
- Mobile-first. Base styles are the narrow layout; `min-width` queries widen it.

## Architecture notes

These are the couplings that aren't visible from any single file:

**Reveal animation contract.** Any element with class `reveal` starts hidden and
gets `is-visible` added by an IntersectionObserver in `script.js`. Add `reveal`
to new content and the entrance animation works automatically. Do not build a
separate animation path — the observer also handles the `prefers-reduced-motion`
case by marking everything visible immediately, and hand-rolled animation would
skip that.

**Scrollspy derives its sections from the nav.** `script.js` reads every
`.nav-link` href and observes the matching element. A new section needs both an
`id` and a nav link pointing at it, or it will never highlight.

**Layout constants come from CSS tokens.** `script.js` reads `--header-h` and
`--nav-breakpoint` via `cssNumber()` at startup and derives the scrollspy
`rootMargin` and the anchor-scroll offset from them. Change the token, not the
JS. The one place this can still drift is the `@media (max-width: 767px)` block
— media queries can't consume custom properties, so that literal must be kept
one below `--nav-breakpoint` by hand.

**Stagger delays read `--i` from each card.** `.project-grid` and `.skills-grid`
children compute `transition-delay: calc(var(--i, 0) * 0.08s)`. A new card needs
`style="--i: N"` on it; without one it defaults to 0 and reveals immediately.

**Adding a project card** means: `--i` for the stagger, plus `reveal` for the
entrance animation. Both are inline on the existing cards — copy one. Note the
Projects section is a **featured article plus a four-card grid**: the capstone
sits above the grid at full width with its photo. Five cards in the plain grid
would leave a hole in the 2×2, which is why it's built this way.

**The hero oscilloscope** (`#scope`, drawn in `script.js`) is decorative: the
canvas is `aria-hidden`, `pointer-events: none`, and carries no information. It
cycles three signal shapes — sine, ~30% duty PWM, serial packet burst — with a
swept beam. It stops its rAF loop when scrolled out of view or the tab is
hidden, and under `prefers-reduced-motion` it paints a single static frame
instead of animating. Keep all three of those behaviors if you touch it.

## Content rules

**Content must stay consistent with the owner's resume. Do not invent projects,
experience, skills, employers, dates, or metrics.**

`assets/Adam-Atienza-Resume.pdf` is the source of truth. If asked to add or
expand content, check it against the resume first; if something isn't there,
ask rather than filling the gap plausibly. This is a job-search site — invented
detail is a real liability, not a rough edge.

Reading the PDF: it stores text as subset glyph IDs, not plain strings. Decoding
requires mapping hex glyph codes back through a `+0x1D` ASCII offset; a naive
text extraction returns embedded font binary instead.

The site's Tools list deliberately includes both "VS Code" and "Visual Studio" —
the owner uses both, for different work. The resume currently lists only Visual
Studio; closing that gap is the owner's call. Don't "fix" the site by dropping
one to match.

The About section is now built from the owner's own resume summary — treat that
wording as his, not filler. The **hero intro line** is still Claude's draft and
may be rewritten at any time.

Skills beyond the resume: "HTML / CSS / JavaScript / Claude Code / Agentic
Coding" were added by the owner's explicit request, from building this site.
Everything else in Skills traces to the resume.

**The hero badge reads "Available for new opportunities."** It is accurate as of
August 2026. It becomes actively misleading the moment that changes, so check it
whenever the site is touched — nobody thinks to edit it otherwise.

**The project cards have no repository links.** This is a known gap, not an
oversight to fill in: the owner has not said which projects have public repos.
Don't invent URLs.

## Deploying

The site is live at `https://adamatienza.github.io/`, served by GitHub Pages from
`main` at the repo root. There is no build step: pushing to `main` *is* the
deploy, and Pages rebuilds within a minute or two.

**Rename the social card whenever its contents change**, to a filename no
platform has fetched before. LinkedIn, Facebook and Slack cache the preview
image against its URL, so replacing the bytes at an existing path leaves them
serving the old card indefinitely — re-running LinkedIn's Post Inspector
refreshes the *page* metadata but not the image. Note this rules out reusing a
previously-published name such as `og-preview.png`, which already has a stale
copy cached against it. Update the `og:image` tag to match.
