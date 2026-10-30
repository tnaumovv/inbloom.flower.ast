import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminFetch } from '@/features/admin/client';
import { AdminError } from '@/features/admin/errors';

describe('admin requests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_url: string, options: RequestInit = {}) => new Promise<Response>((_resolve, reject) => {
      const signal = options.signal;
      if (signal?.aborted) reject(signal.reason);
      else signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('ends a stalled request after 30 seconds even with a caller signal', async () => {
    const caller = new AbortController();
    let settled = false;
    const request = adminFetch('/api/admin/bouquets', undefined, caller.signal)
      .catch(error => { settled = true; return error; });

    await vi.advanceTimersByTimeAsync(29_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
    expect(await request).toMatchObject({ name: 'AdminError', status: 502 });
    expect(caller.signal.aborted).toBe(false);
  });

  it('still cancels immediately when the caller aborts', async () => {
    const caller = new AbortController();
    const request = adminFetch('/api/admin/bouquets', undefined, caller.signal);
    const rejected = expect(request).rejects.toBeInstanceOf(AdminError);
    caller.abort();
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('respects a caller signal that was already aborted', async () => {
    const caller = new AbortController();
    caller.abort();
    await expect(adminFetch('/api/admin/bouquets', undefined, caller.signal)).rejects.toBeInstanceOf(AdminError);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns successful responses without leaving a timeout active', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ bouquets: [] }));
    await expect(adminFetch('/api/admin/bouquets')).resolves.toEqual({ bouquets: [] });
    expect(vi.getTimerCount()).toBe(0);
  });
});
