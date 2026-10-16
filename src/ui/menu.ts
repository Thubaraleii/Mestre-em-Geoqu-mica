export interface MenuModule { id: string; title: string; diagramId?: string }
export interface MenuArea { id: string; title: string; modules: MenuModule[] }

const m = (title: string, diagramId?: string): MenuModule => ({ id: diagramId ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title, diagramId });

export const menuTree: MenuArea[] = [
  { id: 'igneas', title: 'Geologia Ígnea', modules: [
    m('Diagrama QAPF: rochas plutônicas', 'qapf-plutonica'),
    m('Diagrama QAPF: rochas vulcânicas', 'qapf-vulcanica'),
    m('Diagrama TAS', 'tas'),
    m('Magma-tipos do Paraná (Peate et al., 1992)', 'peate-1992'),
    m('Peate · Fig. 7a: Fe₂O₃(t) × TiO₂ (alto-Ti)', 'peate-7a'),
    m('Peate · Fig. 7b: Zr/Y × Sr (alto-Ti)', 'peate-7b'),
    m('Peate · Fig. 8a: Zr/Y × Ti/Zr (baixo-Ti)', 'peate-8a'),
    m('Peate · Fig. 8b: Sr × Ti/Y (baixo-Ti)', 'peate-8b'),
    m('Ultramáficas: Ol – Opx – Cpx', 'ultramaficas-opx-cpx'),
    m('Ultramáficas: Ol – Px – Hbl', 'ultramaficas-px-hbl'),
    m('Rochas gabroicas: Plag – Px – Ol', 'gabroicas-plag-px-ol'),
    m('Rochas gabroicas: Plag – Px – Hbl', 'gabroicas-plag-px-hbl'),
    m('Nomenclatura de produtos piroclásticos'),
    m('Classificação de tufos', 'tufos'),
    m('Estruturas e texturas ígneas'),
  ] },
  { id: 'sedimentar', title: 'Geologia Sedimentar', modules: [
    m('Nomenclatura de granulometria'),
    m('Classificação de arenitos e grauvacas', 'arenitos'),
    m('Classificação de conglomerados'),
    m('Grau de esfericidade e arredondamento'),
    m('Grau de seleção'),
    m('Estruturas e texturas sedimentares'),
  ] },
  { id: 'metamorfica', title: 'Geologia Metamórfica', modules: [
    m('Nomenclatura de rochas metamórficas'),
    m('Fácies e condições de metamorfismo termal'),
    m('Estruturas e texturas metamórficas'),
  ] },
  { id: 'estrutural', title: 'Geologia Estrutural', modules: [
    m('Principais indicadores cinemáticos'),
    m('Classificação de dobras com base no ângulo interflanco'),
    m('Classificação de dobras de Fleuty'),
    m('Propriedades geométricas de dobras'),
    m('Classificação de tectonitos de falhas'),
  ] },
  { id: 'estratigrafia', title: 'Estratigrafia e Geocronologia', modules: [m('Tabela cronoestratigráfica')] },
  { id: 'cartografia', title: 'Cartografia Geológica', modules: [
    m('Convenções geológicas cartográficas'),
    m('Convenções litológicas cartográficas'),
    m('Mapa Geológico do Brasil 1:1.000.000'),
    m('Exagero vertical'),
  ] },
  { id: 'estimativa', title: 'Descrição e estimativa visual', modules: [m('Estimativa de porcentagem')] },
];

export function renderMenu(active: string, onSelect: (diagramId: string) => void): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'menu';
  for (const area of menuTree) {
    const details = document.createElement('details');
    details.open = area.modules.some((x) => x.diagramId) || area.id === active;
    const sum = document.createElement('summary');
    sum.textContent = area.title;
    details.appendChild(sum);
    for (const mod of area.modules) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'menu-item';
      b.textContent = mod.title;
      if (mod.diagramId) {
        b.dataset.diagram = mod.diagramId;
        if (mod.diagramId === active) b.classList.add('active');
        b.addEventListener('click', () => onSelect(mod.diagramId!));
      } else {
        b.disabled = true;
        const soon = document.createElement('span');
        soon.className = 'soon';
        soon.textContent = 'em breve';
        b.appendChild(soon);
      }
      details.appendChild(b);
    }
    nav.appendChild(details);
  }
  return nav;
}
