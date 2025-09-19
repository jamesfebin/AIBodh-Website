

## Comic Panel CLI
- Invoke `node comic-panel-cli.js <storyboard.md> [outputDir]` to turn a markdown storyboard into sequential SVG panels (two sprites per panel, no arrows or nameplates).
- Declare global defaults before the first panel as `key: value` lines (e.g. `panelWidth: 1024`, `spriteScale: 0.9`, `fontPath: assets/SpaceMono.ttf`, `spriteRoot: output`). The CLI auto-scans `<spriteRoot>/male` and `<spriteRoot>/female` for PNGs to build its catalogue.
- Each panel lives inside a fenced block that uses the `comic` info string. You may add a title after the info string, e.g. ```` ```comic Briefing ````.
- Inside the fence, write dialogue with tokens in the form `side_persona_expression: Text goes here`:
  - `side` is `left` or `right` (aliases `l`/`r` also work).
  - `persona` selects the catalogue: `guy`, `male`, `man`, `boy`, `dude`, `bro` map to the male sprites; `girl`, `female`, `woman`, `lady`, `gal` map to the female sprites.
  - `expression` matches the filename suffix. For example `output/male/male_smile.png` is addressed as `left_guy_smile`, while `output/female/female_angry.png` becomes `right_girl_angry`. Use underscores (or hyphens/spaces) for multi-word variants such as `left_guy_more-angry`.
- The first time a side token appears in a panel it chooses the sprite; subsequent lines for that side can swap to a different expression (the final sprite shown in the panel will match the last expression used on that side).
- Optional per-panel controls remain available via assignments inside the fence, e.g. `background = #ffffff` (default), `margin = 48`, `dialogue-area-height = 240`, `sprite-scale = 0.9`, `font-size = 30`, `font-color = #222`, `flip-right = false`, `flip-left = true`.
- Text renders in the Space Mono stack (`'Space Mono', monospace`) at a 34px default. Provide a global `fontPath:` to embed a local TTF directly into the SVG, or override `font-family` / `font-size` per panel for stylistic tweaks.
- Output files default to `panel-01.svg`, `panel-02.svg`, …. Override the suffix for downstream tooling with `outputExtension: panelsvg`.
- `comic-storyboard.sample.md` in the repo demonstrates the syntax, and `test_panels_markdown/` contains example output generated with the current sprite catalogue. If you add new sprites, drop them into the `spriteRoot` directories and reuse their filename suffix (e.g. `female_wink.png` → `right_girl_wink:`).
- Quick example:
  ````markdown
  ```comic Briefing
  left_guy_smile: Ready for the briefing?
  right_girl_angry: Only if you finally updated the sprites.
  left_guy_smile: All polished. Let's deploy.
  ```
  ````
  This yields a single panel with both characters facing inward (the right sprite auto-mirrors unless you disable it with `flip-right = false`).

### Sprite Catalogue (auto-verified)
The CLI scans `output/male` and `output/female` each run so the following emotion lists stay in sync with the actual sprite folders:

- **Male tokens:** `angry`, `anxious`, `laugh`, `more_angry`, `more_sand`, `sad`, `smile`, `surprised`
- **Female tokens:** `angry`, `anxious`, `laugh`, `sad`, `smile`, `surprised`

Use these values as the `expression` segment in your storyboard tokens, for example `left_guy_more_angry:` or `right_girl_laugh:`.
