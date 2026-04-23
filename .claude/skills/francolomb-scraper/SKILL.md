# francolomb-scraper

## When to use this skill

Use this skill whenever code :

- Downloads or lists PDFs from `francolomb.com` or any regional federation site
- Parses a Francolomb race result PDF
- Extracts race metadata, pigeon results, amateur stats, or per-club cartouches
- Deals with variables named `race_pdf`, `francolomb_url`, `clapi`, or file
  patterns like `R\d+_...pdf`

Before any implementation, read `docs/domain/glossaire.md`. Some columns use
metier-specific codes (`J`, `R 1`, `A 1`, `M`, `U-M`) that must not be
re-invented.

## PDF structure, reference

All Francolomb race PDFs follow the same 3-section layout. The software behind
them is `FRANCOLOMB CLAPI, Agrement n 9`. Filename convention :

```
R{region_number}_{group_abbr}_{yyyy-mm-dd}-{release_point}-{category}.pdf
```

Example : `R21_EESE_2026-04-06-Lamotte-Beuvron-Vieux.pdf`

- `R21`, 21eme region
- `EESE`, Entente Est-Sud-Est
- `2026-04-06`, date of the release
- `Lamotte-Beuvron`, release point
- `Vieux`, category (`Vieux` or `Jeunes`)

### Section 1, race results (pages 1 to N)

Header block repeated at the top of every page :

```
Place Amateur / Enlogement Matricule Insc/Engag Distance Constate Ecart Pen Class.
k/N                                                                 page k of N
21EME REGION : GROUPEMENT ENTENTE EST-SUD-EST                       scope
Lamotte Beuvron du 06/04/2026                                       race
260007                                                              francolomb_id
```

Only on the first page :

```
1052 pigeons laches a 10:30   Pt avant : 111 km   Pt extreme : 175 km
Categorie : Vieux
Societe: [list of participating clubs with amateur/engagement counts]
Licence n 1415                                                       internal, ignore
U M 0.3 0.5 1 2 3 5 10 2/31 2/32 PAS INS                             mises schema
```

Then the rows :

```
{place} {amateur_name} {society?} {amateur_num_in_society?} {matricule} {insc}/{engag} {distance?} {n_pigeon_amateur} {clocked_hhmmss} {ecart_code} {velocity_with_comma} {mise?}
```

Fields are sparse on follow-up rows of the same amateur. Carry forward :

- `amateur_name` (empty on rows 2 and next of same amateur)
- `society` (empty on rows 2 and next of same society)
- `amateur_num_in_society` (empty on rows 2 and next)
- `distance` (empty on rows 2 and next of same amateur)

Concrete example (spaces matter, columns are space-separated, not tab) :

```
1 DA COSTA J. & Y. Dammarie les 1 FR 97954 25 F 21 / 41 118839 12:02:36 J 1283,359
2 DA COSTA J. & Y.                FR 97955 25 F 22 / 41           12:02:49 J 1280,363
```

On row 2, `society`, `amateur_num_in_society`, `distance` are missing. Amateur
name is repeated. Forward-fill logic must apply.

### Section 2, amateur statistics (1 page)

```
Place Amateur Classe Enloges Taux Places des pigeons classes
1 DA COSTA J. & Y.   16  41  39,02 %  1 - 2 - 17 - 18 - 19 - 34 - 36 - 51 - ...
2 REGLIN Olivier     18  41  43,90 %  3 - 4 - 42 - 44 - ...
```

The last column is a dash-separated list of place numbers. It can span multiple
physical lines for amateurs with many placements.

### Section 3, per-amateur cartouches (one page each)

Each amateur gets a 1-page cartouche with :

- Society (top-right of header)
- Amateur name
- `Premier :`, always the overall race winner, same across all cartouches
- `Pigeon :`, matricule of the winner
- `Vitesse :`, winner's velocity in m/min
- Engages, Classes, Reussite %, Mises totales
- Distance (in meters), Categorie
- Table of this amateur's pigeons only : `place | n_in_amateur | matricule | mises`

These cartouches are equivalent to what the domain calls "doublages" (per-club
detail). They do NOT add new data, they are a re-projection of Section 1
filtered by amateur. Parsing them is optional for MVP, Section 1 contains
everything.

## Parsing strategy, tiered

### Tier 1, `pdfplumber` plus grammar (default, covers about 95 %)

```python
import pdfplumber
import re
from decimal import Decimal
from datetime import date, time

MATRICULE_RE = re.compile(r'\b([A-Z]{2})\s+(\d{4,7})\s+(\d{2})(\s+F)?\b')
PLACE_RE = re.compile(r'^\s*(\d+)\s+')
INSC_ENGAG_RE = re.compile(r'(\d+)\s*/\s*(\d+)')
CLOCKED_RE = re.compile(r'\b(\d{2}:\d{2}:\d{2})\b')
VELOCITY_RE = re.compile(r'\b(\d{1,4},\d{3})\b')  # always 3 decimals, comma
MISE_RE = re.compile(r'([uUmM]+(?:-[uUmM]+)?)\s+(\d+,\d{2})\s*')
DISTANCE_RE = re.compile(r'\b(\d{5,7})\b')
```

Extract with `page.extract_text()` (not tables, the layout is text-based with
fixed-width columns that the tables API mis-splits).

Algorithm :

1. Parse the first page header to extract race metadata (`francolomb_id`,
   `release_point`, `release_date`, `pigeons_released`, `release_time`,
   `distance_min_km`, `distance_max_km`, `category`, `scope`).
2. Detect the results table start (line matching `^\d+\s+[A-Z]`).
3. For each row :
   - Extract `place` (leading integer).
   - Extract `matricule` via `MATRICULE_RE`.
   - Extract `insc/engag`, `clocked`, `velocity`, `mise` with dedicated regexes.
   - Carry forward `amateur_name`, `society`, `distance` from previous row if
     absent.
4. Stop at page footer marker `FRANCOLOMB CLAPI - Agrement n 9`.

### Tier 2, LLM fallback (Claude Haiku)

Trigger if Tier 1 yields :

- Less than 90 % confidence (rows with missing required fields)
- Parse errors on matricule regex
- Velocity or clocked time absent on a row that has a place number

Prompt template :

```
You are parsing a pigeon racing result PDF from francolomb.com.
Extract each row as JSON : place, amateur_name, society, matricule, insc, engag,
distance_m, n_pigeon_amateur, clocked_hhmmss, ecart_code, velocity_m_per_min, mise_eur.

Matricule format : "XX NNNNNN YY" or "XX NNNNNN YY F" (F = female).
Velocity uses COMMA as decimal separator : "1283,359" becomes 1283.359.
Carry forward amateur_name, society, distance if the row lacks them.

Return ONLY valid JSON, no prose.

PDF page text :
{page_text}
```

Use `claude-haiku-4-5-20251001`. Validate response with Pydantic. If invalid
JSON, store page in quarantine table and alert.

### Tier 3, quarantine

If both tiers fail on a PDF : store the PDF in `race_pdfs_quarantine` table
with error details and send Sentry alert. Never silently drop.

## Crawling rules, non negotiable

- User-Agent : `Colombo-Bot/1.0 (+https://colombo.fr/bot; contact@colombo.fr)`
- Rate limit : 1 request per 2s on `francolomb.com`, 1 per 5s on regional sites
- `robots.txt` : re-check monthly, abort if disallowed
- Deduplication : SHA-256 of PDF bytes into `race_pdfs.content_hash` UNIQUE
- Storage : every PDF downloaded gets stored raw in Supabase Storage bucket
  `race-pdfs/` before parsing. Never re-download, never re-parse destructively.
- Scheduling : cron every 2h on Sunday and Monday (race days), every 24h
  otherwise.
- Ethical opt-out : if `contact@francolomb.com` asks to stop, stop immediately
  and switch to partnership mode.

## Known codes (to confirm with domain expert)

These show up in the `ecart` column and must map to an enum :

- `J` (Junior ? Jeune ? confirm)
- `R 1` (Retard ? confirm)
- `A 1` (Annule ? confirm)
- `M` (? confirm)
- `u-M`, `U-M` mise type, lowercase vs uppercase may matter
- `m` (lowercase) probably a reduced-mise variant

Do not guess. Leave as raw strings until the glossaire is updated by the
domain expert (the founder's father).

## Test fixtures

Keep in `apps/scraper/fixtures/` at least :

- `R21_EESE_2026-04-06-Lamotte-Beuvron-Vieux.pdf` (known-good reference)
- At least 2 PDFs from other regions (layout variation)
- At least 1 "Jeunes" category PDF
- At least 1 PDF with OCR issues or old format

Unit tests (pytest) :

- `test_header_extraction()`, parses race metadata correctly
- `test_forward_fill_amateur()`, row 2 of an amateur inherits name / society / distance
- `test_matricule_variants()`, FR, BE, NL, PO, DE, ES, LU handled
- `test_velocity_comma_decimal()`, "1283,359" becomes 1283.359
- `test_mise_parsing()`, "U-M 2,15" becomes { type: "U-M", amount: 2.15 }
- `test_empty_mise_column()`, missing mise doesn't break the row
- `test_multipage_continuation()`, rows continue across page breaks
- `test_amateur_stats_section()`, parses Section 2
- `test_cartouche_skip()`, Section 3 is detected and skipped (MVP)

## Never do

- Try to parse with `page.extract_tables()`, the layout is not tabular enough.
- Assume the number of pigeons is bounded by a page count.
- Drop rows silently on parse error, quarantine always.
- Parse velocity with `.` as decimal, it's always `,`.
- Trust the filename alone for metadata, always verify with the PDF content.
- Hardcode the list of clubs or regions, it must come from the scraped data.
- Scrape faster than rate limits, ever.
