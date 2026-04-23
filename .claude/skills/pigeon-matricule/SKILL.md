# pigeon-matricule

## When to use this skill

Use this skill whenever code touches a matricule (pigeon identifier) : parsing,
validating, storing, displaying, comparing, or using it as a key. Also triggers
when seeing formats like `FR 123456 26`, `BE-238743-21-F`, or variables named
`matricule`, `band`, `ring_number`.

## What the matricule is

The matricule is the international ISO identifier of a racing pigeon. It is :
- Unique worldwide
- Physical (engraved on the pigeon's ring, often with an RFID chip)
- The join key between everything in Colombo, never replace it with a UUID.

## Canonical format

| Layer | Format | Example |
|---|---|---|
| Database (PK, joins) | `XX-NNNNNN-YY[-F]` uppercase, dashes, no spaces | `FR-123456-26-F` |
| Display (UI) | `XX NNNNNN YY [F]` with spaces | `FR 123456 26 F` |
| User input (accepted) | Anything, normalized via `parseMatricule` | `fr123456 26f` becomes `FR-123456-26-F` |

Components :
- `XX`, ISO country code (FR, BE, NL, DE, ES, LU, etc). 2 uppercase letters.
- `NNNNNN`, club-assigned number. Variable length : typically 5 to 7 digits.
  No leading zero trimming.
- `YY`, year of birth, 2 digits (last two of the 4-digit year).
- `F`, optional suffix, present only if female. Absence means male.

## Required helpers (`packages/shared/src/matricule/`)

These helpers must exist and be used everywhere. Never concatenate strings to
build a matricule.

```ts
// packages/shared/src/matricule/schema.ts
import { z } from 'zod';

export const MatriculeSchema = z.string().regex(
  /^[A-Z]{2}-\d{4,7}-\d{2}(-F)?$/,
  'Matricule invalide. Format attendu : FR-123456-26 ou FR-123456-26-F'
);
export type Matricule = z.infer<typeof MatriculeSchema>;

// packages/shared/src/matricule/parse.ts
export function parseMatricule(input: string): Matricule {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s/._]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return MatriculeSchema.parse(cleaned);
}

// packages/shared/src/matricule/format.ts
export function formatMatricule(m: Matricule): string {
  return m.replaceAll('-', ' ');
}

// packages/shared/src/matricule/properties.ts
export function isFemale(m: Matricule): boolean {
  return m.endsWith('-F');
}
export function birthYear(m: Matricule): number {
  const yy = Number(m.split('-')[2]);
  return yy <= 29 ? 2000 + yy : 1900 + yy;
}
export function countryIso(m: Matricule): string {
  return m.split('-')[0]!;
}
```

## Validation rules (non negotiable)

1. Never trust user input directly. Always pass through `parseMatricule`.
2. In DB, `matricule` is the primary key on `pigeons`. Type : `VARCHAR(20)`.
3. In foreign keys (ex : `pigeon_results.pigeon_matricule`), no
   `CASCADE DELETE`. A pigeon can be sold or transferred, keep historical results.
4. Case sensitivity : matricules are always uppercase in storage. The regex
   enforces.
5. Year ambiguity : a matricule with `YY=26` in 2026 is a pigeon born in 2026.
   If parsed before 2030, pivot on 29 / 30. Revisit this in 2030.

## Edge cases to handle

- Hand-written matricules with typos : user types `FR 12346 26` (5 digits
  instead of 6). UI must offer fuzzy search against the scraped DB and suggest
  candidates.
- Belgian matricules can have 7 digits. Don't hardcode 6.
- Old matricules (pre 2000) use `YY` that conflicts with post 2000. Use the
  pivot rule.
- Multiple formats on paper : some pedigrees write `123456/26` (slash).
  `parseMatricule` must handle.

## Never do

- Use UUID as primary key for pigeons.
- Store matricule with spaces in DB.
- Compare matricules with `==` after different inputs, normalize first.
- Assume 6 digits.
- Use the `F` suffix for anything other than female. No color codes, no region
  codes.

## Test fixtures

Always include these in unit tests :

```ts
const validInputs = [
  ['FR 123456 26 F', 'FR-123456-26-F'],
  ['be-238743-21',   'BE-238743-21'],
  ['NL1234567/24F',  'NL-1234567-24-F'],
  ['  fr  000123  05  ', 'FR-000123-05'],
];
const invalidInputs = [
  '123456-26',        // no country
  'FR-26-123456',     // wrong order
  'FR-123456-26-M',   // M not a valid suffix
  'FRA-123456-26',    // 3-letter country
];
```
