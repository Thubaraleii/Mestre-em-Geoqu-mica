import { classifyRow } from '../core/classify';
import { rowsToCsv, svgToPngBlob, svgToString } from '../core/export';
import { clientToDiagram, renderDiagram, type PlotPoint } from '../core/render';
import type { Classification, DiagramDef, Row } from '../core/types';
import { detectColumns, detectSpecial } from '../data/columns';
import { parseCell, parseText, parseXlsx, type Table } from '../data/parse';
import { exportProject, importProject, loadProject, saveProject, type Project } from '../data/store';
import { diagrams, getDiagram } from '../diagrams';
import tasSample from '../../samples/tas-exemplo.csv?raw';
import qapfSample from '../../samples/qapf-exemplo.csv?raw';
import peateSample from '../../samples/peate-exemplo.csv?raw';
import { menuTree, renderMenu } from './menu';
import { renderPeateView } from './peateView';
import './styles.css';

const MAX_TABLE_ROWS = 500;

type Attrs = Record<string, string | boolean | number | undefined>;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') e.className = String(v);
    else if (typeof v === 'boolean' && k in e) (e as unknown as Record<string, unknown>)[k] = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  e.append(...kids);
  return e;
}

function download(name: string, blob: Blob): void {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function mountApp(root: HTMLElement): void {
  root.innerHTML = '';
  const saved = loadProject();
  const state: Project = saved && getDiagram(saved.diagramId)
    ? { ...saved, options: saved.options ?? {} }
    : { rows: [], headers: [], mapping: {}, diagramId: diagrams[0].id, options: {} };

  // ---------- derivados ----------
  const def = (): DiagramDef => getDiagram(state.diagramId) ?? diagrams[0];
  const columnNames = (d: DiagramDef) => [...d.requiredColumns, ...(d.optionalColumns ?? [])];
  const mapped = (canon: string): string | null => {
    const m = state.mapping[canon];
    if (m !== undefined) return m || null;
    return detectColumns(state.headers, columnNames(def()))[canon] ?? null;
  };
  /** opções efetivas: padrão do módulo + escolha do usuário */
  const opts = (): Record<string, boolean> => ({ ...def().defaultOptions, ...state.options });
  const labelCol = (): string | null => (state.labelColumn !== undefined ? state.labelColumn || null : detectSpecial(state.headers).label);
  const groupCol = (): string | null => (state.groupColumn !== undefined ? state.groupColumn || null : detectSpecial(state.headers).group);

  /** mapeamento canônico -> coluna, calculado uma vez por atualização (não por linha) */
  function columnMap(): [string, string | null][] {
    return columnNames(def()).flat().map((c) => [c, mapped(c)]);
  }

  function canonRow(row: Row, cols: [string, string | null][]): Row {
    const out: Row = {};
    for (const [c, col] of cols) out[c] = col ? (row[col] ?? null) : null;
    return out;
  }

  function compute(): { classes: Classification[]; points: PlotPoint[] } {
    const d = def();
    const cols = columnMap();
    const o = opts();
    const classes = state.rows.map((r) => classifyRow(d, canonRow(r, cols), o));
    const lc = labelCol(), gc = groupCol();
    const points: PlotPoint[] = [];
    classes.forEach((c, i) => {
      if (!c.xy || !c.panel) return;
      const lab = lc ? state.rows[i][lc] : null;
      const grp = gc ? state.rows[i][gc] : null;
      const style = d.pointStyle?.(c);
      points.push({
        id: String(i), label: lab != null && lab !== '' ? String(lab) : `#${i + 1}`, xy: c.xy, panel: c.panel,
        group: style ? style.group : grp != null && grp !== '' ? String(grp) : undefined,
        color: style?.color,
        classification: c.name ?? c.status,
      });
    });
    return { classes, points };
  }

  // ---------- elementos ----------
  const chartBox = h('div', { class: 'chart', id: 'chart' });
  const summary = h('div', { class: 'summary', id: 'summary' });
  const fieldList = h('details', { class: 'fieldlist' });
  const msg = h('div', { class: 'msg', id: 'msg', role: 'status' });
  const titleEl = h('h1', { class: 'title' });
  const paste = h('textarea', { id: 'paste', rows: 5, placeholder: 'Cole aqui a tabela copiada do Excel/Sheets (com cabeçalho na primeira linha) ou um CSV…', spellcheck: false });
  const mapBox = h('div', { class: 'mapping', id: 'mapping' });
  const optBox = h('div', { class: 'options', id: 'options' });
  const tableBox = h('div', { class: 'table-wrap', id: 'table' });
  const menuBox = h('div', { class: 'menu-box' });
  let picking = false;
  let selected: number | null = null; // linha escolhida (módulos de critérios mostram o detalhe dela)
  let lastSvg: SVGSVGElement | null = null;
  const exportButtons: HTMLButtonElement[] = []; // SVG e PNG: só existem quando o módulo tem gráfico
  let lastClasses: Classification[] = [];

  const say = (t: string, kind: 'info' | 'error' = 'info') => { msg.textContent = t; msg.dataset.kind = kind; };

  // ---------- gráfico e classificação ----------
  function refresh(): void {
    const d = def();
    titleEl.textContent = d.title;
    const { classes, points } = compute();
    lastClasses = classes;
    if (selected === null || selected >= state.rows.length) selected = state.rows.length ? 0 : null;
    const isCriteria = d.kind === 'criteria';
    chartBox.classList.toggle('chart-html', isCriteria);
    if (isCriteria) {
      lastSvg = null;
      const lc = labelCol();
      const labels = state.rows.map((r, i) => (lc && r[lc] != null && r[lc] !== '' ? String(r[lc]) : `#${i + 1}`));
      chartBox.replaceChildren(renderPeateView(classes, labels, selected));
    } else {
      lastSvg = renderDiagram(d, points, { reserveLegend: picking });
      chartBox.replaceChildren(lastSvg);
    }
    exportButtons.forEach((b) => { b.disabled = !lastSvg; });
    fieldList.hidden = d.fields.length === 0;
    tableBox.querySelectorAll('tbody tr').forEach((tr, i) => tr.classList.toggle('selected', i === selected));
    if (!fieldList.dataset.for || fieldList.dataset.for !== d.id) {
      fieldList.dataset.for = d.id;
      const ul = h('ul');
      for (const f of d.fields) {
        ul.append(h('li', {}, h('span', { class: 'swatch', style: `background:${f.color}` }), f.short ? `${f.short}  ` : '', f.name));
      }
      fieldList.replaceChildren(h('summary', {}, `Campos do diagrama (${d.fields.length})`), ul);
    }
    const counts = new Map<string, number>();
    for (const c of classes) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
    summary.textContent = state.rows.length
      ? `${state.rows.length} amostras · ${[...counts].map(([k, v]) => `${v} ${k}`).join(' · ')}`
      : 'Nenhum dado carregado. Cole uma tabela, importe um arquivo ou carregue um exemplo.';
    tableBox.querySelectorAll<HTMLElement>('[data-class-row]').forEach((cell) => {
      const i = Number(cell.dataset.classRow);
      const c = classes[i];
      if (!c) return;
      cell.textContent = c.name ?? '—';
      cell.title = c.message ?? '';
      const st = tableBox.querySelector<HTMLElement>(`[data-status-row="${i}"]`);
      if (st) { st.textContent = c.status; st.dataset.status = c.status; st.title = c.message ?? ''; }
    });
    saveProject(state);
  }

  // ---------- tabela ----------
  function rebuildTable(): void {
    if (!state.headers.length) { tableBox.replaceChildren(); return; }
    const table = h('table');
    const head = h('tr', {}, h('th', {}, '#'));
    state.headers.forEach((c) => head.append(h('th', {}, c)));
    head.append(h('th', {}, 'Classificação'), h('th', {}, 'Status'), h('th'));
    table.append(h('thead', {}, head));
    const body = h('tbody');
    state.rows.slice(0, MAX_TABLE_ROWS).forEach((row, i) => {
      const tr = h('tr', {}, h('td', { class: 'idx' }, String(i + 1)));
      tr.addEventListener('click', () => { if (selected !== i) { selected = i; refresh(); } });
      state.headers.forEach((c) => {
        const input = h('input', { value: row[c] == null ? '' : String(row[c]), 'aria-label': `${c} linha ${i + 1}` });
        input.addEventListener('change', () => { row[c] = parseCell(input.value); refresh(); });
        tr.append(h('td', {}, input));
      });
      tr.append(h('td', { class: 'cls', 'data-class-row': i }), h('td', { class: 'status', 'data-status-row': i }));
      const del = h('button', { type: 'button', class: 'ghost', title: 'Remover linha', 'aria-label': `Remover linha ${i + 1}` }, '×');
      del.addEventListener('click', () => { state.rows.splice(i, 1); rebuildTable(); refresh(); });
      tr.append(h('td', {}, del));
      body.append(tr);
    });
    table.append(body);
    tableBox.replaceChildren(table);
    if (state.rows.length > MAX_TABLE_ROWS) {
      tableBox.append(h('p', { class: 'note' }, `Mostrando as primeiras ${MAX_TABLE_ROWS} de ${state.rows.length} linhas (todas são plotadas e exportadas).`));
    }
  }

  // ---------- mapeamento de colunas e opções ----------
  function rebuildControls(): void {
    const d = def();
    const select = (label: string, current: string | null, onChange: (v: string) => void, id: string) => {
      const sel = h('select', { id });
      sel.append(h('option', { value: '' }, '(nenhuma)'));
      state.headers.forEach((c) => sel.append(h('option', { value: c, selected: c === current }, c)));
      sel.addEventListener('change', () => onChange(sel.value));
      return h('label', {}, h('span', {}, label), sel);
    };
    mapBox.replaceChildren();
    if (state.headers.length) {
      mapBox.append(h('h3', {}, 'Colunas'));
      const grid = h('div', { class: 'grid' });
      for (const c of d.requiredColumns.flat()) {
        grid.append(select(c, mapped(c), (v) => { state.mapping[c] = v; refresh(); }, `map-${c}`));
      }
      grid.append(select('Rótulo da amostra', labelCol(), (v) => { state.labelColumn = v; refresh(); }, 'map-label'));
      grid.append(select('Agrupar por (cor/símbolo)', groupCol(), (v) => { state.groupColumn = v; refresh(); }, 'map-group'));
      mapBox.append(grid);
      const optional = (d.optionalColumns ?? []).flat();
      if (optional.length) {
        const og = h('div', { class: 'grid' });
        for (const c of optional) og.append(select(c, mapped(c), (v) => { state.mapping[c] = v; refresh(); }, `map-${c}`));
        const wanted = d.kind === 'criteria' || Object.values(opts()).some(Boolean);
        mapBox.append(h('details', { class: 'optcols', open: wanted }, h('summary', {}, 'Colunas opcionais'), og));
      }
      const missing = d.requiredColumns.flat().filter((c) => !mapped(c));
      if (missing.length) mapBox.append(h('p', { class: 'note warn' }, `Escolha a coluna para: ${missing.join(', ')}.`));
    }
    optBox.replaceChildren();
    for (const o of d.options ?? []) {
      const cb = h('input', { type: 'checkbox', id: `opt-${o.id}`, checked: !!opts()[o.id] });
      cb.addEventListener('change', () => { state.options = { ...state.options, [o.id]: cb.checked }; rebuildControls(); refresh(); });
      optBox.append(h('label', { class: 'check' }, cb, o.label));
    }
  }

  // ---------- carga de dados ----------
  function loadTable(t: Table, source: string): void {
    state.headers = t.headers;
    state.rows = t.rows;
    state.mapping = {};
    state.labelColumn = undefined;
    state.groupColumn = undefined;
    if (!t.headers.length) say('Não encontrei dados. A primeira linha deve ser o cabeçalho.', 'error');
    else say(`${t.rows.length} linhas carregadas de ${source}.`);
    rebuildControls(); rebuildTable(); refresh();
  }

  const loadPasted = () => loadTable(parseText(paste.value), 'texto colado');
  paste.addEventListener('paste', () => setTimeout(loadPasted, 0));

  const fileInput = h('input', { type: 'file', accept: '.csv,.txt,.tsv,.xlsx,.xls', id: 'file', hidden: true });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    try {
      const t = /\.xlsx?$/i.test(f.name) ? parseXlsx(await f.arrayBuffer()) : parseText(await f.text());
      loadTable(t, f.name);
    } catch (e) { say(`Não consegui ler o arquivo: ${(e as Error).message}`, 'error'); }
    fileInput.value = '';
  });

  const projectInput = h('input', { type: 'file', accept: '.json', id: 'project-file', hidden: true });
  projectInput.addEventListener('change', async () => {
    const f = projectInput.files?.[0];
    if (!f) return;
    try {
      const p = importProject(await f.text());
      if (!getDiagram(p.diagramId)) throw new Error(`diagrama desconhecido: ${p.diagramId}`);
      Object.assign(state, { options: {}, ...p });
      say(`Projeto ${f.name} aberto.`);
      selectDiagram(state.diagramId);
    } catch (e) { say(`Projeto inválido: ${(e as Error).message}`, 'error'); }
    projectInput.value = '';
  });

  const btn = (label: string, onClick: () => void, cls = '', id?: string) => {
    const b = h('button', { type: 'button', class: cls, id }, label);
    b.addEventListener('click', onClick);
    return b;
  };

  const sample = (): [string, string] => {
    if (state.diagramId === 'tas') return [tasSample, 'exemplo TAS'];
    if (state.diagramId.startsWith('peate')) return [peateSample, 'exemplo Peate'];
    return [qapfSample, 'exemplo QAPF'];
  };
  const dataBar = h('div', { class: 'bar' },
    btn('Carregar texto colado', loadPasted, 'primary', 'load-paste'),
    btn('Importar arquivo…', () => fileInput.click(), '', 'import'),
    btn('Carregar exemplo', () => { const [csv, n] = sample(); loadTable(parseText(csv), n); }, '', 'example'),
    btn('Adicionar linha', () => {
      if (!state.headers.length) state.headers = ['Amostra', ...def().requiredColumns.flat()];
      state.rows.push(Object.fromEntries(state.headers.map((c) => [c, null])));
      rebuildControls(); rebuildTable(); refresh();
    }, '', 'add-row'),
    btn('Limpar', () => {
      state.rows = []; state.headers = []; state.mapping = {}; paste.value = '';
      rebuildControls(); rebuildTable(); refresh(); say('Dados removidos.');
    }, 'ghost', 'clear'),
  );

  const stem = () => `${state.diagramId}-${new Date().toISOString().slice(0, 10)}`;
  const exportBar = h('div', { class: 'bar' },
    btn('SVG', () => lastSvg && download(`${stem()}.svg`, new Blob([svgToString(lastSvg)], { type: 'image/svg+xml' })), '', 'export-svg'),
    btn('PNG', async () => {
      if (!lastSvg) return;
      try { download(`${stem()}.png`, await svgToPngBlob(lastSvg, 2)); } catch (e) { say(`Falha ao gerar PNG: ${(e as Error).message}`, 'error'); }
    }, '', 'export-png'),
    btn('CSV classificado', () => download(`${stem()}.csv`, new Blob([rowsToCsv(state.rows, lastClasses)], { type: 'text/csv;charset=utf-8' })), '', 'export-csv'),
    btn('Salvar projeto', () => download(`geoqmaster-${stem()}.json`, new Blob([exportProject(state)], { type: 'application/json' })), '', 'export-project'),
    btn('Abrir projeto…', () => projectInput.click(), '', 'open-project'),
  );
  exportButtons.push(exportBar.querySelector<HTMLButtonElement>('#export-svg')!, exportBar.querySelector<HTMLButtonElement>('#export-png')!);

  // ---------- pontos livres com o mouse ----------
  const tip = h('div', { class: 'cursor-tip', hidden: true });
  const PICK_OFF = '＋ Adicionar pontos com o mouse', PICK_ON = '✕ Parar de adicionar pontos';
  const pickBtn = h('button', { type: 'button', id: 'pick-mode', class: 'toggle', 'aria-pressed': 'false' }, PICK_OFF);
  const pickHint = h('span', { class: 'note' }, 'Ligue e clique no gráfico: cada clique cria uma linha na tabela.');
  const diagramSelect = h('select', { id: 'diagram-select', 'aria-label': 'Diagrama' });
  for (const area of menuTree) {
    const usable = area.modules.filter((m) => m.diagramId);
    if (!usable.length) continue;
    const g = h('optgroup', { label: area.title });
    usable.forEach((m) => g.append(h('option', { value: m.diagramId! }, m.title)));
    diagramSelect.append(g);
  }
  diagramSelect.addEventListener('change', () => selectDiagram(diagramSelect.value));

  function setPicking(on: boolean): void {
    picking = on && !!def().fromPoint;
    pickBtn.setAttribute('aria-pressed', String(picking));
    pickBtn.textContent = picking ? PICK_ON : PICK_OFF;
    chartBox.classList.toggle('picking', picking);
    tip.hidden = true;
  }

  function pointAt(ev: MouseEvent): { row: Row; cls: Classification } | null {
    const d = def();
    if (!lastSvg || !d.fromPoint) return null;
    const xy = clientToDiagram(lastSvg, ev.clientX, ev.clientY);
    const row = xy && d.fromPoint(xy);
    return row ? { row, cls: classifyRow(d, row, {}) } : null;
  }

  function addFreePoint(row: Row): void {
    const ensure = (name: string): string => {
      if (!state.headers.includes(name)) {
        state.headers.push(name);
        state.rows.forEach((r) => { r[name] = null; });
      }
      return name;
    };
    const lc = labelCol() ?? ensure('Amostra');
    const gc = state.groupColumn === '' ? null : (groupCol() ?? ensure('Grupo'));
    const target: Record<string, string> = {};
    for (const canon of Object.keys(row)) {
      let col = mapped(canon);
      if (!col) { delete state.mapping[canon]; col = mapped(canon) ?? ensure(canon); }
      target[canon] = col;
    }
    const n = state.rows.filter((r) => String(r[lc] ?? '').startsWith('Ponto livre')).length + 1;
    const newRow: Row = Object.fromEntries(state.headers.map((c) => [c, null]));
    newRow[lc] = `Ponto livre ${n}`;
    if (gc) newRow[gc] = 'Pontos livres';
    for (const [canon, v] of Object.entries(row)) newRow[target[canon]] = v;
    state.rows.push(newRow);
    rebuildControls(); rebuildTable(); refresh();
    tableBox.scrollTop = tableBox.scrollHeight;
    const cls = lastClasses[state.rows.length - 1];
    say(state.options?.anidro
      ? 'Ponto adicionado, mas a normalização anidra está ligada e pontos livres só têm SiO2/Na2O/K2O: desligue a opção para vê-lo.'
      : `Ponto livre ${n} adicionado: ${cls?.name ?? cls?.status ?? ''}.`);
  }

  pickBtn.addEventListener('click', () => { setPicking(!picking); refresh(); });
  chartBox.addEventListener('mousemove', (ev) => {
    if (!picking) return;
    const p = pointAt(ev);
    if (!p) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.textContent = `${p.cls.name ?? p.cls.status} · ${Object.entries(p.row).map(([k, v]) => `${k} ${v}`).join(' · ')}`;
    tip.style.left = `${ev.clientX + 14}px`;
    tip.style.top = `${ev.clientY + 14}px`;
  });
  chartBox.addEventListener('mouseleave', () => { tip.hidden = true; });
  chartBox.addEventListener('click', (ev) => {
    if (!picking) return;
    const p = pointAt(ev);
    if (p) addFreePoint(p.row);
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && picking) { setPicking(false); refresh(); } });

  // ---------- navegação ----------
  function selectDiagram(id: string): void {
    state.diagramId = id;
    diagramSelect.value = id;
    pickBtn.disabled = !def().fromPoint;
    pickBtn.title = !pickBtn.disabled ? ''
      : def().kind === 'criteria' ? 'Este módulo não tem gráfico.'
        : 'Este diagrama usa razões (ex.: Ti/Zr): um clique não define os dados originais (TiO2, Zr, Y…).';
    if (pickBtn.disabled) setPicking(false);
    menuBox.replaceChildren(renderMenu(id, (next) => selectDiagram(next)));
    rebuildControls(); rebuildTable(); refresh();
  }

  root.append(
    h('div', { class: 'app' },
      h('aside', { class: 'side' }, h('div', { class: 'brand' }, 'GeoQMaster'), menuBox),
      h('main', { class: 'main' }, titleEl, h('div', { class: 'toolbar' }, diagramSelect, pickBtn, pickHint), chartBox, summary, fieldList, h('h3', {}, 'Exportar'), exportBar),
      tip,
      h('section', { class: 'data' },
        h('h2', {}, 'Dados'), paste, dataBar, msg, optBox, mapBox, tableBox, fileInput, projectInput),
    ),
  );
  selectDiagram(state.diagramId);
}
