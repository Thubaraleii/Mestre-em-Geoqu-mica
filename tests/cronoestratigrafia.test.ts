import { classifyRow } from '../src/core/classify';
import { getDiagram } from '../src/diagrams';
import { unitAt } from '../src/diagrams/cronoestratigrafia';
import { ICS_ROWS } from '../src/data/ics';
import { parseText } from '../src/data/parse';
import { mountApp } from '../src/ui/app';
import type { DiagramDef } from '../src/core/types';

const def = getDiagram('cronoestratigrafia') as DiagramDef;
const c = (Idade: number | null) => classifyRow(def, { Idade });

describe('dados da carta ICS 2023/09', () => {
  it('ordem decrescente de idade e limites oficiais conhecidos', () => {
    for (let i = 1; i < ICS_ROWS.length; i++) expect(ICS_ROWS[i].base, ICS_ROWS[i].stage).toBeGreaterThan(ICS_ROWS[i - 1].base);
    const base = (stage: string) => ICS_ROWS.find((r) => r.stage === stage)!.base;
    expect(base('Gelasian')).toBe(2.58); // base do Quaternario
    expect(base('Aquitanian')).toBe(23.03); // base do Neogeno
    expect(base('Danian')).toBe(66.0); // base do Cenozoico
    expect(base('Berriasian')).toBe(145.0); // base do Cretaceo
    expect(base('Hettangian')).toBe(201.4); // base do Jurassico
    expect(base('Induan')).toBe(251.902); // base do Triassico / Mesozoico
    expect(base('Asselian')).toBe(298.9); // base do Permiano
    expect(base('Tournaisian')).toBe(358.9); // base do Carbonifero
    expect(base('Lochkovian')).toBe(419.2); // base do Devoniano
    expect(base('Rhuddanian')).toBe(443.8); // base do Siluriano
    expect(base('Tremadocian')).toBe(485.4); // base do Ordoviciano
    expect(base('Fortunian')).toBe(538.8); // base do Cambriano / Fanerozoico
    expect(ICS_ROWS[ICS_ROWS.length - 1].base).toBe(4567);
  });
  it('todas as linhas tem cor lida do PDF', () => {
    expect(ICS_ROWS.filter((r) => !r.color)).toEqual([]);
    for (const r of ICS_ROWS) expect(r.color).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('quatro grandes divisoes: 4 eras do Fanerozoico/Pre-cambriano e contagem de andares', () => {
    expect(new Set(ICS_ROWS.map((r) => r.era))).toEqual(new Set(['Cenozoic', 'Mesozoic', 'Paleozoic', 'Proterozoic', 'Archean', 'Hadean']));
    expect(ICS_ROWS.filter((r) => r.eon === 'Phanerozoic')).toHaveLength(102);
  });
});

describe('idade (Ma) -> unidade', () => {
  it.each([
    [0.001, 'Meghalayan'], [0.0042, 'Northgrippian'], [0.5, 'Chibanian'], [5, 'Zanclean'], [10, 'Tortonian'], [12, 'Serravallian'], [45, 'Lutetian'],
    [66, 'Maastrichtian'], [65.9, 'Danian'], [134, 'Valanginian'], [190, 'Pliensbachian'], [252, 'Changhsingian'], [280, 'Kungurian'],
    [330, 'Serpukhovian'], [400, 'Emsian'], [515, 'Stage 3'], [600, 'Ediacaran'], [1500, 'Calymmian'], [2900, 'Mesoarqueano'], [4000, 'Eoarqueano'], [4500, 'Hadeano'],
  ])('%d Ma -> %s', (age, n) => {
    expect(c(age).name).toBe(n);
  });
  it('mensagem traz a hierarquia e o intervalo', () => {
    const r = c(134);
    expect(r.message).toContain('Cretáceo Inferior');
    expect(r.message).toContain('Mesozoico');
    expect(r.message).toContain('Fanerozoico');
    expect(r.message).toContain('132,6 a 139,8 Ma');
  });
  it('um limite pertence a unidade mais velha; idade 0 e valida', () => {
    expect(unitAt(66)!.row.stage).toBe('Maastrichtian');
    expect(c(0).name).toBe('Meghalayan');
  });
  it('invalido, ausente e mais velho que a Terra', () => {
    expect(c(-1).status).toBe('invalido');
    expect(c(null).status).toBe('ausente');
    expect(c(5000).status).toBe('fora do campo');
    expect(c(4567).status).toBe('fora do campo');
    expect(classifyRow(def, { Idade: 'x' as unknown as number }).status).toBe('invalido');
  });
  it('exemplo classifica todas as linhas', () => {
    for (const r of parseText(def.exampleCsv!).rows) expect(classifyRow(def, r).status, String(r.Amostra)).toBe('ok');
  });
});

describe('tabela na interface', () => {
  it('mostra todas as linhas coloridas, destaca a unidade da amostra e conta', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    root.querySelector<HTMLButtonElement>('[data-diagram="cronoestratigrafia"]')!.click();
    root.querySelector<HTMLButtonElement>('#example')!.click();
    expect(root.querySelectorAll('#chart table.reftable tbody tr')).toHaveLength(117);
    const first = root.querySelector<HTMLElement>('#chart table.reftable tbody tr th')!;
    expect(first.style.borderLeft).toContain('14px solid');
    expect(root.querySelectorAll('#chart tr.hit').length).toBeGreaterThan(10);
    expect(root.querySelector('#chart tr.sel')!.getAttribute('data-key')).toBe('Meghalayan');
  });
});
