# adam-portfolio

Single-page personal portfolio for Adam Atienza — Computer Engineer.
Plain HTML, CSS, and JavaScript. No frameworks, no build step.

## Run it

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

Then visit http://localhost:8000

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All markup — hero, about, projects, skills, contact |
| `style.css` | Dark theme, design tokens in `:root`, responsive layout |
| `script.js` | Mobile nav, sticky header, scrollspy, reveal-on-scroll |
| `assets/Adam-Atienza-Resume.pdf` | Linked from the Contact section |

## Updating the resume

Replace `assets/Adam-Atienza-Resume.pdf` in place — keep the filename and the
link in `index.html` keeps working.

## Before publishing

- [ ] Add "VS Code" to the resume's Tools line — the site lists both VS Code and
      Visual Studio, the resume currently lists only Visual Studio
- [ ] Swap the accent color if desired — change `--accent`, `--accent-dim`,
      `--accent-soft`, and `--accent-line` at the top of `style.css`
