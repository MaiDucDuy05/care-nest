/**
 * CareNest Load Test: FR-3.2 & NFR-3.1 Buyer Journey Baseline
 *
 * Simulates real end-to-end buyer workflows:
 * 1. Browse Catalog (PLP)
 * 2. Search Products
 * 3. View Product Details (PDP)
 * 4. Add Product to Shopping Cart
 * 5. Retrieve Cart Items
 * 6. Checkout / Place Order
 * 7. View Order History
 *
 * Target SLA:
 * - P95 < 300ms
 * - P99 < 1000ms
 * - Error rate < 0.1%
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { config } from '../config/env.js';
import { standardThresholds } from '../config/thresholds.js';
import { getAuthToken, authHeaders } from '../helpers/auth.js';
import { generateCheckoutPayload, randomInt } from '../helpers/data-generators.js';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Warm-up to 20 VUs
    { duration: '1m', target: 50 },   // Ramp-up to 50 VUs
    { duration: '2m', target: 100 },  // Peak at 100 VUs baseline
    { duration: '1m', target: 100 },  // Hold at 100 VUs
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: standardThresholds,
};

export function setup() {
  const token = getAuthToken('buyer');
  return { token };
}

export default function (data) {
  const token = data?.token || getAuthToken('buyer');
  const headers = authHeaders(token);
  let selectedProductId = 'p-1';
  let selectedSellerId = 'seller-wonlex';

  // --- Step 1: Browse Product Listing Page (PLP) ---
  group('01_Browse_Catalog', () => {
    const page = randomInt(1, 3);
    const res = http.get(`${config.baseUrl}/api/v1/products?page=${page}&limit=20`, {
      headers,
      tags: { name: 'PLP_GetProducts' },
    });

    const isOk = check(res, {
      'PLP status 200': (r) => r.status === 200,
      'PLP returns products array': (r) => {
        try {
          const body = JSON.parse(r.body);
          const items = Array.isArray(body) ? body : body.items || body.products || [];
          if (items.length > 0 && items[0].id) {
            selectedProductId = items[0].id;
            if (items[0].sellerId) selectedSellerId = items[0].sellerId;
          }
          return true;
        } catch {
          return false;
        }
      },
    });

    if (!isOk) {
      sleep(1);
      return;
    }
  });

  sleep(randomInt(1, 2));

  // --- Step 2: Search Products ---
  group('02_Search_Products', () => {
    const query = 'omron';
    const res = http.get(`${config.baseUrl}/api/v1/products?search=${encodeURIComponent(query)}&limit=10`, {
      headers,
      tags: { name: 'Search_Products' },
    });

    check(res, {
      'Search status 200': (r) => r.status === 200,
    });
  });

  sleep(randomInt(1, 2));

  // --- Step 3: View Product Details Page (PDP) ---
  group('03_View_PDP', () => {
    const res = http.get(`${config.baseUrl}/api/v1/products/${selectedProductId}`, {
      headers,
      tags: { name: 'PDP_GetDetails' },
    });

    check(res, {
      'PDP status 200 or 404 handled': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(randomInt(1, 2));

  // --- Step 4: Add to Cart ---
  group('04_Add_To_Cart', () => {
    const cartPayload = JSON.stringify({
      productId: selectedProductId,
      sellerId: selectedSellerId,
      name: 'Thiết bị y tế CareNest',
      unitPrice: 1250000,
      quantity: 1,
    });

    const res = http.post(`${config.baseUrl}/api/v1/cart/items`, cartPayload, {
      headers,
      tags: { name: 'Cart_AddItem' },
    });

    check(res, {
      'Add to cart status 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(1);

  // --- Step 5: Get Current Cart ---
  group('05_View_Cart', () => {
    const res = http.get(`${config.baseUrl}/api/v1/cart`, {
      headers,
      tags: { name: 'Cart_Get' },
    });

    check(res, {
      'Get cart status 200': (r) => r.status === 200,
    });
  });

  sleep(randomInt(1, 3));

  // --- Step 6: Checkout / Place Order ---
  group('06_Checkout', () => {
    const checkoutData = JSON.stringify(generateCheckoutPayload());
    const res = http.post(`${config.baseUrl}/api/v1/orders/checkout`, checkoutData, {
      headers,
      tags: { name: 'Order_Checkout' },
    });

    check(res, {
      'Checkout status 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(1);

  // --- Step 7: View Order History ---
  group('07_Order_History', () => {
    const res = http.get(`${config.baseUrl}/api/v1/orders?page=1&pageSize=10`, {
      headers,
      tags: { name: 'Order_List' },
    });

    check(res, {
      'Order history status 200': (r) => r.status === 200,
    });
  });

  sleep(randomInt(1, 3));
}
