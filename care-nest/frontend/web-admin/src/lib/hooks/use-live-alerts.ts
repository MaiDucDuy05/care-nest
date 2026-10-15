'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { connectAlertFeed, disconnectSocket } from '@/lib/socket-client';
import type { AlertAdmin } from '@/lib/api-client';

export function useLiveAlerts(token: string) {
  const [alerts, setAlerts] = useState<AlertAdmin[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const socket = connectAlertFeed(token);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (e) => setError(e.message));

    socket.on('alert:new', (alert: AlertAdmin) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 200));
    });

    socket.on('alert:ack', ({ id }: { id: string }) => {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)));
    });

    socket.on('alert:resolve', ({ id }: { id: string }) => {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a)));
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const ack = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a)));
  }, []);

  const resolve = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a)));
  }, []);

  return { alerts, connected, error, ack, resolve };
}
