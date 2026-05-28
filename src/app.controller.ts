import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ENABLED_SCRAPE_SOURCES,
  ScrapeService,
  ScrapeSource,
} from './scrape.service';

@ApiTags('scrape')
@Controller()
export class AppController {
  constructor(private readonly scrape: ScrapeService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { ok: true };
  }

  // Run one scraper (farojob|keejob|linkedin|optioncarriere)
  @Post('scrape/:source')
  @ApiOperation({ summary: 'Run one scraper' })
  @ApiParam({
    name: 'source',
    required: true,
    description: 'Scraper source (tanitjobs is disabled)',
    enum: ENABLED_SCRAPE_SOURCES,
  })
  async scrapeOne(@Param('source') source: string) {
    return this.scrape.run(source);
  }

  // Run all scrapers
  @Post('scrape')
  @ApiOperation({ summary: 'Run all scrapers' })
  async scrapeAll() {
    return this.scrape.runAll();
  }
}

