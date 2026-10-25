import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ChatGateway } from './chat/chat.gateway.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['metrics', 'health', 'healthz'],
  });

  const chatGateway = app.get(ChatGateway);
  chatGateway.attach(app.getHttpServer());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3010;
  await app.listen(port);
  console.log(`💬 [chat-service] running on http://localhost:${port}/${apiPrefix}`);
  console.log(`⚡ [chat-service] WebSocket gateway ready at ws://localhost:${port}/chat`);
}

bootstrap().catch((err) => {
  console.error('Failed to start chat-service:', err);
  process.exit(1);
});

