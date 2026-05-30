/**
 * Nest server constants (standalone).
 * Keys are tried in order; if one fails, the next is used.
 */
const SCRAPERAPI_KEYS = process.env.SCRAPERAPI_KEYS
  ? process.env.SCRAPERAPI_KEYS.split(',').map((k) => k.trim()).filter(Boolean)
  : [
      '425670af7a348709fe24488ce031f2cc',
      'f2dcf85a92bac43ce10433a4e68f3c6b',
      '4bc959f9218af5d1e862ee62064a8f56',
      '23c1327aeb270f44bb141d469c7f9823',
      '6a9989316d627d1f4d5b95a79be3e0cd',
      '9987c5b5428f3584325f63ffe84adf2e',
      '88a7db8080326ccbf6409e9756f8dc84'
    ];

const SCRAPEDO_TOKENS = process.env.SCRAPEDO_TOKENS
  ? process.env.SCRAPEDO_TOKENS.split(',').map((k) => k.trim()).filter(Boolean)
  : process.env.SCRAPEDO_TOKEN
    ? [process.env.SCRAPEDO_TOKEN.trim()]
    : [];

const MAX_SCRAPE_PAGES = Number(process.env.MAX_SCRAPE_PAGES) || 5;

module.exports = {
  SCRAPERAPI_KEYS,
  SCRAPEDO_TOKENS,
  MAX_SCRAPE_PAGES,
};

