import { escapeHtml } from '@/lib/email';

describe('escapeHtml', () => {
  it('neutralises markup typed into a form', () => {
    expect(escapeHtml('<a href="https://evil.example">Cliquez</a>')).toBe(
      '&lt;a href=&quot;https://evil.example&quot;&gt;Cliquez&lt;/a&gt;'
    );
    expect(escapeHtml("l'été & co")).toBe('l&#039;été &amp; co');
  });

  it('accepts numbers and missing values', () => {
    expect(escapeHtml(12)).toBe('12');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
  });
});
