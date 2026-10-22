// Validação EXTERNA do módulo Peate: as médias de cada magma-tipo publicadas na Tabela 3 do artigo (p. 124)
// devem cair, pelos critérios da Tabela 2 (p. 123), no próprio tipo. Valores copiados do PDF original
// (Peate, Hawkesworth & Mantovani, 1992, Bull. Volcanol. 55:119-139), não derivados do código.
import { classifyRow } from '../src/core/classify';
import { peate, PEATE_TYPES } from '../src/diagrams/peate';
import type { Row } from '../src/core/types';

// Tabela 3, colunas dos basaltos (Gramado, Esmeralda, Ribeira, Paranapanema, Pitanga, Urubici); Fe2O3(t), Sr, Ba, Zr, Y em ppm
const T3: Record<string, Row> = {
  gramado: { SiO2: 53.68, TiO2: 1.43, P2O5: 0.21, Fe2O3t: 12.64, Sr: 238, Ba: 388, Zr: 166, Y: 33 },
  esmeralda: { SiO2: 51.33, TiO2: 1.55, P2O5: 0.2, Fe2O3t: 14.25, Sr: 191, Ba: 240, Zr: 131, Y: 34 },
  ribeira: { SiO2: 50.48, TiO2: 1.8, P2O5: 0.25, Fe2O3t: 13.74, Sr: 288, Ba: 337, Zr: 135, Y: 29 },
  paranapanema: { SiO2: 50.21, TiO2: 2.31, P2O5: 0.31, Fe2O3t: 14.92, Sr: 306, Ba: 290, Zr: 174, Y: 35 },
  pitanga: { SiO2: 50.52, TiO2: 3.53, P2O5: 0.56, Fe2O3t: 15.19, Sr: 466, Ba: 484, Zr: 268, Y: 41 },
  urubici: { SiO2: 51.77, TiO2: 3.74, P2O5: 0.54, Fe2O3t: 13.24, Sr: 768, Ba: 636, Zr: 307, Y: 38 },
};
const name = (id: string) => PEATE_TYPES.find((t) => t.id === id)!.name;
const run = (id: string, prioridade = true) => classifyRow(peate, T3[id], { prioridade });

describe('Peate: médias da Tabela 3 do artigo x critérios da Tabela 2', () => {
  it.each(['gramado', 'esmeralda', 'paranapanema', 'pitanga'])('a média de %s cai só no próprio tipo', (id) => {
    const r = run(id);
    expect(r.status).toBe('ok');
    expect(r.name).toBe(name(id));
  });

  it('Urubici: satisfaz também Pitanga (Fe2O3 de 13,24 está em 12,5-18); pela precedência escolhida cai em Urubici', () => {
    expect(run('urubici', false).name).toBe('Ambíguo: Urubici / Pitanga');
    expect(run('urubici', true).name).toBe('Urubici');
  });

  it('Ribeira: a média do próprio artigo satisfaz TAMBÉM os critérios de Paranapanema (sobreposição real, que o autor reconhece)', () => {
    // O texto do artigo diz que separar Paranapanema de Ribeira é "provavelmente a parte mais difusa" do esquema.
    const r = run('ribeira');
    expect(r.status).toBe('ambiguo');
    expect(r.name).toBe('Ambíguo: Paranapanema / Ribeira');
  });

  it('o limite TiO2 <= 2,3 de Ribeira é o que separa a média de Paranapanema (2,31) de Ribeira: o resultado depende de 0,01', () => {
    const near = { ...T3.paranapanema, TiO2: 2.3 };
    // com TiO2 = 2,3 a média de Paranapanema também passaria em Ribeira (limite superior inclusivo)
    expect(classifyRow(peate, near, { prioridade: true }).status).toBe('ambiguo');
  });

  it('nenhuma média basáltica fica "não classificada" nem "ausente"', () => {
    for (const id of Object.keys(T3)) expect(['ok', 'ambiguo']).toContain(run(id).status);
  });

  it('o resultado não muda se o fator Ti/TiO2 variar dentro da incerteza dos pesos atômicos (5993,2 a 5995)', () => {
    // as razões Ti/Zr e Ti/Y mudam menos de 0,03%: nenhuma média está a essa distância de um limite
    for (const id of Object.keys(T3)) {
      const base = run(id).name;
      const scaled = { ...T3[id], TiO2: (T3[id].TiO2 as number) * (5995 / 5993.2) };
      expect(classifyRow(peate, scaled, { prioridade: true }).name, id).toBe(base);
    }
  });
});
