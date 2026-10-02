# guillaumemarcq.github.io

Site personnel publié sur https://guillaumemarcq.github.io : liens vers OCTO, LinkedIn et mes articles du [blog OCTO](https://blog.octo.com/author/guillaume.marcq).

## Fonctionnement

- Site statique (`index.html` + `style.css`), servi par GitHub Pages depuis la branche `main`.
- `scripts/update-articles.mjs` lit la page auteur du blog et réécrit la liste des articles entre les marqueurs `<!-- articles:start -->` / `<!-- articles:end -->` de `index.html`.
- La GitHub Action `Update articles` le relance chaque jour à 6h UTC (ou à la main via *Run workflow*) et commite s'il y a du nouveau.

## En local

```bash
npm run update   # rafraîchit les articles
npm test         # tests du parseur (Node 20+, aucune dépendance)
```
