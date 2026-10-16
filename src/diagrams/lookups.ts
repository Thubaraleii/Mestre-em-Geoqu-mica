// Módulos de classificação por regras (tabelas e calculadoras), transcritos das figuras de referência do usuário:
// granulometria (escala + peneiras), produtos piroclásticos, dobras (ângulo interflanco e Fleuty), exagero vertical
// (ábaco de Loczi e Ladeira, 1976), conglomerados (Pettijohn, 1975), tectonitos de falha (Sibson, 1977),
// nomenclatura de rochas metamórficas e estimativa de porcentagem (CPRM).
import type { Pt } from '../core/geometry';
import type { Classification, DiagramDef, Field, Row } from '../core/types';
import { readNum } from '../core/values';

const stub: DiagramDef['toPoint'] = () => ({ ok: false, reason: 'invalido', message: 'este módulo não tem gráfico' });
const DEG = Math.PI / 180;

// ---------- leitura ----------
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
function readText(row: Row, key: string): string | null {
  const v = row[key];
  if (v === null || v === undefined || v === '') return null;
  return norm(String(v));
}
/** sim/não: true, false, null (em branco) ou 'bad' */
function readBool(row: Row, key: string): boolean | null | 'bad' {
  const t = readText(row, key);
  if (t === null) return null;
  if (['sim', 's', 'yes', 'y', 'true', '1', 'verdadeiro'].includes(t)) return true;
  if (['nao', 'n', 'no', 'false', '0', 'falso'].includes(t)) return false;
  return 'bad';
}
const ok = (name: string, message?: string, extra: Partial<Classification> = {}): Classification => ({ status: 'ok', name, message, ...extra });
const fail = (status: Classification['status'], message: string): Classification => ({ status, message });

// ---------- granulometria ----------
// limites inferiores (mm), da escala de Wentworth da figura e da tabela de peneiras (mesh)
const GRAIN: { name: string; min: number; range: string; mesh?: string }[] = [
  { name: 'Matacão', min: 256, range: '> 256' },
  { name: 'Bloco', min: 64, range: '64 – 256' },
  { name: 'Seixo', min: 4, range: '4 – 64' },
  { name: 'Grânulo', min: 2, range: '2 – 4', mesh: '5–10' },
  { name: 'Areia muito grossa', min: 1, range: '1 – 2', mesh: '10–18' },
  { name: 'Areia grossa', min: 0.5, range: '0,5 – 1', mesh: '18–35' },
  { name: 'Areia média', min: 0.25, range: '0,25 – 0,5', mesh: '35–60' },
  { name: 'Areia fina', min: 0.125, range: '0,125 – 0,25', mesh: '60–120' },
  { name: 'Areia muito fina', min: 0.062, range: '0,062 – 0,125', mesh: '120–230' },
  { name: 'Silte', min: 0.004, range: '0,004 – 0,062' },
  { name: 'Argila', min: 0, range: '< 0,004' },
];
const phi = (mm: number) => -Math.log2(mm);
const phiTxt = (mm: number) => (mm > 0 ? phi(mm).toFixed(2) : '∞');

function diameter(row: Row): { mm: number } | Classification {
  const d = readNum(row, 'Diametro');
  if (d === 'bad') return fail('invalido', 'diâmetro não numérico');
  if (d === null) return fail('ausente', 'falta a coluna Diametro (mm)');
  if (d <= 0) return fail('invalido', 'o diâmetro deve ser maior que zero');
  return { mm: d };
}

export const granulometria: DiagramDef = {
  id: 'granulometria', area: 'sedimentar', kind: 'table',
  title: 'Nomenclatura de granulometria e detritos sedimentares',
  panels: [], fields: [], requiredColumns: [['Diametro']], toPoint: stub,
  referenceTable: {
    head: ['Classe', 'Diâmetro (mm)', 'φ', 'Malha (mesh)'],
    rows: GRAIN.map((g, i) => [g.name, g.range, i === 0 ? '< −8' : i === GRAIN.length - 1 ? '> 8' : `${phiTxt(GRAIN[i - 1].min)} a ${phiTxt(g.min)}`, g.mesh ?? '—']),
    note: 'Escala da figura (modificado de Dott, 1964) e equivalência entre diâmetros e o padrão americano de peneiras. Limite inferior inclusivo.',
  },
  classify(row) {
    const d = diameter(row);
    if ('status' in d) return d;
    const g = GRAIN.find((x) => d.mm >= x.min)!;
    return ok(g.name, `φ = ${phiTxt(d.mm)}${g.mesh ? ` · malha mesh ${g.mesh}` : ''}`);
  },
};

// ---------- produtos piroclásticos ----------
export const piroclasticos: DiagramDef = {
  id: 'piroclasticos', area: 'igneas', kind: 'table',
  title: 'Nomenclatura de produtos piroclásticos',
  panels: [], fields: [], requiredColumns: [['Diametro']], toPoint: stub,
  referenceTable: {
    head: ['Rocha', 'Tamanho do grão (mm)', 'Produto piroclástico'],
    rows: [
      ['Brecha', '> 256', 'Bloco e bomba (grosso)'],
      ['Aglomerado', '64 – 256', 'Bloco e bomba (fino)'],
      ['Lapili-tufo', '2 – 64', 'Lapili'],
      ['Tufo cinerítico', '< 2', 'Cinza (grossa 1–2, média 0,062–1, fina < 0,062)'],
    ],
    note: 'Tabela de nomenclatura de produtos piroclásticos da figura de referência. Limite inferior inclusivo.',
  },
  classify(row) {
    const d = diameter(row);
    if ('status' in d) return d;
    const m = d.mm;
    if (m >= 256) return ok('Brecha', 'produto: bloco e bomba (grosso, > 256 mm)');
    if (m >= 64) return ok('Aglomerado', 'produto: bloco e bomba (fino, 64–256 mm)');
    if (m >= 2) return ok('Lapili-tufo', 'produto: lapili (2–64 mm)');
    const sub = m >= 1 ? 'grossa' : m >= 0.062 ? 'média' : 'fina';
    return ok('Tufo cinerítico', `produto: cinza ${sub} (< 2 mm)`);
  },
};

// ---------- dobras: ângulo interflanco ----------
const INTERFLANCO: [string, string][] = [
  ['Isoclinal', '0°'], ['Cerrada', '0° – 30°'], ['Fechada', '30° – 70°'], ['Aberta', '70° – 120°'], ['Suave', '120° – 180°'],
];
export const dobrasInterflanco: DiagramDef = {
  id: 'dobras-interflanco', area: 'estrutural', kind: 'table',
  title: 'Classificação de dobras com base no ângulo interflanco',
  panels: [], fields: [], requiredColumns: [['Angulo']], toPoint: stub,
  referenceTable: {
    head: ['Dobra', 'Ângulo interflanco'],
    rows: INTERFLANCO.map(([n, a]) => [n, a]),
    note: 'Quanto menor o ângulo entre os flancos, mais apertada a dobra. Limite inferior inclusivo (30° é fechada, 70° é aberta, 120° é suave).',
  },
  classify(row) {
    const a = readNum(row, 'Angulo');
    if (a === 'bad') return fail('invalido', 'ângulo não numérico');
    if (a === null) return fail('ausente', 'falta a coluna Angulo (°)');
    if (a < 0 || a > 180) return fail('invalido', 'o ângulo interflanco vai de 0° a 180°');
    if (a === 0) return ok('Isoclinal');
    if (a < 30) return ok('Cerrada');
    if (a < 70) return ok('Fechada');
    if (a < 120) return ok('Aberta');
    return ok('Suave', a === 180 ? 'dobra plana (flancos alinhados)' : undefined);
  },
};

// ---------- exagero vertical ----------
const apparentDip = (ve: number, dip: number) => (dip >= 90 ? 90 : Math.atan(ve * Math.tan(dip * DEG)) / DEG);

export const exageroVertical: DiagramDef = (() => {
  const curves = [2, 3, 5, 10].map((ve) => ({
    id: `ve${ve}`, name: `${ve}×`,
    points: Array.from({ length: 91 }, (_, d) => [d, apparentDip(ve, d)] as Pt),
  }));
  const toPoint: DiagramDef['toPoint'] = (row) => {
    const ve = readNum(row, 'Exagero'), d = readNum(row, 'Mergulho');
    if (ve === 'bad' || d === 'bad') return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if (ve === null || d === null) return { ok: false, reason: 'ausente', message: 'faltam Exagero e Mergulho' };
    if (ve <= 0) return { ok: false, reason: 'invalido', message: 'o exagero vertical deve ser maior que zero' };
    if (d < 0 || d > 90) return { ok: false, reason: 'invalido', message: 'o mergulho vai de 0° a 90°' };
    return { ok: true, panel: 'main', xy: [d, apparentDip(ve, d)] };
  };
  return {
    id: 'exagero-vertical', area: 'cartografia',
    title: 'Correção de mergulhos pelo exagero vertical (Loczi e Ladeira, 1976)',
    panels: [{ id: 'main', type: 'cartesian', xLabel: 'Mergulho real (°)', yLabel: 'Mergulho na seção com exagero (°)', xRange: [0, 90], yRange: [0, 90] }],
    fields: [], extraLines: curves, requiredColumns: [['Exagero'], ['Mergulho']], toPoint,
    classify(row) {
      const p = toPoint(row, {});
      if (!p.ok) return { status: p.reason, message: p.message };
      return { status: 'ok', name: `${+p.xy[1].toFixed(1)}°`, message: 'tan(mergulho na seção) = exagero × tan(mergulho real)', panel: p.panel, xy: p.xy };
    },
  };
})();

// ---------- dobras de Fleuty ----------
const DIP_CLASSES: [number, string][] = [[80, 'Normal'], [60, 'Normal inclinada'], [30, 'Moderadamente inclinada'], [10, 'Fracamente inclinada'], [0, 'Recumbente']];
const PLUNGE_CLASSES: [number, string][] = [[80, 'vertical'], [60, 'forte'], [30, 'moderado'], [10, 'fraco'], [0, 'horizontal']];
const dipClass = (d: number) => DIP_CLASSES.find(([min]) => d >= min)![1];
const plungeClass = (p: number) => PLUNGE_CLASSES.find(([min]) => p >= min)![1];

function fleutyName(dip: number, plunge: number): string {
  if (dip >= 80 && plunge >= 80) return 'Vertical';
  const pitch = Math.asin(Math.min(1, Math.sin(plunge * DEG) / Math.sin(dip * DEG))) / DEG;
  if (dip > 0 && pitch > 80) return 'Reclinada'; // eixo a mais de 80° de pitch no plano axial
  const dc = dipClass(dip), pc = plungeClass(plunge);
  if (dc === 'Recumbente') return 'Recumbente';
  if (pc === 'horizontal') return dc === 'Normal' ? 'Normal horizontal' : `Horizontal ${dc.toLowerCase()}`;
  return `${dc} com caimento ${pc}`;
}

/** recorta o polígono ao semiplano y <= x (caimento não pode passar do mergulho do plano axial) */
function clipBelowDiagonal(poly: Pt[]): Pt[] {
  const out: Pt[] = [];
  const side = (p: Pt) => p[0] - p[1]; // >= 0 dentro
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const sa = side(a), sb = side(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

export const dobrasFleuty: DiagramDef = (() => {
  const dipEdges = [0, 10, 30, 60, 80, 90], plungeEdges = [0, 10, 30, 60, 80, 90];
  const fields: Field[] = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const [x0, x1, y0, y1] = [dipEdges[i], dipEdges[i + 1], plungeEdges[j], plungeEdges[j + 1]];
    const poly = clipBelowDiagonal([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    if (poly.length < 3) continue;
    const area = Math.abs(poly.reduce((s, p, k) => { const q = poly[(k + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    if (area < 1e-6) continue;
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    fields.push({ id: `f${i}-${j}`, name: fleutyName(Math.max(cx, 0.001), Math.min(cy, cx)), polygon: poly, panel: 'main', color: ['#fde0dd', '#c7e9c0', '#c6dbef', '#fdd0a2', '#dadaeb', '#ffffb3'][(i + j) % 6], opacity: 0.45 });
  }
  const pitch80: Pt[] = Array.from({ length: 91 }, (_, d) => [d, Math.asin(Math.sin(d * DEG) * Math.sin(80 * DEG)) / DEG] as Pt);
  const toPoint: DiagramDef['toPoint'] = (row) => {
    const d = readNum(row, 'MergulhoPA'), p = readNum(row, 'CaimentoEixo');
    if (d === 'bad' || p === 'bad') return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if (d === null || p === null) return { ok: false, reason: 'ausente', message: 'faltam MergulhoPA e CaimentoEixo' };
    if (d < 0 || d > 90 || p < 0 || p > 90) return { ok: false, reason: 'invalido', message: 'os ângulos vão de 0° a 90°' };
    if (p > d + 1e-9) return { ok: false, reason: 'invalido', message: 'o caimento do eixo não pode ser maior que o mergulho do plano axial' };
    return { ok: true, panel: 'main', xy: [d, p] };
  };
  return {
    id: 'dobras-fleuty', area: 'estrutural', title: 'Classificação de dobras de Fleuty',
    panels: [{ id: 'main', type: 'cartesian', xLabel: 'Mergulho do plano axial (°)', yLabel: 'Caimento do eixo (°)', xRange: [0, 90], yRange: [0, 90] }],
    fields, requiredColumns: [['MergulhoPA'], ['CaimentoEixo']], toPoint,
    extraLines: [{ id: 'reclinadas', name: 'dobras reclinadas: acima da linha (pitch > 80°)', points: pitch80 }],
    classify(row) {
      const p = toPoint(row, {});
      if (!p.ok) return { status: p.reason, message: p.message };
      return { status: 'ok', name: fleutyName(p.xy[0], p.xy[1]), panel: p.panel, xy: p.xy };
    },
  };
})();

// ---------- conglomerados ----------
export const conglomerados: DiagramDef = {
  id: 'conglomerados', area: 'sedimentar', kind: 'table',
  title: 'Classificação de conglomerados (Pettijohn, 1975, modificado)',
  panels: [], fields: [],
  requiredColumns: [['Origem']],
  optionalColumns: [['Matriz'], ['Metaestaveis'], ['MatrizLaminada'], ['Glacial']],
  toPoint: stub,
  referenceTable: {
    head: ['Classe', 'Origem', 'Matriz', 'Critério'],
    rows: [
      ['Conglomerado oligomítico', 'Extraformacional', '< 15% (ortoconglomerado)', 'Metaestáveis < 10%'],
      ['Conglomerado petromítico ou polimítico', 'Extraformacional', '< 15% (ortoconglomerado)', 'Metaestáveis > 10%'],
      ['Lamito ou argilito conglomerático', 'Extraformacional', '> 15% (paraconglomerado)', 'Matriz laminada'],
      ['Tilito (glacial)', 'Extraformacional', '> 15% (paraconglomerado)', 'Matriz não laminada, glacial'],
      ['Tilóide (não glacial)', 'Extraformacional', '> 15% (paraconglomerado)', 'Matriz não laminada, não glacial'],
      ['Conglomerado intraformacional', 'Intraformacional', '—', '—'],
    ],
    note: 'A figura de referência separa petromítico de polimítico dentro de "metaestáveis > 10%" sem dar o critério; por isso o app devolve "petromítico ou polimítico".',
  },
  classify(row) {
    const o = readText(row, 'Origem');
    if (o === null) return fail('ausente', 'falta a coluna Origem (extraformacional ou intraformacional)');
    if (o.startsWith('intra')) return ok('Conglomerado intraformacional');
    if (!o.startsWith('extra')) return fail('invalido', 'Origem deve ser extraformacional ou intraformacional');
    const m = readNum(row, 'Matriz');
    if (m === 'bad') return fail('invalido', 'matriz não numérica');
    if (m === null) return fail('ausente', 'falta Matriz (% de matriz)');
    if (m < 15) {
      const meta = readNum(row, 'Metaestaveis');
      if (meta === 'bad') return fail('invalido', 'metaestáveis não numérico');
      if (meta === null) return fail('ausente', 'falta Metaestaveis (% de fragmentos metaestáveis)');
      if (meta < 10) return ok('Conglomerado oligomítico');
      return ok('Conglomerado petromítico ou polimítico', 'a figura de referência não define o critério que separa petromítico de polimítico');
    }
    const lam = readBool(row, 'MatrizLaminada');
    if (lam === 'bad') return fail('invalido', 'MatrizLaminada deve ser sim ou não');
    if (lam === null) return fail('ausente', 'falta MatrizLaminada (sim ou não)');
    if (lam) return ok('Lamito ou argilito conglomerático');
    const gl = readBool(row, 'Glacial');
    if (gl === 'bad') return fail('invalido', 'Glacial deve ser sim ou não');
    if (gl === null) return fail('ausente', 'falta Glacial (sim ou não)');
    return gl ? ok('Tilito (glacial)') : ok('Tilóide (não glacial)');
  },
};

// ---------- tectonitos de falha (Sibson, 1977) ----------
export const tectonitos: DiagramDef = {
  id: 'tectonitos', area: 'estrutural', kind: 'table',
  title: 'Classificação de tectonitos de falhas (Sibson, 1977)',
  panels: [], fields: [],
  requiredColumns: [['Coesao']],
  optionalColumns: [['Trama'], ['Matriz'], ['Fragmentos'], ['TamFragmento'], ['Vitreo'], ['Recristalizacao']],
  toPoint: stub,
  referenceTable: {
    head: ['Tectonito', 'Coesão', 'Trama', 'Critério'],
    rows: [
      ['Brecha de falha', 'Sem coesão', 'Aleatória', 'Fragmentos visíveis > 30%'],
      ['Farinha de rocha (gouge)', 'Sem coesão', 'Aleatória', 'Fragmentos visíveis < 30%'],
      ['Pseudotaquilito', 'Com coesão', 'Vítreo', '—'],
      ['Brecha de moagem', 'Com coesão', 'Aleatória', 'Matriz < 10%, fragmentos > 0,5 cm'],
      ['Brecha de moagem fina', 'Com coesão', 'Aleatória', 'Matriz < 10%, fragmentos 0,1 a 0,5 cm'],
      ['Microbrecha de moagem', 'Com coesão', 'Aleatória', 'Matriz < 10%, fragmentos < 0,1 cm'],
      ['Protocataclasito', 'Com coesão', 'Aleatória', 'Matriz 10 a 50%'],
      ['Cataclasito', 'Com coesão', 'Aleatória', 'Matriz 50 a 90%'],
      ['Ultracataclasito', 'Com coesão', 'Aleatória', 'Matriz 90 a 100%'],
      ['Protomilonito', 'Com coesão', 'Foliada', 'Matriz 10 a 50%'],
      ['Milonito', 'Com coesão', 'Foliada', 'Matriz 50 a 90%'],
      ['Ultramilonito (filonito)', 'Com coesão', 'Foliada', 'Matriz 90 a 100%'],
      ['Blastomilonito', 'Com coesão', 'Foliada', 'Recristalização pronunciada'],
    ],
    note: 'As células marcadas "?" na figura (trama foliada sem coesão, ou foliada com matriz < 10%) não têm nome definido: o app responde "fora do campo".',
  },
  classify(row) {
    const co = readBool(row, 'Coesao');
    if (co === 'bad') return fail('invalido', 'Coesao deve ser sim ou não');
    if (co === null) return fail('ausente', 'falta Coesao (sim ou não)');
    const tr = readText(row, 'Trama');
    const foliada = tr === null ? null : tr.startsWith('fol') ? true : tr.startsWith('alea') ? false : 'bad';
    if (foliada === 'bad') return fail('invalido', 'Trama deve ser aleatória ou foliada');
    const unknown = (why: string) => fail('fora do campo', `a figura de referência marca "?" (sem nome definido): ${why}`);

    if (!co) {
      if (foliada === null) return fail('ausente', 'falta Trama (aleatória ou foliada)');
      if (foliada) return unknown('trama foliada sem coesão');
      const f = readNum(row, 'Fragmentos');
      if (f === 'bad') return fail('invalido', 'Fragmentos não numérico');
      if (f === null) return fail('ausente', 'falta Fragmentos (% de fragmentos visíveis)');
      return f > 30 ? ok('Brecha de falha') : ok('Farinha de rocha (gouge)');
    }
    const vit = readBool(row, 'Vitreo');
    if (vit === 'bad') return fail('invalido', 'Vitreo deve ser sim ou não');
    if (vit) return ok('Pseudotaquilito');
    if (foliada === null) return fail('ausente', 'falta Trama (aleatória ou foliada)');
    const rec = readBool(row, 'Recristalizacao');
    if (rec === 'bad') return fail('invalido', 'Recristalizacao deve ser sim ou não');
    if (rec) return foliada ? ok('Blastomilonito') : unknown('recristalização pronunciada com trama aleatória');
    const m = readNum(row, 'Matriz');
    if (m === 'bad') return fail('invalido', 'matriz não numérica');
    if (m === null) return fail('ausente', 'falta Matriz (% de matriz)');
    if (m < 10) {
      if (foliada) return unknown('trama foliada com matriz < 10%');
      const t = readNum(row, 'TamFragmento');
      if (t === 'bad') return fail('invalido', 'TamFragmento não numérico');
      if (t === null) return fail('ausente', 'falta TamFragmento (cm)');
      return t > 0.5 ? ok('Brecha de moagem') : t >= 0.1 ? ok('Brecha de moagem fina') : ok('Microbrecha de moagem');
    }
    if (m < 50) return foliada ? ok('Protomilonito') : ok('Protocataclasito');
    if (m < 90) return foliada ? ok('Milonito') : ok('Cataclasito');
    return foliada ? ok('Ultramilonito (filonito)') : ok('Ultracataclasito');
  },
};

// ---------- referências sem dados do usuário ----------
export const rochasMetamorficas: DiagramDef = {
  id: 'rochas-metamorficas', area: 'metamorfica', kind: 'reference',
  title: 'Nomenclatura de rochas metamórficas',
  panels: [], fields: [], requiredColumns: [], toPoint: stub,
  referenceTable: {
    head: ['Nome', 'Estrutura', 'Textura', 'Aspecto', 'Minerais'],
    rows: [
      ['Ardósia', 'Foliada', 'Granulação fina', 'Brilho fosco, fratura plana, grãos muito finos, mais denso que folhelho', 'Minerais reconhecíveis apenas com microscópio ou raio-X'],
      ['Filito', 'Foliada', 'Granulação fina', 'Brilho sedoso, fratura ondulada, grãos finos visíveis com lupa de mão', 'Micas ou anfibólio'],
      ['Xisto', 'Foliada', 'Granulação grossa', 'Orientação comum de grãos individuais, finamente foliada, porfiroblastos comuns', 'Micas abundante; quartzo comum; feldspatos duvidoso; anfibólios comum'],
      ['Gnaisse', 'Foliada', 'Granulação grossa', 'Alternância de leitos ou bandas com minerais claros e escuros, foliação grossa, fraturas em bloco', 'Feldspatos abundante; quartzo comum; micas comum; anfibólios comum'],
      ['Mármore', 'Não foliada', 'Granular maciça', 'Cristais intercrescidos, efervesce com HCl diluído, risca fácil com canivete', 'Calcita e (ou) dolomita'],
      ['Quartzito', 'Não foliada', 'Granular maciça', 'Grãos equigranulares, aparência subvítrea, fraturas cortam grãos e não os circundam', 'Quartzo'],
    ],
    note: 'Tabela de nomenclatura da figura de referência (estrutura, textura, aspecto e minerais).',
  },
};

export const estimativaPorcentagem: DiagramDef = {
  id: 'estimativa-porcentagem', area: 'descricao', kind: 'reference',
  title: 'Estimativa visual de porcentagem (CPRM, caderneta de campo)',
  panels: [], fields: [], requiredColumns: [], toPoint: stub,
};

// ---------- exemplos (botão "Carregar exemplo") ----------
const csv = (header: string, rows: (string | number)[][]): string => [header, ...rows.map((r) => r.join(','))].join('\n') + '\n';
const numbered = (values: number[]) => values.map((v, i) => [`Exemplo ${i + 1}`, v]);

granulometria.exampleCsv = csv('Amostra,Diametro', numbered([300, 100, 10, 3, 1.5, 0.7, 0.3, 0.2, 0.1, 0.03, 0.001]));
piroclasticos.exampleCsv = csv('Amostra,Diametro', numbered([300, 100, 10, 1.5, 0.5, 0.01]));
dobrasInterflanco.exampleCsv = csv('Amostra,Angulo', numbered([0, 15, 40, 90, 150]));
exageroVertical.exampleCsv = csv('Amostra,Exagero,Mergulho', [[3, 10], [3, 20], [3, 30], [3, 45], [3, 60], [5, 30], [5, 45], [10, 15]].map(([e, m], i) => [`Exemplo ${i + 1}`, e, m]));
dobrasFleuty.exampleCsv = csv('Amostra,MergulhoPA,CaimentoEixo', [[85, 5], [85, 45], [70, 20], [45, 5], [20, 5], [5, 3], [85, 85], [60, 59]].map(([d, p], i) => [`Exemplo ${i + 1}`, d, p]));
conglomerados.exampleCsv = csv('Amostra,Origem,Matriz,Metaestaveis,MatrizLaminada,Glacial', [
  ['Exemplo 1 oligomítico', 'extraformacional', 5, 5, '', ''],
  ['Exemplo 2 petromítico ou polimítico', 'extraformacional', 5, 20, '', ''],
  ['Exemplo 3 lamito conglomerático', 'extraformacional', 30, '', 'sim', ''],
  ['Exemplo 4 tilito', 'extraformacional', 30, '', 'não', 'sim'],
  ['Exemplo 5 tilóide', 'extraformacional', 30, '', 'não', 'não'],
  ['Exemplo 6 intraformacional', 'intraformacional', '', '', '', ''],
]);
tectonitos.exampleCsv = csv('Amostra,Coesao,Trama,Matriz,Fragmentos,TamFragmento,Vitreo,Recristalizacao', [
  ['Exemplo 1 brecha de falha', 'não', 'aleatória', '', 50, '', '', ''],
  ['Exemplo 2 gouge', 'não', 'aleatória', '', 10, '', '', ''],
  ['Exemplo 3 pseudotaquilito', 'sim', '', '', '', '', 'sim', ''],
  ['Exemplo 4 brecha de moagem', 'sim', 'aleatória', 5, '', 1, 'não', ''],
  ['Exemplo 5 protocataclasito', 'sim', 'aleatória', 30, '', '', 'não', ''],
  ['Exemplo 6 cataclasito', 'sim', 'aleatória', 70, '', '', 'não', ''],
  ['Exemplo 7 protomilonito', 'sim', 'foliada', 30, '', '', 'não', ''],
  ['Exemplo 8 milonito', 'sim', 'foliada', 70, '', '', 'não', ''],
  ['Exemplo 9 ultramilonito', 'sim', 'foliada', 95, '', '', 'não', ''],
  ['Exemplo 10 blastomilonito', 'sim', 'foliada', '', '', '', 'não', 'sim'],
]);

export const lookups: DiagramDef[] = [
  granulometria, piroclasticos, dobrasInterflanco, exageroVertical, dobrasFleuty, conglomerados, tectonitos, rochasMetamorficas, estimativaPorcentagem,
];
