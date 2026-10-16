// Tabela cronoestratigráfica: ICS International Chronostratigraphic Chart v2023/09 (dados em src/data/ics.ts, gerados
// de scripts/gen-ics.py). Calculadora: idade em Ma -> andar/unidade, com a hierarquia. Intervalo [mais novo, base):
// uma idade exatamente igual a um limite pertence à unidade mais velha, como na tabela de limites da carta.
import { ICS_ROWS, type IcsRow } from '../data/ics';
import type { Classification, DiagramDef } from '../core/types';
import { readNum } from '../core/values';

const EON: Record<string, string> = { Phanerozoic: 'Fanerozoico', Precambrian: 'Pré-cambriano' };
const ERA: Record<string, string> = {
  Cenozoic: 'Cenozoico', Mesozoic: 'Mesozoico', Paleozoic: 'Paleozoico', Proterozoic: 'Proterozoico', Archean: 'Arqueano', Hadean: 'Hadeano',
};
const PERIOD: Record<string, string> = {
  Quaternary: 'Quaternário', Neogene: 'Neógeno', Paleogene: 'Paleógeno', Cretaceous: 'Cretáceo', Jurassic: 'Jurássico', Triassic: 'Triássico',
  Permian: 'Permiano', Carboniferous: 'Carbonífero', Devonian: 'Devoniano', Silurian: 'Siluriano', Ordovician: 'Ordoviciano', Cambrian: 'Cambriano',
  Neoproterozoic: 'Neoproterozoico', Mesoproterozoic: 'Mesoproterozoico', Paleoproterozoic: 'Paleoproterozoico',
  Neoarchean: 'Neoarqueano', Mesoarchean: 'Mesoarqueano', Paleoarchean: 'Paleoarqueano', Eoarchean: 'Eoarqueano',
};
const EPOCH: Record<string, string> = {
  Holocene: 'Holoceno', Pleistocene: 'Pleistoceno', Pliocene: 'Plioceno', Miocene: 'Mioceno', Oligocene: 'Oligoceno', Eocene: 'Eoceno', Paleocene: 'Paleoceno',
  Upper: 'Superior', Middle: 'Médio', Lower: 'Inferior', Lopingian: 'Lopingiano', Guadalupian: 'Guadalupiano', Cisuralian: 'Cisuraliano',
  Pennsylvanian: 'Pensilvaniano', Mississippian: 'Mississipiano', Pridoli: 'Pridoli', Ludlow: 'Ludlow', Wenlock: 'Wenlock', Llandovery: 'Llandovery',
  Furongian: 'Furongiano', Miaolingian: 'Miaolingiano', 'Series 2': 'Série 2', Terreneuvian: 'Terra-novano',
};
const STAGE_PT: Record<string, string> = { 'Upper Pleistocene': 'Pleistoceno Superior' };

const tr = (map: Record<string, string>, k: string) => (k ? map[k] ?? k : '');
const stageName = (r: IcsRow) => (r.stage ? STAGE_PT[r.stage] ?? r.stage : tr(PERIOD, r.period) || tr(ERA, r.era));
const fmt = (n: number) => String(n).replace('.', ',');
const baseText = (r: IcsRow) => `${r.approx ? '~ ' : ''}${fmt(r.base)}${r.err ? ` ± ${fmt(r.err)}` : ''}`;

const younger = (i: number) => (i === 0 ? 0 : ICS_ROWS[i - 1].base);

export function unitAt(age: number): { row: IcsRow; younger: number } | null {
  const i = ICS_ROWS.findIndex((r, k) => age >= younger(k) && age < r.base);
  return i < 0 ? null : { row: ICS_ROWS[i], younger: younger(i) };
}

export const cronoestratigrafia: DiagramDef = {
  id: 'cronoestratigrafia', area: 'estratigrafia', kind: 'table',
  title: 'Tabela cronoestratigráfica (ICS, v2023/09)',
  panels: [], fields: [], requiredColumns: [['Idade']], toPoint: () => ({ ok: false, reason: 'invalido', message: 'este módulo não tem gráfico' }),
  referenceTable: {
    head: ['Andar / unidade', 'Éon', 'Era', 'Período', 'Época', 'Base (Ma)'],
    rows: ICS_ROWS.map((r) => [stageName(r), tr(EON, r.eon), tr(ERA, r.era), tr(PERIOD, r.period), tr(EPOCH, r.epoch), baseText(r)]),
    colors: ICS_ROWS.map((r) => r.color),
    note: 'International Chronostratigraphic Chart (ICS, v2023/09), cores da própria carta. "~" = idade aproximada. Os andares mantêm os nomes internacionais; as demais unidades estão em português. Uma idade igual a um limite pertence à unidade mais velha.',
  },
  classify(row): Classification {
    const age = readNum(row, 'Idade');
    if (age === 'bad') return { status: 'invalido', message: 'idade não numérica' };
    if (age === null) return { status: 'ausente', message: 'falta a coluna Idade (Ma)' };
    if (age < 0) return { status: 'invalido', message: 'a idade não pode ser negativa' };
    const u = unitAt(age);
    if (!u) return { status: 'fora do campo', message: 'mais velha que a Terra (4567 Ma)' };
    const r = u.row;
    const chain = [tr(EPOCH, r.epoch) && r.epoch !== r.stage ? `${tr(PERIOD, r.period)} ${tr(EPOCH, r.epoch)}`.trim() : '', tr(PERIOD, r.period), tr(ERA, r.era), tr(EON, r.eon)]
      .filter((x, i, a) => x && x !== stageName(r) && a.indexOf(x) === i);
    return { status: 'ok', name: stageName(r), message: `${chain.join(' · ')} (${fmt(u.younger)} a ${fmt(r.base)} Ma)` };
  },
  exampleCsv: 'Amostra,Idade\n' + [
    ['Holoceno recente', 0.001], ['Pleistoceno', 0.5], ['Mioceno', 12], ['Eoceno', 45], ['Limite K-Pg (66 Ma)', 66], ['Paraná-Etendeka (~134 Ma)', 134],
    ['Jurássico', 190], ['Permiano', 280], ['Carbonífero', 330], ['Devoniano', 400], ['Cambriano', 515], ['Ediacarano', 600], ['Mesoproterozoico', 1500], ['Arqueano', 2900],
  ].map(([a, b]) => `${a},${b}`).join('\n') + '\n',
};
