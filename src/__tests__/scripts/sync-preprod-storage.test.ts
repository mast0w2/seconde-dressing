/**
 * @jest-environment node
 */
import { encodePath, pickServiceKey, planStorageSync } from '../../../scripts/sync-preprod-storage.mjs';

describe('pickServiceKey', () => {
  it('prefers the legacy service_role key', () => {
    expect(
      pickServiceKey([
        { name: 'anon', type: 'legacy', api_key: 'anon-jwt' },
        { name: 'service_role', type: 'legacy', api_key: 'service-jwt' },
        { name: 'default', type: 'secret', api_key: 'sb_secret_x' },
      ])
    ).toBe('service-jwt');
  });

  it('falls back to a new-style secret key', () => {
    expect(
      pickServiceKey([
        { name: 'default', type: 'publishable', api_key: 'sb_publishable_x' },
        { name: 'default', type: 'secret', api_key: 'sb_secret_x' },
      ])
    ).toBe('sb_secret_x');
  });

  it('fails when no secret was revealed', () => {
    expect(() => pickServiceKey([{ name: 'default', type: 'secret', api_key: null }])).toThrow(
      'No service key returned'
    );
  });
});

describe('planStorageSync', () => {
  it('copies missing and changed files, removes the ones gone from production', () => {
    const source = [
      { path: 'req-1/a.jpg', size: 100 },
      { path: 'req-1/b.jpg', size: 200 },
      { path: 'req-2/c.jpg', size: 300 },
    ];
    const target = [
      { path: 'req-1/a.jpg', size: 100 },
      { path: 'req-1/b.jpg', size: 150 },
      { path: 'old/d.jpg', size: 50 },
    ];
    expect(planStorageSync(source, target)).toEqual({
      copy: ['req-1/b.jpg', 'req-2/c.jpg'],
      remove: ['old/d.jpg'],
    });
  });

  it('does nothing when both sides match', () => {
    const files = [{ path: 'x.jpg', size: 1 }];
    expect(planStorageSync(files, files)).toEqual({ copy: [], remove: [] });
  });
});

describe('encodePath', () => {
  it('encodes each segment but keeps the slashes', () => {
    expect(encodePath('req-1/robe dété #2.jpg')).toBe('req-1/robe%20d%C3%A9t%C3%A9%20%232.jpg');
  });
});
