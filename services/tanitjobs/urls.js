const { call } = require('../../utils/scraperApiClient');
const cheerio = require('cheerio');
const { MAX_SCRAPE_PAGES } = require('../../constants');

const SEARCH_BASE =
  'https://www.tanitjobs.com/jobs/?searchId=1779225076.8928&action=search';

/** Parse Tanitjobs date format DD/MM/YYYY (e.g. 12/05/2026). */
const parseTanitDate = (text) => {
  const match = String(text || '')
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const isPostedThisYear = (date) => {
  if (!date || Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === new Date().getFullYear();
};

const collect = async () => {
  let pageNum = 1;
  const urls = [];
  while (pageNum <= MAX_SCRAPE_PAGES) {
    const pageUrl = `${SEARCH_BASE}&page=${pageNum}`;
    const page = await call(pageUrl);
    if (!page.data || page.status !== 200) break;

    const $ = cheerio.load(page.data);
    const articles = $('article').toArray();
    if (articles.length === 0) break;

    let foundThisYear = false;

    for (const el of articles) {
      const article = $(el);
      // article > div.media-body > div.listing-item__title > a
      const href = article.find('.listing-item__title a.link').attr('href');
      // article > div.media-right > div.listing-item__date
      const datePosted = parseTanitDate(article.find('.listing-item__date').text());

      if (!href || !isPostedThisYear(datePosted)) continue;

      foundThisYear = true;
      urls.push(href.split('?')[0]);
    }

    // Listings are newest-first; stop when a full page has no current-year posts.
    if (!foundThisYear) break;
    pageNum += 1;
  }

  return [...new Set(urls)];
};

module.exports = collect;
