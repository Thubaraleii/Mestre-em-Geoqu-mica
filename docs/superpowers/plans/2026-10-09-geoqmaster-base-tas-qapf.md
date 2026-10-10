# GeoQMaster Base + TAS + QAPF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app (Vite + TypeScript) that plots user-supplied geochemical/modal samples on TAS, QAPF plutonic and QAPF volcanic diagrams and classifies each sample automatically.

**Architecture:** A diagram is a declarative `DiagramDef` (axes, named polygon fields, input function). One SVG renderer draws it and one classifier (point-in-polygon on the same fields) names samples, so plot and classification cannot diverge. Data panel parses pasted/imported tables, maps columns, and feeds the active diagram. No backend.

**Tech Stack:** Vite, TypeScript, Vitest, SheetJS (`xlsx`) for .xlsx import, vanilla DOM + SVG. No UI framework.

**Spec:** `docs/superpowers/specs/2026-10-09-geoqmaster-base-tas-qapf-design.md`

## Global Constraints

- Vite + TypeScript, no UI framework, own SVG rendering; static output deployable to GitHub Pages; runs 100% in the browser.
- One file per diagram in `src/diagrams/`, registered in `src/diagrams/index.ts`.
- Boundary rule: lower bound inclusive; a point exactly on a fronteira is flagged "no limite".
- QAPF with Q > 0 and F > 0 is invalid (warning, not plotted).
- Missing/negative values or zero sum: sample flagged, not plotted. Outside domain: flagged "fora do campo".
- TAS: SiO2 on X (about 41-77), Na2O+K2O on Y (0-16); anhydrous normalisation to 100%; optional total-iron conversion.
- Persistence: autosave in `localStorage`; project file `.json`.
- Polygons are transcribed from Le Bas et al. 1986 / Le Maitre 2002 (TAS) and Streckeisen 1976 / Le Maitre 2002 (QAPF) and checked against them.
- UI language: Portuguese (pt-BR).

## Review Focus

- Pasted data with decimal commas ("49,5") and thousands/blank cells: parsed as numbers, blanks flagged missing.
- Header variants (`SiO2 (wt%)`, `sio2_wt`, `SiO2 %`) detected as SiO2.
- Oxide sums far from 100 (e.g. 0 or 1.0 fractions): normalisation must not divide by zero or silently plot nonsense.
- QAPF rows where Q+A+P is 0 or all four are 0.
- Empty table / one-row table / 5,000 rows: no crash, acceptable render time.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `.gitignore`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` (Vitest, jsdom environment).

- [ ] **Step 1:** `git init`; create the Vite vanilla-ts project files by hand in this folder (do not generate into a subfolder); add `vitest`, `jsdom`, `xlsx`. Set `base: './'` in `vite.config.ts` for Pages.
- [ ] **Step 2: Write failing test** `tests/smoke.test.ts`: `expect(document.createElementNS('http://www.w3.org/2000/svg','svg')).toBeTruthy()`.
- [ ] **Step 3:** Run `npm test` → PASS after config is correct (verifies jsdom works).
- [ ] **Step 4:** Run `npm run build` → completes with no errors.
- [ ] **Step 5: Commit** `chore: scaffold vite + ts + vitest`

### Task 2: Geometry

**Files:**
- Create: `src/core/geometry.ts`; Test: `tests/geometry.test.ts`

**Interfaces:**
- Produces:
  - `type Pt = [number, number]`
  - `pointInPolygon(p: Pt, poly: Pt[]): 'inside' | 'edge' | 'outside'`
  - `ternaryXY(a: number, b: number, c: number): Pt` — a at top vertex, b at bottom-left, c at bottom-right, inputs renormalised to sum 1, unit-height-independent triangle with base width 1.

- [ ] **Step 1: Tests:** unit square: `[0.5,0.5]`→inside, `[1,0.5]`→edge, `[0,0]`→edge (vertex), `[2,2]`→outside; concave L-shape inside/outside cases; `ternaryXY(1,0,0)` is apex, `ternaryXY(0,1,0)` bottom-left, `ternaryXY(0,0,1)` bottom-right, `ternaryXY(1,1,1)` equals centroid.
- [ ] **Step 2:** Run → FAIL (not defined).
- [ ] **Step 3:** Implement both; edge detection uses a small epsilon (1e-9).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(core): geometry helpers`

### Task 3: DiagramDef and classifier

**Files:**
- Create: `src/core/types.ts`, `src/core/classify.ts`; Test: `tests/classify.test.ts`

**Interfaces:**
- Consumes: `pointInPolygon`, `Pt`.
- Produces in `types.ts`:
  - `type Row = Record<string, number | string | null>`
  - `interface Field { id: string; name: string; polygon: Pt[]; color: string; panel?: string }`
  - `interface Panel { id: string; xLabel?: string; yLabel?: string; type: 'cartesian' | 'ternary'; xRange?: Pt; yRange?: Pt; corners?: [string,string,string] }`
  - `interface DiagramDef { id: string; area: string; title: string; panels: Panel[]; fields: Field[]; requiredColumns: string[][]; toPoint(row: Row, opts: Record<string, boolean>): PointResult }`
  - `type PointResult = { ok: true; panel: string; xy: Pt } | { ok: false; reason: 'ausente' | 'invalido' | 'fora do campo' ; message: string }`
  - `interface Classification { status: 'ok' | 'no limite' | 'fora do campo' | 'ausente' | 'invalido'; fieldId?: string; name?: string; panel?: string; xy?: Pt; message?: string }`
- Produces in `classify.ts`: `classifyRow(def: DiagramDef, row: Row, opts?: Record<string, boolean>): Classification`. Fields are tested in order within the sample's panel; an `edge` hit gives `status: 'no limite'` with the field whose lower bound includes the point (first matching field in declaration order).

- [ ] **Step 1: Tests** with a toy two-field `DiagramDef` (two adjacent squares): interior point → ok + field name; shared edge → `no limite` and the first-declared field; outside → `fora do campo`; `toPoint` returning not-ok propagates its reason.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(core): DiagramDef types and classifier`

### Task 4: TAS diagram

**Files:**
- Create: `src/diagrams/tas.ts`, `src/diagrams/index.ts` (registry: `export const diagrams: DiagramDef[]`, `getDiagram(id)`); Test: `tests/tas.test.ts`

**Interfaces:**
- Consumes: `DiagramDef`, `classifyRow`.
- Produces: `tas: DiagramDef` with `id: 'tas'`, `area: 'igneas'`; columns `SiO2`, `Na2O`, `K2O` (and optional `FeOt`/`Fe2O3` + others for `opts.anidro`, `opts.ferro`). Optional overlay lines (Irvine & Baragar alkaline/subalcalina; Middlemost plutonic variant) exposed as `extraLines` on the def and toggled in the UI later.

- [ ] **Step 1: Tests** (classification by `classifyRow(tas, {SiO2, Na2O, K2O})`, K2O=0 and Na2O the alkali total): (43,1)→Picrobasalto; (48,2)→Basalto; (54,2)→Andesito basáltico; (60,3)→Andesito; (66,2)→Dacito; (75,8)→Riolito; (48,6)→Traquibasalto; (43,10)→Foidito. Also: SiO2 below 41 or above 77 → `fora do campo`; missing Na2O → `ausente`; negative value → `invalido`; oxide sum 0 with `anidro` on → `invalido` (no NaN).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Transcribe the 15 field polygons from Le Maitre 2002 (Fig. 2.4 TAS) into `tas.ts`, with the citation in a header comment. Add a grid-coverage test: sample the domain on a 0.1 grid; every point must fall in at least one field, and interior points in at most one.
- [ ] **Step 4:** Run → PASS (fix polygon data until the coverage test passes; do not loosen the test).
- [ ] **Step 5: Commit** `feat(diagrams): TAS`

### Task 5: QAPF plutonic and volcanic

**Files:**
- Create: `src/diagrams/qapf-plutonic.ts`, `src/diagrams/qapf-volcanic.ts`; Modify: `src/diagrams/index.ts`; Test: `tests/qapf.test.ts`

**Interfaces:**
- Produces: `qapfPlutonic`, `qapfVolcanic: DiagramDef` (`id: 'qapf-plutonica'`, `'qapf-vulcanica'`). Two panels: `qap` (Q top, A bottom-left, P bottom-right) and `apf` (F bottom, A top-left, P top-right), drawn as the stacked double triangle. Columns `Q`, `A`, `P`, `F`. `toPoint`: if Q>0 and F>0 → invalid; if F>0 use `apf` else `qap`; renormalise the three relevant values to 100; A+P+Q (or A+P+F) = 0 → invalid.

- [ ] **Step 1: Tests:** (Q,A,P,F) = (30,35,35,0) → Granito (plutonic) / Riolito (volcanic); (10,45,45,0) → Quartzo monzonito (field 8*, A/(A+P)=50) / Quartzo traquito (volcanic); (0,45,45,10) → Foid-monzosienito (field 11) / Fonolito-traquito-foide equivalent on the volcanic diagram, names taken from Le Maitre 2002; (0,5,95,0) → Diorito/Gabro/Anortosito (field 10) / Andesito-Basalto (volcanic); Q=10,F=10 → `invalido`; all zero → `invalido`; row with only Q,A and P blank → `ausente`; a point exactly on the A/(A+P)=35 line → `no limite`. Add the same grid-coverage test per panel.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Transcribe field polygons (numbered fields with names, Le Maitre 2002 Fig. 2.2 and 2.11 for volcanic) using the standard boundaries (Q at 5/20/60/90, A/(A+P) at 10/35/65/90, F at 10/60) via `ternaryXY`, stacked into one coordinate system.
- [ ] **Step 4:** Run → PASS. **Step 5: Commit** `feat(diagrams): QAPF plutonic and volcanic`

### Task 6: SVG renderer

**Files:**
- Create: `src/core/render.ts`; Test: `tests/render.test.ts`

**Interfaces:**
- Consumes: `DiagramDef`, `Classification`.
- Produces: `renderDiagram(def: DiagramDef, points: PlotPoint[], opts?: { width?: number; height?: number; showLabels?: boolean }): SVGSVGElement` where `PlotPoint = { id: string; label: string; xy: Pt; panel: string; group?: string; classification: string }`. Draws axes/ticks (cartesian) or triangle edges + tick labels (ternary), filled field polygons with name labels, then points (colour/symbol by `group`) with `<title>` hover text "label — classification".

- [ ] **Step 1: Tests (jsdom):** TAS render contains 15 field `<path>`s and axis labels "SiO2" / "Na2O+K2O"; 3 points produce 3 point elements each with the right `<title>`; zero points renders without throwing; points outside the viewBox are clamped or skipped, never `NaN` attributes.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(core): SVG renderer`

### Task 7: Data parsing, column detection, store

**Files:**
- Create: `src/data/parse.ts`, `src/data/columns.ts`, `src/data/store.ts`; Test: `tests/data.test.ts`

**Interfaces:**
- Produces:
  - `parseText(text: string): { headers: string[]; rows: Row[] }` — detects tab/semicolon/comma delimiter; decimal comma → number; blank → `null`.
  - `parseXlsx(buf: ArrayBuffer): { headers: string[]; rows: Row[] }`
  - `detectColumns(headers: string[], required: string[][]): Record<string, string | null>` — normalises case, spaces, units suffixes (`wt`, `%`, `(wt%)`), underscores; maps canonical name (`SiO2`) to the actual header or `null`.
  - `store`: `saveProject(p: Project): void`, `loadProject(): Project | null`, `exportProject(p): string`, `importProject(json: string): Project` where `Project = { rows: Row[]; headers: string[]; mapping: Record<string,string>; groupColumn?: string; diagramId: string }`. All `localStorage` access wrapped in try/catch.

- [ ] **Step 1: Tests:** tab-separated paste with decimal commas; semicolon CSV; `"SiO2 (wt%)"`, `sio2_wt`, `SiO2 %` all map to `SiO2`; missing `K2O` → `null`; blank cell → `null`; export→import round trip equals original; `loadProject` returns `null` when `localStorage` throws.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat(data): parsing, column detection, store`

### Task 8: UI shell

**Files:**
- Create: `src/ui/menu.ts`, `src/ui/dataPanel.ts`, `src/ui/chartPanel.ts`, `src/ui/app.ts`, `src/ui/styles.css`; Modify: `src/main.ts`, `index.html`; Test: `tests/ui.test.ts`

**Interfaces:**
- Consumes: registry, `classifyRow`, `renderDiagram`, parse/columns/store.
- Produces: `menuTree` in `menu.ts` containing every area and module from the spec's list (Ígnea, Sedimentar, Metamórfica, Estrutural, Estratigrafia e Geocronologia, Cartografia, Descrição e estimativa visual); entries with a registered diagram are active, others rendered disabled with "em breve". `mountApp(root: HTMLElement): void`.

- [ ] **Step 1: Tests (jsdom):** menu lists all 7 areas; TAS, QAPF plutônica, QAPF vulcânica are enabled and "Diagrama QAPF" siblings not yet built are disabled; pasting a 3-row TAS table into the data textarea results in 3 points in the chart and a "Classificação" column filled; a row with missing K2O shows "ausente" and no point; changing the group column changes point colours; reload (mount again) restores rows from `localStorage`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement: left tree menu, centre chart, data table (editable cells, add/remove row), paste/import controls, column-mapping selectors shown when detection returns `null`, options checkboxes (`anidro`, `ferro`, overlays). **Step 4:** Run → PASS.
- [ ] **Step 5:** Manual check: `npm run dev`, paste `samples/tas-exemplo.csv` (Task 9) and confirm plot visually.
- [ ] **Step 6: Commit** `feat(ui): app shell, menu, data and chart panels`

### Task 9: Exports, samples, docs, deploy

**Files:**
- Create: `src/core/export.ts`, `samples/tas-exemplo.csv`, `samples/qapf-exemplo.csv`, `docs/adicionar-diagrama.md`, `README.md`, `.github/workflows/pages.yml`; Modify: `src/ui/app.ts`; Test: `tests/export.test.ts`

**Interfaces:**
- Produces: `svgToString(svg: SVGSVGElement): string`, `svgToPngBlob(svg: SVGSVGElement, scale?: number): Promise<Blob>`, `rowsToCsv(rows: Row[], classifications: Classification[]): string` (appends `Classificação` and `Status` columns, `;`-safe quoting).

- [ ] **Step 1: Tests:** `svgToString` output parses back as SVG with an xmlns; `rowsToCsv` quotes cells containing `;` or `"` and has the extra columns; header-only input yields header-only CSV.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement and add export buttons (SVG, PNG, CSV, projeto .json import/export). **Step 4:** Run → PASS.
- [ ] **Step 5:** Write the two sample CSVs (at least one sample per TAS field and per main QAPF field, plus one deliberately invalid row each), `docs/adicionar-diagrama.md` (worked example: create file, export `DiagramDef`, register in `index.ts`, add tests) and README (run, test, deploy). Pages workflow: build on push to `main`, publish `dist/`.
- [ ] **Step 6:** Run `npm test` and `npm run build` → all green. **Step 7: Commit** `feat: exports, samples, docs, pages deploy`
