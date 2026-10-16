import { classifyRow } from '../src/core/classify';
import { getDiagram } from '../src/diagrams';
import { MULTI_ORDER, normalize, PM, REE_ORDER } from '../src/diagrams/spiders';
import { renderSpider } from '../src/ui/spiderView';
import { mountApp } from '../src/ui/app';
import { parseText } from '../src/data/parse';
import type { DiagramDef } from '../src/core/types';

const def = (id: string) => getDiagram(id) as DiagramDef;

describe('normalizacao ao manto primitivo (Sun e McDonough, 1989)', () => {
  it('ordem dos elementos igual a dos PDFs do GCDkit do usuario', () => {
    expect(MULTI_ORDER.slice(0, 12)).toEqual(['Cs', 'Rb', 'Ba', 'Th', 'U', 'Nb', 'Ta', 'K', 'La', 'Ce', 'Pb', 'Pr']);
    expect(MULTI_ORDER.slice(-8)).toEqual(['Ti', 'Gd', 'Tb', 'Dy', 'Y', 'Ho', 'Er', 'Tm', 'Yb', 'Lu'].slice(-8));
    expect(REE_ORDER).toEqual(['La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Y', 'Ho', 'Er', 'Tm', 'Yb', 'Lu']);
    for (const e of [...MULTI_ORDER, ...REE_ORDER]) expect(PM[e], e).toBeGreaterThan(0);
  });
  it('um valor igual ao manto primitivo vira 1', () => {
    const { values } = normalize({ La: PM.La, Yb: PM.Yb * 10 }, ['La', 'Yb', 'Lu']);
    expect(values[0]).toBeCloseTo(1, 9);
    expect(values[1]).toBeCloseTo(10, 9);
    expect(values[2]).toBeNull();
  });
  it('K, P e Ti vem dos oxidos (K2O x 8301, P2O5 x 4364, TiO2 x 5994) quando faltam', () => {
    const { values } = normalize({ K2O: 1, P2O5: 0.5, TiO2: 2 }, ['K', 'P', 'Ti']);
    expect(values[0]).toBeCloseTo(8301 / 250, 9);
    expect(values[1]).toBeCloseTo((0.5 * 4364) / 95, 9);
    expect(values[2]).toBeCloseTo((2 * 5994) / 1300, 9);
    // o elemento direto tem prioridade sobre o oxido
    expect(normalize({ K: 500, K2O: 1 }, ['K']).values[0]).toBeCloseTo(2, 9);
  });
  it('zero, negativo e texto nao entram na escala log; texto marca invalido', () => {
    const r = normalize({ La: 0, Ce: -1, Pr: 'x' as unknown as number }, ['La', 'Ce', 'Pr']);
    expect(r.values).toEqual([null, null, null]);
    expect(r.bad).toBe(true);
    expect(normalize({ La: 0 }, ['La']).bad).toBe(false);
  });
});

describe('classificacao (so valida/ausente) e exemplos', () => {
  it('minimo de 3 elementos', () => {
    expect(classifyRow(def('spider-ree'), { La: 20, Ce: 40 }).status).toBe('ausente');
    const r = classifyRow(def('spider-ree'), { La: 20, Ce: 40, Nd: 20 });
    expect(r.status).toBe('ok');
    expect(r.name).toBe('3 de 15 elementos');
    expect(classifyRow(def('spider-ree'), { La: 'abc' as unknown as number, Ce: 4, Nd: 5, Sm: 1 }).status).toBe('invalido');
  });
  it('exemplos classificam e plotam', () => {
    for (const id of ['spider-manto-primitivo', 'spider-ree']) {
      const rows = parseText(def(id).exampleCsv!).rows;
      expect(rows).toHaveLength(2);
      for (const r of rows) expect(classifyRow(def(id), r).status).toBe('ok');
    }
  });
});

describe('grafico spider', () => {
  it('uma linha por amostra, rotulos dos elementos e eixo log sem NaN', () => {
    const d = def('spider-ree');
    const rows = parseText(d.exampleCsv!).rows;
    const svg = renderSpider(d, rows, ['a', 'b'], ['Alto-Ti', 'Baixo-Ti']);
    expect(svg.querySelectorAll('g.spider-line')).toHaveLength(2);
    expect(svg.querySelectorAll('polyline')).toHaveLength(2);
    const labels = [...svg.querySelectorAll('text')].map((t) => t.textContent);
    for (const e of REE_ORDER) expect(labels).toContain(e);
    expect(labels).toContain('Alto-Ti');
    expect(svg.outerHTML).not.toContain('NaN');
  });
  it('sem dados desenha so os eixos', () => {
    const svg = renderSpider(def('spider-manto-primitivo'), [], [], []);
    expect(svg.querySelectorAll('g.spider-line')).toHaveLength(0);
    expect(svg.outerHTML).not.toContain('NaN');
  });
  it('lacunas: pula o elemento sem dado e liga os vizinhos', () => {
    const d = def('spider-ree');
    const svg = renderSpider(d, [{ La: 20, Ce: 40, Nd: 20, Gd: 5 }], ['x'], [undefined]);
    expect(svg.querySelectorAll('circle').length).toBe(4);
  });
});

describe('spider na interface', () => {
  it('exemplo carrega, desenha o grafico e habilita exportar SVG; clique livre desabilitado', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    root.querySelector<HTMLButtonElement>('[data-diagram="spider-manto-primitivo"]')!.click();
    root.querySelector<HTMLButtonElement>('#example')!.click();
    expect(root.querySelectorAll('#chart g.spider-line')).toHaveLength(2);
    expect(root.querySelector<HTMLButtonElement>('#export-svg')!.disabled).toBe(false);
    expect(root.querySelector<HTMLButtonElement>('#pick-mode')!.disabled).toBe(true);
    expect([...root.querySelectorAll('td.cls')].map((c) => c.textContent)).toEqual(['27 de 29 elementos', '27 de 29 elementos']);
  });
});
