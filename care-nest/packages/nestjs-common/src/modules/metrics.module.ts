import { Injectable, Module, Global } from '@nestjs/common';
import { Controller, Get, Header } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

/**
 * Thin wrapper around `prom-client`. We use a single process-wide
 * `Registry` so the `/metrics` endpoint returns the union of default
 * Node metrics + anything a service increments.
 *
 * Usage:
 * ```ts
 * constructor(private metrics: MetricsService) {}
 *
 * @Get('foo')
 * async foo() {
 *   const t = this.metrics.startTimer('foo_duration_seconds');
 *   try { return await this.bar(); } finally { t(); }
 * }
 * ```
 */
@Injectable()
export class MetricsService {
  readonly registry: Registry;
  private readonly counters = new Map<string, Counter>();
  private readonly histograms = new Map<string, Histogram>();

  constructor() {
    this.registry = new Registry();
    // Default Node.js metrics: process_cpu_seconds_total,
    // nodejs_eventloop_lag_seconds, nodejs_heap_size_used_bytes, etc.
    collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Increment a counter. `labels` are merged into the metric labels.
   * Calling twice with the same name+labels increments; with new
   * labels adds a new label dimension.
   */
  inc(name: string, labels: Record<string, string | number> = {}): void {
    const c = this.counters.get(name) ?? this.registry.getSingleMetric(name) as Counter
      ?? (() => {
        const created = new Counter({ name, help: name, labelNames: Object.keys(labels) });
        this.registry.registerMetric(created);
        this.counters.set(name, created);
        return created;
      })();
    c.inc(labels);
  }

  /**
   * Observe a histogram value. Default buckets cover 5ms → 10s.
   */
  observe(name: string, value: number, labels: Record<string, string | number> = {}): void {
    const h = this.histograms.get(name) ?? this.registry.getSingleMetric(name) as Histogram
      ?? (() => {
        const created = new Histogram({
          name,
          help: name,
          labelNames: Object.keys(labels),
          buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        });
        this.registry.registerMetric(created);
        this.histograms.set(name, created);
        return created;
      })();
    h.observe(labels, value);
  }

  /** Start a timer for a histogram. Call the returned fn to record the elapsed seconds. */
  startTimer(name: string, labels: Record<string, string | number> = {}): () => void {
    const start = process.hrtime.bigint();
    return () => {
      const elapsedNs = Number(process.hrtime.bigint() - start);
      const seconds = elapsedNs / 1e9;
      this.observe(name, seconds, labels);
    };
  }

  /** Render the registry as Prometheus text exposition. */
  render(): Promise<string> {
    return this.registry.metrics();
  }

  /** Content-Type for the /metrics endpoint. */
  contentType(): string {
    return this.registry.contentType;
  }
}

@Controller('metrics')
class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics(): Promise<string> {
    return this.metricsService.render();
  }
}

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
