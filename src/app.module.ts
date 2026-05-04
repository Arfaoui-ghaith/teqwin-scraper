import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { InternshipScheduleService } from './internship-schedule.service';
import { ScrapeService } from './scrape.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [ScrapeService, InternshipScheduleService],
})
export class AppModule {}

