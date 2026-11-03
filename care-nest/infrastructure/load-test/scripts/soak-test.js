/**
 * CareNest Load Test: FR-3.10 Soak / Endurance Test
 *
 * Runs sustained, constant load over an extended period to uncover:
 * - Memory leaks in Node.js / NestJS processes
 * - PostgreSQL connection pool exhaustion or unclosed client connections
 * - Redis connection leaks or memory growth
 * - Gradual latency degradation (P95/P99 drift)
 *
 * Configurable duration via SOAK_DURATION env var (default: 15m; staging: 2h-4h).
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from '../config/env.js';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { randomInt } from '../helpers/data-generators.js';

const soakDuration = __ENV.SOAK_DURATION || '15m';

export const options = {
  stages: [
    { duration: '2m', target: 150 },          // Gentle ramp-up
    { duration: soakDuration, target: 150 },  // Sustained endurance period
    { duration: '2m', target: 0 },            // Cool-down
  ],
  thresholds: {
    // Over long durations, P95 must not drift above 400ms
    http_req_duration: ['p(95)<400', 'p(99)<1200'],
    // Error rate must stay minimal (< 0.1%)
    http_req_failed: ['rate<0.001'],
  },
};

export function setup() {
  const token = getAuthToken('buyer');
  return { token };
}

export default function (data) {
  const token = data?.token || getAuthToken('buyer');
  const headers = authHeaders(token);

  // Rotate between common queries
  const page = randomInt(1, 10);
  const endpoints = [
    `${config.baseUrl}/api/v1/products?page=${page}&limit=20`,
    `${config.baseUrl}/api/v1/cart`,
    `${config.baseUrl}/api/v1/orders?page=1&pageSize=10`,
  ];

  const targetUrl = endpoints[randomInt(0, endpoints.length - 1)];
  const res = http.get(targetUrl, {
    headers,
    tags: { name: 'Soak_Operation' },
  });

  check(res, {
    'Soak operation status 200': (r) => r.status === 200,
  });

  sleep(randomInt(1, 3));
}
