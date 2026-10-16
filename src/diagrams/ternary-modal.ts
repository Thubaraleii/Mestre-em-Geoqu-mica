// Classificações modais em triângulos, transcritas das figuras de referência do usuário
// (ultramáficas e gabroicas: classificação IUGS; tufos; arenitos e grauvacas: Dott, 1964).
// Limites finos (faixas de 5% e 95% junto às arestas) foram lidos de fotografias: conferir com o livro.
import type { DiagramDef } from '../core/types';
import { readNum } from '../core/values';
import { bands, buildTernary, type Comp, type TriField } from './ternary-shared';

const UL = { Ol: 'Ol' };
void UL;

// ---------- Ultramáficas ----------
export const ultramaficasOpxCpx = buildTernary({
  id: 'ultramaficas-opx-cpx',
  title: 'Ultramáficas: Ol – Opx – Cpx (IUGS)',
  panels: [{
    id: 'tri', offsetY: 0, corners: ['Ol', 'Opx', 'Cpx'], columns: ['Ol', 'Opx', 'Cpx'],
    fields: bands([
      [90, 100, 0, 1, 'Dunito'],
      [40, 90, 0, 0.05, 'Harzburgito'], [40, 90, 0.05, 0.95, 'Lherzolito'], [40, 90, 0.95, 1, 'Wehrlito'],
      [10, 40, 0, 0.05, 'Olivina ortopiroxenito'], [10, 40, 0.05, 0.95, 'Olivina websterito'], [10, 40, 0.95, 1, 'Olivina clinopiroxenito'],
      [0, 10, 0, 0.05, 'Ortopiroxenito'], [0, 10, 0.05, 0.95, 'Websterito'], [0, 10, 0.95, 1, 'Clinopiroxenito'],
    ]),
  }],
});

export const ultramaficasPxHbl = buildTernary({
  id: 'ultramaficas-px-hbl',
  title: 'Ultramáficas: Ol – Px – Hbl (IUGS)',
  panels: [{
    id: 'tri', offsetY: 0, corners: ['Ol', 'Px', 'Hbl'], columns: ['Ol', 'Px', 'Hbl'],
    fields: bands([
      [90, 100, 0, 1, 'Dunito'],
      [40, 90, 0, 0.05, 'Piroxênio peridotito'], [40, 90, 0.05, 0.95, 'Piroxênio hornblenda peridotito'], [40, 90, 0.95, 1, 'Hornblenda peridotito'],
      [10, 40, 0, 0.05, 'Olivina piroxenito'], [10, 40, 0.05, 0.5, 'Olivina hornblenda piroxenito'],
      [10, 40, 0.5, 0.95, 'Olivina piroxênio hornblendito'], [10, 40, 0.95, 1, 'Olivina hornblendito'],
      [0, 10, 0, 0.05, 'Piroxenito'], [0, 10, 0.05, 0.5, 'Hornblenda piroxenito'],
      [0, 10, 0.5, 0.95, 'Piroxênio hornblendito'], [0, 10, 0.95, 1, 'Hornblendito'],
    ]),
  }],
});

// ---------- Gabroicas ----------
const MODS: [number, number, string][] = [[65, 90, ' (leuco-)'], [35, 65, ''], [10, 35, ' (mela-)']];

export const gabroicasPlagPxOl = buildTernary({
  id: 'gabroicas-plag-px-ol',
  title: 'Rochas gabroicas: Plag – Px – Ol (IUGS)',
  panels: [{
    id: 'tri', offsetY: 0, corners: ['Plag', 'Px', 'Ol'], columns: ['Plag', 'Px', 'Ol'],
    fields: [
      ...bands([[90, 100, 0, 1, 'Anortosito']]),
      ...MODS.flatMap(([t1, t2, m]) => bands([
        [t1, t2, 0, 0.05, `Gabro/Gabronorito/Norito${m}`],
        [t1, t2, 0.05, 0.95, `Olivina gabro/Olivina gabronorito/Olivina norito${m}`],
        [t1, t2, 0.95, 1, `Troctolito${m}`],
      ])),
      ...bands([[0, 10, 0, 1, 'Rochas ultramáficas com plagioclásio']]),
    ],
  }],
});

export const gabroicasPlagPxHbl = buildTernary({
  id: 'gabroicas-plag-px-hbl',
  title: 'Rochas gabroicas: Plag – Px – Hbl (IUGS)',
  panels: [{
    id: 'tri', offsetY: 0, corners: ['Plag', 'Px', 'Hbl'], columns: ['Plag', 'Px', 'Hbl'],
    fields: [
      ...bands([[90, 100, 0, 1, 'Anortosito']]),
      ...MODS.flatMap(([t1, t2, m]) => bands([
        [t1, t2, 0, 0.05, `Gabro/Gabronorito/Norito${m}`],
        [t1, t2, 0.05, 0.95, `Piroxênio hornblenda gabro/gabronorito/norito${m}`],
        [t1, t2, 0.95, 1, `Hornblenda gabro${m}`],
      ])),
      ...bands([
        [0, 10, 0, 0.05, 'Piroxenito com plagioclásio'], [0, 10, 0.05, 0.5, 'Hornblenda piroxenito com plagioclásio'],
        [0, 10, 0.5, 0.95, 'Piroxênio hornblendito com plagioclásio'], [0, 10, 0.95, 1, 'Hornblendito com plagioclásio'],
      ]),
    ],
  }],
});

// ---------- Tufos ----------
const V: Comp = [100, 0, 0], F: Comp = [0, 100, 0], X: Comp = [0, 0, 100];
const mVF: Comp = [50, 50, 0], mVX: Comp = [50, 0, 50], mFX: Comp = [0, 50, 50];
const C: Comp = [100 / 3, 100 / 3, 100 / 3];

export const tufos = buildTernary({
  id: 'tufos',
  title: 'Classificação de tufos',
  panels: [{
    id: 'tri', offsetY: 0, corners: ['Vidro', 'Fragmentos de rocha', 'Cristais'], columns: ['Vidro', 'FragRocha', 'Cristais'],
    fields: [
      { name: 'Tufo vítrico', poly: [V, mVF, C, mVX] },
      { name: 'Tufo lítico', poly: [mVF, F, mFX, C] },
      { name: 'Tufo de cristal', poly: [C, mFX, X, mVX] },
    ],
  }],
});

// ---------- Arenitos (matriz < 15%) e grauvacas (matriz 15-75%), modificado de Dott (1964) ----------
const DIAMOND: Comp[] = [[100, 0, 0], [95, 5, 0], [90, 5, 5], [95, 0, 5]];
const arenitoFields: TriField[] = [
  { name: 'Quartzo arenito', poly: DIAMOND },
  { name: 'Subarcósio', poly: [[95, 5, 0], [75, 25, 0], [50, 25, 25], [90, 5, 5]] },
  { name: 'Arenito sublítico', poly: [[95, 0, 5], [75, 0, 25], [50, 25, 25], [90, 5, 5]] },
  { name: 'Arcósio', poly: [[75, 25, 0], [0, 100, 0], [0, 50, 50], [50, 25, 25]] },
  { name: 'Arenito lítico', poly: [[75, 0, 25], [0, 0, 100], [0, 50, 50], [50, 25, 25]] },
];
const grauvacaFields: TriField[] = [
  { name: 'Quartzo grauvaca', poly: DIAMOND },
  { name: 'Grauvaca feldspática', poly: [[95, 5, 0], [0, 100, 0], [0, 50, 50], [90, 5, 5]] },
  { name: 'Grauvaca lítica', poly: [[95, 0, 5], [0, 0, 100], [0, 50, 50], [90, 5, 5]] },
];

export const arenitos: DiagramDef = buildTernary({
  id: 'arenitos',
  area: 'sedimentar',
  title: 'Classificação de arenitos (Dott, 1964, modificado)',
  panels: [
    { id: 'a', offsetY: 0, corners: ['Quartzo', 'Feldspato', 'Fragmentos líticos'], columns: ['Q', 'Feld', 'Lit'], fields: arenitoFields, extra: { Matriz: 5 } },
    { id: 'g', offsetY: -1.2, corners: ['Quartzo', 'Feldspato', 'Fragmentos líticos'], columns: ['Q', 'Feld', 'Lit'], fields: grauvacaFields, extra: { Matriz: 30 } },
  ],
  optionalColumns: [['Matriz']],
  route(row) {
    const m = readNum(row, 'Matriz');
    if (m === 'bad' || (typeof m === 'number' && m < 0)) return { fail: 'invalido', message: 'matriz inválida' };
    if (m === null || m < 15) return 'a';
    if (m <= 75) return 'g';
    return { fail: 'fora do campo', message: 'matriz > 75%: lamito/argilito, fora do diagrama de arenitos' };
  },
});

export const ternaryModal: DiagramDef[] = [ultramaficasOpxCpx, ultramaficasPxHbl, gabroicasPlagPxOl, gabroicasPlagPxHbl, tufos, arenitos];
