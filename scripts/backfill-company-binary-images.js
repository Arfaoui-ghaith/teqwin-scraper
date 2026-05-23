/**
 * Backfill internship_company.binary_image from existing image URLs.
 * Run: node scripts/backfill-company-binary-images.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const { fetchImageBinary } = require('../utils/fetchImageBinary');

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

  const alterSql = require('fs').readFileSync(
    path.join(__dirname, 'add-binary-image-column.sql'),
    'utf8'
  );
  await client.query(alterSql);
  console.log('Column binary_image ensured.');

  const { rows } = await client.query(`
    SELECT id, name, image
    FROM "internship_company"
    WHERE deleted = false
      AND image IS NOT NULL
      AND image <> ''
      AND image NOT LIKE '%tanitjobs.com/files%'
      AND ("binary_image" IS NULL OR octet_length("binary_image") = 0)
    ORDER BY "createdAt" ASC
  `);

  console.log(`Companies to process: ${rows.length}`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const n = i + 1;
    process.stdout.write(`[${n}/${rows.length}] ${row.name?.slice(0, 40) || row.id}... `);

    const result = await fetchImageBinary(row.image);
    if (!result) {
      console.log('SKIP (fetch failed)');
      failed += 1;
      continue;
    }

    await client.query(
      `UPDATE "internship_company" SET "binary_image" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [result.buffer, row.id]
    );
    console.log(`OK (${result.buffer.length} bytes, ${result.mime})`);
    ok += 1;
  }

  await client.end();
  console.log(`\nDone. Saved: ${ok}, failed/skipped: ${failed}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
