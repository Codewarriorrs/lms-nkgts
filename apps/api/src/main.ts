import dotenv from 'dotenv';
import path from 'path';
// Load root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

console.log('DEBUG: DATABASE_URL exists in process.env?', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DEBUG: DATABASE_URL length:', process.env.DATABASE_URL.length);
  console.log('DEBUG: DATABASE_URL start:', process.env.DATABASE_URL.substring(0, 20));
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');

  // Konfigurasi limit ukuran request payload (Default Express hanya 100kb)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
