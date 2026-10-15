import { Module } from '@nestjs/common';
import { EmailChannel } from './email.channel.js';
import { SmsChannel } from './sms.channel.js';
import { PushChannel } from './push.channel.js';

@Module({
  providers: [EmailChannel, SmsChannel, PushChannel],
  exports: [EmailChannel, SmsChannel, PushChannel],
})
export class ChannelsModule {}
