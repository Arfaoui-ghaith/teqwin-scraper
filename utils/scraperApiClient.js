/**
 * HTTP client that routes all requests through ScraperAPI.
 * Tries each key from nest-server/constants.js in order.
 */
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { SCRAPERAPI_KEYS } = require('../constants');

const SCRAPERAPI_BASE = 'https://api.scraperapi.com';

const buildScraperUrl = (apiKey, targetUrl, scraperParams = {}) => {
  const query = new URLSearchParams();
  query.set('api_key', apiKey);
  query.set('url', targetUrl);
  for (const [key, value] of Object.entries(scraperParams)) {
    if (value != null && value !== false) query.set(key, String(value));
  }
  return `${SCRAPERAPI_BASE}?${query.toString()}`;
};

const call = async (url, options = {}) => {
  if (!SCRAPERAPI_KEYS || SCRAPERAPI_KEYS.length === 0) {
    console.error('ScraperAPI: No API keys configured.');
    return { data: '', status: 500, url };
  }

  const { scraperParams = {}, ...fetchOptions } = options;
  let lastError = null;
  for (let i = 0; i < SCRAPERAPI_KEYS.length; i++) {
    const apiKey = SCRAPERAPI_KEYS[i];
    const scraperUrl = buildScraperUrl(apiKey, url, scraperParams);
    try {
      const res = await fetch(scraperUrl, { method: 'get', ...fetchOptions });
      const data = await res.text();

      if (res.status === 200) return { data, status: res.status, url };
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        lastError = new Error(`ScraperAPI key ${i + 1} failed (${res.status})`);
        continue;
      }
      return { data, status: res.status, url };
    } catch (er) {
      lastError = er;
      console.warn(`ScraperAPI key ${i + 1} failed for ${url}:`, er.message);
    }
  }

  console.error(`ScraperAPI: all ${SCRAPERAPI_KEYS.length} key(s) failed for ${url}:`, lastError?.message);
  return { data: '', status: 500, url };
};

module.exports = { call };

