const { call } = require('../../utils/httpClient');
const cheerio = require('cheerio');

const collect = async () => {
  const URL = `https://www.keejob.com/offres-emploi/?keywords=&job_types=7&job_types=9&education_level=0&experience_level=0&professions=%5B24%2C9%2C25%5D&sort_by=`;
  const page = await call(URL);
  const $ = cheerio.load(page.data);

  const urls = $("article[class='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150']")
    .map(function () {
      return `https://www.keejob.com${$(this)
        .find("h2[class='text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 leading-snug']")
        .find('a')
        .attr('href')}`;
    })
    .toArray();

  return urls;
};

module.exports = collect;

