/**
 * HTTP client that routes requests through scrape.do.
 * @see https://scrape.do/documentation/
 */
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { SCRAPEDO_TOKENS } = require('../constants');

const SCRAPEDO_BASE = 'https://api.scrape.do';

const buildScrapeDoUrl = (token, targetUrl, scrapeParams = {}) => {
  const query = new URLSearchParams();
  query.set('token', token);
  query.set('url', targetUrl);
  for (const [key, value] of Object.entries(scrapeParams)) {
    if (value != null && value !== false) query.set(key, String(value));
  }
  return `${SCRAPEDO_BASE}/?${query.toString()}`;
};

const call = async (url, options = {}) => {
  if (!SCRAPEDO_TOKENS || SCRAPEDO_TOKENS.length === 0) {
    console.error('scrape.do: No API tokens configured (SCRAPEDO_TOKEN or SCRAPEDO_TOKENS).');
    return { data: '', status: 500, url };
  }

  const { scrapeParams = {}, ...fetchOptions } = options;
  let lastError = null;

  for (let i = 0; i < SCRAPEDO_TOKENS.length; i++) {
    const token = SCRAPEDO_TOKENS[i];
    const proxyUrl = buildScrapeDoUrl(token, url, scrapeParams);
    try {
      const res = await fetch(proxyUrl, { method: 'get', ...fetchOptions });
      const data = await res.text();

      if (res.status === 200) return { data, status: res.status, url };
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        lastError = new Error(`scrape.do token ${i + 1} failed (${res.status})`);
        continue;
      }
      return { data, status: res.status, url };
    } catch (er) {
      lastError = er;
      console.warn(`scrape.do token ${i + 1} failed for ${url}:`, er.message);
    }
  }

  console.error(
    `scrape.do: all ${SCRAPEDO_TOKENS.length} token(s) failed for ${url}:`,
    lastError?.message,
  );
  return { data: '', status: 500, url };
};

module.exports = { call, buildScrapeDoUrl };
