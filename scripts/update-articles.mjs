// Récupère les articles de Guillaume Marcq sur blog.octo.com
// et les injecte dans index.html entre les marqueurs <!-- articles:start/end -->.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const BLOG_URL = 'https://blog.octo.com';
export const AUTHOR_URL = `${BLOG_URL}/author/guillaume.marcq`;

const START = '<!-- articles:start -->';
const END = '<!-- articles:end -->';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" };

function decode(text) {
  return text.replace(/&(amp|lt|gt|quot|#39|apos);/g, (_, e) => ENTITIES[e]);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(html) {
  return decode(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

function attr(value) {
  return value.replace(/^"|"$/g, '');
}

export function parseArticles(html) {
  return html
    .split('<div class=articleListItem>')
    .slice(1)
    .map((block) => {
      const title = block.match(/class=articleListItem-title><h2>([\s\S]*?)<\/h2>/);
      const href = block.match(/<a href=("[^"]+"|\S+) class=articleListItem-title>/);
      const category = block.match(/class=articleListItem-category><span>([\s\S]*?)<\/span>/);
      const date = block.match(/Posté le (\d{2})\/(\d{2})\/(\d{4})/);
      const summary = block.match(/class=articleListItem-preview>([\s\S]*?)<\/div>/);
      const authors = [...block.matchAll(/<a href=\/author\/[^>]+>([^<]+)<\/a>/g)].map((m) => decode(m[1]).trim());
      if (!title || !href || !date) return null;
      return {
        title: stripTags(title[1]),
        url: new URL(attr(href[1]), BLOG_URL).href,
        category: category ? stripTags(category[1]) : '',
        date: `${date[3]}-${date[2]}-${date[1]}`,
        summary: summary ? stripTags(summary[1]) : '',
        authors,
      };
    })
    .filter(Boolean);
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function renderArticles(articles) {
  return articles
    .map((a) => {
      const coAuthors = a.authors.filter((name) => name !== 'Guillaume Marcq');
      const meta = [a.category, coAuthors.length ? `avec ${coAuthors.join(', ')}` : '']
        .filter(Boolean)
        .map(escapeHtml)
        .join(' · ');
      return `      <li class="article">
        <a href="${escapeHtml(a.url)}">
          <time datetime="${a.date}">${DATE_FORMAT.format(new Date(a.date))}</time>
          <h3>${escapeHtml(a.title)}</h3>
          <p>${escapeHtml(a.summary)}</p>
          <span class="article-meta">${meta}</span>
        </a>
      </li>`;
    })
    .join('\n');
}

export function injectArticles(page, articlesHtml) {
  const start = page.indexOf(START);
  const end = page.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Marqueurs ${START} / ${END} introuvables dans la page`);
  }
  return `${page.slice(0, start + START.length)}\n${articlesHtml}\n      ${page.slice(end)}`;
}

async function main() {
  const response = await fetch(AUTHOR_URL);
  if (!response.ok) throw new Error(`${AUTHOR_URL} a répondu ${response.status}`);
  const articles = parseArticles(await response.text());
  if (articles.length === 0) throw new Error('Aucun article trouvé : la structure du blog a peut-être changé');

  const indexPath = new URL('../index.html', import.meta.url);
  const page = await readFile(indexPath, 'utf8');
  const updated = injectArticles(page, renderArticles(articles));
  if (updated !== page) await writeFile(indexPath, updated);
  console.log(`${articles.length} articles ${updated !== page ? 'mis à jour' : 'inchangés'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
