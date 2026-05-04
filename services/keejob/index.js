const collect = require('./urls');
const { call } = require('../../utils/httpClient');
const cheerio = require('cheerio');
const { decode } = require('html-entities');
const { isoCountry } = require('iso-country');
const { getRemote } = require('../../utils/verif');
const { extract } = require('../../utils/extractSkills');
const { saveInternship } = require('../../utils/saveToJson');
const { isPostedThisYear } = require('../../utils/isThisYear');
const { getUrlsToFetch } = require('../../utils/scrapedUrlsRegistry');

const SOURCE = 'keejob';

const getContents = async () => {
  console.log(`[${SOURCE}] Start Keejob Web Scraping Process...`);
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
    const ch = obj.slice(obj.indexOf('"description"'), obj.indexOf('"datePosted"'));
    const ch1 = obj.replace(ch, '');

    const job = JSON.parse(ch1);
    const country = isoCountry(job.jobLocation.address.addressCountry);

    const company = {
      image: job.hiringOrganization.logo,
      name: job.hiringOrganization.name,
      address: job.jobLocation.name,
      country: country.name,
      countryFlag: country.emoji,
    };

    const internship = {
      title: job.title,
      datePosted: new Date(job.datePosted),
      validThrough: new Date(job.validThrough),
      description: decode(ch.replace('"description":"', '').replace('",\n', '')),
      url: content.url,
      remote: getRemote(ch),
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

