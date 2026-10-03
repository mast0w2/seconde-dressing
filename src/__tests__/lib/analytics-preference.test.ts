import {
  ANALYTICS_PREFERENCE_EVENT,
  isAnalyticsOptedOut,
  isOptOutFromBrowser,
  sanitizeAnalyticsUrl,
  setAnalyticsOptOut,
} from '@/lib/analytics-preference';

function setGlobalPrivacyControl(value: boolean | undefined) {
  Object.defineProperty(navigator, 'globalPrivacyControl', { value, configurable: true });
}

describe('analytics opt-out', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setGlobalPrivacyControl(undefined);
  });

  it('measures by default', () => {
    expect(isAnalyticsOptedOut()).toBe(false);
  });

  it('remembers an objection and lets the visitor take it back', () => {
    setAnalyticsOptOut(true);
    expect(isAnalyticsOptedOut()).toBe(true);
    setAnalyticsOptOut(false);
    expect(isAnalyticsOptedOut()).toBe(false);
  });

  it('treats Global Privacy Control as an objection', () => {
    setGlobalPrivacyControl(true);
    expect(isAnalyticsOptedOut()).toBe(true);
    expect(isOptOutFromBrowser()).toBe(true);
  });

  it('notifies the page when the choice changes', () => {
    const listener = jest.fn();
    window.addEventListener(ANALYTICS_PREFERENCE_EVENT, listener);
    setAnalyticsOptOut(true);
    window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, listener);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe(true);
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
