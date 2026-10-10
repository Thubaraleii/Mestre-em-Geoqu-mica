import * as XLSX from 'xlsx';
import { parseText, parseXlsx } from '../src/data/parse';
import { detectColumns, detectSpecial } from '../src/data/columns';
import { exportProject, importProject, loadProject, saveProject, type Project } from '../src/data/store';

describe('parseText', () => {
  it('colado do Excel (tab) com virgula decimal', () => {
    const { headers, rows } = parseText('Amostra\tSiO2\tNa2O\nA1\t49,5\t3,2\nA2\t60\t\n');
    expect(headers).toEqual(['Amostra', 'SiO2', 'Na2O']);
    expect(rows).toEqual([{ Amostra: 'A1', SiO2: 49.5, Na2O: 3.2 }, { Amostra: 'A2', SiO2: 60, Na2O: null }]);
  });
  it('CSV com ponto e virgula', () => {
    const { rows } = parseText('a;b\n1,5;2\n');
    expect(rows).toEqual([{ a: 1.5, b: 2 }]);
  });
  it('CSV com virgula e aspas', () => {
    const { headers, rows } = parseText('id,nota\n"x,1",3.5\n');
    expect(headers).toEqual(['id', 'nota']);
    expect(rows).toEqual([{ id: 'x,1', nota: 3.5 }]);
  });
  it('texto nao numerico permanece texto; linhas vazias ignoradas; cabecalhos repetidos', () => {
    const { headers, rows } = parseText('x,x\n<0.01,2\n\n,\n');
    expect(headers).toEqual(['x', 'x_2']);
    expect(rows).toEqual([{ x: '<0.01', x_2: 2 }]);
  });
  it('vazio', () => {
    expect(parseText('')).toEqual({ headers: [], rows: [] });
    expect(parseText('SiO2,K2O').rows).toEqual([]);
  });
});

describe('parseXlsx', () => {
  it('le a primeira planilha', () => {
    const ws = XLSX.utils.aoa_to_sheet([['SiO2', 'Grupo'], [50, 'A'], [null, 'B']]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'S1');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const { rows } = parseXlsx(buf);
    expect(rows).toEqual([{ SiO2: 50, Grupo: 'A' }, { SiO2: null, Grupo: 'B' }]);
  });
});

describe('detectColumns', () => {
  it('variacoes de SiO2', () => {
    for (const h of ['SiO2', 'SiO2 (wt%)', 'sio2_wt', 'SiO2 %', 'SiO₂', 'SIO2 wt.%']) {
      expect(detectColumns([h], [['SiO2']]).SiO2).toBe(h);
    }
  });
  it('ausente vira null; outros nomes', () => {
    const m = detectColumns(['Sample', 'SiO2', 'Na2O (wt%)', 'Quartzo', 'Plagioclásio'], [['SiO2'], ['K2O'], ['Na2O'], ['Q'], ['P']]);
    expect(m).toEqual({ SiO2: 'SiO2', K2O: null, Na2O: 'Na2O (wt%)', Q: 'Quartzo', P: 'Plagioclásio' });
  });
  it('rotulo e grupo', () => {
    expect(detectSpecial(['Amostra', 'SiO2', 'Litologia'])).toEqual({ label: 'Amostra', group: 'Litologia' });
    expect(detectSpecial(['SiO2'])).toEqual({ label: null, group: null });
  });
});

describe('store', () => {
  const p: Project = { rows: [{ a: 1 }], headers: ['a'], mapping: { SiO2: 'a' }, groupColumn: 'a', diagramId: 'tas' };
  it('ida e volta', () => {
    expect(importProject(exportProject(p))).toEqual(p);
  });
  it('importacao invalida lanca erro', () => {
    expect(() => importProject('{"foo":1}')).toThrow();
    expect(() => importProject('nao json')).toThrow();
  });
  it('save/load e tolera localStorage quebrado', () => {
    saveProject(p);
    expect(loadProject()).toEqual(p);
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('bloqueado'); };
    expect(loadProject()).toBeNull();
    Storage.prototype.getItem = orig;
  });
});
