# Diagram hints

Some Einbürgerungstest questions are not single facts — the answer only makes sense
inside a structure: who appoints whom, which chamber does what, what happened in
which order. For those questions the hint carries a **diagram** in addition to the
text hint.

## Data model

One diagram serves many questions. `src/data/diagrams.json` is an array of
concepts (`src/types.ts` → `Diagram`):

```json
{
  "key": "bundesrat-zusammensetzung",
  "type": "organigram",
  "titleDe": "Wer bildet den Bundesrat?",
  "titleEn": "Who forms the Bundesrat?",
  "altDe": "...", "altEn": "...",
  "aspect": "4:3",
  "file": "diagrams/bundesrat-zusammensetzung.png",
  "questionIds": [12, 45, 88],
  "prompt": "<generation prompt, kept so the image can be regenerated>"
}
```

`file` is relative to the Vite base (`public/diagrams/...` in the repo). An empty
`file` means the concept is specified but the image has not been generated yet;
`diagramHintHtml()` renders nothing in that case, so a half-finished set is safe to
ship.

The first concept listing a question id wins, so no card ever shows two diagrams.

## Rendering

`src/diagrams.ts` exposes:

- `diagramFor(questionId)` — the concept for a question, or `undefined`
- `diagramHintHtml(questionId, showEnglish)` — markup, or `''`
- `bindDiagramToggles(root)` — wires tap-to-enlarge; call after each re-render

Wired into the review hint box, the browse reveal panel, and the exam
wrong-answer list.

### Aspect ratio

The declared `aspect` is applied as a CSS `aspect-ratio` on the frame, which
reserves the box before the PNG loads so the card does not jump. The image is
`object-contain`, so a generated image whose real ratio drifts from the declared
one letterboxes instead of cropping.

The app is phone-only, so the allowed ratios are portrait/square — Instagram
shapes, nothing landscape. A wide diagram becomes an unreadable strip in a
~340 px card.

- `4:5` — default. Organigrams, flowcharts, comparisons
- `1:1` — compact set diagrams, venns, cycles
- `3:4` — slightly taller hierarchies
- `9:16` — vertical timelines (run the time axis top to bottom, never sideways)

Tapping the figure drops the ratio cap and lets the image grow to `75vh`, which is
how dense organigrams stay readable on a phone.

## Authoring the images

Diagrams are hand-authored SVG, one file per concept, following
the style guide below. SVG is what makes them work at card
size: exact aspect ratio, crisp text at any zoom, German label plus English
gloss on every node, a few KB each, and facts we control.

The workflow per concept is: write the spec (what the diagram must show), write
the SVG, then **rasterize and look at it** —

```bash
rsvg-convert -w 680 public/diagrams/<key>.svg -o /tmp/check.png
```

SVG does not wrap text, so an unverified diagram usually has a label hanging out
of its box. Never commit one that has not been rendered and inspected.

### Why not NotebookLM infographics

Tried and rejected. NotebookLM's infographic generator was asked twice, with an
explicit structural brief ("one flow chart, these boxes, these arrows, German
labels first, no poster"), and both times returned a decorative multi-panel
poster with English-only labels, clipart, and its own choice of aspect ratio
(16:9, then 1:1). It is a good study-poster generator and a poor diagram
generator: the structure is not controllable, which is exactly the part a
learner needs to be correct.

The path is documented here in case the feature improves. Driven through the
`notebooklm-mcp` server (`nlm login` first if auth is stale):

1. **Classify.** Decide which questions are structural and group them into
   concepts. Concept keys are stable; several questions share one.
2. **One source per concept.** Add a `text` source to the diagram notebook
   containing only the facts that diagram must show — node names, vote counts,
   dates, German term plus English gloss. NotebookLM is source-grounded, so the
   source is what keeps the picture factually correct.
3. **Generate** with `studio_create(artifact_type="infographic")`, passing
   `source_ids` for that one source so the image cannot drift into other topics,
   plus `orientation` derived from `aspect` and a `custom_prompt` built from the
   template below.
4. **Download** with `download_artifact(artifact_type="infographic")` into
   `public/diagrams/<key>.png` and set `file` in `diagrams.json`.

### Prompt template

```text
Draw ONE single diagram, not a multi-section poster. Type: <type> answering "<question>".

Content: <the concept spec — exact boxes, arrows, groups, dates, set members,
German label with the English gloss underneath>.

Design: clean, flat, minimal, high contrast, no photos, no decorative
illustration, very little prose. Labels are short German terms with the English
translation underneath in smaller, lighter text. Must stay legible at roughly
340 px wide on a phone screen. <orientation> composition, no stacked sections,
no header/footer banners, no logos.
```

NotebookLM can be wrong. Check every generated image against the source text
before committing it — a diagram hint that teaches the wrong structure is worse
than no diagram.
# Style guide

Every diagram in `public/diagrams/` is a hand-authored SVG. They are hint
illustrations inside a phone card, not posters: one idea, few words, big type.

## Canvas

Portrait or square only — the app is phone-only.

| aspect | viewBox | use |
| --- | --- | --- |
| `4:5` | `0 0 600 750` | default: organigrams, flowcharts, comparisons |
| `1:1` | `0 0 600 600` | compact sets, venns, cycles |
| `3:4` | `0 0 600 800` | taller hierarchies |
| `9:16` | `0 0 600 1067` | vertical timelines only |

The card renders the SVG at roughly 340 CSS px wide, so a 600-unit viewBox is
displayed at 0.57×. That is the number to keep in mind for every size below.

## Type

- Font stack: `font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"`
- German label: `font-size="22"` `font-weight="600"` — the primary text, always first
- English gloss: `font-size="15"` `fill="#64748b"` — directly under its German label
- Diagram title: `font-size="26"` `font-weight="700"`, top-left, German only
- Numbers/annotations: `font-size="18"`
- Never smaller than 15. Never rotated text. Never text inside a shape it
  overflows — SVG does not wrap, so split long labels into multiple `<text>`
  lines with `<tspan x="..." dy="1.15em">`.
- At most ~22 text lines in the whole diagram. If it needs more, the concept is
  too big: cut detail, do not shrink type.

## Colour

Fixed palette, light background (the card frame paints white behind it):

```
ink      #0f172a   text, strokes
muted    #64748b   English gloss, secondary strokes
line     #cbd5e1   light rules, grid
paper    #ffffff   background
box      #f1f5f9   neutral node fill
accent   #2563eb   the thing the question is about
accent2  #dc2626   contrast/"not this" side
good     #16a34a   outcome/result nodes
warn     #d97706   third category when two are not enough
```

- Paint an explicit `<rect width="100%" height="100%" fill="#ffffff"/>` first.
  The card sits on a white frame, so the diagram must not rely on page colours.
- Use `accent` for the node the answer sits on. One accent per diagram.
- Do not use colour as the only carrier of meaning — label it too.

## Shapes

- Nodes: `<rect rx="10">` with `fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"`
- Arrows: `stroke="#0f172a" stroke-width="2.5"` plus a shared marker:
  ```xml
  <defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6"
    markerHeight="6" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#0f172a"/></marker></defs>
  ```
  then `marker-end="url(#a)"`.
- No gradients, no shadows, no icons, no clipart, no 3D, no photographs.
- Flow reads top to bottom. Timelines run top to bottom, never sideways.

## Content rules

- German term first, English gloss underneath. Every single label.
- Facts must be correct and must match the concept's source text. A diagram that
  teaches the wrong structure is worse than no diagram.
- Show the structure the question turns on — not everything known about the topic.
- Add `<title>` as the first child of the `<svg>`: the German alt text.

## Verifying

Rasterize at real card width and look at it:

```bash
rsvg-convert -w 340 public/diagrams/<key>.svg -o /tmp/check.png
```

Open the PNG. If a label is unreadable, collides, or overflows its box, fix the
SVG — do not ship it. Also check it at `-w 900` (the tap-to-enlarge size).
