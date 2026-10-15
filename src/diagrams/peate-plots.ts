// Diagramas de variação de Peate, Hawkesworth & Mantovani (1992), Figs. 7 e 8:
//   7a  Fe2O3(t) x TiO2   (alto-Ti)     7b  Zr/Y x Sr     (alto-Ti)
//   8a  Zr/Y x Ti/Zr      (baixo-Ti)    8b  Sr x Ti/Y     (baixo-Ti)
// O artigo mostra só os dados; as caixas de cada magma-tipo são montadas a partir dos limites
// da Tabela 2 nas duas variáveis do gráfico (um campo "> v" vai de v até o fim do eixo).
// Os pontos são coloridos pelo magma-tipo que a classificação de 12 critérios atribuiu.
import type { Pt } from '../core/geometry';
import type { Classification, DiagramDef, Field, Row } from '../core/types';
import { classifyPeate, criteriaValues, PEATE_TYPES, type Rule } from './peate';

type Axis = { key: string; label: string; range: [number, number] };
interface PlotSpec {
  id: string; title: string; x: Axis; y: Axis; types: string[]; required: string[][];
}

export const PEATE_COLORS: Record<string, string> = {
  urubici: '#e41a1c', pitanga: '#ff7f00', paranapanema: '#984ea3',
  ribeira: '#377eb8', esmeralda: '#4daf4a', gramado: '#a65628',
};

/** legenda e cor do ponto: o magma-tipo atribuído, ou uma categoria neutra */
export function peatePointStyle(c: Classification): { group: string; color: string } {
  const t = c.status === 'ok' ? PEATE_TYPES.find((x) => x.id === c.fieldId) : undefined;
  if (t) return { group: t.name, color: PEATE_COLORS[t.id] };
  if (c.status === 'ambiguo') return { group: 'Ambíguo', color: '#666666' };
  if (c.status === 'nao classificado') return { group: 'Não classificado', color: '#111111' };
  return { group: 'Dados insuficientes', color: '#9e9e9e' };
}

const SPECS: PlotSpec[] = [
  { id: 'peate-7a', title: 'Peate et al. (1992), Fig. 7a: Fe₂O₃(t) × TiO₂ (alto-Ti)',
    x: { key: 'TiO2', label: 'TiO₂ (wt%)', range: [0, 6] }, y: { key: 'Fe2O3t', label: 'Fe₂O₃(t) (wt%)', range: [8, 20] },
    types: ['urubici', 'pitanga', 'paranapanema'], required: [['TiO2'], ['Fe2O3t']] },
  { id: 'peate-7b', title: 'Peate et al. (1992), Fig. 7b: Zr/Y × Sr (alto-Ti)',
    x: { key: 'Sr', label: 'Sr (ppm)', range: [0, 1400] }, y: { key: 'ZrY', label: 'Zr/Y', range: [2, 12] },
    types: ['urubici', 'pitanga', 'paranapanema'], required: [['Sr'], ['Zr'], ['Y']] },
  { id: 'peate-8a', title: 'Peate et al. (1992), Fig. 8a: Zr/Y × Ti/Zr (baixo-Ti)',
    x: { key: 'TiZr', label: 'Ti/Zr', range: [20, 120] }, y: { key: 'ZrY', label: 'Zr/Y', range: [2, 8] },
    types: ['ribeira', 'esmeralda', 'gramado'], required: [['TiO2'], ['Zr'], ['Y']] },
  { id: 'peate-8b', title: 'Peate et al. (1992), Fig. 8b: Sr × Ti/Y (baixo-Ti)',
    x: { key: 'TiY', label: 'Ti/Y', range: [100, 700] }, y: { key: 'Sr', label: 'Sr (ppm)', range: [0, 450] },
    types: ['ribeira', 'esmeralda', 'gramado'], required: [['TiO2'], ['Y'], ['Sr']] },
];

/** intervalo coberto por uma regra da Tabela 2, recortado ao eixo */
function span(rule: Rule, [min, max]: [number, number]): [number, number] {
  if ('gt' in rule) return [Math.max(min, rule.gt), max];
  if ('lt' in rule) return [min, Math.min(max, rule.lt)];
  return [Math.max(min, rule.range[0]), Math.min(max, rule.range[1])];
}

const ALL_INPUTS = [['SiO2'], ['TiO2'], ['P2O5'], ['Fe2O3t'], ['FeOt'], ['Sr'], ['Ba'], ['Zr'], ['Y'], ['LOI']];

function build(s: PlotSpec): DiagramDef {
  const fields: Field[] = s.types.map((id) => {
    const t = PEATE_TYPES.find((x) => x.id === id)!;
    const [x0, x1] = span(t.rules[s.x.key], s.x.range);
    const [y0, y1] = span(t.rules[s.y.key], s.y.range);
    const polygon: Pt[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    return { id, name: t.name, color: PEATE_COLORS[id], panel: 'main', polygon, opacity: 0.2 };
  });
  const toPoint: DiagramDef['toPoint'] = (row: Row) => {
    const v = criteriaValues(row);
    if (v === 'bad') return { ok: false, reason: 'invalido', message: 'valor não numérico ou negativo' };
    const x = v[s.x.key], y = v[s.y.key];
    if (x === null || y === null) return { ok: false, reason: 'ausente', message: `faltam dados para ${s.x.label} e ${s.y.label}` };
    return { ok: true, panel: 'main', xy: [x, y] };
  };
  const requiredFlat = new Set(s.required.flat());
  const def: DiagramDef = {
    id: s.id, area: 'igneas', title: s.title,
    panels: [{ id: 'main', type: 'cartesian', xLabel: s.x.label, yLabel: s.y.label, xRange: s.x.range, yRange: s.y.range }],
    fields,
    requiredColumns: s.required,
    optionalColumns: ALL_INPUTS.filter(([c]) => !requiredFlat.has(c)),
    options: [{ id: 'prioridade', label: 'Se Urubici e Pitanga coincidirem, escolher Urubici (limites mais restritivos)' }],
    defaultOptions: { prioridade: true },
    pointStyle: peatePointStyle,
    toPoint,
    // a cor do ponto é o resultado do Peate; o ponto é plotado mesmo sem dados para classificar
    classify(row, opts): Classification {
      const c = classifyPeate(row, opts);
      const p = toPoint(row, opts);
      return p.ok ? { ...c, panel: p.panel, xy: p.xy } : c;
    },
  };
  // Só dá para converter clique em dados quando as duas variáveis são medidas diretas (7a).
  if (s.x.key === 'TiO2' && s.y.key === 'Fe2O3t') {
    def.fromPoint = ([x, y]) => {
      const [[xa, xb], [ya, yb]] = [s.x.range, s.y.range];
      if (x < xa || x > xb || y < ya || y > yb) return null;
      return { TiO2: Math.round(x * 100) / 100, Fe2O3t: Math.round(y * 100) / 100 };
    };
  }
  return def;
}

export const peatePlots: DiagramDef[] = SPECS.map(build);
