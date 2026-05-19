import { Injectable } from '@nestjs/common';
import path from 'path';

export type ScrapeSource = 'farojob' | 'keejob' | 'linkedin' | 'optioncarriere' | 'tanitjobs';

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
    tanitjobs: path.join(this.nestRoot, 'services/tanitjobs/index.js'),
  };

  async run(source: ScrapeSource): Promise<RunResult> {
    if (!this.sourceToEntry[source]) {
      throw new Error(`Unknown source: ${source}`);
    }

    const started = Date.now();
    const entry = this.sourceToEntry[source];

    // Require and call the scraper in-process.
    // Each scraper exports { run } and saves to PostgreSQL.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(entry) as { run: () => Promise<ScrapedItem[]> };
    const results = await mod.run();
    const durationMs = Date.now() - started;
    const data = Array.isArray(results) ? results : [];
    return {
      source,
      ok: true,
      durationMs,
      count: data.length,
      data,
    };
  }

  async runAll() {
    const sources: ScrapeSource[] = ['farojob', 'keejob', 'linkedin', 'optioncarriere', 'tanitjobs'];
    const results = [];
    for (const s of sources) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await this.run(s));
    }
    return { ok: results.every((r) => r.ok), results };
  }
}

