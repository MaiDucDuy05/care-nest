import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import type { Payout } from '@carenest/database';

export interface PayoutRequestedEvent {
  payoutId: string;
  sellerId: string;
  amountVnd: number;
  bankName: string;
  bankAccount: string;
  occurredAt: string;
}

export interface PayoutPaidEvent {
  payoutId: string;
  sellerId: string;
  amountVnd: number;
  transferRef: string;
  occurredAt: string;
}

export interface PayoutFailedEvent {
  payoutId: string;
  sellerId: string;
  reason: string;
  occurredAt: string;
}

@Injectable()
export class PayoutEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PayoutEventPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — payout event publishing is best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('payment-service');
      this.logger.log('PayoutEventPublisher ready');
    } catch (err: any) {
      this.logger.error(`Failed to init Kafka producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await disconnectKafka();
    } catch {
      /* swallow */
    }
  }

  async publishRequested(payout: Payout): Promise<void> {
    if (!this.producer) return;
    const event: PayoutRequestedEvent = {
      payoutId: payout.id,
      sellerId: payout.sellerId,
      amountVnd: Number(payout.amountVnd),
      bankName: payout.bankName,
      bankAccount: payout.bankAccount,
      occurredAt: new Date().toISOString(),
    };
    await this.producer.publish(KAFKA_TOPICS.PAYOUT_REQUESTED, event, { key: payout.sellerId });
  }

  async publishPaid(payout: Payout, transferRef: string): Promise<void> {
    if (!this.producer) return;
    const event: PayoutPaidEvent = {
      payoutId: payout.id,
      sellerId: payout.sellerId,
      amountVnd: Number(payout.amountVnd),
      transferRef,
      occurredAt: new Date().toISOString(),
    };
    await this.producer.publish(KAFKA_TOPICS.PAYOUT_PAID, event, { key: payout.sellerId });
  }

  async publishFailed(payout: Payout, reason: string): Promise<void> {
    if (!this.producer) return;
    const event: PayoutFailedEvent = {
      payoutId: payout.id,
      sellerId: payout.sellerId,
      reason,
      occurredAt: new Date().toISOString(),
    };
    await this.producer.publish(KAFKA_TOPICS.PAYOUT_FAILED, event, { key: payout.sellerId });
  }
}
