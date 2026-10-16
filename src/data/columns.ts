const SUBSCRIPTS: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

/** minúsculas, sem acentos, sem unidades (wt%, %, parênteses), sem espaços/_/-/. */
export function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[₀-₉]/g, (c) => SUBSCRIPTS[c])
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/wt\.?\s*%?|%|ppm/g, '')
    .replace(/[\s_.\-]+/g, '');
}

const ALIASES: Record<string, string[]> = {
  FeOt: ['feot', 'feototal', 'totalfeo', 'feo*', 'feotot'],
  Idade: ['idade', 'age', 'ma', 'idadema'],
  Nb: ['nb', 'niobio'],
  Y: ['y', 'ittrio', 'yttrium'],
  Zr: ['zr', 'zirconio'],
  Ol: ['ol', 'olivina', 'olivine'],
  Opx: ['opx', 'ortopiroxenio', 'orthopyroxene'],
  Cpx: ['cpx', 'clinopiroxenio', 'clinopyroxene'],
  Px: ['px', 'piroxenio', 'pyroxene'],
  Hbl: ['hbl', 'hornblenda', 'hornblende'],
  Plag: ['plag', 'pl', 'plagioclasio', 'plagioclase'],
  Vidro: ['vidro', 'glass', 'gl', 'vit'],
  FragRocha: ['fragrocha', 'frag', 'fragmentos', 'fragmentosderocha', 'rockfragments', 'lithics'],
  Cristais: ['cristais', 'cristal', 'crystals', 'cryst'],
  Feld: ['feld', 'feldspato', 'feldspar', 'fk', 'f'],
  Lit: ['lit', 'l', 'lithic', 'liticos', 'fragmentosliticos'],
  Matriz: ['matriz', 'matrix', 'mat'],
  Q: ['q', 'qtz', 'quartz', 'quartzo'],
  A: ['a', 'afs', 'kfs', 'af', 'alkalifeldspar', 'feldspatoalcalino', 'kfeldspar'],
  P: ['p', 'pl', 'plag', 'plagioclase', 'plagioclasio'],
  F: ['f', 'foid', 'foids', 'feldspathoid', 'feldspatoide', 'feldspatoides'],
};

export function detectColumns(headers: string[], required: string[][]): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  const norm = headers.map(normalizeHeader);
  for (const canon of required.flat()) {
    const wanted = new Set([normalizeHeader(canon), ...(ALIASES[canon] ?? [])]);
    const i = norm.findIndex((n) => wanted.has(n));
    out[canon] = i >= 0 ? headers[i] : null;
  }
  return out;
}

const LABELS = ['amostra', 'amostras', 'sample', 'samples', 'sampleid', 'id', 'nome', 'name'];
const GROUPS = ['grupo', 'group', 'unidade', 'unit', 'litologia', 'lithology', 'rocha', 'rock', 'formacao', 'formation'];

export function detectSpecial(headers: string[]): { label: string | null; group: string | null } {
  const norm = headers.map(normalizeHeader);
  const find = (list: string[]) => {
    const i = norm.findIndex((n) => list.includes(n));
    return i >= 0 ? headers[i] : null;
  };
  return { label: find(LABELS), group: find(GROUPS) };
}
