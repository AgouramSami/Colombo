import { describe, expect, it } from 'vitest';
import { formatMatricule } from './format';
import { parseMatricule } from './parse';
import { birthYear, countryIso, isFemale } from './properties';
import { MatriculeSchema } from './schema';

const validInputs: [string, string][] = [
  ['FR 123456 26 F', 'FR-123456-26-F'],
  ['be-238743-21', 'BE-238743-21'],
  ['NL1234567/24F', 'NL-1234567-24-F'],
  ['  fr  000123  05  ', 'FR-000123-05'],
];

const invalidInputs = [
  '123456-26',       // no country
  'FR-26-123456',    // wrong order
  'FR-123456-26-M',  // M is not a valid suffix
  'FRA-123456-26',   // 3-letter country
];

describe('MatriculeSchema', () => {
  it('accepte les matricules canoniques valides', () => {
    expect(() => MatriculeSchema.parse('FR-123456-26')).not.toThrow();
    expect(() => MatriculeSchema.parse('FR-123456-26-F')).not.toThrow();
    expect(() => MatriculeSchema.parse('BE-1234567-21')).not.toThrow();
  });

  it.each(invalidInputs)('rejette "%s"', (input) => {
    expect(() => MatriculeSchema.parse(input)).toThrow();
  });
});

describe('parseMatricule', () => {
  it.each(validInputs)('normalise "%s" -> "%s"', (input, expected) => {
    expect(parseMatricule(input)).toBe(expected);
  });

  it('gere les slashes comme separateurs', () => {
    expect(parseMatricule('FR/123456/26')).toBe('FR-123456-26');
  });

  it('gere les points comme separateurs', () => {
    expect(parseMatricule('FR.123456.26')).toBe('FR-123456-26');
  });

  it('gere les underscores comme separateurs', () => {
    expect(parseMatricule('FR_123456_26')).toBe('FR-123456-26');
  });

  it('gere les tirets multiples', () => {
    expect(parseMatricule('FR--123456--26')).toBe('FR-123456-26');
  });

  it.each(invalidInputs)('leve une erreur pour "%s"', (input) => {
    expect(() => parseMatricule(input)).toThrow();
  });
});

describe('formatMatricule', () => {
  it('remplace les tirets par des espaces', () => {
    expect(formatMatricule('FR-123456-26')).toBe('FR 123456 26');
    expect(formatMatricule('FR-123456-26-F')).toBe('FR 123456 26 F');
  });
});

describe('isFemale', () => {
  it('retourne true pour un matricule femelle', () => {
    expect(isFemale('FR-123456-26-F')).toBe(true);
  });

  it('retourne false pour un matricule male', () => {
    expect(isFemale('FR-123456-26')).toBe(false);
  });
});

describe('birthYear', () => {
  it('interprete YY <= 29 comme annee 2000+', () => {
    expect(birthYear('FR-123456-00')).toBe(2000);
    expect(birthYear('FR-123456-26')).toBe(2026);
    expect(birthYear('FR-123456-29')).toBe(2029);
  });

  it('interprete YY >= 30 comme annee 1900+', () => {
    expect(birthYear('FR-123456-30')).toBe(1930);
    expect(birthYear('FR-123456-99')).toBe(1999);
  });
});

describe('countryIso', () => {
  it('extrait le code pays', () => {
    expect(countryIso('FR-123456-26')).toBe('FR');
    expect(countryIso('BE-238743-21')).toBe('BE');
    expect(countryIso('NL-1234567-24-F')).toBe('NL');
  });
});
