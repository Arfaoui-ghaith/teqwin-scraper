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
    const urls = $("a[class='base-card__full-link absolute top-0 right-0 bottom-0 left-0 p-0 z-[2] outline-offset-[4px]']")
      .slice(9)
      .map(function () {
        return $(this).attr('href');
      })
      .toArray();
    res = res.concat(urls);
  }

  return res.map((url) => url.split('?')[0]);
};

module.exports = collect;

