'use client';

/**
 * useRealtimeVitals — subscribes to Socket.IO vitals:update events for a device.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './use-socket';
import { VitalsUpdate } from '../socket-client';

export interface UseRealtimeVitalsOptions {
  deviceId: string;
  userId: string;
  authToken?: string;
  /** Initial vitals from SSR */
  initialVitals?: VitalsUpdate | null;
}

export function useRealtimeVitals({ deviceId, userId, authToken, initialVitals }: UseRealtimeVitalsOptions) {
  const [vitals, setVitals] = useState<VitalsUpdate | null>(initialVitals ?? null);
  const [isConnected, setIsConnected] = useState(false);

  const { subscribe, joinRoom, isConnected: socketConnected } = useSocket({ authToken, autoConnect: true });

  useEffect(() => {
    setIsConnected(socketConnected);
  }, [socketConnected]);

  useEffect(() => {
    if (!deviceId || !userId) return;

    const room = `subject:${userId}`;
    joinRoom(room);

    const unsub = subscribe('vitals:update', (data) => {
      const update = data as VitalsUpdate;
      if (update.deviceId === deviceId) {
        setVitals((prev) => ({ ...prev, ...update }));
      }
    });

    return () => {
      unsub();
    };
  }, [deviceId, userId, subscribe, joinRoom]);

  const updateVitals = useCallback((update: Partial<VitalsUpdate>) => {
    setVitals((prev) => prev ? { ...prev, ...update } : update as VitalsUpdate);
  }, []);

  return { vitals, updateVitals, isConnected };
}
