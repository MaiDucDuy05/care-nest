/**
 * Socket.IO client singleton for real-time alerts and vitals.
 */
import { io, Socket } from 'socket.io-client';

const ALERT_WS_URL = process.env.NEXT_PUBLIC_ALERT_WS_URL || 'http://localhost:3007';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(ALERT_WS_URL, {
      path: '/alerts',
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export function connectSocket(authToken?: string) {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: authToken };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}

export type SocketEvent =
  | 'vitals:update'
  | 'alert:new'
  | 'geofence:event'
  | 'device:status';

export interface VitalsUpdate {
  deviceId: string;
  timestamp: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  spo2?: number;
  temperature?: number;
  battery?: number;
  lat?: number;
  lng?: number;
  inGeofence?: string;
}

export interface AlertEvent {
  id: string;
  deviceId: string;
  subjectId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  kind: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}
