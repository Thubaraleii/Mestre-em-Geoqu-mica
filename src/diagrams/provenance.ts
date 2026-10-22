// Procedência e estado de verificação de cada esquema (classificação, diagrama, tabela).
// Escrito com honestidade: "publicado" só quando os valores foram copiados da publicação; "verificado" só quando
// houve conferência com uma fonte independente (e qual); o resto é digitalizado, reconstruído ou assumido.
// Os campos `verified` e `pending` dizem o que foi e o que NÃO foi conferido.
export type Status = 'publicado' | 'verificado' | 'digitalizado' | 'reconstruido' | 'assumido';

export interface Provenance {
  /** versão do esquema: muda quando a geometria, os limites ou as regras mudam */
  version: string;
  status: Status;
  sources: string[];
  verified: string[];
  pending: string[];
}

export const STATUS_LABEL: Record<Status, string> = {
  publicado: 'valores publicados',
  verificado: 'verificado contra fonte independente',
  digitalizado: 'digitalizado de figura',
  reconstruido: 'reconstruído de definições',
  assumido: 'assumido, sem fonte',
};

const P = (version: string, status: Status, sources: string[], verified: string[], pending: string[]): Provenance => ({ version, status, sources, verified, pending });

const PEATE_SRC = 'Peate, Hawkesworth & Mantovani (1992), Bull. Volcanol. 55:119-139';
const PEATE_PLOT_PENDING = ['as caixas vêm dos limites da Tabela 2 nas duas variáveis do gráfico; o artigo não desenha campos'];
const TERNARY_PENDING = ['faixas finas de 5% e 95% junto às arestas lidas de fotografia: conferir com o livro'];

export const PROVENANCE: Record<string, Provenance> = {
  tas: P('1.1.0', 'verificado', ['Le Bas et al. (1986), J. Petrol. 27:745', 'Le Maitre et al. (2002), Igneous Rocks, Cambridge'],
    ['geometria comparada com o GCDkit (Le Maitre 1989) do usuário: tests/tas-gcdkit.test.ts', 'região superior corrigida com GCDkit e SVG da Wikimedia (Le Maitre 2002)'],
    ['região superior prolongada até y = 16 por extrapolação: conferir com Le Maitre (2002)', 'divergências abertas entre as fontes: fronteira dacito/riolito e limite superior do riolito',
      'normalização anidra sem o ajuste de Fe3+/Fe2+ da IUGS (Middlemost 1989)', 'sem divisão traquito/traquidacito (exige norma CIPW), linha alcalina/subalcalina e TAS plutônico']),
  'qapf-plutonica': P('1.0.0', 'reconstruido', ['Streckeisen (1976), Earth-Sci. Rev. 12:1', 'Le Maitre et al. (2002)'],
    ['triângulo superior (Q-A-P) conferido com a transcrição do pyrolite'],
    ['triângulo inferior reconstruído de definições da BGS, não da figura', 'só aceita moda: sem cálculo de Q-A-P-F a partir de química (norma CIPW) e sem checar M < 90']),
  'qapf-vulcanica': P('1.0.0', 'assumido', ['Le Maitre et al. (2002)'], [],
    ['a geometria foi ESPELHADA do plutônico por suposição; nenhuma fonte conferida', 'nomes vulcânicos não conferidos com a figura original']),
  'peate-1992': P('1.0.0', 'publicado', [PEATE_SRC + ', Tabelas 2 e 3'],
    ['Tabela 2 transcrita do PDF original e conferida na imagem ampliada', 'médias da Tabela 3 classificadas: tests/peate-table3.test.ts'],
    ['decisões do app, não do artigo: mínimo de 5 critérios com dado e precedência Urubici sobre Pitanga', 'não verificado se os critérios valem para dados brutos ou normalizados']),
  ...Object.fromEntries(['peate-7a', 'peate-7b', 'peate-8a', 'peate-8b', 'peate-tio2-zry', 'peate-tiy-tizr', 'peate-mgo-tio2'].map((id) => [id,
    P('1.0.0', 'reconstruido', [PEATE_SRC + ', Figs. 7 e 8 (eixos)', 'Tabela 2 (limites das caixas)'], ['eixos conforme as figuras do artigo'], PEATE_PLOT_PENDING)])),
  'ultramaficas-opx-cpx': P('1.0.0', 'digitalizado', ['figura de referência do usuário (classificação IUGS de ultramáficas)'], ['limites de olivina 90/40/10 lidos da figura'], TERNARY_PENDING),
  'ultramaficas-px-hbl': P('1.0.0', 'digitalizado', ['figura de referência do usuário (classificação IUGS de ultramáficas)'], ['limites de olivina 90/40/10 lidos da figura'], TERNARY_PENDING),
  'gabroicas-plag-px-ol': P('1.0.0', 'digitalizado', ['figura de referência do usuário (classificação IUGS de rochas gabroicas)'], ['limites de plagioclásio 90/65/35/10 lidos da figura'], TERNARY_PENDING),
  'gabroicas-plag-px-hbl': P('1.0.0', 'digitalizado', ['figura de referência do usuário (classificação IUGS de rochas gabroicas)'], ['limites de plagioclásio 90/65/35/10 lidos da figura'], TERNARY_PENDING),
  tufos: P('1.0.0', 'digitalizado', ['figura de referência do usuário (classificação de tufos)'], ['três campos e limites de 50% lidos da figura'], ['conferir com a fonte original da figura (a versão de Schmid, 1981, usa 75%)']),
  arenitos: P('1.0.0', 'reconstruido', ['Dott (1964), J. Sed. Petrol. 34:625, modificado (figura de referência do usuário)'], ['campos reconstruídos das regras: quartzo arenito F e L < 5%, subarcósio/sublítico 5-25%, arcósio/lítico > 25%'], ['limites inferidos da figura; conferir com Dott (1964)']),
  granulometria: P('1.0.0', 'publicado', ['escala de granulometria e tabela de peneiras (figura de referência do usuário; Wentworth/Dott)'], ['limites copiados da figura'], ['malhas (mesh) só informativas']),
  piroclasticos: P('1.0.0', 'publicado', ['tabela de nomenclatura de produtos piroclásticos (figura de referência do usuário)'], ['limites copiados da figura'], ['subdivisão da cinza (grossa/média/fina) lida de figura de baixa resolução']),
  'dobras-interflanco': P('1.0.0', 'publicado', ['figura de referência do usuário (classificação de Fleuty/Ramsay de dobras por ângulo interflanco)'], ['limites 0/30/70/120/180 copiados da figura'], []),
  'dobras-fleuty': P('1.0.0', 'reconstruido', ['Fleuty (1964), Proc. Geol. Assoc. 75:461 (figura de referência do usuário)'], ['limites de 10/30/60/80 graus copiados da figura'], ['a regra que compõe os nomes é do app', 'linha das dobras reclinadas (pitch de 80 graus) deduzida da figura']),
  'exagero-vertical': P('1.0.0', 'publicado', ['Loczi e Ladeira (1976); tan(aparente) = exagero x tan(real)'], ['fórmula trigonométrica exata'], []),
  conglomerados: P('1.0.0', 'publicado', ['Pettijohn (1975), modificado (figura de referência do usuário)'], ['regras copiadas da figura'], ['a figura não define o critério petromítico x polimítico']),
  tectonitos: P('1.0.0', 'publicado', ['Sibson (1977), J. Geol. Soc. 133:191 (figura de referência do usuário)'], ['regras e limites copiados da figura'], ['células "?" da figura não têm nome definido']),
  'rochas-metamorficas': P('1.0.0', 'publicado', ['tabela de nomenclatura de rochas metamórficas (figura de referência do usuário)'], ['texto da tabela copiado'], []),
  'estimativa-porcentagem': P('1.0.0', 'reconstruido', ['CPRM, caderneta de campo (figura de referência do usuário)'], ['a área coberta de cada círculo é calculada'], ['desenhos gerados pelo app, não as figuras originais']),
  'convencoes-litologicas': P('1.0.0', 'reconstruido', ['legenda de convenções litológicas (figura de referência do usuário)'], ['nomes e cores sugeridas copiados da legenda'], ['padrões desenhados à mão pelo app; conferir com a convenção oficial (FGDC-STD-013-2006 / IBGE)']),
  arredondamento: P('1.0.0', 'reconstruido', ['Powers (1953), J. Sed. Petrol. 23:117'], ['seis classes conforme a figura de referência'], ['limites numéricos do índice de arredondamento escritos de memória: conferir com Powers (1953)']),
  selecao: P('1.0.0', 'reconstruido', ['Folk e Ward (1957), J. Sed. Petrol. 27:3'], ['fórmula do desvio-padrão gráfico inclusivo'], ['as 7 classes originais foram agrupadas em 5 pelo app', 'limites escritos de memória: conferir com Folk e Ward (1957)']),
  cronoestratigrafia: P('1.0.0', 'digitalizado', ['ICS International Chronostratigraphic Chart v2023/09 (stratigraphy.org)'], ['12 limites principais conferidos por teste', 'cores lidas do próprio PDF'], ['nomes e idades dos 117 andares transcritos à mão da imagem: falta conferência automática completa']),
  'shand-1943': P('1.0.0', 'publicado', ['Shand (1943), Eruptive Rocks', 'Frost et al. (2001), J. Petrol. 42:2033'], ['linhas A/NK = 1 e A/CNK = 1 do PDF do GCDkit do usuário'], ['sem correção de apatita por padrão', 'sem tratamento de CaO insuficiente']),
  afm: P('1.0.0', 'digitalizado', ['Irvine e Baragar (1971), Can. J. Earth Sci. 8:523', 'curva do PDF do GCDkit do usuário'], ['curva de 9 pontos (M de 5 a 50%) extraída do PDF vetorial'], ['as pontas da curva foram prolongadas até as arestas por extrapolação do app']),
  'pearce-norry-1979': P('1.0.0', 'digitalizado', ['Pearce e Norry (1979), Contrib. Mineral. Petrol. 69:33', 'campos do GCDkit do usuário'], ['três paralelogramos extraídos do PDF vetorial'], ['não conferido com a figura original de 1979', 'diagramas discriminantes são probabilísticos (Vermeesch, 2006)']),
  'winchester-floyd-1977': P('1.0.0', 'digitalizado', ['Winchester e Floyd (1977), Chem. Geol. 20:325', 'PNG do GCDkit do usuário'], ['os 11 rótulos do PNG caem no campo certo'], ['fronteiras digitalizadas de imagem (erro de cerca de 0,03 década)', 'Zr em ppm e TiO2 convertido a ppm: inferido dos seus pontos, não da publicação']),
  'spider-manto-primitivo': P('1.0.0', 'reconstruido', ['Sun e McDonough (1989), Geol. Soc. Spec. Publ. 42:313'], ['ordem dos elementos igual à do GCDkit do usuário'], ['valores de normalização escritos de memória: conferir com a publicação']),
  'spider-ree': P('1.0.0', 'reconstruido', ['Sun e McDonough (1989), Geol. Soc. Spec. Publ. 42:313'], ['ordem dos elementos igual à do GCDkit do usuário'], ['valores de normalização escritos de memória: conferir com a publicação']),
};

export function provenanceOf(id: string): Provenance {
  return PROVENANCE[id] ?? P('0.0.0', 'assumido', [], [], ['sem registro de procedência']);
}

/** identificador estável do esquema, gravado nas exportações */
export const schemeId = (id: string) => `${id}@${provenanceOf(id).version}`;
