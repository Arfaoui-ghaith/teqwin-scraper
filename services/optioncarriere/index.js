const collect = require('./urls');
const cheerio = require('cheerio');
const { call } = require('../../utils/scraperApiClient');
const { isoCountry } = require('iso-country');
const parseAddress = require('country-in-text-detector');
const { decode } = require('html-entities');
const { getRemote } = require('../../utils/verif');
const { extract } = require('../../utils/extractSkills');
const { saveInternship } = require('../../utils/saveToJson');
const { isPostedThisYear } = require('../../utils/isThisYear');
const { getUrlsToFetch } = require('../../utils/scrapedUrlsRegistry');

const SOURCE = 'optioncarriere';

const getContents = async () => {
  console.log(`[${SOURCE}] Start OptionCarriere Web Scraping Process...`);
  const urls = await collect();
  const toFetch = await getUrlsToFetch(urls);
  const skippedUrls = urls.length - toFetch.length;
  if (skippedUrls > 0) console.log(`[${SOURCE}] Skipped ${skippedUrls} already-scraped URLs.`);
  console.log(`[${SOURCE}] ${toFetch.length} New Internships to fetch.`);
  if (toFetch.length === 0) return [];
  console.log(`[${SOURCE}] Start Fetching & Scraping Data From The Web Pages Contents...`);

  return await Promise.all(
    toFetch.map(async (url) => {
      const content = await call(url, { method: 'get' });
      return content;
    })
  );
};

const getDetails = async (content) => {
  if (content.data !== '' && content.status === 200) {
    const $ = cheerio.load(content.data);
    const obj = $("script[type='application/ld+json']").text();
    const job = JSON.parse(obj);

    let country = parseAddress.detect(job.jobLocation.address.addressCountry);
    if (country.length > 0) country = isoCountry(country[0].iso3166);
    else country = isoCountry('TN');

    const company = {
      image: $("img[class='lazy logo lazy-done']").attr('src'),
      name: job.hiringOrganization.name,
      address: job.jobLocation.address.addressLocality,
      country: country.name,
      countryFlag: country.emoji,
    };

    const internship = {
      title: job.title,
      datePosted: new Date(job.datePosted),
      validThrough: new Date(job.validThrough),
      description: decode($("section[class='content']").text()),
      url: content.url,
      remote: getRemote($("section[class='content']").text()),
    };

    if (company.name == null) company.name = `interMe-${company.country}`;
    return { company, internship };
  }
};

const parseDetails = async () => {
  const contents = await getContents();
  return await Promise.all(
    contents.map(async (content) => {
      try {
        return await getDetails(content);
      } catch (e) {
        console.log(e.message);
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
  return await Promise.all(
    valid.map(async (item) => {
      const intern = { ...item, internship: await getSkills(item.internship) };

      try {
        await saveInternship(intern, SOURCE);
      } catch (err) {
        console.error(`[${SOURCE}] Error saving:`, err.message);
      }

      return intern;
    })
  );
};

module.exports = { run };

