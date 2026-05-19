const { call } = require('../../utils/httpClient');
const cheerio = require('cheerio');
const { MAX_SCRAPE_PAGES } = require('../../constants');

const LISTING_SELECTOR =
  "article[class='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150']";

const collect = async () => {
  const urls = [];
  const seen = new Set();
  const baseUrl =
    'https://www.keejob.com/offres-emploi/?keywords=&job_types=7&job_types=9&education_level=0&experience_level=0&professions=%5B24%2C9%2C25%5D&sort_by=';

  for (let page = 1; page <= MAX_SCRAPE_PAGES; page++) {
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}&page=${page}`;
    const response = await call(pageUrl);
    if (response.status !== 200) break;

    const $ = cheerio.load(response.data);
    const links = $(LISTING_SELECTOR)
      .map(function () {
        return `https://www.keejob.com${$(this)
          .find("h2[class='text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 leading-snug']")
          .find('a')
          .attr('href')}`;
      })
      .toArray()
      .filter(Boolean);

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
