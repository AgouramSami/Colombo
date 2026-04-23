import {
  boolean,
  char,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Schema Drizzle pour Colombo.
 *
 * Source de verite pour la structure de la base. Toute modification passe par
 * une migration (pnpm db:generate) et met a jour docs/architecture/data-model.md.
 *
 * Important :
 *   - Ce fichier ne gere PAS les policies RLS, les triggers ni les fonctions
 *     RPC. Elles vivent dans des migrations SQL manuelles dans
 *     packages/db/migrations/sql/ (voir drizzle.config.ts).
 *   - Les references a auth.users (Supabase Auth) sont decalarees via
 *     pgSchema('auth') plus loin.
 */

// =============================================================================
// Reference au schema auth de Supabase (geree par Supabase Auth, pas Drizzle)
// =============================================================================

const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

// =============================================================================
// Enums
// =============================================================================

export const raceCategoryEnum = pgEnum('race_category', [
  'vitesse',
  'petit_demi_fond',
  'demi_fond',
  'grand_demi_fond',
  'fond',
  'grand_fond',
  'jeunes',
]);

export const pigeonAgeClassEnum = pgEnum('pigeon_age_class', [
  'vieux',
  'jeune',
]);

export const userPlanEnum = pgEnum('user_plan', ['free', 'eleveur', 'club']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
]);

export const pdfTypeEnum = pgEnum('pdf_type', [
  'resultat_concours',
  'doublage_club',
]);

export const parseStatusEnum = pgEnum('parse_status', [
  'pending',
  'success',
  'partial',
  'quarantine',
]);

// =============================================================================
// users
// =============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    displayName: text('display_name'),
    plan: userPlanEnum('plan').notNull().default('free'),
    stripeCustomerId: text('stripe_customer_id'),
    phone: text('phone'),
    onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_unique').on(t.email),
    stripeCustomerIdUnique: uniqueIndex('users_stripe_customer_id_unique')
      .on(t.stripeCustomerId)
      .where(sql`${t.stripeCustomerId} is not null`),
  }),
);

// =============================================================================
// subscriptions
// =============================================================================

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeSubscriptionId: text('stripe_subscription_id').notNull(),
    stripePriceId: text('stripe_price_id').notNull(),
    status: subscriptionStatusEnum('status').notNull(),
    plan: userPlanEnum('plan').notNull(),
    currentPeriodEnd: timestamp('current_period_end', {
      withTimezone: true,
    }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    stripeSubscriptionIdUnique: uniqueIndex(
      'subscriptions_stripe_subscription_id_unique',
    ).on(t.stripeSubscriptionId),
    userStatusIdx: uniqueIndex('subscriptions_user_status_idx').on(
      t.userId,
      t.status,
    ),
  }),
);

// =============================================================================
// lofts
// =============================================================================

export const lofts = pgTable(
  'lofts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    address: text('address'),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),
    licenceNumber: text('licence_number'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    userIdIdx: uniqueIndex('lofts_user_id_idx')
      .on(t.userId, t.id)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// =============================================================================
// regions (referentiel public)
// =============================================================================

export const regions = pgTable(
  'regions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    number: smallint('number').notNull(),
    name: text('name').notNull(),
    francolombSlug: text('francolomb_slug'),
  },
  (t) => ({
    numberUnique: uniqueIndex('regions_number_unique').on(t.number),
  }),
);

// =============================================================================
// clubs (hierarchie federation > groupement > entente > club > societe)
// =============================================================================

export const clubs = pgTable(
  'clubs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    regionId: uuid('region_id')
      .notNull()
      .references(() => regions.id, { onDelete: 'restrict' }),
    parentClubId: uuid('parent_club_id').references((): any => clubs.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    francolombUrl: text('francolomb_url'),
    city: text('city'),
  },
  (t) => ({
    francolombUrlUnique: uniqueIndex('clubs_francolomb_url_unique')
      .on(t.francolombUrl)
      .where(sql`${t.francolombUrl} is not null`),
  }),
);

// =============================================================================
// pigeons (matricule en PK)
// =============================================================================

export const pigeons = pgTable(
  'pigeons',
  {
    matricule: varchar('matricule', { length: 20 }).primaryKey(),
    loftId: uuid('loft_id').references(() => lofts.id, {
      onDelete: 'set null',
    }),
    countryIso: char('country_iso', { length: 2 }).notNull(),
    yearOfBirth: smallint('year_of_birth').notNull(),
    isFemale: boolean('is_female').notNull(),
    name: text('name'),
    color: text('color'),
    fatherMatricule: varchar('father_matricule', { length: 20 }).references(
      (): any => pigeons.matricule,
      { onDelete: 'set null' },
    ),
    motherMatricule: varchar('mother_matricule', { length: 20 }).references(
      (): any => pigeons.matricule,
      { onDelete: 'set null' },
    ),
    breederMatricule: text('breeder_matricule'),
    notes: text('notes'),
    photoUrl: text('photo_url'),
    acquiredAt: date('acquired_at'),
    soldAt: date('sold_at'),
    deceasedAt: date('deceased_at'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    loftIdIdx: uniqueIndex('pigeons_loft_id_idx')
      .on(t.loftId, t.matricule)
      .where(sql`${t.deletedAt} is null and ${t.loftId} is not null`),
    countryYearIdx: uniqueIndex('pigeons_country_year_idx').on(
      t.countryIso,
      t.yearOfBirth,
      t.matricule,
    ),
  }),
);

// =============================================================================
// pedigrees (metadonnees enrichies facultatives)
// =============================================================================

export const pedigrees = pgTable('pedigrees', {
  pigeonMatricule: varchar('pigeon_matricule', { length: 20 })
    .primaryKey()
    .references(() => pigeons.matricule, { onDelete: 'cascade' }),
  pdfUrl: text('pdf_url'),
  notesAscendance: text('notes_ascendance'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// =============================================================================
// trainings
// =============================================================================

export const trainings = pgTable(
  'trainings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pigeonMatricule: varchar('pigeon_matricule', { length: 20 })
      .notNull()
      .references(() => pigeons.matricule, { onDelete: 'cascade' }),
    trainingDate: date('training_date').notNull(),
    releasePoint: text('release_point'),
    distanceKm: integer('distance_km'),
    returnTime: time('return_time'),
    weather: text('weather'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pigeonDateIdx: uniqueIndex('trainings_pigeon_date_idx').on(
      t.pigeonMatricule,
      t.trainingDate,
      t.id,
    ),
  }),
);

// =============================================================================
// pigeon_notes
// =============================================================================

export const pigeonNotes = pgTable(
  'pigeon_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pigeonMatricule: varchar('pigeon_matricule', { length: 20 })
      .notNull()
      .references(() => pigeons.matricule, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pigeonCreatedIdx: uniqueIndex('pigeon_notes_pigeon_created_idx').on(
      t.pigeonMatricule,
      t.createdAt,
      t.id,
    ),
  }),
);

// =============================================================================
// races
// =============================================================================

export const races = pgTable(
  'races',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    francolombId: text('francolomb_id'),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'restrict' }),
    raceDate: date('race_date').notNull(),
    releaseTime: time('release_time'),
    releasePoint: text('release_point').notNull(),
    releaseLat: numeric('release_lat', { precision: 9, scale: 6 }),
    releaseLng: numeric('release_lng', { precision: 9, scale: 6 }),
    category: raceCategoryEnum('category').notNull(),
    ageClass: pigeonAgeClassEnum('age_class').notNull(),
    pigeonsReleased: integer('pigeons_released'),
    distanceMinKm: integer('distance_min_km'),
    distanceMaxKm: integer('distance_max_km'),
    misesSchema: jsonb('mises_schema'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    francolombIdUnique: uniqueIndex('races_francolomb_id_unique')
      .on(t.francolombId)
      .where(sql`${t.francolombId} is not null`),
    raceDateIdx: uniqueIndex('races_date_idx').on(t.raceDate, t.id),
    clubDateIdx: uniqueIndex('races_club_date_idx').on(
      t.clubId,
      t.raceDate,
      t.id,
    ),
  }),
);

// =============================================================================
// race_pdfs
// =============================================================================

export const racePdfs = pgTable(
  'race_pdfs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    raceId: uuid('race_id')
      .notNull()
      .references(() => races.id, { onDelete: 'cascade' }),
    pdfUrl: text('pdf_url').notNull(),
    type: pdfTypeEnum('type').notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    storagePath: text('storage_path').notNull(),
    parseStatus: parseStatusEnum('parse_status').notNull().default('pending'),
    parseMethod: text('parse_method'),
    parseError: text('parse_error'),
    downloadedAt: timestamp('downloaded_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    parsedAt: timestamp('parsed_at', { withTimezone: true }),
  },
  (t) => ({
    contentHashUnique: uniqueIndex('race_pdfs_content_hash_unique').on(
      t.contentHash,
    ),
    raceIdIdx: uniqueIndex('race_pdfs_race_id_idx').on(t.raceId, t.id),
    parseStatusIdx: uniqueIndex('race_pdfs_parse_status_idx')
      .on(t.parseStatus, t.id)
      .where(sql`${t.parseStatus} != 'success'`),
  }),
);

// =============================================================================
// pigeon_results (le coeur de la valeur metier)
// =============================================================================

export const pigeonResults = pgTable(
  'pigeon_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    raceId: uuid('race_id')
      .notNull()
      .references(() => races.id, { onDelete: 'cascade' }),
    pigeonMatricule: varchar('pigeon_matricule', { length: 20 })
      .notNull()
      .references(() => pigeons.matricule, { onDelete: 'restrict' }),
    amateurDisplayName: text('amateur_display_name').notNull(),
    societyName: text('society_name'),
    place: integer('place').notNull(),
    nPigeonAmateur: integer('n_pigeon_amateur'),
    nConstatation: integer('n_constatation'),
    nEngagement: integer('n_engagement'),
    distanceM: integer('distance_m'),
    clockedAtTime: time('clocked_at_time').notNull(),
    velocityMPerMin: numeric('velocity_m_per_min', {
      precision: 7,
      scale: 3,
    }).notNull(),
    ecartCode: text('ecart_code'),
    miseType: text('mise_type'),
    miseEur: numeric('mise_eur', { precision: 6, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    racePigeonUnique: uniqueIndex('pigeon_results_race_pigeon_unique').on(
      t.raceId,
      t.pigeonMatricule,
    ),
    pigeonRaceIdx: uniqueIndex('pigeon_results_pigeon_race_idx').on(
      t.pigeonMatricule,
      t.raceId,
    ),
    racePlaceIdx: uniqueIndex('pigeon_results_race_place_idx').on(
      t.raceId,
      t.place,
    ),
    amateurNameIdx: uniqueIndex('pigeon_results_amateur_name_idx').on(
      t.amateurDisplayName,
      t.id,
    ),
  }),
);

// =============================================================================
// race_amateur_stats (pre-calcul depuis Section 2 du PDF)
// =============================================================================

export const raceAmateurStats = pgTable(
  'race_amateur_stats',
  {
    raceId: uuid('race_id')
      .notNull()
      .references(() => races.id, { onDelete: 'cascade' }),
    amateurDisplayName: text('amateur_display_name').notNull(),
    societyName: text('society_name'),
    pigeonsEngaged: integer('pigeons_engaged').notNull(),
    pigeonsClassed: integer('pigeons_classed').notNull(),
    successRate: numeric('success_rate', {
      precision: 5,
      scale: 2,
    }).notNull(),
    totalMiseEur: numeric('total_mise_eur', { precision: 8, scale: 2 })
      .notNull()
      .default('0'),
    places: integer('places').array().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.raceId, t.amateurDisplayName] }),
  }),
);
