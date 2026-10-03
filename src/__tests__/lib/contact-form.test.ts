import { contactFieldErrors, validateContactData } from '@/lib/contact-form';
import { FIELD_MAX } from '@/lib/form-limits';

const valid = {
  name: '  Léa Martin ',
  email: ' LEA@Example.com ',
  phone: '06 12 34 56 78',
  subject: 'Une question',
  message: 'Bonjour, je voudrais savoir…',
};

describe('validateContactData', () => {
  it('accepts a complete form and normalizes it', () => {
    const result = validateContactData(valid);
    expect(result).toEqual({
      valid: true,
      data: {
        name: 'Léa Martin',
        email: 'lea@example.com',
        phone: '06 12 34 56 78',
        subject: 'Une question',
        message: 'Bonjour, je voudrais savoir…',
      },
    });
  });

  it('treats the phone number as optional', () => {
    const result = validateContactData({ ...valid, phone: '' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.phone).toBeUndefined();
  });

  it('rejects a non-object body', () => {
    expect(validateContactData(null).valid).toBe(false);
  });

  it('returns French messages for each missing field', () => {
    const result = validateContactData({ name: '', email: '', subject: ' ', message: '' });
    expect(result).toEqual({
      valid: false,
      errors: [
        'Le nom est requis.',
        "L'email est requis.",
        'Le sujet est requis.',
        'Le message est requis.',
      ],
    });
  });
});

describe('contactFieldErrors', () => {
  it('flags an invalid email and phone number', () => {
    expect(contactFieldErrors({ ...valid, email: 'lea@example', phone: '12' })).toEqual({
      email: "Cette adresse email n'est pas valide.",
      phone: "Ce numéro de téléphone n'est pas valide.",
    });
  });

  it('caps the length of every field', () => {
    const errors = contactFieldErrors({
      name: 'a'.repeat(FIELD_MAX.name + 1),
      email: `${'a'.repeat(FIELD_MAX.email)}@example.com`,
      subject: 'a'.repeat(FIELD_MAX.subject + 1),
      message: 'a'.repeat(FIELD_MAX.message + 1),
    });
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'subject']);
  });

  it('accepts values exactly at the limit', () => {
    expect(
      contactFieldErrors({ ...valid, message: 'a'.repeat(FIELD_MAX.message) })
    ).toEqual({});
  });
});
