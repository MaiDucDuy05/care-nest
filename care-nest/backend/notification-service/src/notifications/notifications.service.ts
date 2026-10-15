import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationDispatcher } from '../channels/dispatcher.js';
import { UserChannelResolver } from '../channels/user-channel-resolver.js';
import { renderTemplate } from '../templates/templates.js';
import type { CreateNotificationDto } from './dto/notification.dto.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly dispatcher: NotificationDispatcher,
    private readonly userResolver: UserChannelResolver,
  ) {}

  /**
   * Send a notification. Renders the template, builds a channel-priority
   * dispatch plan, persists one row per attempt, and dispatches.
   *
   * For backward compatibility, if `dto.channel` is set we use the
   * explicit single-channel mode; otherwise we use the dispatcher
   * (Phase 2 default: ZNS > PUSH > SMS > EMAIL).
   */
  async send(dto: CreateNotificationDto): Promise<any> {
    const rendered = renderTemplate(dto.templateKey, dto.payload);
    if (!rendered) {
      throw new NotFoundException(`Template '${dto.templateKey}' không tồn tại`);
    }
    const subject = dto.subject || rendered.subject;
    const body = rendered.body;

    // Persist the QUEUED row first
    const notif = await this.notificationsRepository.create({
      userId: dto.userId,
      channel: dto.channel,
      templateKey: dto.templateKey,
      payload: dto.payload,
      subject,
      body,
    });

    if (dto.channel) {
      // Explicit single-channel mode (backward compat)
      return this.dispatchSingleChannel(notif.id, dto, subject, body);
    }

    // Dispatcher mode: build a plan based on user's contact info
    const plan = await this.dispatcher.buildPlan(dto.userId, dto.templateKey, {
      to: 'auto',
      subject,
      body,
      templateKey: dto.templateKey,
      payload: dto.payload,
    });
    if (plan.channels.length === 0) {
      await this.notificationsRepository.markFailed(notif.id, 'No contact info');
      return notif;
    }
    const isCritical = dto.templateKey === 'alert.sos' || dto.templateKey === 'alert.fall';
    const results = await this.dispatcher.execute(
      plan,
      { to: 'auto', subject, body, templateKey: dto.templateKey, payload: dto.payload },
      isCritical,
    );

    // Pick the first successful result, if any
    const success = results.find((r) => !r.error);
    if (success) {
      return this.notificationsRepository.markSent(notif.id, success.providerMessageId);
    }
    const firstError = results.find((r) => r.error)?.error ?? 'All channels failed';
    await this.notificationsRepository.markFailed(notif.id, firstError);
    return notif;
  }

  private async dispatchSingleChannel(
    notifId: string,
    dto: CreateNotificationDto,
    subject: string,
    body: string,
  ): Promise<any> {
    const contact = await this.userResolver.resolve(dto.userId);
    const recipient = String(
      dto.payload.to
      || dto.payload.email
      || dto.payload.phone
      || dto.payload.deviceToken
      || contact.email
      || contact.phone
      || contact.deviceToken
      || 'unknown',
    );
    const plan = await this.dispatcher.buildPlan(dto.userId, dto.templateKey, {
      to: recipient,
      subject,
      body,
      templateKey: dto.templateKey,
      payload: dto.payload,
    });
    // Filter to only the requested channel
    const step = plan.channels.find((c) => c.channel === dto.channel);
    if (!step) {
      await this.notificationsRepository.markFailed(notifId, `No recipient for ${dto.channel}`);
      return;
    }
    try {
      const res = await step.adapter.send({ to: recipient, subject, body, templateKey: dto.templateKey, payload: dto.payload });
      if (res.error) {
        await this.notificationsRepository.markFailed(notifId, res.error);
      } else {
        return this.notificationsRepository.markSent(notifId, res.providerMessageId);
      }
    } catch (err: any) {
      this.logger.warn({ err: err.message, id: notifId }, 'Single-channel dispatch failed');
      await this.notificationsRepository.markFailed(notifId, err.message);
    }
  }

  async listForUser(userId: string, page = 1, pageSize = 20): Promise<any> {
    return this.notificationsRepository.listForUser(userId, page, pageSize);
  }

  async markRead(id: string): Promise<any> {
    return this.notificationsRepository.markRead(id);
  }
}
