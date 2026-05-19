const collect = require('./urls');
const cheerio = require('cheerio');
const { call } = require('../../utils/scraperApiClient');
const { decode } = require('html-entities');
const { isoCountry } = require('iso-country');
const { getRemote } = require('../../utils/verif');
const { extract } = require('../../utils/extractSkills');
const { saveInternship } = require('../../utils/saveToJson');
const { isPostedThisYear } = require('../../utils/isThisYear');
const { getUrlsToFetch } = require('../../utils/scrapedUrlsRegistry');

const SOURCE = 'tanitjobs';
const TUNISIA = isoCountry('TN');

/** Parse Tanitjobs date format DD/MM/YYYY (e.g. 18/06/2026). */
const parseTanitDate = (text) => {
  const match = String(text || '')
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

/** Trim whitespace and remove trailing "-" from company name. */
const parseCompanyName = (raw) =>
  String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/-\s*$/, '')
    .trim();

const getContents = async () => {
  console.log(`[${SOURCE}] Start Tanitjobs Web Scraping Process...`);
  const urls = await collect();
  const toFetch = await getUrlsToFetch(urls);
  const skippedUrls = urls.length - toFetch.length;
  if (skippedUrls > 0) console.log(`[${SOURCE}] Skipped ${skippedUrls} already-scraped URLs.`);
  console.log(`[${SOURCE}] ${toFetch.length} New Internships to fetch.`);
  if (toFetch.length === 0) return [];
  console.log(`[${SOURCE}] Start Fetching & Scraping Data From The Web Pages Contents...`);

  return await Promise.all(
    toFetch.map(async (url, i) => {
      const n = i + 1;
      const total = toFetch.length;
      const short = url.length > 60 ? url.slice(0, 57) + '...' : url;
      console.log(`[${SOURCE}] Fetching (${n}/${total}): ${short}`);
      const start = Date.now();
      const content = await call(url, { method: 'get' });
      console.log(`[${SOURCE}] Fetched (${n}/${total}): ${content.status} in ${Date.now() - start}ms`);
      return content;
    })
  );
};

const getDescriptionHtml = ($) => {
  let description = '';
  $('h3.details-body__title').each((_, el) => {
    const heading = $(el).text().trim().toLowerCase();
    if (!description && heading.includes('description de l')) {
      description = $(el).next('.details-body__content').html() || '';
    }
  });
  return description.trim();
};

const getDeadlineDate = ($) => {
  let deadlineText = '';
  $('h3.details-body__title').each((_, el) => {
    const heading = $(el).text().trim().toLowerCase();
    if (heading.includes('expiration') || heading.includes("date d'expiration")) {
      deadlineText = $(el).next('.details-body__content').text().trim();
    }
  });

  if (!deadlineText) {
    const blocks = $('.detail-offre .details-body__content.content-text').toArray();
    for (let i = blocks.length - 1; i >= 0; i--) {
      const text = $(blocks[i]).text().trim();
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
        deadlineText = text;
        break;
      }
    }
  }

  return parseTanitDate(deadlineText);
};

const getDetails = async (content) => {
  if (content.data === '' || content.status !== 200) return;

  const $ = cheerio.load(decode(content.data));

  const title =
    $('#stickytop h1.details-header__title').first().text().trim() ||
    $('h1.details-header__title').first().text().trim();

  const companyName = parseCompanyName(
    $('#stickytop .listing-item__info--item-company').first().text() ||
      $('.listing-item__info--item-company').first().text()
  );

  const address = (
    $('#stickytop .listing-item__info--item-location').first().text() ||
    $('.listing-item__info--item-location').first().text()
  )
    .replace(/\s+/g, ' ')
    .trim();

  const description = getDescriptionHtml($);
  let validThrough = getDeadlineDate($);
  let datePosted = null;
  let logo;

  try {
    const job = JSON.parse($("script[type='application/ld+json']").first().text());
    datePosted = job.datePosted ? new Date(job.datePosted) : null;
    if (!validThrough && job.validThrough) validThrough = new Date(job.validThrough);
    logo = job.hiringOrganization?.logo;
  } catch {
    // fall back to DOM-only fields
  }

  if (!validThrough && datePosted) {
    validThrough = new Date(datePosted);
    validThrough.setMonth(validThrough.getMonth() + 3);
  }

  const company = {
    image: logo,
    name: companyName || `interMe-${TUNISIA.name}`,
    address,
    country: TUNISIA.name,
    countryFlag: TUNISIA.emoji,
  };

  const internship = {
    title,
    datePosted: datePosted || new Date(),
    validThrough: validThrough || new Date(),
    description: description || '',
    url: content.url.split('?')[0],
    remote: getRemote(description),
  };

  return { company, internship };
};

const parseDetails = async () => {
  const contents = await getContents();
  console.log(`[${SOURCE}] Parsing ${contents.length} pages...`);
  return await Promise.all(
    contents.map(async (content, i) => {
      try {
        const details = await getDetails(content);
        if (details) {
          console.log(
            `[${SOURCE}] Parsed (${i + 1}/${contents.length}): ${details.internship?.title || 'unknown'}`
          );
        }
        return details;
      } catch (e) {
        console.log(`[${SOURCE}] Parse error (${i + 1}): ${e.message}`);
        return undefined;
      }
    })
  );
};

const getSkills = async (intern) => {
  try {
    const skills = await extract(intern.description.replace(/>/g, '> ').replace(/</g, ' <'));
    return { ...intern, skills };
  } catch (e) {
    console.log(e.message);
    return { ...intern, skills: [] };
  }
};

const run = async () => {
  const res = await parseDetails();
  const valid = res.filter((item) => item != undefined).filter(isPostedThisYear);
  const skipped = res.filter((item) => item != undefined).length - valid.length;
  if (skipped > 0) console.log(`[${SOURCE}] Skipped ${skipped} internships not posted this year.`);
  if (valid.length === 0) {
    console.log(`[${SOURCE}] No valid internships to save.`);
    return [];
  }
  console.log(`[${SOURCE}] Saving ${valid.length} internships...`);
  const results = await Promise.all(
    valid.map(async (item, i) => {
      const intern = { ...item, internship: await getSkills(item.internship) };

      try {
        await saveInternship(intern, SOURCE);
        console.log(`[${SOURCE}] Saved (${i + 1}/${valid.length}): ${intern.internship?.title}`);
      } catch (err) {
        console.error(`[${SOURCE}] Error saving: ${err.message}`);
      }

      return intern;
    })
  );
  console.log(`[${SOURCE}] Done. Saved ${results.length} internships.`);
  return results;
};

module.exports = { run };
