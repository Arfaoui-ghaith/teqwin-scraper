const { call: scraperApiCall } = require('../../utils/scraperApiClient');

/** ScraperAPI options for OptionCarriere (bot-protected, JS-rendered pages). */
const OPTIONCARRIERE_SCRAPER_PARAMS = {
  render: 'true',
  country_code: 'tn',
  premium: 'true',
};

const call = (url, options = {}) =>
  scraperApiCall(url, {
    ...options,
    scraperParams: { ...OPTIONCARRIERE_SCRAPER_PARAMS, ...options.scraperParams },
  });

module.exports = { call, OPTIONCARRIERE_SCRAPER_PARAMS };
