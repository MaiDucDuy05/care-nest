import { describe, it, expect } from 'vitest';
import { MetricsService } from '../src/modules/metrics.module';

describe('MetricsService', () => {
  it('registers default Node.js metrics on construction', async () => {
    const svc = new MetricsService();
    const text = await svc.render();
    // Default metrics include nodejs_eventloop_lag_seconds
    expect(text).toMatch(/nodejs_eventloop_lag_seconds/);
    expect(text).toMatch(/process_cpu_user_seconds_total/);
  });

  it('inc() registers and increments a counter', async () => {
    const svc = new MetricsService();
    svc.inc('refunds_total', { gateway: 'VNPAY' });
    svc.inc('refunds_total', { gateway: 'VNPAY' });
    svc.inc('refunds_total', { gateway: 'MOMO' });
    const text = await svc.render();
    expect(text).toMatch(/refunds_total\{gateway="VNPAY"\} 2/);
    expect(text).toMatch(/refunds_total\{gateway="MOMO"\} 1/);
  });

  it('observe() records histogram values', async () => {
    const svc = new MetricsService();
    svc.observe('foo_duration_seconds', 0.123, { method: 'GET' });
    svc.observe('foo_duration_seconds', 0.456, { method: 'GET' });
    const text = await svc.render();
    expect(text).toMatch(/foo_duration_seconds_bucket\{le="0\.25",method="GET"\}/);
    expect(text).toMatch(/foo_duration_seconds_count\{method="GET"\} 2/);
  });

  it('startTimer records elapsed seconds', async () => {
    const svc = new MetricsService();
    const stop = svc.startTimer('op_duration_seconds', { kind: 'slow' });
    await new Promise((r) => setTimeout(r, 30));
    stop();
    const text = await svc.render();
    expect(text).toMatch(/op_duration_seconds_count\{kind="slow"\} 1/);
    const match = text.match(/op_duration_seconds_sum\{kind="slow"\} (\S+)/);
    expect(match).not.toBeNull();
    expect(parseFloat(match![1])).toBeGreaterThan(0.02);
  });

  it('contentType returns Prometheus text format', () => {
    const svc = new MetricsService();
    expect(svc.contentType()).toContain('text/plain');
  });
});
