import { safeRedirectPath } from '@/lib/safe-redirect';

describe('safeRedirectPath', () => {
  it('keeps a path on this site, with its query and hash', () => {
    expect(safeRedirectPath('/dashboard/seller')).toBe('/dashboard/seller');
    expect(safeRedirectPath('/dashboard/contract/abc?x=1#top')).toBe('/dashboard/contract/abc?x=1#top');
  });

  it('returns null when there is nothing to follow', () => {
    expect(safeRedirectPath(null)).toBeNull();
    expect(safeRedirectPath(undefined)).toBeNull();
    expect(safeRedirectPath('')).toBeNull();
  });

  it('refuses absolute and protocol-relative URLs', () => {
    expect(safeRedirectPath('https://evil.example')).toBeNull();
    expect(safeRedirectPath('//evil.example/login')).toBeNull();
  });

  it('refuses scripts', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBeNull();
    expect(safeRedirectPath('/javascript:alert(1)')).toBe('/javascript:alert(1)');
  });

  it('refuses what browsers would turn into another host', () => {
    expect(safeRedirectPath('/\\evil.example')).toBeNull();
    expect(safeRedirectPath('/\t/evil.example')).toBeNull();
    expect(safeRedirectPath('/\n/evil.example')).toBeNull();
  });
});
