import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PRODUCT_IMAGE_UPLOAD_DIR } from './products/product-image-storage.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(PRODUCT_IMAGE_UPLOAD_DIR, { prefix: '/uploads/products/' });

  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['metrics', 'health', 'healthz'],
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
  await app.listen(port);
  console.log(`🚀 [catalog-service] running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start catalog-service:', err);
  process.exit(1);
});
