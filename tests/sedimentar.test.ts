import { classifyRow } from '../src/core/classify';
import { getDiagram } from '../src/diagrams';
import { sigmaFolkWard } from '../src/diagrams/sedimentar';
import { parseText } from '../src/data/parse';
import type { DiagramDef, Row } from '../src/core/types';

const def = (id: string) => getDiagram(id) as DiagramDef;
const c = (id: string, row: Row) => classifyRow(def(id), row);

describe('arredondamento (Powers, 1953)', () => {
  it.each([[0.12, 'Muito anguloso'], [0.16, 'Muito anguloso'], [0.17, 'Anguloso'], [0.25, 'Subanguloso'], [0.35, 'Subarredondado'], [0.49, 'Arredondado'], [0.7, 'Bem arredondado'], [1, 'Bem arredondado']])('%d -> %s', (r, n) => {
    expect(c('arredondamento', { Arredondamento: r }).name).toBe(n);
  });
  it('esfericidade e anexada; invalida e recusada', () => {
    expect(c('arredondamento', { Arredondamento: 0.3, Esfericidade: 'Alta' }).message).toBe('esfericidade alta');
    expect(c('arredondamento', { Arredondamento: 0.3, Esfericidade: 'média' }).status).toBe('invalido');
    expect(c('arredondamento', { Arredondamento: 0.3 }).message).toBeUndefined();
  });
  it('faixas: abaixo de 0,12 fora do campo; fora de 0-1 invalido; ausente', () => {
    expect(c('arredondamento', { Arredondamento: 0.05 }).status).toBe('fora do campo');
    expect(c('arredondamento', { Arredondamento: 1.5 }).status).toBe('invalido');
    expect(c('arredondamento', { Arredondamento: null }).status).toBe('ausente');
  });
});

describe('selecao (Folk e Ward, 1957)', () => {
  it.each([[0.2, 'Muito bem selecionado'], [0.35, 'Bem selecionado'], [0.49, 'Bem selecionado'], [0.5, 'Moderadamente selecionado'], [0.99, 'Moderadamente selecionado'], [1, 'Mal selecionado'], [1.99, 'Mal selecionado'], [2, 'Muito mal selecionado'], [5, 'Muito mal selecionado']])('sigma %d -> %s', (s, n) => {
    expect(c('selecao', { Sigma: s }).name).toBe(n);
  });
  it('calcula sigma dos percentis: (phi84-phi16)/4 + (phi95-phi5)/6.6', () => {
    expect(sigmaFolkWard(-1, 0, 2.5, 3.5)).toBeCloseTo(2.5 / 4 + 4.5 / 6.6, 9);
    const r = c('selecao', { Phi5: -1, Phi16: 0, Phi84: 2.5, Phi95: 3.5 });
    expect(r.name).toBe('Mal selecionado');
    expect(r.message).toContain('calculado dos percentis');
    expect(r.message).toContain('1,31');
  });
  it('sigma informado tem prioridade; ausente, invalido e percentis fora de ordem', () => {
    expect(c('selecao', { Sigma: 0.2, Phi5: -1, Phi16: 0, Phi84: 2.5, Phi95: 3.5 }).name).toBe('Muito bem selecionado');
    expect(c('selecao', {}).status).toBe('ausente');
    expect(c('selecao', { Phi5: -1, Phi16: 0, Phi84: 2.5 }).status).toBe('ausente');
    expect(c('selecao', { Sigma: -1 }).status).toBe('invalido');
    expect(c('selecao', { Phi5: 1, Phi16: 0, Phi84: 2, Phi95: 3 }).status).toBe('invalido');
    expect(c('selecao', { Sigma: 'x' as unknown as number }).status).toBe('invalido');
  });
});

describe('exemplos', () => {
  it.each([['arredondamento'], ['selecao']])('%s: todas as linhas do exemplo classificam', (id) => {
    for (const r of parseText(def(id).exampleCsv!).rows) expect(classifyRow(def(id), r).status, String(r.Amostra)).toBe('ok');
  });
});
