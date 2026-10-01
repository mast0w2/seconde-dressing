import {
  CONSENT_CHANGE_EVENT,
  CONSENT_MAX_AGE_MS,
  readConsent,
  sanitizeAnalyticsUrl,
  writeConsent,
} from '@/lib/consent';

describe('consent storage', () => {
  const now = 1_800_000_000_000;

  beforeEach(() => window.localStorage.clear());

  it('has no choice before the visitor decides', () => {
    expect(readConsent(now)).toBeNull();
  });

  it('remembers a choice', () => {
    writeConsent('denied', now);
    expect(readConsent(now + 1000)).toBe('denied');
    writeConsent('granted', now);
    expect(readConsent(now + 1000)).toBe('granted');
  });

  it('asks again after six months', () => {
    writeConsent('granted', now);
    expect(readConsent(now + CONSENT_MAX_AGE_MS - 1)).toBe('granted');
    expect(readConsent(now + CONSENT_MAX_AGE_MS + 1)).toBeNull();
  });

  it('ignores a corrupted or foreign value', () => {
    window.localStorage.setItem('seconde:consent', '{not json');
    expect(readConsent(now)).toBeNull();
    window.localStorage.setItem('seconde:consent', JSON.stringify({ analytics: 'yes' }));
    expect(readConsent(now)).toBeNull();
  });

  it('notifies the page when the choice changes', () => {
    const listener = jest.fn();
    window.addEventListener(CONSENT_CHANGE_EVENT, listener);
    writeConsent('granted', now);
    window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe('granted');
  });
});

describe('sanitizeAnalyticsUrl', () => {
  it('removes the query string and fragment', () => {
    expect(
      sanitizeAnalyticsUrl('https://www.seconde-dressing.com/login?redirect=/dashboard&email=a@b.c#x')
    ).toBe('https://www.seconde-dressing.com/login');
  });

  it('keeps campaign parameters', () => {
    expect(
      sanitizeAnalyticsUrl('https://www.seconde-dressing.com/?utm_source=insta&token=secret&utm_campaign=sept')
    ).toBe('https://www.seconde-dressing.com/?utm_source=insta&utm_campaign=sept');
  });

  it('falls back to cutting the string when the URL cannot be parsed', () => {
    expect(sanitizeAnalyticsUrl('/concept?x=1')).toBe('/concept');
  });
});
