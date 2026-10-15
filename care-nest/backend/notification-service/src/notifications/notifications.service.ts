import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationsRepository } from './notifications.repository.js';
import { EmailChannel } from '../channels/email.channel.js';
import { SmsChannel } from '../channels/sms.channel.js';
import { PushChannel } from '../channels/push.channel.js';
import { renderTemplate } from '../templates/templates.js';
import type { CreateNotificationDto } from './dto/notification.dto.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly emailChannel: EmailChannel,
    private readonly smsChannel: SmsChannel,
    private readonly pushChannel: PushChannel,
  ) {}

  /**
   * Send a notification. Renders the template, persists the row, then
   * dispatches via the appropriate channel adapter.
   *
   * In production each adapter would do a real provider call. In dev/test
   * they all just log. Failures are caught and the row is marked FAILED.
   */
  async send(dto: CreateNotificationDto): Promise<any> {
    const rendered = renderTemplate(dto.templateKey, dto.payload);
    if (!rendered) {
      throw new NotFoundException(`Template '${dto.templateKey}' không tồn tại`);
    }
    const subject = dto.subject || rendered.subject;
    const body = rendered.body;

    const notif = await this.notificationsRepository.create({
      userId: dto.userId,
      channel: dto.channel,
      templateKey: dto.templateKey,
      payload: dto.payload,
      subject,
      body,
    });

    try {
      const recipient = String(dto.payload.to || dto.payload.email || dto.payload.phone || dto.payload.deviceToken || 'unknown');
      const result: { providerMessageId?: string; error?: string } = await this.dispatch(dto.channel, {
        to: recipient,
        subject,
        body,
        templateKey: dto.templateKey,
        payload: dto.payload,
      });
      if (result.error) {
        await this.notificationsRepository.markFailed(notif.id, result.error);
      } else {
        return await this.notificationsRepository.markSent(notif.id, result.providerMessageId);
      }
    } catch (err: any) {
      this.logger.warn({ err: err.message, id: notif.id }, 'Notification dispatch failed');
      await this.notificationsRepository.markFailed(notif.id, err.message);
    }
    return notif;
  }

  async listForUser(userId: string, page = 1, pageSize = 20): Promise<any> {
    return this.notificationsRepository.listForUser(userId, page, pageSize);
  }

  async markRead(id: string): Promise<any> {
    return this.notificationsRepository.markRead(id);
  }

  private async dispatch(channel: NotificationChannel, payload: any) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailChannel.send(payload);
      case NotificationChannel.SMS:
        return this.smsChannel.send(payload);
      case NotificationChannel.PUSH:
        return this.pushChannel.send(payload);
      default:
        return { error: `IN_APP channel has no remote adapter` };
    }
  }
}
