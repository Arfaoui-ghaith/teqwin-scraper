#!/usr/bin/env node
/**
 * CLI runner for teqwin-server (and ops). Usage:
 *   node scripts/run-scraper.js <source>     — one source
 *   node scripts/run-scraper.js --all        — all enabled sources
 * Prints a single JSON line to stdout.
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ENABLED_SOURCES = ['farojob', 'keejob', 'linkedin', 'optioncarriere'];
const DISABLED_SOURCES = ['tanitjobs'];

const arg = process.argv[2];

const runOne = async (source) => {
  if (DISABLED_SOURCES.includes(source)) {
    throw new Error(`Source "${source}" is disabled`);
  }
  if (!ENABLED_SOURCES.includes(source)) {
    throw new Error(
      `Unknown source "${source}". Enabled: ${ENABLED_SOURCES.join(', ')}`,
    );
  }

  const entry = path.join(__dirname, '..', 'services', source, 'index.js');
  const started = Date.now();
  const mod = require(entry);
  const data = await mod.run();
  return {
    source,
    ok: true,
    durationMs: Date.now() - started,
    count: Array.isArray(data) ? data.length : 0,
  };
};

const main = async () => {
  try {
    if (!arg) {
      throw new Error('Usage: node scripts/run-scraper.js <source|--all>');
    }

    if (arg === '--all') {
      const results = [];
      for (const source of ENABLED_SOURCES) {
        // eslint-disable-next-line no-await-in-loop
        results.push(await runOne(source));
      }
      const payload = { ok: results.every((r) => r.ok), results };
      console.log(JSON.stringify(payload));
      return;
    }

    const result = await runOne(arg);
    console.log(JSON.stringify(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ ok: false, error: message }));
    process.exit(1);
  }
};

main();
