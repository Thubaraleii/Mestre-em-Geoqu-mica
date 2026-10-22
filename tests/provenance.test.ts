import { classifyRow } from '../src/core/classify';
import { rowsToCsv } from '../src/core/export';
import { diagrams, getDiagram } from '../src/diagrams';
import { PROVENANCE, provenanceOf, schemeId } from '../src/diagrams/provenance';
import { importProject, exportProject } from '../src/data/store';
import { mountApp } from '../src/ui/app';
import type { DiagramDef } from '../src/core/types';

describe('procedência dos esquemas', () => {
  it('todo módulo registrado tem procedência, versão e ao menos uma fonte (ou justificativa)', () => {
    const faltam = diagrams.filter((d) => !PROVENANCE[d.id]).map((d) => d.id);
    expect(faltam).toEqual([]);
    for (const d of diagrams) {
      const p = provenanceOf(d.id);
      expect(p.version, d.id).toMatch(/^\d+\.\d+\.\d+$/);
      expect(p.sources.length + p.verified.length, d.id).toBeGreaterThan(0);
    }
  });
  it('não existe procedência para módulo que não existe', () => {
    for (const id of Object.keys(PROVENANCE)) expect(getDiagram(id), id).toBeDefined();
  });
  it('status honesto: o QAPF vulcânico é "assumido" e nada fica "verificado" sem dizer o que foi conferido', () => {
    expect(provenanceOf('qapf-vulcanica').status).toBe('assumido');
    expect(provenanceOf('qapf-plutonica').status).toBe('reconstruido');
    for (const [id, p] of Object.entries(PROVENANCE)) {
      if (p.status === 'verificado') expect(p.verified.length, id).toBeGreaterThan(0);
      if (p.status === 'assumido') expect(p.pending.length, id).toBeGreaterThan(0);
    }
  });
  it('o TAS carrega a versão que mudou com a correção da geometria', () => {
    expect(schemeId('tas')).toBe('tas@1.1.0');
  });
});

describe('código estável de classe', () => {
  const def = (id: string) => getDiagram(id) as DiagramDef;
  it('usa o id semântico do campo quando há (TAS, Peate) e o nome sem acentos quando o id depende da ordem', () => {
    expect(classifyRow(def('tas'), { SiO2: 48, Na2O: 2, K2O: 0 }).code).toBe('tas:basalt');
    expect(classifyRow(def('peate-1992'), { SiO2: 54, TiO2: 1, P2O5: 0.1, Fe2O3t: 11, Sr: 200, Ba: 250, Zr: 110, Y: 28 }).code).toBe('peate-1992:gramado');
    expect(classifyRow(def('qapf-plutonica'), { Q: 30, A: 35, P: 35, F: 0 }).code).toBe('qapf-plutonica:monzogranito');
    expect(classifyRow(def('granulometria'), { Diametro: 1.5 }).code).toBe('granulometria:areia-muito-grossa');
  });
  it('amostras sem classe não têm código', () => {
    expect(classifyRow(def('tas'), { SiO2: 48 }).code).toBeUndefined();
  });
  it('o código não muda com o texto exibido (peate com marca de LOI)', () => {
    const ok = { SiO2: 54, TiO2: 1, P2O5: 0.1, Fe2O3t: 11, Sr: 200, Ba: 250, Zr: 110, Y: 28 };
    expect(classifyRow(def('peate-1992'), { ...ok, LOI: 3.5 }).code).toBe(classifyRow(def('peate-1992'), ok).code);
  });
});

describe('exportações carregam o esquema', () => {
  it('CSV: colunas Código, Esquema e Procedência', () => {
    const d = getDiagram('tas')!;
    const c = classifyRow(d, { SiO2: 48, Na2O: 2, K2O: 0 });
    const csv = rowsToCsv([{ SiO2: 48 }], [c], { id: schemeId('tas'), status: provenanceOf('tas').status }).replace(/^﻿/, '');
    const [head, line] = csv.split('\r\n');
    expect(head).toBe('SiO2;Classificação;Status;Código;Esquema;Procedência');
    expect(line).toBe('48;Basalto;ok;tas:basalt;tas@1.1.0;verificado');
  });
  it('CSV sem esquema mantém o formato antigo', () => {
    const csv = rowsToCsv([{ a: 1 }], [{ status: 'ok', name: 'X' }]).replace(/^﻿/, '');
    expect(csv.split('\r\n')[0]).toBe('a;Classificação;Status');
  });
  it('projeto .json grava o esquema e continua importável', () => {
    const p = { rows: [{ a: 1 }], headers: ['a'], mapping: {}, diagramId: 'tas' };
    const json = exportProject(p, { esquema: schemeId('tas') });
    expect(JSON.parse(json).esquema).toBe('tas@1.1.0');
    expect(importProject(json)).toEqual(p);
  });
});

describe('selo de procedência na interface', () => {
  it('mostra o selo, a versão e os pontos a conferir; muda ao trocar de módulo', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    expect(root.querySelector('#provenance .badge')!.textContent).toBe('verificado contra fonte independente');
    expect(root.querySelector('#provenance .scheme-id')!.textContent).toBe('tas@1.1.0');
    expect(root.querySelector('#provenance .pending-count')!.textContent).toMatch(/ponto/);
    root.querySelector<HTMLButtonElement>('[data-diagram="qapf-vulcanica"]')!.click();
    expect(root.querySelector('#provenance .badge')!.textContent).toBe('assumido, sem fonte');
    expect(root.querySelector('#provenance .badge')!.className).toContain('badge-assumido');
    expect(root.querySelectorAll('#provenance .prov-pending li').length).toBeGreaterThan(0);
  });
});
