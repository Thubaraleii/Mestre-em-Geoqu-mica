import type { Classification, Row } from './types';

export function svgToString(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
}

export function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const w = Number(svg.getAttribute('width')) || 800, h = Number(svg.getAttribute('height')) || 600;
  const url = URL.createObjectURL(new Blob([svgToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale; canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('canvas indisponível')); return; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('falha ao gerar PNG'))), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('falha ao carregar o SVG')); };
    img.src = url;
  });
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV para Excel pt-BR: separador ';', decimal ',', BOM UTF-8; acrescenta Classificação e Status. */
export function rowsToCsv(rows: Row[], classes: Pick<Classification, 'status' | 'name' | 'message'>[]): string {
  const headers: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!headers.includes(k)) headers.push(k);
  const lines = [[...headers, 'Classificação', 'Status'].map(csvCell).join(';')];
  rows.forEach((r, i) => {
    const c = classes[i];
    lines.push([...headers.map((h) => csvCell(r[h])), csvCell(c?.name ?? ''), csvCell(c?.status ?? '')].join(';'));
  });
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
