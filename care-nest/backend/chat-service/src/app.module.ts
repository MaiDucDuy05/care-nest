import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { ChatModule } from './chat/chat.module.js';

@Module({
  imports: [MetricsModule, ChatModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}

