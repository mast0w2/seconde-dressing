import { HONEYPOT_FIELD, MIN_FILL_TIME_MS, STARTED_AT_FIELD, isLikelySpam } from '@/lib/spam';

describe('isLikelySpam', () => {
  const now = 1_800_000_000_000;

  it('lets a normal submission through', () => {
    expect(
      isLikelySpam({ name: 'Léa', [HONEYPOT_FIELD]: '', [STARTED_AT_FIELD]: now - 45_000 }, now)
    ).toBe(false);
  });

  it('flags a filled honeypot', () => {
    expect(isLikelySpam({ [HONEYPOT_FIELD]: 'https://spam.example' }, now)).toBe(true);
  });

  it('ignores a honeypot made only of spaces', () => {
    expect(isLikelySpam({ [HONEYPOT_FIELD]: '   ' }, now)).toBe(false);
  });

  it('flags a form sent faster than a person can type', () => {
    expect(isLikelySpam({ [STARTED_AT_FIELD]: now - (MIN_FILL_TIME_MS - 1) }, now)).toBe(true);
  });

  it('accepts a form sent exactly at the minimum fill time', () => {
    expect(isLikelySpam({ [STARTED_AT_FIELD]: now - MIN_FILL_TIME_MS }, now)).toBe(false);
  });

  it('does not flag submissions without the trap fields (page loaded before a deploy)', () => {
    expect(isLikelySpam({ name: 'Léa', email: 'lea@example.com' }, now)).toBe(false);
  });

  it('ignores a start time in the future (clock skew)', () => {
    expect(isLikelySpam({ [STARTED_AT_FIELD]: now + 60_000 }, now)).toBe(false);
  });

  it('ignores bodies that are not objects', () => {
    expect(isLikelySpam(null, now)).toBe(false);
    expect(isLikelySpam('text', now)).toBe(false);
  });
});
