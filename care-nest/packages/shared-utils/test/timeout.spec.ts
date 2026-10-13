import { describe, it, expect } from 'vitest';
import { withTimeout, TimeoutError } from '../src/index.js';

describe('withTimeout', () => {
  it('resolves when the promise resolves in time', async () => {
    const out = await withTimeout(Promise.resolve('ok'), 100);
    expect(out).toBe('ok');
  });
  it('rejects with TimeoutError when the promise takes too long', async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve('late'), 50));
    await expect(withTimeout(slow, 10)).rejects.toBeInstanceOf(TimeoutError);
  });
});
