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

export function ChannelToggleGrid({ preferences, onChange }: ChannelToggleProps) {
  const t = useTranslations('notif.channels');

  const channels = Object.keys(preferences.channels) as Array<keyof typeof preferences.channels>;

  const toggleChannel = (channel: keyof typeof preferences.channels) => {
    onChange({
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: !preferences.channels[channel],
      },
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel];
        const isEnabled = preferences.channels[channel];

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

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{t(`${channel}` as 'email' | 'sms' | 'push' | 'telegram')}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t(`${channel}Desc` as 'emailDesc' | 'smsDesc' | 'pushDesc' | 'telegramDesc')}
              </div>
            </div>

            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => toggleChannel(channel)}
              style={{
                width: '20px',
                height: '20px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
          </label>
        );
      })}
    </div>
  );
}
