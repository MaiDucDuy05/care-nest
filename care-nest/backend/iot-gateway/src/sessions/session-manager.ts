import type { Socket } from 'node:net';

export class SessionManager {
  private static instance: SessionManager;
  private readonly sessions = new Map<string, Socket>();

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
  }

  getSocket(deviceId: string): Socket | undefined {
    return this.sessions.get(deviceId);
  }

  getActiveCount(): number {
    return this.sessions.size;
  }

  getAllDeviceIds(): string[] {
    return Array.from(this.sessions.keys());
  }
}
