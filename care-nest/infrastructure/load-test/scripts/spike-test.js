/**
 * CareNest Load Test: FR-3.11 Flash Sale / Spike Test
 *
 * Simulates extreme sudden traffic surges (e.g. Flash Sale launch at 00:00 / 12:00):
 * - Baseline traffic: 100-200 req/s
 * - 5x to 10x sudden spike to 2,000+ req/s within 60s
 * - Measures rate-limiter efficacy, thread-pool saturation, and recovery time.
 *
 * Target SLA:
 * - P95 < 1200ms under extreme spike
 * - Error rate < 5% during burst, recovering to < 0.1% post-spike
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from '../config/env.js';
import { spikeThresholds } from '../config/thresholds.js';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { randomInt } from '../helpers/data-generators.js';

export const options = {
  scenarios: {
    flash_sale_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 3000,
      stages: [
        { duration: '30s', target: 200 },   // Warm-up baseline
        { duration: '15s', target: 1500 },  // Sudden spike initiation
        { duration: '1m', target: 2000 },   // Peak flash sale burst (5x-10x)
        { duration: '30s', target: 300 },   // Traffic recedes
        { duration: '1m', target: 100 },    // Recovery verification
      ],
    },
  },
  thresholds: spikeThresholds,
};

export function setup() {
  const token = getAuthToken('buyer');
  return { token };
}

export default function (data) {
  const token = data?.token || getAuthToken('buyer');
  const headers = authHeaders(token);

  // During flash sales, users aggressively refresh product listings and spam add-to-cart
  const action = Math.random();

  if (action < 0.50) {
    // 50% Flash Sale PDP / PLP refresh
    const res = http.get(`${config.baseUrl}/api/v1/products?limit=10&flashSale=true`, {
      headers,
      tags: { name: 'Spike_FlashCatalog' },
    });
    check(res, {
      'status 200 or 429 rate limited': (r) => r.status === 200 || r.status === 429,
    });
  } else if (action < 0.80) {
    // 30% Rapid Add-to-cart attempts
    const payload = JSON.stringify({
      productId: 'p-flash-sale-omron',
      sellerId: 'seller-wonlex',
      name: 'Omron Flash Sale 50% OFF',
      unitPrice: 725000,
      quantity: 1,
    });

    const res = http.post(`${config.baseUrl}/api/v1/cart/items`, payload, {
      headers,
      tags: { name: 'Spike_AddToCart' },
    });

    check(res, {
      'status 200, 201 or 429': (r) => r.status === 200 || r.status === 201 || r.status === 429,
    });
  } else {
    // 20% Instant Checkout attempt
    const checkoutPayload = JSON.stringify({
      shippingAddress: {
        name: 'Flash Sale Buyer',
        phone: '0987654321',
        line1: 'Số 1 Phố Huế',
        district: 'Hai Bà Trưng',
        province: 'Hà Nội',
        country: 'VN',
      },
      paymentMethod: 'COD',
      note: 'Giao hỏa tốc',
    });

    const res = http.post(`${config.baseUrl}/api/v1/orders/checkout`, checkoutPayload, {
      headers,
      tags: { name: 'Spike_Checkout' },
    });

    check(res, {
      'status 200, 201, 400 or 429': (r) => [200, 201, 400, 429].includes(r.status),
    });
  }
}
