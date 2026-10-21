# Contrast audit (issue #18, part 1)

Thresholds: 4.5:1 body text, 3:1 for 24px+ text and for topic marks (non-text UI).
Page `#F6F3EA`; surface `#FFFDF7`.

Tools:
- **calc**: WCAG 2.1 relative-luminance formula (script, hex in, ratio out). Opacity is composited over the real background before measuring.
- **axe**: axe-core 4.10.2 `color-contrast` rule, run in the rendered app (puppeteer, 390x844) on `#/`, `#/review`, `#/berlin`, `#/exam`, `#/browse`, plus review per topic with the English helper on. axe skips disabled controls and reports some pairs as "incomplete" (background image or opacity), so calc covers those.

Real foregrounds differ from the issue text: the English helper line is `.question-head-sub` (the topic sub colour), and disabled Good text is DaisyUI's `base-content` at 20% on `base-content` at 10% over the page, not `#D6D1C4`.

## Results

| Pair | Size / role | Threshold | Before | After | Result |
|---|---|---|---|---|---|
| muted on page | 12-14px body/meta | 4.5 | 5.34 | 6.04 | pass |
| muted on base-200 (#E8DFCF) | secondary surface text | 4.5 | 4.48 | 5.07 | pass |
| faded on page | 17px answer text (is-faded) | 4.5 | 3.71 | 4.80 | pass |
| correct #0B4A42 on page | 17px semibold answer | 4.5 | 9.13 | 9.13 | pass |
| wrong #A8442A on page | 17px answer (+strikethrough) | 4.5 | 5.37 | 5.37 | pass |
| Politik ink on fill | band/header text | 4.5 | 4.87 | 6.26 | pass |
| Politik sub on fill (= English helper line, "no. / short" meta) | 12-16px | 4.5 | 3.79 | 4.88 | pass |
| Politik ink@80% on fill (home band waiting label) | 11px | 4.5 | 3.71 | 4.60 | pass |
| Politik mark on page | non-text UI (size-2 square) | 3 | 4.46 | 5.73 | pass |
| Geschichte ink on fill | band/header text | 4.5 | 9.96 | 9.96 | pass |
| Geschichte sub on fill (= English helper line, "no. / short" meta) | 12-16px | 4.5 | 6.74 | 6.74 | pass |
| Geschichte ink@80% on fill (home band waiting label) | 11px | 4.5 | 6.99 | 6.99 | pass |
| Geschichte mark on page | non-text UI (size-2 square) | 3 | 9.13 | 9.13 | pass |
| Gesellschaft ink on fill | band/header text | 4.5 | 12.60 | 12.60 | pass |
| Gesellschaft sub on fill (= English helper line, "no. / short" meta) | 12-16px | 4.5 | 7.26 | 7.26 | pass |
| Gesellschaft ink@80% on fill (home band waiting label) | 11px | 4.5 | 7.63 | 7.63 | pass |
| Gesellschaft mark on page | non-text UI (size-2 square) | 3 | 2.21 | 3.84 | pass |
| Berlin ink on fill | band/header text | 4.5 | 8.64 | 8.64 | pass |
| Berlin sub on fill (= English helper line, "no. / short" meta) | 12-16px | 4.5 | 5.79 | 5.79 | pass |
| Berlin ink@80% on fill (home band waiting label) | 11px | 4.5 | 5.84 | 5.84 | pass |
| Berlin mark on page | non-text UI (size-2 square) | 3 | 1.89 | 3.61 | pass |
| Disabled Good label (ink 20% on ink 10% over page = #b8b5ae on #e0ddd5) | 16px, disabled control (WCAG-exempt) | 4.5 | 1.51 | 1.51 | exempt |
| Disabled Good sub-label (opacity .7 more: #c4c1ba) | 11px, disabled | 4.5 | 1.32 | 1.32 | exempt |
| Issue's literal pair: ink #161614 on #D6D1C4 | n/a (not the real bg) | 4.5 | 11.89 | - | n/a |
| Footer copyright (ink @ .6 x .7 = .42 on page; after: .7) | 12px | 4.5 | 2.67 | 6.39 | pass |
| Browse table head (daisy 60% ink mix on base-200; after: muted) | 14px bold | 4.5 | 4.32 | 5.07 | pass |

All rows measured with calc; axe confirms the topic, muted and faded rows (axe results below).

## Token changes (src/styles.css)

| Token | Before | After | Why |
|---|---|---|---|
| `--color-muted` | `#66645C` | `#5E5C54` | 4.48 on base-200 (axe saw 4.31 in table heads); now 5.07 |
| `--color-faded` | `#807D74` | `#6E6B62` | 3.71 on page for 17px answer text; now 4.80 |
| `.topic-politik --topic` | `#B5532F` | `#A24028` | sub 3.79 and ink@80% 3.71 on the fill; sub colour kept, fill darkened |
| `.topic-politik --topic-mark` | `#B5532F` | `#A24028` | follows the fill |
| `.topic-gesellschaft --topic-mark` | `#B898DB` | `#9068C0` | 2.21 on page (needs 3) |
| `.topic-berlin --topic-mark` | `#F5A04A` | `#C2670F` | 1.89 on page (needs 3) |

## axe-core violating nodes (color-contrast), 390x844

| Route / state | Before | After |
|---|---|---|
| `#/` | 2 | 1 |
| `#/review` (initial, helper on, answered) | 1 / 2 / 2 | 0 / 0 / 0 |
| `#/berlin` (initial, helper on, answered) | 0 / 0 / 0 | 0 / 0 / 0 |
| `#/exam` (list, started) | 0 / 0 | 0 / 0 |
| `#/browse` | 3 | 3 |
| review per topic with helper on (politik, geschichte, gesellschaft, berlin) | politik failed | 0 each |

After the footer and table-head fixes below, a re-run of axe-core 4.10.2 at 390x844 reports **0** color-contrast violations on `#/`, `#/review`, `#/berlin`, `#/exam`, `#/browse`, `#/memory` and `#/stats`.

## Fixed outside the tokens

- Footer copyright (`src/lib/footer.ts`): dropped `opacity-60` on the `<p>`, which sat inside an `opacity-70` footer. 2.67 → 6.39 (calc).
- Browse table head: `text-muted` on the `<thead>` in `src/views/browse.ts` (a plain CSS rule loses to DaisyUI's layer). 4.32 → 5.07 (calc); axe now 0 on every route.

## Notes

- Disabled Good (1.51:1) is exempt under WCAG 1.4.3 (inactive components) and is not a pass/fail pair.
- Dark mode is not covered: the owner decided against a dark theme (issue #18).
