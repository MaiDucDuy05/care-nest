import { describe, it, expect, vi } from 'vitest';
import { retry } from '../src/index.js';

describe('retry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const out = await retry(fn, { attempts: 3 });
    expect(out).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries up to the limit on failure', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(retry(fn, { attempts: 3, initialDelayMs: 1, jitter: 0 })).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops retrying when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('validation'));
    const shouldRetry = (err: unknown) => !(err instanceof Error && err.message === 'validation');
    await expect(retry(fn, { attempts: 5, initialDelayMs: 1, jitter: 0, shouldRetry })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry before each retry', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('a')).mockRejectedValueOnce(new Error('b')).mockResolvedValue('ok');
    const onRetry = vi.fn();
    const out = await retry(fn, { attempts: 5, initialDelayMs: 1, jitter: 0, onRetry });
    expect(out).toBe('ok');
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('honors AbortSignal — skips fn entirely when already aborted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    const ac = new AbortController();
    ac.abort();
    await expect(retry(fn, { attempts: 5, initialDelayMs: 1, jitter: 0, signal: ac.signal })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('honors AbortSignal — stops retrying after abort during backoff', async () => {
    const ac = new AbortController();
    const fn = vi.fn().mockImplementation(async () => {
      ac.abort();
      throw new Error('boom');
    });
    await expect(retry(fn, { attempts: 5, initialDelayMs: 1, jitter: 0, signal: ac.signal })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
