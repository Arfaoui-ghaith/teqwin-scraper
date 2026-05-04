const { call } = require('../../utils/httpClient');
const cheerio = require('cheerio');

const collect = async () => {
  let i = 1;
  let urls = [];

  while (true) {
    const URL = `https://www.farojob.net/?post_type=noo_job&s&category%5B0%5D=informatique&type=stage&paged=${i}`;
    const page = await call(URL);
    if (page.status !== 200) break;

    const $ = cheerio.load(page.data);
    const a = $("div[class='show-view-more']")
      .map(function () {
        return $(this).find('a').attr('href');
      })
      .toArray();

    urls = urls.concat(a);
    // current behavior: only first page
    break;
  }

  return urls;
};

module.exports = collect;

