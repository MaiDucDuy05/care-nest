'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * useAlerts — subscribes to alert:new events and manages alert list.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './use-socket';
import { AlertEvent } from '../socket-client';

export interface UseAlertsOptions {
  userId: string;
  authToken?: string;
  /** Initial alerts from SSR */
  initialAlerts?: AlertEvent[];
}

export function useAlerts({ userId, authToken, initialAlerts = [] }: UseAlertsOptions) {
  const [alerts, setAlerts] = useState<AlertEvent[]>(initialAlerts);
  const [isLoading, setIsLoading] = useState(false);

  const { subscribe, joinRoom } = useSocket({ authToken, autoConnect: true });

  useEffect(() => {
    if (!userId) return;

    const room = `subject:${userId}`;
    joinRoom(room);

    const unsub = subscribe('alert:new', (data) => {
      const alert = data as AlertEvent;
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => {
      unsub();
    };
  }, [userId, subscribe, joinRoom]);

  const prependAlert = useCallback((alert: AlertEvent) => {
    setAlerts((prev) => [alert, ...prev]);
  }, []);

  const markRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, []);

  return { alerts, isLoading, prependAlert, markRead };
}
