import { describe, expect, it } from 'vitest';
import { formatMatricule } from './format';
import { parseMatricule } from './parse';
import { birthYear, countryIso, isFemale } from './properties';
import { MatriculeSchema } from './schema';

describe('MatriculeSchema', () => {
  const accepted = [
    'FR-123456-26',
    'FR-123456-26-F',
    'BE-238743-21',
    'NL-1234567-24-F',
    'LU-1234-26',
    'DE-1234567-99',
    'ES-12345-00',
  ];

  const rejected = [
    '123456-26',
    'FR-26-123456',
    'FR-123456-26-M',
    'FRA-123456-26',
    'fr-123456-26',
    'FR-123-26',
    'FR-12345678-26',
    'FR-123456-2',
    'FR-123456-2026',
    '',
  ];

  it.each(accepted)('accepts %s', (m) => {
    expect(MatriculeSchema.parse(m)).toBe(m);
  });

  it.each(rejected)('rejects %s', (m) => {
    expect(() => MatriculeSchema.parse(m)).toThrow();
  });
});

describe('parseMatricule', () => {
  const valid: Array<[string, string]> = [
    ['FR 123456 26 F', 'FR-123456-26-F'],
    ['be-238743-21', 'BE-238743-21'],
    ['NL1234567/24F', 'NL-1234567-24-F'],
    ['  fr  000123  05  ', 'FR-000123-05'],
    ['FR.123456.26', 'FR-123456-26'],
    ['FR_123456_26_F', 'FR-123456-26-F'],
    ['FR--123456--26', 'FR-123456-26'],
    ['---FR-123456-26---', 'FR-123456-26'],
    ['FR123456/26/F', 'FR-123456-26-F'],
    ['be 238743 21', 'BE-238743-21'],
  ];

  const invalid = ['123456-26', 'FR-26-123456', 'FR-123456-26-M', 'FRA-123456-26', 'totally wrong'];

  it.each(valid)('parses %s to %s', (input, expected) => {
    expect(parseMatricule(input)).toBe(expected);
  });

  it.each(invalid)('rejects %s', (input) => {
    expect(() => parseMatricule(input)).toThrow();
  });
});

describe('formatMatricule', () => {
  it('replaces dashes with spaces', () => {
    expect(formatMatricule('FR-123456-26')).toBe('FR 123456 26');
    expect(formatMatricule('FR-123456-26-F')).toBe('FR 123456 26 F');
    expect(formatMatricule('NL-1234567-24-F')).toBe('NL 1234567 24 F');
  });
});

describe('isFemale', () => {
  it('returns true when matricule ends with -F', () => {
    expect(isFemale('FR-123456-26-F')).toBe(true);
    expect(isFemale('BE-238743-21-F')).toBe(true);
  });

  it('returns false when matricule has no suffix', () => {
    expect(isFemale('FR-123456-26')).toBe(false);
    expect(isFemale('NL-1234567-24')).toBe(false);
  });
});

describe('countryIso', () => {
  it.each([
    ['FR-123456-26', 'FR'],
    ['BE-238743-21', 'BE'],
    ['NL-1234567-24-F', 'NL'],
    ['LU-123456-26-F', 'LU'],
    ['DE-1234567-99', 'DE'],
  ])('extracts country of %s as %s', (m, iso) => {
    expect(countryIso(m)).toBe(iso);
  });
});

describe('birthYear', () => {
  it('returns 2000 to 2029 for YY 00 to 29', () => {
    expect(birthYear('FR-123456-00')).toBe(2000);
    expect(birthYear('FR-123456-05')).toBe(2005);
    expect(birthYear('FR-123456-26')).toBe(2026);
    expect(birthYear('FR-123456-29')).toBe(2029);
  });

  it('returns 1930 to 1999 for YY 30 to 99', () => {
    expect(birthYear('FR-123456-30')).toBe(1930);
    expect(birthYear('FR-123456-50')).toBe(1950);
    expect(birthYear('FR-123456-99')).toBe(1999);
  });

  it('handles female suffix without confusing the year', () => {
    expect(birthYear('FR-123456-26-F')).toBe(2026);
    expect(birthYear('FR-123456-95-F')).toBe(1995);
    expect(birthYear('NL-1234567-05-F')).toBe(2005);
  });
});
