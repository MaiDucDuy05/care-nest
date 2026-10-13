/**
 * Retry with exponential backoff + jitter
 *
 * Use for transient failures (network blips, broker reconnects) — not for
 * business validation errors, which should be surfaced immediately.
 */

export interface RetryOptions {
  /** Total attempts including the first one. Default: 5 */
  attempts?: number;
  /** Initial delay in ms. Default: 200 */
  initialDelayMs?: number;
  /** Cap on delay between attempts. Default: 5_000 */
  maxDelayMs?: number;
  /** Multiplier. Default: 2 */
  factor?: number;
  /** Random jitter 0-1 of the delay. Default: 0.1 */
  jitter?: number;
  /** Only retry if this predicate returns true. */
  shouldRetry?: (err: unknown) => boolean;
  /** Called before each retry. Useful for logging. */
  onRetry?: (err: unknown, attempt: number, nextDelayMs: number) => void;
  /** External abort signal — cancels the retry loop. */
  signal?: AbortSignal;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    attempts = 5,
    initialDelayMs = 200,
    maxDelayMs = 5_000,
    factor = 2,
    jitter = 0.1,
    shouldRetry = () => true,
    onRetry,
    signal,
  } = options;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (signal?.aborted) {
      throw new Error('retry aborted');
    }
    try {
      return await fn();
    } catch (err) {
      // re-check abort after a failed attempt (caller may have aborted)
      if (signal?.aborted) {
        throw new Error('retry aborted');
      }
      lastError = err;
      if (attempt === attempts || !shouldRetry(err)) {
        throw err;
      }
      const jitterMs = delay * jitter * Math.random();
      const nextDelay = Math.min(delay + jitterMs, maxDelayMs);
      onRetry?.(err, attempt, nextDelay);
      await sleep(nextDelay);
      delay = Math.min(delay * factor, maxDelayMs);
    }
  }
  // Should be unreachable — last attempt either resolves or throws.
  throw lastError;
}
