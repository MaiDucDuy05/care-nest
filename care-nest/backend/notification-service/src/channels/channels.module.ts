import { Module, type Provider } from '@nestjs/common';
import { EmailChannel } from './email.channel.js';
import { SmsChannel } from './sms.channel.js';
import { PushChannel } from './push.channel.js';
import { VapidPushChannel } from './vapid-push.channel.js';
import { EsmsSmsChannel } from './esms-sms.channel.js';
import { SesEmailChannel } from './ses-email.channel.js';
import { ZnsZaloChannel } from './zns-zalo.channel.js';
import { NotificationDispatcher } from './dispatcher.js';
import { UserChannelResolver } from './user-channel-resolver.js';

/**
 * ChannelsModule wires the 4 channel implementations + the dispatcher.
 *
 * The "official" instances are:
 *   - `VapidPushChannel` for PUSH
 *   - `EsmsSmsChannel`   for SMS
 *   - `SesEmailChannel`  for EMAIL
 *   - `ZnsZaloChannel`   for ZNS
 *
 * The Phase 1 mocks (EmailChannel, SmsChannel, PushChannel) are kept for
 * backward compatibility and for tests that don't want a real adapter. The
 * dispatcher prefers the "official" instances when both are present.
 */
@Module({
  providers: [
    EmailChannel,
    SmsChannel,
    PushChannel,
    VapidPushChannel,
    EsmsSmsChannel,
    SesEmailChannel,
    ZnsZaloChannel,
    NotificationDispatcher,
    UserChannelResolver,
  ],
  exports: [
    EmailChannel,
    SmsChannel,
    PushChannel,
    VapidPushChannel,
    EsmsSmsChannel,
    SesEmailChannel,
    ZnsZaloChannel,
    NotificationDispatcher,
    UserChannelResolver,
  ],
})
export class ChannelsModule {}
