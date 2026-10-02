import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseArticles, renderArticles, injectArticles } from './update-articles.mjs';

const fixture = await readFile(new URL('./author-page.fixture.html', import.meta.url), 'utf8');

describe('parseArticles', () => {
  const articles = parseArticles(fixture);

  test('GIVEN the author page WHEN parsed THEN should return every article', () => {
    assert.equal(articles.length, 6);
  });

  test('GIVEN a quoted href with an apostrophe WHEN parsed THEN should keep the full absolute URL', () => {
    assert.equal(
      articles[0].url,
      "https://blog.octo.com/compiler-du-code-ne-le-rend-pas-secret-la-preuve-par-age-of-empires-et-une-dose-d'ia",
    );
  });

  test('GIVEN a French date WHEN parsed THEN should convert it to ISO format', () => {
    assert.equal(articles[0].date, '2026-07-08');
  });

  test('GIVEN HTML entities in the summary WHEN parsed THEN should decode them', () => {
    assert.match(articles[0].summary, /Tapez "Food"/);
  });

  test('GIVEN an article with several authors WHEN parsed THEN should list them all', () => {
    const techTrends = articles.find((a) => a.title.includes('Tech Trends 2024'));
    assert.equal(techTrends.authors.length, 5);
  });

  test('GIVEN a page without articles WHEN parsed THEN should return an empty list', () => {
    assert.deepEqual(parseArticles('<html><body></body></html>'), []);
  });
});

describe('renderArticles', () => {
  const article = {
    title: 'A <b> & "c"',
    url: 'https://blog.octo.com/x',
    category: 'Software Engineering',
    date: '2026-06-09',
    summary: 'Résumé',
    authors: ['Guillaume Marcq', 'Jane Doe'],
  };

  test('GIVEN a title with HTML characters WHEN rendered THEN should escape them', () => {
    assert.match(renderArticles([article]), /A &lt;b&gt; &amp; &quot;c&quot;/);
  });

  test('GIVEN co-authors WHEN rendered THEN should mention them without Guillaume Marcq', () => {
    assert.match(renderArticles([article]), /Software Engineering · avec Jane Doe/);
  });

  test('GIVEN an ISO date WHEN rendered THEN should format it in French', () => {
    assert.match(renderArticles([article]), /9 juin 2026/);
  });
});

describe('injectArticles', () => {
  test('GIVEN a page with markers WHEN injected THEN should replace only the content between them', () => {
    const page = 'avant<!-- articles:start -->ancien<!-- articles:end -->après';
    assert.equal(injectArticles(page, 'nouveau'), 'avant<!-- articles:start -->\nnouveau\n      <!-- articles:end -->après');
  });

  test('GIVEN a page without markers WHEN injected THEN should throw', () => {
    assert.throws(() => injectArticles('<html></html>', 'x'), /Marqueurs/);
  });
});
