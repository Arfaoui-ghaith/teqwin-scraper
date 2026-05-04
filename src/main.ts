import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
const { getDataSource } = require('../utils/db') as { getDataSource: () => Promise<unknown> };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  const port = Number(process.env.NEST_PORT || process.env.PORT || 3000);

  try {
    await getDataSource();
    const host = process.env.POSTGRES_HOST || 'localhost';
    const db = process.env.POSTGRES_DATABASE || 'postgres';
    console.log(`Database connected: ${db} @ ${host}`);
  } catch (err) {
    console.warn('Database not connected at startup:', (err as Error).message);
  }

  const config = new DocumentBuilder()
    .setTitle('Teqween Scraper API')
    .setDescription('API documentation for the Teqween scraping Nest server')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nest scraping server listening on ${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

