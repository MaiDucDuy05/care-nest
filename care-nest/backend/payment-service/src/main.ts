import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Tự động load file .env từ thư mục gốc dự án nếu có
try {
  const possibleEnvs = [
    resolve(process.cwd(), 'care-nest/.env'),
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '.env'),
  ];
  if (typeof process.loadEnvFile === 'function') {
    for (const envPath of possibleEnvs) {
      if (existsSync(envPath)) {
        process.loadEnvFile(envPath);
        break;
      }
    }
  }
} catch {
  // Bỏ qua nếu môi trường đã inject sẵn biến
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['metrics', 'health', 'healthz'],
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;
  await app.listen(port);
  console.log(`🚀 [payment-service] running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start payment-service:', err);
  process.exit(1);
});
