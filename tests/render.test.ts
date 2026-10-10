import { renderDiagram, type PlotPoint } from '../src/core/render';
import { tas } from '../src/diagrams/tas';
import { qapfPlutonic } from '../src/diagrams/qapf-plutonic';

const pt = (id: string, xy: [number, number], extra: Partial<PlotPoint> = {}): PlotPoint =>
  ({ id, label: id, xy, panel: 'tas', classification: 'Basalto', ...extra });

describe('renderDiagram', () => {
  it('TAS: 15 campos e rotulos de eixo', () => {
    const svg = renderDiagram(tas, []);
    expect(svg.querySelectorAll('path.field')).toHaveLength(15);
    const text = svg.textContent ?? '';
    expect(text).toContain('SiO2');
    expect(text).toContain('Na2O + K2O');
  });
  it('pontos com title de hover', () => {
    const svg = renderDiagram(tas, [pt('A1', [48, 2]), pt('A2', [60, 3]), pt('A3', [70, 8])]);
    const pts = svg.querySelectorAll('.pt');
    expect(pts).toHaveLength(3);
    expect(pts[0].querySelector('title')?.textContent).toBe('A1 — Basalto');
  });
  it('sem pontos nao quebra e nao gera NaN', () => {
    const svg = renderDiagram(tas, []);
    expect(svg.outerHTML).not.toContain('NaN');
  });
  it('pontos fora da faixa ou nao finitos sao ignorados', () => {
    const svg = renderDiagram(tas, [pt('a', [200, 2]), pt('b', [NaN, 2]), pt('c', [50, 3])]);
    expect(svg.querySelectorAll('.pt')).toHaveLength(1);
    expect(svg.outerHTML).not.toContain('NaN');
  });
  it('grupos geram simbolos/cores distintos e legenda', () => {
    const svg = renderDiagram(tas, [pt('a', [48, 2], { group: 'G1' }), pt('b', [60, 3], { group: 'G2' })]);
    expect(svg.querySelectorAll('.legend-item')).toHaveLength(2);
  });
  it('QAPF: dois triangulos e 20+ campos', () => {
    const svg = renderDiagram(qapfPlutonic, [{ id: 'x', label: 'x', xy: [0.5, 0.3], panel: 'qap', classification: 'Monzogranito' }]);
    expect(svg.querySelectorAll('path.field').length).toBe(qapfPlutonic.fields.length);
    expect(svg.querySelectorAll('path.outline')).toHaveLength(2);
    expect(svg.querySelectorAll('.pt')).toHaveLength(1);
    expect(svg.outerHTML).not.toContain('NaN');
  });
});
