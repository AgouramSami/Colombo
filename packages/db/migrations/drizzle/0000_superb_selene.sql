CREATE TYPE "public"."parse_status" AS ENUM('pending', 'success', 'partial', 'quarantine');--> statement-breakpoint
CREATE TYPE "public"."pdf_type" AS ENUM('resultat_concours', 'doublage_club');--> statement-breakpoint
CREATE TYPE "public"."pigeon_age_class" AS ENUM('vieux', 'jeune');--> statement-breakpoint
CREATE TYPE "public"."race_category" AS ENUM('vitesse', 'petit_demi_fond', 'demi_fond', 'grand_demi_fond', 'fond', 'grand_fond', 'jeunes');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."user_plan" AS ENUM('free', 'eleveur', 'club');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"parent_club_id" uuid,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"francolomb_url" text,
	"city" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lofts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"licence_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedigrees" (
	"pigeon_matricule" varchar(20) PRIMARY KEY NOT NULL,
	"pdf_url" text,
	"notes_ascendance" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pigeon_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pigeon_matricule" varchar(20) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pigeon_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid NOT NULL,
	"pigeon_matricule" varchar(20) NOT NULL,
	"amateur_display_name" text NOT NULL,
	"society_name" text,
	"place" integer NOT NULL,
	"n_pigeon_amateur" integer,
	"n_constatation" integer,
	"n_engagement" integer,
	"distance_m" integer,
	"clocked_at_time" time NOT NULL,
	"velocity_m_per_min" numeric(7, 3) NOT NULL,
	"ecart_code" text,
	"mise_type" text,
	"mise_eur" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pigeons" (
	"matricule" varchar(20) PRIMARY KEY NOT NULL,
	"loft_id" uuid,
	"country_iso" char(2) NOT NULL,
	"year_of_birth" smallint NOT NULL,
	"is_female" boolean NOT NULL,
	"name" text,
	"color" text,
	"father_matricule" varchar(20),
	"mother_matricule" varchar(20),
	"breeder_matricule" text,
	"notes" text,
	"photo_url" text,
	"acquired_at" date,
	"sold_at" date,
	"deceased_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "race_amateur_stats" (
	"race_id" uuid NOT NULL,
	"amateur_display_name" text NOT NULL,
	"society_name" text,
	"pigeons_engaged" integer NOT NULL,
	"pigeons_classed" integer NOT NULL,
	"success_rate" numeric(5, 2) NOT NULL,
	"total_mise_eur" numeric(8, 2) DEFAULT '0' NOT NULL,
	"places" integer[] NOT NULL,
	CONSTRAINT "race_amateur_stats_race_id_amateur_display_name_pk" PRIMARY KEY("race_id","amateur_display_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "race_pdfs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid NOT NULL,
	"pdf_url" text NOT NULL,
	"type" "pdf_type" NOT NULL,
	"content_hash" char(64) NOT NULL,
	"storage_path" text NOT NULL,
	"parse_status" "parse_status" DEFAULT 'pending' NOT NULL,
	"parse_method" text,
	"parse_error" text,
	"downloaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"parsed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "races" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"francolomb_id" text,
	"club_id" uuid NOT NULL,
	"race_date" date NOT NULL,
	"release_time" time,
	"release_point" text NOT NULL,
	"release_lat" numeric(9, 6),
	"release_lng" numeric(9, 6),
	"category" "race_category" NOT NULL,
	"age_class" "pigeon_age_class" NOT NULL,
	"pigeons_released" integer,
	"distance_min_km" integer,
	"distance_max_km" integer,
	"mises_schema" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" smallint NOT NULL,
	"name" text NOT NULL,
	"francolomb_slug" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"plan" "user_plan" NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pigeon_matricule" varchar(20) NOT NULL,
	"training_date" date NOT NULL,
	"release_point" text,
	"distance_km" integer,
	"return_time" time,
	"weather" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"plan" "user_plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"phone" text,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clubs" ADD CONSTRAINT "clubs_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clubs" ADD CONSTRAINT "clubs_parent_club_id_clubs_id_fk" FOREIGN KEY ("parent_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lofts" ADD CONSTRAINT "lofts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedigrees" ADD CONSTRAINT "pedigrees_pigeon_matricule_pigeons_matricule_fk" FOREIGN KEY ("pigeon_matricule") REFERENCES "public"."pigeons"("matricule") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pigeon_notes" ADD CONSTRAINT "pigeon_notes_pigeon_matricule_pigeons_matricule_fk" FOREIGN KEY ("pigeon_matricule") REFERENCES "public"."pigeons"("matricule") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pigeon_results" ADD CONSTRAINT "pigeon_results_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pigeon_results" ADD CONSTRAINT "pigeon_results_pigeon_matricule_pigeons_matricule_fk" FOREIGN KEY ("pigeon_matricule") REFERENCES "public"."pigeons"("matricule") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pigeons" ADD CONSTRAINT "pigeons_loft_id_lofts_id_fk" FOREIGN KEY ("loft_id") REFERENCES "public"."lofts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pigeons" ADD CONSTRAINT "pigeons_father_matricule_pigeons_matricule_fk" FOREIGN KEY ("father_matricule") REFERENCES "public"."pigeons"("matricule") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pigeons" ADD CONSTRAINT "pigeons_mother_matricule_pigeons_matricule_fk" FOREIGN KEY ("mother_matricule") REFERENCES "public"."pigeons"("matricule") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "race_amateur_stats" ADD CONSTRAINT "race_amateur_stats_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "race_pdfs" ADD CONSTRAINT "race_pdfs_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "races" ADD CONSTRAINT "races_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trainings" ADD CONSTRAINT "trainings_pigeon_matricule_pigeons_matricule_fk" FOREIGN KEY ("pigeon_matricule") REFERENCES "public"."pigeons"("matricule") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "clubs_francolomb_url_unique" ON "clubs" USING btree ("francolomb_url") WHERE "clubs"."francolomb_url" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lofts_user_id_idx" ON "lofts" USING btree ("user_id","id") WHERE "lofts"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pigeon_notes_pigeon_created_idx" ON "pigeon_notes" USING btree ("pigeon_matricule","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pigeon_results_race_pigeon_unique" ON "pigeon_results" USING btree ("race_id","pigeon_matricule");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pigeon_results_pigeon_race_idx" ON "pigeon_results" USING btree ("pigeon_matricule","race_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pigeon_results_race_place_idx" ON "pigeon_results" USING btree ("race_id","place");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pigeon_results_amateur_name_idx" ON "pigeon_results" USING btree ("amateur_display_name","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pigeons_loft_id_idx" ON "pigeons" USING btree ("loft_id","matricule") WHERE "pigeons"."deleted_at" is null and "pigeons"."loft_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pigeons_country_year_idx" ON "pigeons" USING btree ("country_iso","year_of_birth","matricule");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "race_pdfs_content_hash_unique" ON "race_pdfs" USING btree ("content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "race_pdfs_race_id_idx" ON "race_pdfs" USING btree ("race_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "race_pdfs_parse_status_idx" ON "race_pdfs" USING btree ("parse_status","id") WHERE "race_pdfs"."parse_status" != 'success';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "races_francolomb_id_unique" ON "races" USING btree ("francolomb_id") WHERE "races"."francolomb_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "races_date_idx" ON "races" USING btree ("race_date","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "races_club_date_idx" ON "races" USING btree ("club_id","race_date","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "regions_number_unique" ON "regions" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_unique" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_status_idx" ON "subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "trainings_pigeon_date_idx" ON "trainings" USING btree ("pigeon_matricule","training_date","id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_customer_id_unique" ON "users" USING btree ("stripe_customer_id") WHERE "users"."stripe_customer_id" is not null;