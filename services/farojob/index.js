const collect = require('./urls');
const cheerio = require('cheerio');
const { call } = require('../../utils/httpClient');
const { getRemote } = require('../../utils/verif');
const parseAddress = require('country-in-text-detector');
const { isoCountry } = require('iso-country');
const { decode } = require('html-entities');
const { extract } = require('../../utils/extractSkills');
const { saveInternship } = require('../../utils/saveToJson');
const { isPostedThisYear } = require('../../utils/isThisYear');
const { getUrlsToFetch } = require('../../utils/scrapedUrlsRegistry');

const SOURCE = 'farojob';

const getContents = async () => {
  console.log(`[${SOURCE}] Start Farojob Web Scraping Process...`);
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

const getDetails = async (content) => {
  if (content.data !== '' && content.status === 200) {
    const $ = cheerio.load(content.data);
    $('center').remove();

    const internLocalisation = $("em[itemprop='jobLocation']").text().trim();
    let country = parseAddress.detect(internLocalisation);
    if (country.length > 0) country = isoCountry(country[0].iso3166);
    else country = isoCountry('TN');

    const company = {
      image: $("img[class='']").attr('src'),
      name: $("h3[class='company-title']").text().trim(),
      address: internLocalisation,
      country: country.name,
      countryFlag: country.emoji,
    };

    const date = new Date($("time[class='entry-date']").attr('datetime'));

    const internship = {
      title: $("h1[class='page-title']").text().trim(),
      datePosted: new Date($("time[class='entry-date']").attr('datetime')),
      validThrough: new Date(date.setMonth(date.getMonth() + 3)),
      description: decode($("div[class='job-desc']").html().trim()),
      url: content.url,
      remote: getRemote($("div[class='job-desc']").html().trim()),
    };

    if (company.name == null) company.name = `interMe-${company.country}`;
    return { company, internship };
  }
};

const parseDetails = async () => {
  const contents = await getContents();
  console.log(`[farojob] Parsing ${contents.length} pages...`);
  return await Promise.all(
    contents.map(async (content, i) => {
      try {
        const details = await getDetails(content);
        if (details) console.log(`[${SOURCE}] Parsed (${i + 1}/${contents.length}): ${details.internship?.title || 'unknown'}`);
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
  const valid = res
    .filter((item) => item != undefined)
    .filter(isPostedThisYear);
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

