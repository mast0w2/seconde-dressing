import { safeExtension, storagePath } from '@/lib/storage';

describe('storagePath', () => {
  const base = 'https://abc.supabase.co/storage/v1/object/public';

  it('keeps a bare path as it is', () => {
    expect(storagePath('req-1/photo.jpg', 'request-items')).toBe('req-1/photo.jpg');
  });

  it('extracts the path from a public URL stored before the buckets went private', () => {
    expect(storagePath(`${base}/request-items/req-1/photo.jpg`, 'request-items')).toBe('req-1/photo.jpg');
    expect(storagePath(`${base}/sale-proofs/req-1/item-1.pdf`, 'sale-proofs')).toBe('req-1/item-1.pdf');
  });

  it('undoes the encoding getPublicUrl applied', () => {
    expect(
      storagePath(`${base}/request-items/req-1/robe%20d%C3%A9t%C3%A9.jpg`, 'request-items')
    ).toBe('req-1/robe dété.jpg');
  });

  it('drops a query string', () => {
    expect(storagePath(`${base}/request-items/req-1/photo.jpg?t=123`, 'request-items')).toBe('req-1/photo.jpg');
  });
});

describe('safeExtension', () => {
  it('keeps a plain extension, lowercased', () => {
    expect(safeExtension("robe d'été.JPG")).toBe('jpg');
    expect(safeExtension('justificatif.pdf')).toBe('pdf');
  });

  it('falls back when the extension could not be a storage key', () => {
    expect(safeExtension('photo')).toBe('jpg');
    expect(safeExtension('photo.jpég')).toBe('jpg');
    expect(safeExtension('photo.')).toBe('jpg');
    expect(safeExtension('scan', 'pdf')).toBe('pdf');
  });
});
