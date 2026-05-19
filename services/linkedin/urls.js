const { call } = require('../../utils/httpClient');
const cheerio = require('cheerio');

const collect = async () => {
  const URLS = [
    'https://www.linkedin.com/jobs/search?keywords=&location=Tunisie&locationId=&geoId=102134353&f_TPR=&f_JT=I&position=1&pageNum=0',
  ];
  let res = [];
  for (const URL of URLS) {
    const page = await call(URL);
    const $ = cheerio.load(page.data);
    const urls = $('a.base-card__full-link[href*="/jobs/view/"]')
      .map(function () {
        return $(this).attr('href');
      })
      .toArray();
    res = res.concat(urls);
  }

  return res.map((url) => url.split('?')[0]);
};

module.exports = collect;