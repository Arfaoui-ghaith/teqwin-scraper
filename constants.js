/**
 * Nest server constants (standalone).
 * Keys are tried in order; if one fails, the next is used.
 */
const SCRAPERAPI_KEYS = process.env.SCRAPERAPI_KEYS
  ? process.env.SCRAPERAPI_KEYS.split(',').map((k) => k.trim()).filter(Boolean)
  : [
      '4bc959f9218af5d1e862ee62064a8f56',
      '23c1327aeb270f44bb141d469c7f9823',
      'f2dcf85a92bac43ce10433a4e68f3c6b',
      '6a9989316d627d1f4d5b95a79be3e0cd'
      // Add more keys here
    ];

module.exports = {
  SCRAPERAPI_KEYS,
};

