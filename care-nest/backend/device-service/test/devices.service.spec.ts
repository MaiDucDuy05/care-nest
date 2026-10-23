import { describe, it, expect } from 'vitest';
import { DevicesService } from '../src/devices/devices.service.js';

describe('DevicesService', () => {
  it('should be defined', () => {
    const mockRepo = {} as any;
    const mockActivation = {} as any;
    const service = new DevicesService(mockRepo, mockActivation);
    expect(service).toBeDefined();
  });
});
