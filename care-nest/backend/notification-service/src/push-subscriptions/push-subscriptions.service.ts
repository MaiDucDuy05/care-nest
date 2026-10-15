import { Injectable, NotFoundException } from '@nestjs/common';
import { PushSubscriptionsRepository } from './push-subscriptions.repository.js';
import type { PushSubscriptionCreateDto } from './dto/push-subscription.dto.js';

@Injectable()
export class PushSubscriptionsService {
  constructor(private readonly repository: PushSubscriptionsRepository) {}

  async subscribe(userId: string, dto: PushSubscriptionCreateDto): Promise<any> {
    return this.repository.upsert(
      userId,
      dto.endpoint,
      dto.keys.p256dh,
      dto.keys.auth,
      dto.userAgent,
    );
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.repository.deleteByEndpoint(endpoint);
  }

  async listForUser(userId: string): Promise<any[]> {
    return this.repository.listForUser(userId);
  }
}
