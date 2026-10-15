'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * useSocket — manages Socket.IO connection with auto-reconnect.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket, SocketEvent } from '../socket-client';

export interface UseSocketOptions {
  authToken?: string;
  autoConnect?: boolean;
}

export function useSocket({ authToken, autoConnect = true }: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    const socket = connectSocket(authToken);

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      setConnectionError(err.message);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Reconnect on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      document.removeEventListener('visibilitychange', handleVisibility);
      // Don't disconnect on unmount — let it persist
    };
  }, [authToken, autoConnect]);

  const subscribe = useCallback((event: SocketEvent, handler: (...args: unknown[]) => void) => {
    const socket = getSocket();
    socket.on(event, handler);

    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    return () => {
      socket.off(event, handler);
      listenersRef.current.get(event)?.delete(handler);
    };
  }, []);

  const joinRoom = useCallback((room: string) => {
    const socket = getSocket();
    socket.emit('join', { room });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    const socket = getSocket();
    socket.emit('leave', { room });
  }, []);

  return { isConnected, connectionError, subscribe, joinRoom, leaveRoom };
}
