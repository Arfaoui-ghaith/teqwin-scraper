import { Injectable } from '@nestjs/common';
import path from 'path';

/** Active scraper targets (tanitjobs is intentionally disabled). */
export type ScrapeSource = 'farojob' | 'keejob' | 'linkedin' | 'optioncarriere';

export const DISABLED_SCRAPE_SOURCES = ['tanitjobs'] as const;

export const ENABLED_SCRAPE_SOURCES: ScrapeSource[] = [
  'farojob',
  'keejob',
  'linkedin',
  'optioncarriere',
];

export type ScrapedItem = {
  company: { image?: string; name: string; address: string; country: string; countryFlag: string };
  internship: {
    title: string;
    datePosted: Date;
    validThrough: Date;
    description: string;
    url: string;
    remote?: boolean;
    skills?: string[];
  };
};

type RunResult = {
  source: ScrapeSource;
  ok: boolean;
  durationMs: number;
  count: number;
  data: ScrapedItem[];
};

@Injectable()
export class ScrapeService {
  private readonly nestRoot = path.resolve(__dirname, '..'); // nest-server/

  private readonly sourceToEntry: Record<ScrapeSource, string> = {
    farojob: path.join(this.nestRoot, 'services/farojob/index.js'),
    keejob: path.join(this.nestRoot, 'services/keejob/index.js'),
    linkedin: path.join(this.nestRoot, 'services/linkedin/index.js'),
    optioncarriere: path.join(this.nestRoot, 'services/optioncarriere/index.js'),
  };

  async run(source: string): Promise<RunResult> {
    if ((DISABLED_SCRAPE_SOURCES as readonly string[]).includes(source)) {
      throw new Error(`Scraper source "${source}" is disabled`);
    }
    if (!this.sourceToEntry[source as ScrapeSource]) {
      throw new Error(
        `Unknown source: ${source}. Enabled: ${ENABLED_SCRAPE_SOURCES.join(', ')}`,
      );
    }

    const started = Date.now();
    const entry = this.sourceToEntry[source as ScrapeSource];

    // Require and call the scraper in-process.
    // Each scraper exports { run } and saves to PostgreSQL.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(entry) as { run: () => Promise<ScrapedItem[]> };
    const results = await mod.run();
    const durationMs = Date.now() - started;
    const data = Array.isArray(results) ? results : [];
    return {
      source: source as ScrapeSource,
      ok: true,
      durationMs,
      count: data.length,
      data,
    };
  }

  async runAll() {
    const sources: ScrapeSource[] = [...ENABLED_SCRAPE_SOURCES];
    const results = [];
    for (const s of sources) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await this.run(s));
    }
    return { ok: results.every((r) => r.ok), results };
  }
}

