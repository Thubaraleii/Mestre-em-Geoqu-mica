import { FEOT_TO_FE2O3T, TI_PPM_PER_TIO2 } from '../src/core/constants';
import { classifyRow } from '../src/core/classify';
import { pointInPolygon } from '../src/core/geometry';
import { renderDiagram } from '../src/core/render';
import { getDiagram } from '../src/diagrams';
import { mountApp } from '../src/ui/app';
import type { DiagramDef, Row } from '../src/core/types';

const ids = ['peate-7a', 'peate-7b', 'peate-8a', 'peate-8b'];
const def = (id: string) => getDiagram(id) as DiagramDef;

const URUBICI: Row = { SiO2: 50, TiO2: 4, P2O5: 0.6, Fe2O3t: 13, Sr: 700, Ba: 800, Zr: 300, Y: 40 };
const PITANGA: Row = { SiO2: 48, TiO2: 3.2, P2O5: 0.45, Fe2O3t: 15, Sr: 450, Ba: 500, Zr: 280, Y: 38 };
const RIBEIRA: Row = { SiO2: 50, TiO2: 2, P2O5: 0.3, Fe2O3t: 14, Sr: 300, Ba: 400, Zr: 150, Y: 37 };
const ESMERALDA: Row = { SiO2: 52, TiO2: 1.3, P2O5: 0.15, Fe2O3t: 13, Sr: 180, Ba: 200, Zr: 100, Y: 26 };

const inside = (d: DiagramDef, fieldName: string, xy: [number, number]) =>
  pointInPolygon(xy, d.fields.find((f) => f.name === fieldName)!.polygon) !== 'outside';

describe('diagramas de variacao de Peate et al. (1992), Figs. 7 e 8', () => {
  it('quatro diagramas registrados, com tres campos (tipos) cada', () => {
    for (const id of ids) {
      expect(def(id), id).toBeDefined();
      expect(def(id).fields).toHaveLength(3);
      expect(def(id).title).toContain('Peate');
    }
    expect(def('peate-7a').fields.map((f) => f.name)).toEqual(['Urubici', 'Pitanga', 'Paranapanema']);
    expect(def('peate-8a').fields.map((f) => f.name)).toEqual(['Ribeira', 'Esmeralda', 'Gramado']);
  });

  it('eixos: variaveis certas em cada figura', () => {
    const lab = (id: string) => [def(id).panels[0].xLabel, def(id).panels[0].yLabel].join(' | ');
    expect(lab('peate-7a')).toBe('TiO₂ (wt%) | Fe₂O₃(t) (wt%)');
    expect(lab('peate-7b')).toBe('Sr (ppm) | Zr/Y');
    expect(lab('peate-8a')).toBe('Ti/Zr | Zr/Y');
    expect(lab('peate-8b')).toBe('Ti/Y | Sr (ppm)');
  });

  it('caixas vem da Tabela 2: 7a (TiO2 x Fe2O3t)', () => {
    const d = def('peate-7a');
    const [[xmin, xmax], [ymin, ymax]] = [d.panels[0].xRange!, d.panels[0].yRange!];
    const box = (n: string) => {
      const xs = d.fields.find((f) => f.name === n)!.polygon.map((p) => p[0]);
      const ys = d.fields.find((f) => f.name === n)!.polygon.map((p) => p[1]);
      return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    };
    expect(box('Urubici')).toEqual([3.3, xmax, ymin, 14.5]); // TiO2 > 3.3 ; Fe2O3(t) < 14.5
    expect(box('Pitanga')).toEqual([2.8, xmax, 12.5, 18]); // TiO2 > 2.8 ; Fe2O3(t) 12.5-18
    expect(box('Paranapanema')).toEqual([1.7, 3.2, 12.5, 17]);
    expect(xmin).toBeLessThan(1.7); expect(ymax).toBeGreaterThan(18);
  });

  it('caixas 8b (Ti/Y x Sr): Ribeira Ti/Y > 300 e Sr 200-375; Esmeralda Ti/Y < 330 e Sr < 250', () => {
    const d = def('peate-8b');
    const r = d.fields.find((f) => f.name === 'Ribeira')!.polygon;
    const e = d.fields.find((f) => f.name === 'Esmeralda')!.polygon;
    expect(Math.min(...r.map((p) => p[0]))).toBe(300);
    expect([Math.min(...r.map((p) => p[1])), Math.max(...r.map((p) => p[1]))]).toEqual([200, 375]);
    expect(Math.max(...e.map((p) => p[0]))).toBe(330);
    expect(Math.max(...e.map((p) => p[1]))).toBe(250);
  });

  it('pontos caem onde os valores mandam', () => {
    expect(def('peate-7a').toPoint(URUBICI, {})).toEqual({ ok: true, panel: 'main', xy: [4, 13] });
    const p7b = def('peate-7b').toPoint(PITANGA, {});
    expect(p7b.ok && p7b.xy[0]).toBe(450);
    expect(p7b.ok && p7b.xy[1]).toBeCloseTo(280 / 38, 9);
    const p8a = def('peate-8a').toPoint(ESMERALDA, {});
    expect(p8a.ok && p8a.xy[0]).toBeCloseTo((1.3 * TI_PPM_PER_TIO2) / 100, 9);
    const p8b = def('peate-8b').toPoint(RIBEIRA, {});
    expect(p8b.ok && p8b.xy).toEqual([(2 * TI_PPM_PER_TIO2) / 37, 300]);
  });

  it('amostras tipicas caem dentro da caixa do proprio tipo', () => {
    const at = (id: string, row: Row) => {
      const p = def(id).toPoint(row, {});
      if (!p.ok) throw new Error('sem ponto');
      return p.xy;
    };
    expect(inside(def('peate-7a'), 'Urubici', at('peate-7a', URUBICI))).toBe(true);
    expect(inside(def('peate-7a'), 'Pitanga', at('peate-7a', PITANGA))).toBe(true);
    expect(inside(def('peate-7a'), 'Urubici', at('peate-7a', PITANGA))).toBe(false); // Fe2O3 15 > 14.5
    expect(inside(def('peate-8a'), 'Esmeralda', at('peate-8a', ESMERALDA))).toBe(true);
    expect(inside(def('peate-8b'), 'Ribeira', at('peate-8b', RIBEIRA))).toBe(true);
    expect(inside(def('peate-8b'), 'Esmeralda', at('peate-8b', RIBEIRA))).toBe(false);
  });

  it('estilo do ponto: cor e legenda vem do magma-tipo atribuido', () => {
    for (const id of ids) expect(def(id).pointStyle).toBeTypeOf('function');
    const style = def('peate-7a').pointStyle!;
    expect(style(classifyRow(def('peate-7a'), PITANGA, { prioridade: true }))).toEqual({ group: 'Pitanga', color: '#C98A4B' });
    expect(style(classifyRow(def('peate-7a'), URUBICI, {})).group).toBe('Ambíguo');
    expect(style(classifyRow(def('peate-7a'), { TiO2: 3, Fe2O3t: 14 }, {})).group).toBe('Dados insuficientes');
  });

  it('classificacao vem do Peate e o ponto acompanha', () => {
    const c = classifyRow(def('peate-7a'), PITANGA, { prioridade: true });
    expect(c.name).toBe('Pitanga');
    expect(c.xy).toEqual([3.2, 15]);
    expect(c.panel).toBe('main');
  });

  it('dados insuficientes para classificar ainda plotam (so precisam das duas variaveis)', () => {
    const c = classifyRow(def('peate-7a'), { TiO2: 3, Fe2O3t: 14 }, {});
    expect(c.status).toBe('ausente');
    expect(c.xy).toEqual([3, 14]);
  });

  it('ausente/invalido/zero: sem NaN', () => {
    expect(def('peate-8a').toPoint({ TiO2: 1, Zr: 100 }, {}).ok).toBe(false); // falta Y
    expect(def('peate-8a').toPoint({ TiO2: 1, Zr: 100, Y: 0 }, {}).ok).toBe(false);
    expect(def('peate-7a').toPoint({ TiO2: -1, Fe2O3t: 14 }, {}).ok).toBe(false);
    expect(def('peate-7a').toPoint({ TiO2: 'x' as unknown as number, Fe2O3t: 14 }, {}).ok).toBe(false);
  });

  it('7a: clique devolve TiO2 e Fe2O3t; os demais diagramas nao tem fromPoint', () => {
    expect(def('peate-7a').fromPoint!([3.5, 14])).toEqual({ TiO2: 3.5, Fe2O3t: 14 });
    expect(def('peate-7a').fromPoint!([9, 14])).toBeNull();
    for (const id of ['peate-7b', 'peate-8a', 'peate-8b']) expect(def(id).fromPoint, id).toBeUndefined();
  });

  it('Fe2O3(t) vem de FeOt quando falta', () => {
    const p = def('peate-7a').toPoint({ TiO2: 3, FeOt: 10 }, {});
    expect(p.ok && p.xy[1]).toBeCloseTo(10 * FEOT_TO_FE2O3T, 9);
  });

  it('renderiza com 3 campos e pontos, sem NaN', () => {
    const d = def('peate-8a');
    const p = d.toPoint(ESMERALDA, {});
    if (!p.ok) throw new Error('sem ponto');
    const svg = renderDiagram(d, [{ id: '0', label: 'E', xy: p.xy, panel: p.panel, group: 'Esmeralda', classification: 'Esmeralda' }]);
    expect(svg.querySelectorAll('path.field')).toHaveLength(3);
    expect(svg.querySelectorAll('.pt')).toHaveLength(1);
    expect(svg.outerHTML).not.toContain('NaN');
  });
});

describe('Peate: graficos na interface', () => {
  let root: HTMLElement;
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById('app')!;
    mountApp(root);
    root.querySelector<HTMLButtonElement>('[data-diagram="peate-8a"]')!.click();
    root.querySelector<HTMLButtonElement>('#example')!.click();
  });

  it('menu tem os quatro graficos e o exemplo plota, colorido por magma-tipo', () => {
    for (const id of ids) expect(root.querySelector(`[data-diagram="${id}"]`), id).not.toBeNull();
    expect(root.querySelector('#chart svg')).not.toBeNull();
    expect(root.querySelectorAll('#chart .pt').length).toBeGreaterThanOrEqual(8);
    const legend = [...root.querySelectorAll('.legend-item')].map((l) => l.textContent);
    expect(legend).toEqual(expect.arrayContaining(['Ribeira', 'Esmeralda', 'Gramado']));
  });

  it('clique-para-adicionar so onde as variaveis sao medidas diretas (7a); razoes desabilitam com explicacao', () => {
    const pick = root.querySelector<HTMLButtonElement>('#pick-mode')!;
    expect(pick.disabled).toBe(true); // 8a usa Ti/Zr e Zr/Y: um clique nao define TiO2, Zr e Y
    expect(pick.title).toContain('razões');
    root.querySelector<HTMLButtonElement>('[data-diagram="peate-7a"]')!.click();
    expect(root.querySelector<HTMLButtonElement>('#pick-mode')!.disabled).toBe(false);
    expect(root.querySelector<HTMLButtonElement>('#pick-mode')!.title).toBe('');
  });

  it('exportar SVG/PNG fica habilitado nos graficos e desabilitado na tabela de criterios', () => {
    expect(root.querySelector<HTMLButtonElement>('#export-svg')!.disabled).toBe(false);
    root.querySelector<HTMLButtonElement>('[data-diagram="peate-1992"]')!.click();
    expect(root.querySelector<HTMLButtonElement>('#export-svg')!.disabled).toBe(true);
  });
});

describe('gráficos Peate da pasta "Múltiplos" do usuário', () => {
  const RIB: Row = { SiO2: 50, TiO2: 2, P2O5: 0.3, Fe2O3t: 14, Sr: 300, Ba: 400, Zr: 150, Y: 37, MgO: 6 };
  it('TiO2 x Zr/Y e Ti/Y x Ti/Zr tem as caixas dos 6 magma-tipos; MgO x TiO2 nao tem campos', () => {
    expect(def('peate-tio2-zry').fields).toHaveLength(6);
    expect(def('peate-tiy-tizr').fields).toHaveLength(6);
    expect(def('peate-mgo-tio2').fields).toHaveLength(0);
  });
  it('eixos', () => {
    const lab = (id: string) => [def(id).panels[0].xLabel, def(id).panels[0].yLabel].join(' | ');
    expect(lab('peate-tio2-zry')).toBe('TiO₂ (wt%) | Zr/Y');
    expect(lab('peate-tiy-tizr')).toBe('Ti/Zr | Ti/Y');
    expect(lab('peate-mgo-tio2')).toBe('MgO (wt%) | TiO₂ (wt%)');
  });
  it('pontos: Ribeira cai na propria caixa em Ti/Y x Ti/Zr e em TiO2 x Zr/Y', () => {
    for (const id of ['peate-tiy-tizr', 'peate-tio2-zry']) {
      const p = def(id).toPoint(RIB, {});
      expect(p.ok, id).toBe(true);
      if (p.ok) expect(inside(def(id), 'Ribeira', p.xy), id).toBe(true);
    }
    const p = def('peate-tiy-tizr').toPoint(RIB, {});
    expect(p.ok && p.xy[0]).toBeCloseTo((2 * TI_PPM_PER_TIO2) / 150, 9);
    expect(p.ok && p.xy[1]).toBeCloseTo((2 * TI_PPM_PER_TIO2) / 37, 9);
  });
  it('MgO x TiO2: ponto, colorido pela classificacao, e erros', () => {
    expect(def('peate-mgo-tio2').toPoint(RIB, {})).toEqual({ ok: true, panel: 'main', xy: [6, 2] });
    expect(def('peate-mgo-tio2').toPoint({ TiO2: 2 }, {}).ok).toBe(false);
    expect(def('peate-mgo-tio2').toPoint({ MgO: -1, TiO2: 2 }, {}).ok).toBe(false);
    const c = classifyRow(def('peate-mgo-tio2'), RIB, { prioridade: true });
    expect(c.xy).toEqual([6, 2]);
    expect(def('peate-mgo-tio2').pointStyle!(c).group).toBe('Ribeira');
    const svg = renderDiagram(def('peate-mgo-tio2'), [{ id: '0', label: 'r', xy: [6, 2], panel: 'main', classification: 'Ribeira' }]);
    expect(svg.querySelectorAll('path.field')).toHaveLength(0);
    expect(svg.querySelectorAll('.pt')).toHaveLength(1);
    expect(svg.outerHTML).not.toContain('NaN');
  });
});
