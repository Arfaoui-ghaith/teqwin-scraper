const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { call: scraperApiCall } = require('./scraperApiClient');

const DEFAULT_IMAGE_URL =
  'https://imageio.forbes.com/i-forbesimg/media/lists/companies/no-pic_416x416.jpg?format=jpg&height=416&width=416&fit=bounds-no-image';

/** Tanitjobs logos are blocked (Cloudflare); use UI avatars instead — never fetch. */
const isTanitjobsImageUrl = (url) =>
  typeof url === 'string' && /tanitjobs\.com\/files/i.test(url);

const detectMime = (buffer) => {
  if (!buffer || buffer.length < 4) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'image/webp';
  }
  return 'image/jpeg';
};

const isHtmlBuffer = (buffer) => {
  const head = buffer.slice(0, 64).toString('utf8').toLowerCase();
  return head.includes('<!doctype') || head.includes('<html');
};

const bufferFromResponse = (data, contentType = '') => {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data || '');
  if (buffer.length === 0) return null;
  if (isHtmlBuffer(buffer)) return null;

  const mime = (contentType.split(';')[0].trim() || detectMime(buffer));
  return {
    buffer,
    mime: mime.startsWith('image/') ? mime : detectMime(buffer),
  };
};

const fetchImageDirect = async (url) => {
  try {
    const res = await fetch(url, {
      method: 'get',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) return null;

    const arrayBuffer = await res.arrayBuffer();
    return bufferFromResponse(Buffer.from(arrayBuffer), contentType);
  } catch {
    return null;
  }
};

const fetchImageViaScraperApi = async (url) => {
  const page = await scraperApiCall(url);

  if (!page.data || page.status !== 200) {
    console.warn(`[fetchImageBinary] ScraperAPI HTTP ${page.status} for ${url.slice(0, 80)}`);
    return null;
  }

  const result = bufferFromResponse(page.data);
  if (!result) {
    console.warn(`[fetchImageBinary] ScraperAPI returned non-image for ${url.slice(0, 80)}`);
    return null;
  }

  console.log(`[fetchImageBinary] ScraperAPI OK (${result.buffer.length} bytes) for ${url.slice(0, 80)}`);
  return result;
};

/**
 * Download image from URL and return raw bytes + mime type.
 * @param {string} imageUrl
 * @returns {Promise<{ buffer: Buffer, mime: string } | null>}
 */
const fetchImageBinary = async (imageUrl) => {
  const url = (imageUrl || '').trim();
  if (!url.startsWith('http')) return null;
  if (isTanitjobsImageUrl(url)) return null;

  const viaDirect = await fetchImageDirect(url);
  if (viaDirect) return viaDirect;

  const viaScraper = await fetchImageViaScraperApi(url);
  if (viaScraper) return viaScraper;

  console.warn(`[fetchImageBinary] Failed for ${url.slice(0, 80)}`);
  return null;
};

const bufferToDataUrl = (buffer, mime = 'image/jpeg') => {
  if (!buffer || buffer.length === 0) return null;
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

module.exports = {
  DEFAULT_IMAGE_URL,
  isTanitjobsImageUrl,
  fetchImageBinary,
  fetchImageViaScraperApi,
  detectMime,
  bufferToDataUrl,
};
