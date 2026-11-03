/**
 * SLA Thresholds based on CareNest NFR specifications:
 * - NFR-3.1: API P95 latency < 300ms
 * - NFR-3.2: API P99 latency < 1000ms
 * - Error rate < 0.1% (http_req_failed < 0.001)
 */

export const standardThresholds = {
  // 95% of requests must complete below 300ms, 99% below 1000ms
  http_req_duration: ['p(95)<300', 'p(99)<1000'],
  // HTTP failure rate must stay below 0.1% (99.9% success rate)
  http_req_failed: ['rate<0.001'],
};

export const stressThresholds = {
  // Under stress (1,000+ req/s), allow slightly relaxed thresholds while preventing degradation
  http_req_duration: ['p(95)<500', 'p(99)<1500'],
  http_req_failed: ['rate<0.01'], // < 1% error rate during sustained stress
};

export const spikeThresholds = {
  // During sudden burst spike (5x traffic in 60s), allow higher latency but enforce system survival
  http_req_duration: ['p(95)<1200', 'p(99)<3000'],
  http_req_failed: ['rate<0.05'], // < 5% error rate during peak spike
};

export const paymentThresholds = {
  // Payment callbacks and order checkout must have high availability
  http_req_duration: ['p(95)<400', 'p(99)<1200'],
  http_req_failed: ['rate<0.0005'], // < 0.05% error rate
};

export const websocketThresholds = {
  // Realtime message latency P95 < 2000ms (FR-3.4)
  ws_connecting: ['p(95)<1000'],
  ws_session_duration: ['p(95)>10000'],
};
