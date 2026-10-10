# GeoQMaster

Aplicação web que reúne diagramas e classificações geológicas. Você cola ou importa amostras, vê os pontos plotados no diagrama e recebe a classificação automática de cada uma. Roda 100% no navegador (sem servidor).

## Diagramas disponíveis

| Área | Diagrama | Entrada |
|---|---|---|
| Ígnea | TAS (Le Bas et al., 1986; Le Maitre et al., 2002) | `SiO2`, `Na2O`, `K2O` (opcional: óxidos maiores para base anidra) |
| Ígnea | QAPF plutônico (Streckeisen, 1976) | `Q`, `A`, `P`, `F` modais |
| Ígnea | QAPF vulcânico (Le Maitre et al., 2002) | `Q`, `A`, `P`, `F` modais |

O menu já mostra a árvore completa de áreas e módulos; os que ainda não existem aparecem como "em breve".

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
