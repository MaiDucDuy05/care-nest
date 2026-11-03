/**
 * CareNest Load Test: FR-3.5 IoT Telemetry Ingestion & Query Benchmark
 *
 * Tests the capacity of device-service and IoT data pipelines:
 * 1. Caregiver dashboard high-frequency vitals polling (Latest vitals & 24h history)
 * 2. Device registration and status queries
 *
 * Target SLA:
 * - Vitals query P95 < 250ms
 * - Device list P95 < 300ms
 * - Error rate < 0.1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from '../config/env.js';
import { standardThresholds } from '../config/thresholds.js';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { randomInt } from '../helpers/data-generators.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up to 50 concurrent caregivers
    { duration: '1m', target: 200 },   // Ramp-up to 200 concurrent viewers
    { duration: '2m', target: 500 },   // High load peak
    { duration: '1m', target: 500 },   // Hold load
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: standardThresholds,
};

const DEVICE_IDS = [
  'DEV-WONLEX-001',
  'DEV-WONLEX-002',
  'DEV-WONLEX-003',
  'DEV-OMRON-101',
  'DEV-OMRON-102',
];

export function setup() {
  const token = getAuthToken('buyer');
  return { token };
}

export default function (data) {
  const token = data?.token || getAuthToken('buyer');
  const headers = authHeaders(token);
  const deviceId = DEVICE_IDS[randomInt(0, DEVICE_IDS.length - 1)];

  // 1. Fetch latest real-time vitals (heart rate, SpO2, blood pressure)
  const latestRes = http.get(`${config.baseUrl}/api/v1/devices/${deviceId}/telemetry/latest`, {
    headers,
    tags: { name: 'IoT_LatestVitals' },
  });

  check(latestRes, {
    'Latest vitals status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);

  // 2. Query historical telemetry time-series (for health charts)
  const historyRes = http.get(`${config.baseUrl}/api/v1/devices/${deviceId}/telemetry?limit=50`, {
    headers,
    tags: { name: 'IoT_TelemetryHistory' },
  });

  check(historyRes, {
    'Telemetry history status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(randomInt(1, 2));

  // 3. List registered devices
  const listRes = http.get(`${config.baseUrl}/api/v1/devices?page=1&pageSize=20`, {
    headers,
    tags: { name: 'IoT_ListDevices' },
  });

  check(listRes, {
    'List devices status 200': (r) => r.status === 200,
  });

  sleep(randomInt(1, 2));
}
