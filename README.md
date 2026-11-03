<p align="center"><img src="public/app-icon.svg" alt="MAFic" width="96" /></p>

# MAFic — Meu Ábaco Favorito

*Ábacos • Gráficos • Diagramas geológicos.*

**Identidade visual:** paleta Basalto `#1E1E22`, Gabro `#3A3A40`, Rocha ígnea `#6B6B73`, Feições geológicas `#7A1F28`, Sedimento `#D6D3CB` e Off-white `#F6F3EE`; tipografia Montserrat. O emblema (rocha máfica com veio vinho) está em `src/assets/emblema.svg`; o favicon e o ícone do app, em `public/`.

Aplicação web que reúne diagramas e classificações geológicas. Você cola ou importa amostras, vê os pontos plotados no diagrama e recebe a classificação automática de cada uma. Roda 100% no navegador (sem servidor).

## Diagramas disponíveis

| Área | Diagrama | Entrada |
|---|---|---|
| Ígnea | TAS (Le Bas et al., 1986; Le Maitre et al., 2002) | `SiO2`, `Na2O`, `K2O` (opcional: óxidos maiores para base anidra) |
| Ígnea | QAPF plutônico (Streckeisen, 1976) | `Q`, `A`, `P`, `F` modais |
| Ígnea | QAPF vulcânico (Le Maitre et al., 2002) | `Q`, `A`, `P`, `F` modais |
| Ígnea | Magma-tipos do Paraná (Peate et al., 1992, Tabela 2) | `TiO2`, `Zr`, `Y` (mínimo) e, se houver, `SiO2`, `P2O5`, `Fe2O3t` (ou `FeOt`), `Sr`, `Ba`, `LOI` |

| Ígnea | Peate (1992), Figs. 7a, 7b, 8a, 8b: diagramas de variação | as mesmas colunas do módulo Peate |

### Magma-tipos do Paraná (Peate et al., 1992)

Aplica os 12 critérios da Tabela 2 (SiO₂, TiO₂, P₂O₅, Fe₂O₃(t), Sr, Ba, Zr, Ti/Zr, Ti/Y, Zr/Y, Sr/Y, Ba/Y) aos seis magma-tipos: Urubici, Pitanga, Paranapanema (alto-Ti) e Ribeira, Esmeralda, Gramado (baixo-Ti). Não tem gráfico: mostra a tabela de critérios e, para a linha selecionada, ✓/✗ por critério e por tipo.

- `>` e `<` são estritos; faixas são inclusivas. Ti (ppm) = TiO₂ × 5994. `FeOt` vira Fe₂O₃(t) × 1,1113 se `Fe2O3t` faltar.
- Um tipo é atribuído quando **todos** os critérios com dado são atendidos (mínimo de 5 critérios com dado). Critério sem dado não conta contra a amostra.
- Se mais de um tipo atende: **ambiguo**. Urubici atende sempre também os limites de Pitanga; por isso há a opção (ligada por padrão) de escolher Urubici nesses casos.
- Nenhum tipo atende: **nao classificado**, com o melhor ajuste. O artigo informa que cerca de 90% das análises se enquadram.
- `LOI` > 2,5 marca a amostra com ⚠ (o artigo descartou essas análises), mas ela ainda é classificada.

**Diagramas de variação (Figs. 7 e 8 do artigo):** Fe₂O₃(t) × TiO₂ (7a) e Zr/Y × Sr (7b) para os tipos alto-Ti; Zr/Y × Ti/Zr (8a) e Sr × Ti/Y (8b) para os baixo-Ti. O artigo mostra só os dados; as caixas de cada magma-tipo são montadas pelo app a partir dos limites da Tabela 2 nas duas variáveis do gráfico (a sobreposição entre caixas é real, e é o que o artigo discute). Os pontos recebem a cor do magma-tipo atribuído pela classificação de 12 critérios; o ponto é plotado mesmo que faltem dados para classificar, bastando as duas variáveis do eixo. A Fig. 7a aceita pontos livres com o mouse (TiO₂ e Fe₂O₃(t) são medidos diretamente); nos gráficos de razões um clique não define os dados originais, então o botão fica desabilitado.

O menu já mostra a árvore completa de áreas e módulos; os que ainda não existem aparecem como "em breve".

### Outros módulos

| Área | Módulo | Entrada |
|---|---|---|
| Ígnea | Ultramáficas (Ol–Opx–Cpx e Ol–Px–Hbl) | `Ol`, `Opx`/`Px`, `Cpx`/`Hbl` modais |
| Ígnea | Rochas gabroicas (Plag–Px–Ol e Plag–Px–Hbl) | `Plag`, `Px`, `Ol`/`Hbl` modais |
| Ígnea | Tufos | `Vidro`, `FragRocha`, `Cristais` |
| Ígnea | Produtos piroclásticos | `Diametro` (mm) |
| Ígnea | AFM (Irvine e Baragar, 1971), Shand (1943), Pearce e Norry (1979), Winchester e Floyd (1977) | óxidos e elementos-traço (veja o seletor de colunas) |
| Ígnea | Spider multielementar e de ETR (manto primitivo, Sun e McDonough 1989) | elementos em ppm; K₂O, P₂O₅ e TiO₂ viram K, P e Ti |
| Ígnea | Peate: 7a, 7b, 8a, 8b, TiO₂×Zr/Y, Ti/Y×Ti/Zr, MgO×TiO₂ | veja o módulo Peate acima |
| Sedimentar | Arenitos e grauvacas (Q–F–L, com `Matriz`) | `Q`, `Feld`, `Lit`, `Matriz` |
| Sedimentar | Granulometria | `Diametro` (mm) |
| Sedimentar | Conglomerados | `Origem`, `Matriz`, `Metaestaveis`, `MatrizLaminada`, `Glacial` |
| Sedimentar | Arredondamento (Powers) e seleção (Folk e Ward) | `Arredondamento`, `Esfericidade`; `Sigma` ou `Phi5/16/84/95` |
| Metamórfica | Nomenclatura de rochas metamórficas | só consulta |
| Estrutural | Dobras (ângulo interflanco; Fleuty), tectonitos de falha (Sibson) | `Angulo`; `MergulhoPA`, `CaimentoEixo`; `Coesao`, `Trama`, `Matriz`… |
| Estratigrafia | Tabela cronoestratigráfica (ICS v2023/09) | `Idade` (Ma) |
| Cartografia | Exagero vertical (ábaco); convenções litológicas | `Exagero`, `Mergulho`; só consulta |
| Descrição | Estimativa visual de porcentagem | só consulta (círculos gerados pelo app) |

Fontes: as figuras de referência do usuário (`lista pro app.docx`), os gráficos do GCDkit do projeto de Taió, a carta oficial da ICS (`stratigraphy.org`) e o artigo de Peate et al. (1992). Valores lidos de fotografias (ex.: faixas de 5% e 95% das ultramáficas e gabroicas) e fronteiras digitalizadas de imagem (Winchester e Floyd) estão marcados nos comentários dos módulos e devem ser conferidos com a fonte.

## Como usar

1. Escolha o diagrama no menu.
2. Cole a tabela copiada do Excel/Sheets (cabeçalho na primeira linha), importe `.csv`/`.xlsx`, ou clique em **Carregar exemplo**.
3. O app reconhece cabeçalhos como `SiO2`, `SiO2 (wt%)`, `sio2_wt`, `Quartzo`, `Plagioclásio`. Se algo não for reconhecido, escolha a coluna nos seletores.
4. Use **Agrupar por** para colorir os pontos por grupo/unidade/litologia.
5. Exporte o gráfico (SVG/PNG), o CSV classificado ou o projeto (`.json`).

Valores com vírgula decimal (`49,5`) funcionam. Os dados ficam salvos no navegador (localStorage); use **Salvar projeto** para levar a outro computador ou versionar no git.

### Estados de classificação

- **ok**: dentro de um campo.
- **no limite**: exatamente sobre a fronteira entre dois campos (vale o primeiro declarado).
- **fora do campo**: fora de qualquer campo (ex.: SiO2 < 41 no TAS, Q > 60 no QAPF vulcânico).
- **ambiguo** / **nao classificado**: só no módulo Peate (mais de um tipo atende / nenhum atende).
- **ausente**: faltam colunas ou valores. **invalido**: valor negativo, texto, soma zero, ou Q e F juntos no QAPF.

No QAPF, `Q` e `F` em branco valem 0; `A` e `P` são obrigatórios.

## Desenvolvimento

Requer Node.js 20+.

```bash
npm install
npm run dev     # servidor local
npm test        # testes (Vitest)
npm run build   # gera dist/
```

Estrutura: `src/core` (geometria, classificador, renderizador SVG, exportação), `src/data` (leitura de tabelas, detecção de colunas, armazenamento), `src/diagrams` (um arquivo por diagrama), `src/ui` (interface), `samples` (CSVs de exemplo), `tests`.

Para adicionar um diagrama novo veja [docs/adicionar-diagrama.md](docs/adicionar-diagrama.md).

## Publicação

O workflow `.github/workflows/pages.yml` publica `dist/` no GitHub Pages a cada push em `main` (ative Pages com a fonte "GitHub Actions" nas configurações do repositório).

## Fontes dos polígonos

Os campos do TAS e do QAPF foram reconstruídos a partir da nomenclatura e dos limites publicados em Le Bas et al. (1986), Streckeisen (1976) e Le Maitre et al. (2002), e conferidos contra a transcrição do projeto pyrolite (BSD-3) e as definições da BGS. Confira visualmente contra a publicação original antes de usar em trabalhos formais.

## Aplicativo Android (Android Studio)

O app web é empacotado com [Capacitor](https://capacitorjs.com); o projeto Android fica em `android/`.

```bash
npm run android:open   # gera o site, sincroniza e abre o projeto no Android Studio
```

No Android Studio: **Run ▶** para instalar no celular/emulador, ou **Build → Build APK(s)** para gerar o `.apk`. Use o JDK que vem com o Android Studio (JDK 21). Depois de mudar o código web, rode `npm run android:sync`. Ícones: `resources/` + `npx capacitor-assets generate --android`.
