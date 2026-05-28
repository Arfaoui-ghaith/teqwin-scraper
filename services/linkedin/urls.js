const { call } = require('../../utils/httpClient');
const cheerio = require('cheerio');
const { MAX_SCRAPE_PAGES } = require('../../constants');

const SEARCH_BASE =
  'https://www.linkedin.com/jobs/search?keywords=Stage%2C Internship%2C Pfe&location=Tunisie&locationId=&geoId=102134353&&geoId=102134353&f_TPR=r2592000&trk=public_jobs_jobs-search-bar_search-submit&position=1';

const collect = async () => {
  const urls = [];
  const seen = new Set();

  for (let pageNum = 0; pageNum < MAX_SCRAPE_PAGES; pageNum++) {
    const searchUrl = `${SEARCH_BASE}&position=1&pageNum=${pageNum}`;
    const page = await call(searchUrl);
    if (page.status !== 200) break;

    const $ = cheerio.load(page.data);
    const links = $('a.base-card__full-link[href*="/jobs/view/"]')
      .map(function () {
        return $(this).attr('href');
      })
      .toArray()
      .filter(Boolean)
      .map((href) => href.split('?')[0]);

    if (links.length === 0) break;

    for (const href of links) {
      if (!seen.has(href)) {
        seen.add(href);
        urls.push(href);
      }
    }
  }

  return urls;
};

module.exports = collect;
