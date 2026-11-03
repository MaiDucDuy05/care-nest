/**
 * CareNest Load Test: FR-3.3 Sustained API Stress Test
 *
 * Requirements:
 * - Sustain 1,000 requests/second for 5 minutes
 * - Enforce P95 < 300ms (P95 < 500ms under heavy stress), P99 < 1500ms
 * - Error rate < 1%
 *
 * Traffic distribution:
 * - 60% Catalog Browsing & Search (read-heavy)
 * - 25% Cart Management
 * - 15% Checkout & Order Tracking
 */

import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/env.js';
import { stressThresholds } from '../config/thresholds.js';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { generateCheckoutPayload, randomInt } from '../helpers/data-generators.js';

export const options = {
  scenarios: {
    stress_1000_rps: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 2000,
      stages: [
        { duration: '1m', target: 500 },   // Ramp up to 500 req/s
        { duration: '1m', target: 1000 },  // Ramp up to 1,000 req/s
        { duration: '5m', target: 1000 },  // Sustain 1,000 req/s for 5 minutes
        { duration: '30s', target: 100 },  // Cool down
        { duration: '15s', target: 0 },    // Ramp down to 0
      ],
    },
  },
  thresholds: stressThresholds,
};

export function setup() {
  const token = getAuthToken('buyer');
  return { token };
}

export default function (data) {
  const token = data?.token || getAuthToken('buyer');
  const headers = authHeaders(token);
  const rand = Math.random();

  if (rand < 0.60) {
    // 60% Catalog Read traffic
    const page = randomInt(1, 5);
    const isSearch = Math.random() < 0.3;

    if (isSearch) {
      const keywords = ['omron', 'wonlex', 'blood', 'heart', 'sensor'];
      const q = keywords[randomInt(0, keywords.length - 1)];
      const res = http.get(`${config.baseUrl}/api/v1/products?search=${q}`, {
        headers,
        tags: { name: 'Stress_SearchProducts' },
      });
      check(res, { 'status 200': (r) => r.status === 200 });
    } else {
      const res = http.get(`${config.baseUrl}/api/v1/products?page=${page}&limit=20`, {
        headers,
        tags: { name: 'Stress_GetProducts' },
      });
      check(res, { 'status 200': (r) => r.status === 200 });
    }
  } else if (rand < 0.85) {
    // 25% Cart traffic
    if (Math.random() < 0.5) {
      const res = http.get(`${config.baseUrl}/api/v1/cart`, {
        headers,
        tags: { name: 'Stress_GetCart' },
      });
      check(res, { 'status 200': (r) => r.status === 200 });
    } else {
      const payload = JSON.stringify({
        productId: `p-${randomInt(1, 10)}`,
        sellerId: 'seller-wonlex',
        name: 'Sản phẩm y tế thông minh',
        unitPrice: 1500000,
        quantity: 1,
      });
      const res = http.post(`${config.baseUrl}/api/v1/cart/items`, payload, {
        headers,
        tags: { name: 'Stress_AddToCart' },
      });
      check(res, { 'status 200 or 201': (r) => r.status === 200 || r.status === 201 });
    }
  } else {
    // 15% Checkout & Order Tracking
    if (Math.random() < 0.6) {
      const res = http.get(`${config.baseUrl}/api/v1/orders?page=1&pageSize=10`, {
        headers,
        tags: { name: 'Stress_ListOrders' },
      });
      check(res, { 'status 200': (r) => r.status === 200 });
    } else {
      const checkoutPayload = JSON.stringify(generateCheckoutPayload());
      const res = http.post(`${config.baseUrl}/api/v1/orders/checkout`, checkoutPayload, {
        headers,
        tags: { name: 'Stress_Checkout' },
      });
      check(res, { 'status 200 or 201': (r) => r.status === 200 || r.status === 201 });
    }
  }
}
