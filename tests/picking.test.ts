import { classifyRow } from '../src/core/classify';
import { clientToDiagram, getTransform } from '../src/core/render';
import { tas } from '../src/diagrams/tas';
import { qapfPlutonic } from '../src/diagrams/qapf-plutonic';
import { qapfXY } from '../src/diagrams/qapf-shared';
import { mountApp } from '../src/ui/app';

describe('fromPoint', () => {
  it('TAS: devolve SiO2, alcalis em Na2O e K2O = 0; fora do dominio e null', () => {
    expect(tas.fromPoint!([60.004, 3.1])).toEqual({ SiO2: 60, Na2O: 3.1, K2O: 0 });
    expect(tas.fromPoint!([40, 3])).toBeNull();
    expect(tas.fromPoint!([60, 17])).toBeNull();
    expect(classifyRow(tas, tas.fromPoint!([60, 3])!).name).toBe('Andesito');
  });
  it('QAPF: ida e volta com qapfXY nos dois triangulos', () => {
    for (const [panel, t, a, p] of [['qap', 30, 35, 35], ['qap', 10, 5, 85], ['apf', 20, 60, 20], ['apf', 5, 45, 50]] as const) {
      const row = qapfPlutonic.fromPoint!(qapfXY(panel, t, a, p))!;
      const T = panel === 'qap' ? row.Q : row.F;
      expect(T as number).toBeCloseTo(t, 0);
      expect(row.A as number).toBeCloseTo(a, 0);
      expect(row.P as number).toBeCloseTo(p, 0);
      expect(panel === 'qap' ? row.F : row.Q).toBe(0);
    }
  });
  it('QAPF: fora dos triangulos e null', () => {
    expect(qapfPlutonic.fromPoint!([0.05, 0.8])).toBeNull();
    expect(qapfPlutonic.fromPoint!([-0.2, 0.1])).toBeNull();
    expect(qapfPlutonic.fromPoint!([0.5, 2])).toBeNull();
  });
  it('clique em um ponto classificado cai no mesmo campo', () => {
    const row = qapfPlutonic.fromPoint!(qapfXY('qap', 30, 35, 35))!;
    expect(classifyRow(qapfPlutonic, row).name).toBe('Monzogranito');
  });
});

describe('modo de pontos livres', () => {
  let root: HTMLElement;
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById('app')!;
    mountApp(root);
  });
  const svg = () => root.querySelector<SVGSVGElement>('#chart svg')!;
  const clickAt = (x: number, y: number) => {
    const tf = getTransform(svg())!;
    root.querySelector('#chart')!.dispatchEvent(new MouseEvent('click', {
      bubbles: true, clientX: tf.ox + (x - tf.x0) * tf.sx, clientY: tf.oy - (y - tf.y0) * tf.sy,
    }));
  };
  const toggle = () => root.querySelector<HTMLButtonElement>('#pick-mode')!.click();

  it('conversao pixel -> diagrama inverte o renderizador', () => {
    const tf = getTransform(svg())!;
    const [x, y] = clientToDiagram(svg(), tf.ox + (55 - tf.x0) * tf.sx, tf.oy - (4 - tf.y0) * tf.sy)!;
    expect(x).toBeCloseTo(55); expect(y).toBeCloseTo(4);
  });

  it('com a tabela vazia cria colunas e linhas; cada clique adiciona um ponto', () => {
    toggle();
    clickAt(60, 3);
    clickAt(75, 8);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(root.querySelectorAll('#chart .pt')).toHaveLength(2);
    const cls = [...root.querySelectorAll('td.cls')].map((c) => c.textContent);
    expect(cls).toEqual(['Andesito', 'Riolito']);
    const heads = [...root.querySelectorAll('thead th')].map((t) => t.textContent);
    expect(heads).toEqual(expect.arrayContaining(['Amostra', 'Grupo', 'SiO2', 'Na2O', 'K2O']));
    const labels = [...root.querySelectorAll<HTMLInputElement>('td input[aria-label^="Amostra"]')].map((i) => i.value);
    expect(labels).toEqual(['Ponto livre 1', 'Ponto livre 2']);
    expect(root.querySelectorAll('.legend-item')).toHaveLength(1);
  });

  it('fora do modo, o clique nao faz nada; clique fora do diagrama e ignorado', () => {
    clickAt(60, 3);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(0);
    toggle();
    clickAt(30, 3);
    clickAt(60, 20);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('usa as colunas ja mapeadas e preserva as linhas existentes', () => {
    const ta = root.querySelector<HTMLTextAreaElement>('#paste')!;
    ta.value = 'Nome\tSiO2 (wt%)\tNa2O\tK2O\nA\t48\t2\t1\n';
    root.querySelector<HTMLButtonElement>('#load-paste')!.click();
    toggle();
    clickAt(66, 3);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    expect([...root.querySelectorAll('thead th')].map((t) => t.textContent)).not.toContain('SiO2');
    expect([...root.querySelectorAll('td.cls')].map((c) => c.textContent)).toEqual(['Basalto', 'Dacito']);
  });

  it('QAPF: clique no triangulo de cima e no de baixo', () => {
    root.querySelector<HTMLButtonElement>('[data-diagram="qapf-plutonica"]')!.click();
    toggle();
    clickAt(...(qapfXY('qap', 30, 35, 35) as [number, number]));
    clickAt(...(qapfXY('apf', 30, 70, 0.2) as [number, number]));
    const cls = [...root.querySelectorAll('td.cls')].map((c) => c.textContent);
    expect(cls).toEqual(['Monzogranito', 'Foid sienito']);
  });

  it('seletor de diagrama junto do botao troca o diagrama e acompanha o menu', () => {
    const sel = root.querySelector<HTMLSelectElement>('#diagram-select')!;
    expect(sel.value).toBe('tas');
    sel.value = 'qapf-vulcanica';
    sel.dispatchEvent(new Event('change'));
    expect(root.querySelector('h1.title')!.textContent).toContain('vulcânicas');
    root.querySelector<HTMLButtonElement>('[data-diagram="qapf-plutonica"]')!.click();
    expect(sel.value).toBe('qapf-plutonica');
  });

  it('o botao fica no mesmo bloco do titulo, antes do grafico', () => {
    const main = root.querySelector('main')!;
    const order = [...main.children].map((c) => c.className || c.tagName);
    expect(order.indexOf('toolbar')).toBeGreaterThan(-1);
    expect(order.indexOf('toolbar')).toBeLessThan(order.indexOf('chart'));
    expect(main.querySelector('.toolbar #pick-mode')).not.toBeNull();
  });

  it('Escape desliga o modo', () => {
    toggle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(root.querySelector('#pick-mode')!.getAttribute('aria-pressed')).toBe('false');
    clickAt(60, 3);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(0);
  });
});
