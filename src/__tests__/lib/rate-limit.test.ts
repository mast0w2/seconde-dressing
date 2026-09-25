/**
 * @jest-environment node
 */
import { allowRequest, clientIp } from '@/lib/rate-limit';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: jest.fn(),
}));

const mockedAdmin = getSupabaseAdminClient as jest.Mock;

describe('allowRequest', () => {
  afterEach(() => mockedAdmin.mockReset());

  it('counts in memory without the service role key', async () => {
    mockedAdmin.mockReturnValue(null);
    const rule = { key: 'test:memory', max: 2, windowSeconds: 60 };
    expect(await allowRequest(rule)).toBe(true);
    expect(await allowRequest(rule)).toBe(true);
    expect(await allowRequest(rule)).toBe(false);
  });

  it('asks the database, with a hashed key', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: false, error: null });
    mockedAdmin.mockReturnValue({ rpc });

    expect(await allowRequest({ key: 'contact:to:cliente@example.com', max: 3, windowSeconds: 3600 })).toBe(false);
    expect(rpc).toHaveBeenCalledWith('rate_limit_hit', {
      bucket_key: expect.stringMatching(/^[0-9a-f]{64}$/),
      max_hits: 3,
      window_seconds: 3600,
    });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('cliente@example.com');
  });

  it('stops at the first exhausted rule', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: false, error: null });
    mockedAdmin.mockReturnValue({ rpc });

    await allowRequest(
      { key: 'a', max: 1, windowSeconds: 60 },
      { key: 'b', max: 1, windowSeconds: 60 }
    );
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('falls back to memory when the database call fails', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    mockedAdmin.mockReturnValue({ rpc });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const rule = { key: 'test:fallback', max: 1, windowSeconds: 60 };
    expect(await allowRequest(rule)).toBe(true);
    expect(await allowRequest(rule)).toBe(false);
  });
});

describe('clientIp', () => {
  it('reads the first X-Forwarded-For entry', () => {
    const request = new Request('https://seconde.test', {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    });
    expect(clientIp(request)).toBe('203.0.113.7');
  });

  it('falls back to "unknown"', () => {
    expect(clientIp(new Request('https://seconde.test'))).toBe('unknown');
  });
});
