import type { Socket } from 'node:net';

export class SessionManager {
  private static instance: SessionManager;
  private readonly sessions = new Map<string, Socket>();
  // S16: track which userId owns each active device. Set on login
  // when device-service confirms a used activation code exists.
  private readonly owners = new Map<string, string>();

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  register(deviceId: string, socket: Socket): void {
    this.sessions.set(deviceId, socket);
  }

  unregister(deviceId: string): void {
    this.sessions.delete(deviceId);
    this.owners.delete(deviceId);
  }

  getSocket(deviceId: string): Socket | undefined {
    return this.sessions.get(deviceId);
  }

  getActiveCount(): number {
    return this.sessions.size;
  }

  setOwner(deviceId: string, userId: string): void {
    this.owners.set(deviceId, userId);
  }

  getOwner(deviceId: string): string | undefined {
    return this.owners.get(deviceId);
  }
}
