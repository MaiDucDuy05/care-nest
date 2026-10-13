import { describe, it, expect } from 'vitest';
import { DevicesService } from '../src/devices/devices.service.js';

describe('DevicesService', () => {
  it('should be defined', () => {
    const mockRepo = {} as any;
    const service = new DevicesService(mockRepo);
    expect(service).toBeDefined();
  });
});
