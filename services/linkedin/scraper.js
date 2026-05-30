const { call: scrapeDoCall } = require('../../utils/scrapeDoClient');

/** scrape.do options for LinkedIn (guest job search is JS-rendered). */
const LINKEDIN_SCRAPE_PARAMS = {};

const call = (url, options = {}) =>
  scrapeDoCall(url, {
    ...options,
    scrapeParams: { ...LINKEDIN_SCRAPE_PARAMS, ...options.scrapeParams },
  });

module.exports = { call, LINKEDIN_SCRAPE_PARAMS };
