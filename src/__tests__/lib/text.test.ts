import { capitalizeName } from '@/lib/text';

describe('capitalizeName', () => {
  it('capitalizes the first letter of a name', () => {
    expect(capitalizeName('john')).toBe('John');
    expect(capitalizeName('marie')).toBe('Marie');
  });

  it('handles empty strings', () => {
    expect(capitalizeName('')).toBe('');
  });

  it('handles names that are already capitalized', () => {
    expect(capitalizeName('John')).toBe('John');
  });

  it('handles single character names', () => {
    expect(capitalizeName('a')).toBe('A');
  });
});
