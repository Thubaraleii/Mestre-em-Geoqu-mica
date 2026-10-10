import * as XLSX from 'xlsx';
import type { Row } from '../core/types';

export interface Table { headers: string[]; rows: Row[] }

const NUMBER = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)(e[+-]?\d+)?$/i;

export function parseCell(v: unknown): number | string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (s === '') return null;
  if (NUMBER.test(s)) return Number(s.replace(',', '.'));
  return s;
}

function tokenize(text: string, delim: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], cur = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else quoted = false; } else cur += ch;
    } else if (ch === '"' && cur === '') quoted = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); out.push(row); row = []; cur = '';
    } else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); out.push(row); }
  return out;
}

function toTable(grid: unknown[][]): Table {
  const nonEmpty = grid.filter((r) => r.some((c) => parseCell(c) !== null));
  if (!nonEmpty.length) return { headers: [], rows: [] };
  const seen = new Map<string, number>();
  const headers = nonEmpty[0].map((h, i) => {
    let name = String(h ?? '').trim() || `col_${i + 1}`;
    const n = (seen.get(name) ?? 0) + 1;
    seen.set(name, n);
    if (n > 1) name = `${name}_${n}`;
    return name;
  });
  const rows = nonEmpty.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, parseCell(r[i])])) as Row);
  return { headers, rows };
}

export function parseText(input: string): Table {
  const text = input.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
  const delim = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
  return toTable(tokenize(text, delim));
}

export function parseXlsx(buf: ArrayBuffer): Table {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { headers: [], rows: [] };
  return toTable(XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null }));
}
