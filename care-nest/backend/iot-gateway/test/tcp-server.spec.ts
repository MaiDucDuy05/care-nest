import { describe, it, expect } from 'vitest';
import { IotTcpServer } from '../src/server/tcp-server.js';
import { SessionManager } from '../src/sessions/session-manager.js';

describe('IotTcpServer', () => {
  it('should initialize with default port 18800', () => {
    const server = new IotTcpServer(18800);
    expect(server.port).toBe(18800);
  });

  it('should manage sessions as a singleton', () => {
    const sm1 = SessionManager.getInstance();
    const sm2 = SessionManager.getInstance();
    expect(sm1).toBe(sm2);
  });
});
