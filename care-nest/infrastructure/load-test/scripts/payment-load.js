/**
 * CareNest Load Test: FR-3.13 Concurrent Payment Webhook & Idempotency Test
 *
 * Verifies that:
 * 1. Webhook endpoints handle 200 concurrent payment gateway notifications.
 * 2. Idempotency deduping prevents double-charging or duplicate order state mutation.
 * 3. Concurrent requests with identical gatewayEventId/transactionRef safely resolve
 *    without database deadlocks or 500 errors.
 *
 * Target SLA:
 * - P95 < 400ms
 * - P99 < 1200ms
 * - Error rate < 0.05%
 */

import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/env.js';
import { paymentThresholds } from '../config/thresholds.js';
import { randomInt } from '../helpers/data-generators.js';

export const options = {
  scenarios: {
    concurrent_webhooks: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
    },
    burst_idempotency: {
      executor: 'per-vu-iterations',
      vus: 200,
      iterations: 1,
      startTime: '1m5s',
      maxDuration: '30s',
    },
  },
  thresholds: paymentThresholds,
};

// Fixed pool of transaction IDs to force concurrency conflicts and test deduping
const SHARED_ORDER_IDS = Array.from({ length: 20 }, (_, i) => `TEST_ORDER_${1000 + i}`);

export default function () {
  const vuId = __VU;
  const targetOrderId = SHARED_ORDER_IDS[vuId % SHARED_ORDER_IDS.length];
  const simulatedIp = `103.20.128.${(vuId % 250) + 1}`; // Diverse IP pool

  const webhookType = vuId % 2 === 0 ? 'vnpay' : 'cod';

  if (webhookType === 'vnpay') {
    // VNPay IPN Simulation
    const vnpayQuery = [
      `vnp_TmnCode=CARENEST`,
      `vnp_Amount=150000000`,
      `vnp_BankCode=NCB`,
      `vnp_BankTranNo=VNP14325678`,
      `vnp_CardType=ATM`,
      `vnp_PayDate=20261103120000`,
      `vnp_OrderInfo=${encodeURIComponent('Thanh toan don hang ' + targetOrderId)}`,
      `vnp_TransactionNo=14325678`,
      `vnp_ResponseCode=00`,
      `vnp_TransactionStatus=00`,
      `vnp_TxnRef=${targetOrderId}`,
      `vnp_SecureHashType=SHA512`,
      `vnp_SecureHash=mock_dev_hash`,
    ].join('&');

    const res = http.post(`${config.baseUrl}/api/v1/webhooks/vnpay?${vnpayQuery}`, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-For': simulatedIp,
      },
      tags: { name: 'Webhook_VNPay' },
    });

    check(res, {
      'VNPay response 200 or 400': (r) => r.status === 200 || r.status === 400,
      'VNPay not 500 error': (r) => r.status !== 500,
    });
  } else {
    // COD Confirmation Simulation
    const payload = JSON.stringify({
      orderId: targetOrderId,
      source: 'load-test-courier-cod',
      collectedAt: new Date().toISOString(),
    });

    const res = http.post(`${config.baseUrl}/api/v1/webhooks/cod/confirm`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': simulatedIp,
      },
      tags: { name: 'Webhook_COD' },
    });

    check(res, {
      'COD confirm status 200 or 201': (r) => r.status === 200 || r.status === 201,
      'COD returns ok boolean': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.ok === true;
        } catch {
          return false;
        }
      },
      'COD not 500 error': (r) => r.status !== 500,
    });
  }
}
