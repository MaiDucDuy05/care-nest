'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Save } from 'lucide-react';
import { ChannelToggleGrid } from '@/components/notif/channel-toggle';
import { notificationService, NotificationPreferences, DEFAULT_PREFERENCES } from '@/services/notification.service';

// UI keys for alert types (lowercase, user-friendly)
const ALERT_TYPES: Array<{ uiKey: string; serviceKey: keyof NotificationPreferences['alertTypes'] }> = [
  { uiKey: 'sos', serviceKey: 'sos' },
  { uiKey: 'fall', serviceKey: 'fall' },
  { uiKey: 'vital', serviceKey: 'vital' },
  { uiKey: 'geofence', serviceKey: 'geofence' },
  { uiKey: 'battery', serviceKey: 'battery' },
  { uiKey: 'billing', serviceKey: 'billing' },
];

export default function NotificationsPage() {
  const t = useTranslations('notif');
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const result = await notificationService.getPreferences();
        if (isMounted) {
          setPrefs(result);
        }
      } catch {
        // Fallback to default preferences
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await notificationService.updatePreferences(prefs);
      setPrefs(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAlert = (serviceKey: keyof NotificationPreferences['alertTypes']) => {
    setPrefs((prev) => {
      const alertTypes = prev?.alertTypes || DEFAULT_PREFERENCES.alertTypes;
      return {
        ...prev,
        alertTypes: { ...alertTypes, [serviceKey]: !alertTypes[serviceKey] },
      };
    });
  };

  const safeAlerts = prefs?.alertTypes || DEFAULT_PREFERENCES.alertTypes;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t('subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Channels */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Bell size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{t('channels.title')}</h2>
          </div>
          <ChannelToggleGrid preferences={prefs} onChange={setPrefs} />
        </div>

        {/* Alert Types */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            {t('alertTypes.title')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ALERT_TYPES.map((item) => {
              const isEnabled = Boolean(safeAlerts[item.serviceKey]);

              return (
                <label
                  key={item.serviceKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isEnabled ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: isEnabled ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleAlert(item.serviceKey)}
                    style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                      {t(`alertTypes.${item.uiKey}`)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t(`alertTypes.${item.uiKey}Desc`)}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
          {error && <span style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</span>}
          {saveSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: 600 }}>
              ✓ {t('saveSuccess')}
            </span>
          )}
          <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
