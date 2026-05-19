const path = require('path');
const { DataSource } = require('typeorm');
const { InternshipCompany, InternshipSkill, Internship } = require('../entities');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Build DATABASE_URL from POSTGRES_* if not set
if (!process.env.DATABASE_URL && process.env.POSTGRES_HOST) {
  const user = process.env.POSTGRES_USERNAME || 'postgres';
  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD || '');
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT || 5432;
  const database = process.env.POSTGRES_DATABASE || 'postgres';
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=verify-full`;
}

let dataSource;

const getDataSource = async () => {
  if (dataSource?.isInitialized) return dataSource;
  dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [InternshipCompany, InternshipSkill, Internship],
    synchronize: false,
    ssl: process.env.DATABASE_URL?.includes('sslmode=') ? { rejectUnauthorized: false } : false,
  });
  await dataSource.initialize();
  return dataSource;
};

/**
 * Save internship to PostgreSQL. Uses upsert for Company and Skill to avoid duplicates.
 * Intern is upserted by url.
 * @param {Object} data - { company: {...}, internship: {...} }
 * @param {string} source - farojob | keejob | linkedin | optioncarriere | tanitjobs
 */
const saveInternshipToDb = async (data, source) => {
  const ds = await getDataSource();
  const companyRepo = ds.getRepository('InternshipCompany');
  const skillRepo = ds.getRepository('InternshipSkill');
  const internshipRepo = ds.getRepository('Internship');

  const companyName = data.company?.name || 'Unknown';
  const companyImage = data.company?.image || 'https://imageio.forbes.com/i-forbesimg/media/lists/companies/no-pic_416x416.jpg?format=jpg&height=416&width=416&fit=bounds-no-image';
  const companyAddress = data.company?.address ?? '';
  const companyCountry = data.company?.country || 'Tunisia';
  const companyCountryFlag = data.company?.countryFlag || '🇹🇳';

  let company = await companyRepo.findOne({ where: { name: companyName } });
  if (!company) {
    company = companyRepo.create({
      name: companyName,
      image: companyImage,
      address: companyAddress,
      country: companyCountry,
      countryFlag: companyCountryFlag,
    });
    await companyRepo.save(company);
  } else {
    company.image = companyImage;
    company.address = companyAddress;
    company.country = companyCountry;
    company.countryFlag = companyCountryFlag;
    await companyRepo.save(company);
  }

  const skillIds = [];
  for (const skillName of data.internship?.skills || []) {
    if (!skillName || typeof skillName !== 'string') continue;
    const title = skillName.trim();
    if (!title) continue;
    let skill = await skillRepo.findOne({ where: { title } });
    if (!skill) {
      try {
        skill = skillRepo.create({ title });
        await skillRepo.save(skill);
      } catch (err) {
        if (err.code === '23505') {
          skill = await skillRepo.findOne({ where: { title } });
        }
        if (!skill) throw err;
      }
    }
    skillIds.push(skill.id);
  }

  const datePosted = data.internship?.datePosted
    ? new Date(data.internship.datePosted)
    : new Date();
  const validThrough = data.internship?.validThrough
    ? new Date(data.internship.validThrough)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const internshipData = {
    title: data.internship.title || 'Untitled',
    datePosted,
    validThrough,
    description: data.internship.description || '',
    url: data.internship.url,
    remote: data.internship.remote ?? false,
    companyId: company.id,
  };

  let internship = await internshipRepo.findOne({
    where: { url: data.internship.url },
    relations: ['skills'],
  });

  if (!internship) {
    internship = internshipRepo.create(internshipData);
    await internshipRepo.save(internship);
    for (const skillId of skillIds) {
      await ds.query(
        'INSERT INTO "SkillsOnInterns" ("internshipId", "skillId") VALUES ($1, $2)',
        [internship.id, skillId]
      );
    }
  } else {
    internship.title = internshipData.title;
    internship.datePosted = internshipData.datePosted;
    internship.validThrough = internshipData.validThrough;
    internship.description = internshipData.description;
    internship.remote = internshipData.remote;
    internship.companyId = internshipData.companyId;
    await internshipRepo.save(internship);
    await ds.query(
      'DELETE FROM "SkillsOnInterns" WHERE "internshipId" = $1',
      [internship.id]
    );
    for (const skillId of skillIds) {
      await ds.query(
        'INSERT INTO "SkillsOnInterns" ("internshipId", "skillId") VALUES ($1, $2)',
        [internship.id, skillId]
      );
    }
  }
};

const getInternshipRepository = async () => {
  const ds = await getDataSource();
  return ds.getRepository('Internship');
};

module.exports = {
  getDataSource,
  saveInternshipToDb,
  getInternshipRepository,
};
