const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getInternshipRepository } = require('./db');

/**
 * Get URLs that have not yet been scraped (not in DB).
 * @param {string[]} urls - internship URLs to check
 * @returns {Promise<string[]>} URLs that are not yet in the internship table
 */
const getUrlsToFetch = async (urls) => {
  if (!urls || urls.length === 0) return [];
  try {
    const repo = await getInternshipRepository();
    const existing = await repo
      .createQueryBuilder('i')
      .select('i.url')
      .where('i.url IN (:...urls)', { urls })
      .getMany();
    const existingSet = new Set(existing.map((r) => r.url));
    return urls.filter((url) => !existingSet.has(url));
  } catch (err) {
    console.warn('[scrapedUrlsRegistry] Could not query DB (table may not exist):', err.message);
    return urls;
  }
};

module.exports = {
  getUrlsToFetch,
};
