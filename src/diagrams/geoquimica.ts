// Diagramas geoquímicos de classificação usados no projeto de Taió.
// Geometria extraída dos PDFs/PNGs exportados pelo GCDkit na pasta Graficos\Classificação do usuário:
//  - Shand (1943): linhas A/NK = 1 e A/CNK = 1 (vetorial, exato)
//  - AFM (Irvine e Baragar, 1971): curva de 9 pontos entre M = 5 e M = 50 (vetorial); as pontas foram prolongadas até as arestas
//  - Pearce e Norry (1979): três paralelogramos (vetorial, exato)
//  - Winchester e Floyd (1977): fronteiras digitalizadas do PNG (calibrando os eixos logarítmicos, erro de cerca de 0,03 década): conferir
import { pointInPolygon, type Pt } from '../core/geometry';
import type { Classification, DiagramDef, Field, Row } from '../core/types';
import { readNum } from '../core/values';
import { buildTernary, compXY, type Comp } from './ternary-shared';

const MW = { Al2O3: 101.96, CaO: 56.08, Na2O: 61.98, K2O: 94.2 };

// ---------- Shand (1943) ----------
export const shand: DiagramDef = (() => {
  const R: [number, number] = [0.5, 1.5], Y: [number, number] = [0, 7];
  const f = (id: string, name: string, color: string, polygon: Pt[]): Field => ({ id, name, color, polygon, panel: 'main', opacity: 0.3 });
  const toPoint: DiagramDef['toPoint'] = (row) => {
    const al = readNum(row, 'Al2O3'), ca = readNum(row, 'CaO'), na = readNum(row, 'Na2O'), k = readNum(row, 'K2O');
    if ([al, ca, na, k].some((v) => v === 'bad')) return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if ([al, ca, na, k].some((v) => v === null)) return { ok: false, reason: 'ausente', message: 'faltam Al2O3, CaO, Na2O ou K2O' };
    const [A, C, N, K] = [al, ca, na, k] as number[];
    if ([A, C, N, K].some((v) => v < 0)) return { ok: false, reason: 'invalido', message: 'valor negativo' };
    const nk = N / MW.Na2O + K / MW.K2O;
    const cnk = C / MW.CaO + nk;
    if (cnk <= 0 || nk <= 0) return { ok: false, reason: 'invalido', message: 'Na2O + K2O igual a zero' };
    const a = A / MW.Al2O3;
    return { ok: true, panel: 'main', xy: [a / cnk, a / nk] };
  };
  return {
    id: 'shand-1943', area: 'igneas', title: 'Índice de saturação em alumina (Shand, 1943)',
    panels: [{ id: 'main', type: 'cartesian', xLabel: 'A/CNK', yLabel: 'A/NK', xRange: R, yRange: Y }],
    fields: [
      f('metaluminous', 'Metaluminoso', '#9ecae1', [[0.5, 1], [1, 1], [1, 7], [0.5, 7]]),
      f('peraluminous', 'Peraluminoso', '#fdae6b', [[1, 1], [1.5, 1], [1.5, 7], [1, 7]]),
      f('peralkaline', 'Peralcalino', '#a1d99b', [[0.5, 0], [1.5, 0], [1.5, 1], [0.5, 1]]),
    ],
    extraLines: [{ id: 'teorica', name: 'A/NK = A/CNK (CaO = 0)', points: [[0.5, 0.5], [1.5, 1.5]] }],
    requiredColumns: [['Al2O3'], ['CaO'], ['Na2O'], ['K2O']], toPoint,
    exampleCsv: 'Amostra,Al2O3,CaO,Na2O,K2O\nExemplo 1 metaluminoso,15,8,3,1.5\nExemplo 2 peraluminoso,15,1,3,4\nExemplo 3 peralcalino,10,0.5,7,5\n',
  };
})();

// ---------- AFM (Irvine e Baragar, 1971) ----------
const AFM_CURVE: Comp[] = [[70, 30, 0], [58.8, 36.2, 5], [47.6, 42.4, 10], [29.6, 53.6, 16.8], [25.4, 54.6, 20], [21.4, 54.6, 24], [19.4, 52.8, 27.8], [18.9, 51.1, 30], [16.6, 43.4, 40], [15, 35, 50]];
// composição [topo F, esquerda A, direita M]
const toFAM = (c: Comp): Comp => [c[1], c[0], c[2]];
export const afm: DiagramDef = (() => {
  const curve = AFM_CURVE.map(toFAM);
  const base = buildTernary({
    id: 'afm', title: 'AFM (Irvine e Baragar, 1971)',
    panels: [{
      id: 'tri', offsetY: 0, corners: ['F (FeOt)', 'A (Na2O + K2O)', 'M (MgO)'], columns: ['F', 'A', 'M'],
      fields: [
        // acima da curva (mais ferro): do vértice F, pela aresta A-F até a curva, ao longo dela até M = 50 e de volta pela aresta F-M
        { name: 'Série toleítica', poly: [[100, 0, 0], ...curve, [50, 0, 50]] },
        // abaixo da curva: o restante do triângulo
        { name: 'Série cálcio-alcalina', poly: [curve[0], [0, 100, 0], [0, 0, 100], [50, 0, 50], ...curve.slice(1).reverse()] },
      ],
    }],
  });
  const toPoint: DiagramDef['toPoint'] = (row) => {
    const na = readNum(row, 'Na2O'), k = readNum(row, 'K2O'), mg = readNum(row, 'MgO');
    let fe = readNum(row, 'FeOt');
    const f2 = readNum(row, 'Fe2O3'), f1 = readNum(row, 'FeO');
    if ([na, k, mg, fe, f2, f1].some((v) => v === 'bad')) return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if (fe === null && (f2 !== null || f1 !== null)) fe = ((f2 as number | null) ?? 0) * 0.8998 + ((f1 as number | null) ?? 0);
    if (na === null || k === null || mg === null || fe === null) return { ok: false, reason: 'ausente', message: 'faltam Na2O, K2O, MgO ou ferro (FeOt, ou Fe2O3 e FeO)' };
    const [A, F, M] = [(na as number) + (k as number), fe as number, mg as number];
    if (A < 0 || F < 0 || M < 0) return { ok: false, reason: 'invalido', message: 'valor negativo' };
    const s = A + F + M;
    if (s <= 0) return { ok: false, reason: 'invalido', message: 'A + F + M igual a zero' };
    return { ok: true, panel: 'tri', xy: compXY([(F * 100) / s, (A * 100) / s, (M * 100) / s]) };
  };
  base.toPoint = toPoint;
  base.requiredColumns = [['Na2O'], ['K2O'], ['FeOt'], ['MgO']];
  base.optionalColumns = [['Fe2O3'], ['FeO']];
  base.fromPoint = undefined;
  base.extraLines = [{ id: 'curva', name: 'Irvine e Baragar (1971)', points: curve.map((c) => compXY(c)), panel: 'tri' }];
  base.exampleCsv = 'Amostra,Na2O,K2O,FeOt,MgO\nExemplo 1 toleítica,2.5,0.8,12,6\nExemplo 2 cálcio-alcalina,3.5,2,6,3\n';
  return base;
})();

// ---------- eixos logarítmicos digitalizados ----------
const PN_X = (px: number) => 1 + (px - 59.0) / 189.4; // log10 Zr   (Zr 10 em x = 59,0 ; 1000 em 437,8)
const PN_Y = (py: number) => (393.6 - py) / 257.95; //   log10 Zr/Y (1 em y = 393,6 ; 20 em 58,0)
const pn = (pts: [number, number][]): Pt[] => pts.map(([x, y]) => [PN_X(x), PN_Y(y)]);

export const pearceNorry: DiagramDef = (() => {
  const mk = (id: string, name: string, color: string, poly: Pt[]): Field => ({ id, name, color, polygon: poly, panel: 'main', opacity: 0.25 });
  const fields = [
    mk('iab', 'Basaltos de arco de ilha (IAB)', '#6baed6', pn([[102.68, 359.95], [205.01, 359.95], [259.89, 263.29], [162.06, 263.29]])),
    mk('morb', 'Basaltos de cadeia meso-oceânica (MORB)', '#74c476', pn([[162.06, 321.67], [269.98, 321.67], [334.53, 250.1], [221.95, 250.1]])),
    mk('wpb', 'Basaltos intraplaca (WPB)', '#fd8d3c', pn([[221.9, 250.1], [309.4, 135.7], [395.8, 135.7], [309.4, 250.1]])),
  ];
  const toPoint: DiagramDef['toPoint'] = (row) => {
    const zr = readNum(row, 'Zr'), y = readNum(row, 'Y');
    if (zr === 'bad' || y === 'bad') return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if (zr === null || y === null) return { ok: false, reason: 'ausente', message: 'faltam Zr e Y' };
    if (zr <= 0 || y <= 0) return { ok: false, reason: 'invalido', message: 'Zr e Y devem ser maiores que zero' };
    return { ok: true, panel: 'main', xy: [Math.log10(zr), Math.log10(zr / y)] };
  };
  return {
    id: 'pearce-norry-1979', area: 'igneas', title: 'Zr – Zr/Y (Pearce e Norry, 1979)',
    panels: [{ id: 'main', type: 'cartesian', xLabel: 'Zr (ppm)', yLabel: 'Zr/Y', xRange: [1, 3], yRange: [0, Math.log10(20)], xLog: true, yLog: true }],
    fields, requiredColumns: [['Zr'], ['Y']], toPoint,
    classify(row): Classification {
      const p = toPoint(row, {});
      if (!p.ok) return { status: p.reason, message: p.message };
      const inside = fields.filter((f) => pointInPolygon(p.xy, f.polygon) !== 'outside');
      const base = { panel: p.panel, xy: p.xy };
      if (inside.length === 1) return { status: 'ok', name: inside[0].name, fieldId: inside[0].id, ...base };
      if (inside.length === 0) return { status: 'fora do campo', message: 'fora dos três campos', ...base };
      return { status: 'ambiguo', name: `Sobreposição: ${inside.map((f) => f.id.toUpperCase()).join(' / ')}`, message: 'os campos de Pearce e Norry se sobrepõem nesta região', ...base };
    },
    exampleCsv: 'Amostra,Zr,Y\nExemplo 1 IAB,30,20\nExemplo 2 MORB,100,40\nExemplo 3 WPB,280,40\nExemplo 4 fora,1500,10\n',
  };
})();

// Winchester e Floyd (1977): Nb/Y x Zr/TiO2, calibração do PNG (x: Nb/Y 0,01 em 78 px e 10 em 1559; y: Zr/TiO2 5 em 78 px e 0,001 em 720)
const WF_X = (px: number) => -2 + (px - 78) / 493.7;
const WF_Y = (py: number) => Math.log10(5) - (py - 78) / 173.4;
const wf = (pts: [number, number][]): Pt[] => pts.map(([x, y]) => [WF_X(x), WF_Y(y)]);

export const winchesterFloyd: DiagramDef = (() => {
  const L = 78, Rr = 1559, T = 78, B = 720;
  const P1: [number, number] = [973, 385], P2: [number, number] = [1052, 353], P3: [number, number] = [1106, 377], P4: [number, number] = [1203, 175];
  const P5: [number, number] = [1166, 78], P6: [number, number] = [1433, 441], P7: [number, number] = [827, 224], P9: [number, number] = [973, 471];
  const P10: [number, number] = [973, 497], P11: [number, number] = [1138, 477], P12: [number, number] = [1294, 515];
  const up: [number, number][] = [[1225, 240], [1285, 278], [1451, 325]];
  const mk = (id: string, name: string, color: string, poly: [number, number][]): Field => ({ id, name, color, polygon: wf(poly), panel: 'main', opacity: 0.22 });
  const fields = [
    mk('phonolite', 'Fonolito', '#bcbddc', [P5, [Rr, T], [Rr, 347], ...up.slice().reverse(), P4]),
    mk('trachyte', 'Traquito', '#9e9ac8', [P4, ...up, [Rr, 347], [Rr, 441], P6, P3]),
    mk('comendite', 'Comendito / Pantelerito', '#fcbba1', [[827, T], P5, P4, P3, P2, P7]),
    mk('rhyolite', 'Riolito', '#fb6a4a', [[L, T], [827, T], P7, P2, P1, [710, 359], [L, 359]]),
    mk('rhyodacite', 'Riodacito / Dacito', '#fdae6b', [[L, 359], [710, 359], P1, P9, [845, 477], [247, 411], [L, 411]]),
    mk('andesite', 'Andesito', '#fdd0a2', [[L, 411], [247, 411], [845, 477], P9, P10, [905, 523], [905, 521], [457, 532], [L, 532]]),
    mk('and-bas', 'Andesito / Basalto', '#c7e9c0', [[L, 532], [457, 532], [905, 521], [905, 523], [730, 590], [290, 602], [L, 602]]),
    mk('subalk', 'Basalto subalcalino', '#74c476', [[L, B], [973, B], P10, [905, 523], [730, 590], [290, 602], [L, 602]]),
    mk('trachyandesite', 'Traquiandesito', '#c6dbef', [P1, P2, P3, P6, P12, P11, P10]),
    mk('alkbas', 'Basalto alcalino', '#9ecae1', [P10, P11, P12, [1294, B], [973, B]]),
    mk('basanite', 'Basanito / Nefelinito', '#6baed6', [P12, P6, [Rr, 441], [Rr, B], [1294, B]]),
  ];
  const toPoint: DiagramDef['toPoint'] = (row) => {
    const nb = readNum(row, 'Nb'), y = readNum(row, 'Y'), zr = readNum(row, 'Zr'), ti = readNum(row, 'TiO2');
    if ([nb, y, zr, ti].some((v) => v === 'bad')) return { ok: false, reason: 'invalido', message: 'valor não numérico' };
    if ([nb, y, zr, ti].some((v) => v === null)) return { ok: false, reason: 'ausente', message: 'faltam Nb, Y, Zr ou TiO2' };
    const [NB, Y, ZR, TI] = [nb, y, zr, ti] as number[];
    if (NB <= 0 || Y <= 0 || ZR <= 0 || TI <= 0) return { ok: false, reason: 'invalido', message: 'os valores devem ser maiores que zero' };
    // Zr em ppm, TiO2 em wt% convertido a ppm (x 10000), como no gráfico do GCDkit
    return { ok: true, panel: 'main', xy: [Math.log10(NB / Y), Math.log10(ZR / (TI * 1e4))] };
  };
  return {
    id: 'winchester-floyd-1977', area: 'igneas', title: 'Nb/Y – Zr/TiO₂ (Winchester e Floyd, 1977)',
    panels: [{ id: 'main', type: 'cartesian', xLabel: 'Nb/Y', yLabel: 'Zr/TiO₂', xRange: [-2, 1], yRange: [-3, Math.log10(5)], xLog: true, yLog: true }],
    fields, requiredColumns: [['Nb'], ['Y'], ['Zr'], ['TiO2']], toPoint,
    exampleCsv: 'Amostra,Nb,Y,Zr,TiO2\nExemplo 1 basalto subalcalino,5,30,100,2\nExemplo 2 andesito,10,25,200,1\nExemplo 3 traquiandesito,30,35,300,1.5\nExemplo 4 riolito,30,60,500,0.3\nExemplo 5 traquito,100,50,900,0.5\n',
  };
})();

export const geoquimica: DiagramDef[] = [shand, afm, pearceNorry, winchesterFloyd];
void ({} as Row);
