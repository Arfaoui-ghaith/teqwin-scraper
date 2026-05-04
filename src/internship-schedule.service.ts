import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScrapeService } from './scrape.service';

const cronOpts: { name: string; timeZone?: string } = {
  name: 'internshipScrape',
};
if (process.env.INTERNSHIP_SCRAPE_TZ) {
  cronOpts.timeZone = process.env.INTERNSHIP_SCRAPE_TZ;
}

@Injectable()
export class InternshipScheduleService {
  private readonly log = new Logger(InternshipScheduleService.name);
  private running = false;

  constructor(private readonly scrape: ScrapeService) {}

  /** Daily at 10:00 and 17:00 (server local time, or INTERNSHIP_SCRAPE_TZ if set). */
  @Cron('0 10,17 * * *', cronOpts)
  async handleScheduledScrape(): Promise<void> {
    if (process.env.DISABLE_INTERNSHIP_CRON === '1') {
      return;
    }
    if (this.running) {
      this.log.warn('Scheduled internship scrape skipped: previous run still in progress');
      return;
    }
    this.running = true;
    this.log.log('Starting scheduled internship scrape (all sources)');
    try {
      const result = await this.scrape.runAll();
      this.log.log(
        `Scheduled internship scrape finished: ok=${result.ok}, sources=${result.results.length}`,
      );
    } catch (e) {
      this.log.error('Scheduled internship scrape failed', e as Error);
    } finally {
      this.running = false;
    }
  }
}
