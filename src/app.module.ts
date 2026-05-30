import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScrapeService } from './scrape.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [ScrapeService],
})
export class AppModule {}
