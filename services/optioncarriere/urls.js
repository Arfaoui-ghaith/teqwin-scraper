const { call } = require('./scraper');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.optioncarriere.tn';
const JOB_LINK_SELECTOR = 'main ul li article header h2 a';

const toAbsoluteUrl = (href) => {
  if (!href) return null;
  const full = href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? href : `/${href}`}`;
  return full.split('?')[0];
};

const collect = async () => {
  let pageNum = 1;
  const urls = [];
  const seen = new Set();

  while (true) {
    const pageUrl = `${BASE_URL}/emploi?ct=i&s=Stage&l=Tunisie&p=${pageNum}`;
    const page = await call(pageUrl);
    if (!page.data || page.status !== 200) break;

    const $ = cheerio.load(page.data);
    const links = $(JOB_LINK_SELECTOR)
      .map(function () {
        return $(this).attr('href');
      })
      .get()
      .map(toAbsoluteUrl)
      .filter(Boolean);

    if (links.length === 0) break;

    for (const url of links) {
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
    pageNum += 1;
  }

  return urls;
};

module.exports = collect;
