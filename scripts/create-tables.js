const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
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

const sql = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

client
  .connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log('Internship tables created successfully.');
    client.end();
  })
  .catch((err) => {
    console.error(err.message);
    client.end();
    process.exit(1);
  });
