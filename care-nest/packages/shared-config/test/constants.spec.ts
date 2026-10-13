import { describe, it, expect } from 'vitest';
import { KAFKA_TOPICS, SERVICE_NAMES, TIMEOUTS_MS, IOT, PAGINATION } from '../src/index.js';

describe('constants', () => {
  it('exposes a stable list of service names', () => {
    expect(SERVICE_NAMES.API_GATEWAY).toBe('api-gateway');
    expect(SERVICE_NAMES.IOT_GATEWAY).toBe('iot-gateway');
  });
  it('exposes all required Kafka topics', () => {
    expect(KAFKA_TOPICS.IOT_LOCATION_RECEIVED).toBe('iot.location.received');
    expect(KAFKA_TOPICS.ORDER_CREATED).toBe('order.created');
    expect(KAFKA_TOPICS.ALERT_TRIGGERED).toBe('alert.triggered');
  });
  it('exposes timeouts in milliseconds', () => {
    expect(TIMEOUTS_MS.HTTP_DEFAULT).toBe(5_000);
  });
  it('exposes IoT defaults matching iot-codec', () => {
    expect(IOT.MAX_BUFFER_SIZE).toBe(4096);
    expect(IOT.DEFAULT_TCP_PORT).toBe(18800);
  });
  it('exposes pagination defaults', () => {
    expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
    expect(PAGINATION.MAX_PAGE_SIZE).toBe(200);
  });
});
