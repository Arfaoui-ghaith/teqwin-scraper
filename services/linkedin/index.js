const collect = require('./urls');
const { call } = require('./scraper');
const cheerio = require('cheerio');
const { decode } = require('html-entities');
const { isoCountry } = require('iso-country');
const { getRemote } = require('../../utils/verif');
const { extract } = require('../../utils/extractSkills');
const { saveInternship } = require('../../utils/saveToJson');
const { isPostedThisYear } = require('../../utils/isThisYear');
const { getUrlsToFetch } = require('../../utils/scrapedUrlsRegistry');

const SOURCE = 'linkedin';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const REQUEST_DELAY_MS = Number(process.env.SCRAPEDO_REQUEST_DELAY_MS) || 1500;

const getContents = async () => {
  console.log(`[${SOURCE}] Start Linkedin Web Scraping Process...`);
  const urls = await collect();
  const toFetch = await getUrlsToFetch(urls);
  const skippedUrls = urls.length - toFetch.length;
  if (skippedUrls > 0) console.log(`[${SOURCE}] Skipped ${skippedUrls} already-scraped URLs.`);
  console.log(`[${SOURCE}] ${toFetch.length} New Internships to fetch.`);
  if (toFetch.length === 0) return [];
  console.log(`[${SOURCE}] Start Fetching & Scraping Data From The Web Pages Contents...`);

  const contents = [];
  for (let i = 0; i < toFetch.length; i++) {
    const url = toFetch[i];
    const content = await call(url, { method: 'get' });
    contents.push(content);
    if (i < toFetch.length - 1) await sleep(REQUEST_DELAY_MS);
  }
  return contents;
};

const getDetails = async (content) => {
  if (content.data !== '' && content.status === 200) {
    const $ = cheerio.load(decode(content.data));
    const job = JSON.parse($("script[type='application/ld+json']").text());
    const country = isoCountry(job.jobLocation.address.addressCountry);

    const company = {
      image: job.hiringOrganization.logo,
      name: job.hiringOrganization.name,
      address: job.jobLocation.address.addressLocality,
      country: country.name,
      countryFlag: country.emoji,
    };

    const internship = {
      title: job.title,
      datePosted: new Date(job.datePosted),
      validThrough: new Date(job.validThrough),
      description: job.description,
      url: content.url,
      remote: getRemote(job.description),
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

