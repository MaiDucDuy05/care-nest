'use client';

import { Mail, MessageSquare, Bell, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { NotificationPreferences } from '@/services/notification.service';

interface ChannelToggleProps {
  preferences: NotificationPreferences;
  onChange: (updated: NotificationPreferences) => void;
}

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
  telegram: Send,
};

const DEFAULT_CHANNELS = { email: true, sms: true, push: false, telegram: false };

export function ChannelToggleGrid({ preferences, onChange }: ChannelToggleProps) {
  const t = useTranslations('notif.channels');

  const safeChannels = preferences?.channels || DEFAULT_CHANNELS;
  const channelKeys = Object.keys(safeChannels) as Array<keyof typeof DEFAULT_CHANNELS>;

  const toggleChannel = (channel: keyof typeof DEFAULT_CHANNELS) => {
    onChange({
      ...preferences,
      channels: {
        ...safeChannels,
        [channel]: !safeChannels[channel],
      },
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
      {channelKeys.map((channel) => {
        const Icon = CHANNEL_ICONS[channel] || Bell;
        const isEnabled = Boolean(safeChannels[channel]);

        return (
          <label
            key={channel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${isEnabled ? 'var(--primary)' : 'var(--border-color)'}`,
              background: isEnabled ? 'var(--primary-light)' : 'var(--bg-card)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isEnabled ? 'var(--primary)' : 'var(--bg-card-subtle)',
              color: isEnabled ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>
                {t(channel)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t(`${channel}Desc`)}
              </div>
            </div>

            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => toggleChannel(channel)}
              style={{ accentColor: 'var(--primary)', width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>
        );
      })}
    </div>
  );
}
