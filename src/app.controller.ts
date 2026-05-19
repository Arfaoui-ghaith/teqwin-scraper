import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ScrapeService, ScrapeSource } from './scrape.service';

@ApiTags('scrape')
@Controller()
export class AppController {
  constructor(private readonly scrape: ScrapeService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { ok: true };
  }

  // Run one scraper (farojob|keejob|linkedin|optioncarriere|tanitjobs)
  @Post('scrape/:source')
  @ApiOperation({ summary: 'Run one scraper' })
  @ApiParam({
    name: 'source',
    required: true,
    description: 'Scraper source',
    enum: ['farojob', 'keejob', 'linkedin', 'optioncarriere', 'tanitjobs'],
  })
  async scrapeOne(@Param('source') source: string) {
    return this.scrape.run(source as ScrapeSource);
  }

  // Run all scrapers
  @Post('scrape')
  @ApiOperation({ summary: 'Run all scrapers' })
  async scrapeAll() {
    return this.scrape.runAll();
  }
}

