const { call } = require('../../utils/scraperApiClient');
const cheerio = require('cheerio');

const collect = async () => {
  let i = 1;
  let urls = [];

  while (true) {
    const URL = `https://www.optioncarriere.tn/emploi?ct=i&s=Stage&l=Tunisie&p=${i}`;
    const page = await call(URL);
    if (page.status !== 200) break;
  
    const $ = cheerio.load(page.data);
    const a = $("article[class='job clicky']")
      .map(function () {
        return `https://www.optioncarriere.tn${$(this).attr('data-url')}`;
      })
      .toArray();
    if (a.length === 0) break;

    urls = urls.concat(a);
    i++;
  }

  return urls;
};

module.exports = collect;

