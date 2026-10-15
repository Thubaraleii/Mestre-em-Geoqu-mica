import { mountApp } from '../src/ui/app';

let root: HTMLElement;
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById('app')!;
  mountApp(root);
});

const paste = (text: string) => {
  const ta = root.querySelector<HTMLTextAreaElement>('#paste')!;
  ta.value = text;
  root.querySelector<HTMLButtonElement>('#load-paste')!.click();
};

describe('menu', () => {
  it('lista as 7 areas; TAS e QAPF ativos; demais em breve', () => {
    expect(root.querySelectorAll('.menu details')).toHaveLength(7);
    const enabled = [...root.querySelectorAll<HTMLButtonElement>('.menu-item:not(:disabled)')].map((b) => b.dataset.diagram);
    expect(enabled.sort()).toEqual(['peate-1992', 'peate-7a', 'peate-7b', 'peate-8a', 'peate-8b', 'qapf-plutonica', 'qapf-vulcanica', 'tas']);
    expect(root.querySelectorAll('.menu-item:disabled .soon').length).toBeGreaterThan(20);
  });
});

describe('fluxo de dados (TAS)', () => {
  const tsv = 'Amostra\tGrupo\tSiO2 (wt%)\tNa2O\tK2O\nA\tX\t48,5\t2,0\t0,8\nB\tX\t60\t3\t1,5\nC\tY\t75\t4\t4\nD\tY\t70\t3\t\n';

  it('cola 4 linhas: 3 pontos, classificacao preenchida e linha incompleta marcada', () => {
    paste(tsv);
    expect(root.querySelectorAll('.chart .pt')).toHaveLength(3);
    const cls = [...root.querySelectorAll('td.cls')].map((c) => c.textContent);
    expect(cls.slice(0, 3)).toEqual(['Basalto', 'Andesito', 'Riolito']);
    expect(root.querySelector('[data-status-row="3"]')!.textContent).toBe('ausente');
  });

  it('agrupar por Grupo gera legenda', () => {
    paste(tsv);
    expect(root.querySelectorAll('.legend-item')).toHaveLength(2);
  });

  it('trocar o mapeamento de coluna reclassifica', () => {
    paste('x\tSiO2\tNa2O\tK2O\nA\t48\t2\t1\n');
    expect(root.querySelectorAll('.chart .pt')).toHaveLength(1);
    const sel = root.querySelector<HTMLSelectElement>('#map-K2O')!;
    sel.value = '';
    sel.dispatchEvent(new Event('change'));
    expect(root.querySelectorAll('.chart .pt')).toHaveLength(0);
    expect(root.querySelector('[data-status-row="0"]')!.textContent).toBe('ausente');
  });

  it('editar uma celula atualiza o grafico', () => {
    paste('SiO2\tNa2O\tK2O\n48\t2\t1\n');
    const input = root.querySelector<HTMLInputElement>('td input')!;
    input.value = '66';
    input.dispatchEvent(new Event('change'));
    expect(root.querySelector('td.cls')!.textContent).toBe('Dacito');
  });

  it('exemplo TAS carrega 17 linhas e restaura apos remontar', () => {
    root.querySelector<HTMLButtonElement>('#example')!.click();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(17);
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById('app')!;
    mountApp(root);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(17);
  });

  it('tabela vazia / so cabecalho nao quebra', () => {
    paste('');
    expect(root.querySelector('#msg')!.textContent).toContain('Não encontrei dados');
    paste('SiO2\tNa2O\tK2O');
    expect(root.querySelectorAll('.chart .pt')).toHaveLength(0);
  });

  it('base anidra sem oxidos suficientes marca invalido', () => {
    paste('SiO2\tNa2O\tK2O\n48\t2\t1\n');
    const cb = root.querySelector<HTMLInputElement>('#opt-anidro')!;
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
    expect(root.querySelector('[data-status-row="0"]')!.textContent).toBe('invalido');
  });

  it('5000 linhas: plota todas e mostra no maximo 500 na tabela', () => {
    const lines = ['SiO2\tNa2O\tK2O'];
    for (let i = 0; i < 5000; i++) lines.push(`${45 + (i % 30)}\t${1 + (i % 6)}\t1`);
    paste(lines.join('\n'));
    expect(root.querySelectorAll('.chart .pt').length).toBeGreaterThan(4000);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(500);
  }, 30000);
});

describe('QAPF', () => {
  it('troca de diagrama mantem dados e classifica com Q A P F', () => {
    paste('Q\tA\tP\tF\n30\t35\t35\t0\n');
    root.querySelector<HTMLButtonElement>('[data-diagram="qapf-plutonica"]')!.click();
    expect(root.querySelectorAll('.chart .pt')).toHaveLength(1);
    expect(root.querySelector('td.cls')!.textContent).toBe('Monzogranito');
    root.querySelector<HTMLButtonElement>('[data-diagram="qapf-vulcanica"]')!.click();
    expect(root.querySelector('td.cls')!.textContent).toBe('Riolito');
  });
});
