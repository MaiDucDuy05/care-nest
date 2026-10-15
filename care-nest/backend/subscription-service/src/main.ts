import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3008;
  await app.listen(port);
  console.log(`🚀 [subscription-service] running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start subscription-service:', err);
  process.exit(1);
});
