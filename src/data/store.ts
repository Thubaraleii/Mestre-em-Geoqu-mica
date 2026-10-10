import type { Row } from '../core/types';

export interface Project {
  rows: Row[];
  headers: string[];
  mapping: Record<string, string>;
  groupColumn?: string;
  labelColumn?: string;
  diagramId: string;
  options?: Record<string, boolean>;
}

const KEY = 'geoqmaster.project';

export function saveProject(p: Project): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* sem armazenamento: segue sem salvar */ }
}

export function loadProject(): Project | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? importProject(raw) : null;
  } catch { return null; }
}

export function exportProject(p: Project): string {
  return JSON.stringify({ app: 'geoqmaster', version: 1, ...p }, null, 2);
}

export function importProject(json: string): Project {
  const o = JSON.parse(json);
  if (!o || !Array.isArray(o.rows) || !Array.isArray(o.headers) || typeof o.diagramId !== 'string') {
    throw new Error('Arquivo de projeto inválido');
  }
  const { app: _app, version: _v, ...p } = o;
  void _app; void _v;
  return { mapping: {}, ...p } as Project;
}
