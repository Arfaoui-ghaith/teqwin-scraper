/**
 * Clear Tanitjobs logo URLs/binary so the app shows letter avatars.
 * Run: node scripts/clear-tanitjobs-company-images.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  (process.env.POSTGRES_HOST
    ? `postgresql://${process.env.POSTGRES_USERNAME || 'postgres'}:${encodeURIComponent(process.env.POSTGRES_PASSWORD || '')}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DATABASE || 'postgres'}?sslmode=verify-full`
    : null);

if (!url) {
  console.error('No DATABASE_URL or POSTGRES_* env vars');
  process.exit(1);
}

const run = async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const result = await client.query(`
    UPDATE "internship_company"
    SET image = NULL,
        "binary_image" = NULL,
        "updatedAt" = NOW()
    WHERE deleted = false
      AND image LIKE '%tanitjobs.com/files%'
  `);

  console.log(`Cleared images for ${result.rowCount} Tanitjobs companies (UI will use avatars).`);
  await client.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
