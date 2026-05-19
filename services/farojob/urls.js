const { call } = require('../../utils/httpClient');
const cheerio = require('cheerio');
const { MAX_SCRAPE_PAGES } = require('../../constants');

const collect = async () => {
  let urls = [];

  for (let page = 1; page <= MAX_SCRAPE_PAGES; page++) {
    const URL = `https://www.farojob.net/?post_type=noo_job&s&category%5B0%5D=informatique&type=stage&paged=${page}`;
    const response = await call(URL);
    if (response.status !== 200) break;

    const $ = cheerio.load(response.data);
    const links = $("div[class='show-view-more']")
      .map(function () {
        return $(this).find('a').attr('href');
      })
      .toArray()
      .filter(Boolean);

    if (links.length === 0) break;
    urls = urls.concat(links);
  }

  return urls;
};

module.exports = collect;
