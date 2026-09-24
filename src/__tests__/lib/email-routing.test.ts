import { routeRecipient } from '@/lib/email';

describe('routeRecipient', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('sends to the real recipient in production', () => {
    delete process.env.EMAIL_REDIRECT_TO;
    process.env.VERCEL_ENV = 'production';
    expect(routeRecipient('cliente@example.com', 'Bonjour')).toEqual({
      to: 'cliente@example.com',
      subject: 'Bonjour',
    });
  });

  it('redirects every email when EMAIL_REDIRECT_TO is set', () => {
    process.env.EMAIL_REDIRECT_TO = 'dev+preprod@example.com';
    process.env.VERCEL_ENV = 'preview';
    expect(routeRecipient('cliente@example.com', 'Bonjour')).toEqual({
      to: 'dev+preprod@example.com',
      subject: '[test → cliente@example.com] Bonjour',
    });
  });

  it('sends nothing from a preview that lacks EMAIL_REDIRECT_TO', () => {
    delete process.env.EMAIL_REDIRECT_TO;
    process.env.VERCEL_ENV = 'preview';
    expect(routeRecipient('cliente@example.com', 'Bonjour')).toBeNull();
  });
});
