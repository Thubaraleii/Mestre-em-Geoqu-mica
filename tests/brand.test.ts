import { readFileSync } from 'node:fs';
import { renderMenu } from '../src/ui/menu';
import { mountApp } from '../src/ui/app';
import emblem from '../src/assets/emblema.svg?raw';
import favicon from '../public/favicon.svg?raw';
import appIcon from '../public/app-icon.svg?raw';

const PALETTE = ['#1e1e22', '#3a3a40', '#6b6b73', '#7a1f28', '#d6d3cb', '#f6f3ee'];

describe('identidade visual MAFic', () => {
  it('emblema, favicon e icone do app em SVG valido, com as cores da paleta', () => {
    for (const [name, svg] of [['emblema', emblem], ['favicon', favicon], ['app-icon', appIcon]] as const) {
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      expect(doc.documentElement.nodeName, name).toBe('svg');
      expect(doc.querySelector('parsererror'), name).toBeNull();
      expect(svg.toLowerCase(), name).toContain('#7a1f28'); // feicoes geologicas (veio vinho)
      expect(svg.toLowerCase(), name).toContain('#1e1e22'); // basalto
      expect(svg.toLowerCase(), name).toContain('#f6f3ee'); // off-white (veios da rocha)
    }
  });
  it('as cores da paleta estao nos tokens do CSS', () => {
    const css = readFileSync('src/ui/styles.css', 'utf8').toLowerCase();
    for (const c of PALETTE) expect(css, c).toContain(c);
  });

  it('cabecalho tem o emblema, o nome e o tagline; titulo da pagina', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    expect(root.querySelector('.brand .logo svg')).not.toBeNull();
    expect(root.querySelector('.brand-text strong')!.textContent).toBe('MAFic');
    expect(root.querySelector('.brand-text .sub')!.textContent).toBe('Meu Ábaco Favorito');
    expect(root.querySelector('.brand-text small')!.textContent).toBe('Ábacos • Gráficos • Diagramas geológicos');
  });
});

describe('busca no menu', () => {
  const titles = (nav: HTMLElement) => [...nav.querySelectorAll('.menu-item')].map((b) => b.textContent ?? '');
  it('sem filtro mostra as 7 areas', () => {
    expect(renderMenu('tas', () => {}).querySelectorAll('details')).toHaveLength(7);
  });
  it('filtra por nome, sem diferenciar acentos nem maiusculas', () => {
    const nav = renderMenu('tas', () => {}, 'PEATE');
    expect(titles(nav).length).toBeGreaterThan(5);
    for (const t of titles(nav)) expect(t.toLowerCase()).toContain('peate');
    expect(titles(renderMenu('tas', () => {}, 'fácies')).some((t) => t.startsWith('Fácies'))).toBe(true);
    expect(titles(renderMenu('tas', () => {}, 'facies')).some((t) => t.startsWith('Fácies'))).toBe(true);
  });
  it('filtra por area: "sedimentar" lista os modulos de Geologia Sedimentar', () => {
    const nav = renderMenu('tas', () => {}, 'sedimentar');
    expect(nav.querySelectorAll('details')).toHaveLength(1);
    expect(titles(nav).some((t) => t.startsWith('Classificação de arenitos'))).toBe(true);
  });
  it('sem resultado mostra aviso; grupos filtrados ficam abertos', () => {
    const none = renderMenu('tas', () => {}, 'zzzzz');
    expect(none.querySelector('.menu-empty')!.textContent).toBe('Nenhum módulo encontrado.');
    expect(none.querySelectorAll('.menu-item')).toHaveLength(0);
    for (const d of renderMenu('tas', () => {}, 'tufos').querySelectorAll('details')) expect((d as HTMLDetailsElement).open).toBe(true);
  });
  it('digitar na caixa de busca atualiza o menu da interface', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    const box = root.querySelector<HTMLInputElement>('#menu-search')!;
    box.value = 'spider';
    box.dispatchEvent(new Event('input'));
    const items = [...root.querySelectorAll('.menu-item')].map((b) => b.textContent);
    expect(items).toEqual(['Spider multielementar (manto primitivo)', 'Spider de ETR (manto primitivo)']);
    box.value = '';
    box.dispatchEvent(new Event('input'));
    expect(root.querySelectorAll('.menu details')).toHaveLength(7);
  });
  it('trocar de diagrama mantem o filtro digitado', () => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById('app')!;
    mountApp(root);
    const box = root.querySelector<HTMLInputElement>('#menu-search')!;
    box.value = 'tas';
    box.dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('[data-diagram="tas"]')!.click();
    expect(box.value).toBe('tas');
    expect(root.querySelectorAll('.menu details').length).toBeLessThan(7);
  });
});
