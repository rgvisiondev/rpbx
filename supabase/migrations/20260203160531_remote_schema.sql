CREATE SCHEMA IF NOT EXISTS "analytics"
ALTER SCHEMA "analytics" OWNER TO "postgres"
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog"
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions"
COMMENT ON SCHEMA "public" IS 'standard public schema'
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql"
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions"
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public"
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions"
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault"
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions"
CREATE TYPE "public"."pricing_plan_interval" AS ENUM (
    'day',
    'week',
    'month',
    'year'
)
ALTER TYPE "public"."pricing_plan_interval" OWNER TO "postgres"
CREATE TYPE "public"."pricing_type" AS ENUM (
    'one_time',
    'recurring'
)
ALTER TYPE "public"."pricing_type" OWNER TO "postgres"
CREATE TYPE "public"."subscription_status" AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'paused'
)
ALTER TYPE "public"."subscription_status" OWNER TO "postgres"
CREATE OR REPLACE FUNCTION "public"."current_user_type"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select user_type
  from public.profiles
  where id = auth.uid();
$$
ALTER FUNCTION "public"."current_user_type"() OWNER TO "postgres"
CREATE OR REPLACE FUNCTION "public"."get_investor_email_by_profile_id"("p_profile_id" "uuid") RETURNS TABLE("email" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select u.email
  from public.investor_profiles p
  join auth.users u on u.id = p.user_id
  where p.id = p_profile_id
    and p.status = 'published'
  limit 1;
$$
ALTER FUNCTION "public"."get_investor_email_by_profile_id"("p_profile_id" "uuid") OWNER TO "postgres"
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, username, first_name, last_name, user_type)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'last_name'), ''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'user_type'), ''), 'member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres"
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$
ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres"
CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end $$
ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres"
SET default_tablespace = ''
SET default_table_access_method = "heap"
CREATE TABLE IF NOT EXISTS "analytics"."weekly_user_metrics" (
    "week_start" "date" NOT NULL,
    "total_auth_users" integer NOT NULL,
    "business_users" integer NOT NULL,
    "investor_users" integer NOT NULL,
    "member_users" integer NOT NULL,
    "business_complete" integer NOT NULL,
    "business_incomplete" integer NOT NULL,
    "investor_complete" integer NOT NULL,
    "investor_incomplete" integer NOT NULL,
    "dormant_30d" integer NOT NULL,
    "inactive_14_30d" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
ALTER TABLE "analytics"."weekly_user_metrics" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."business_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "industry" "text" NOT NULL,
    "ownership_percentage" numeric,
    "annual_revenue_range" "text",
    "cash_flow_range" "text",
    "ebitda_range" "text",
    "years_in_business" "text",
    "employee_count_range" "text",
    "county" "text",
    "can_provide_financials" boolean DEFAULT false,
    "can_provide_tax_returns" boolean DEFAULT false,
    "contact_email" "text",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_id" "uuid" NOT NULL,
    "city" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "listing_image_path" "text",
    "listing_image_alt" "text",
    "listing_image_w" integer,
    "listing_image_h" integer,
    "state_code" "text",
    "country_code" "text" DEFAULT 'US'::"text",
    "postal_code" "text",
    "geocoded_lat" numeric,
    "geocoded_lng" numeric,
    "geocode_place_id" "text",
    "geocoded_at" timestamp with time zone,
    "geocode_confidence" numeric,
    "listing_image_choice" "text",
    "address" "text",
    "stripe_subscription_id" "text",
    CONSTRAINT "business_listings_county_len_check" CHECK ((("county" IS NULL) OR ("char_length"("county") <= 100))),
    CONSTRAINT "business_listings_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
)
ALTER TABLE "public"."business_listings" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."business_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "stripe_price_id" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "plan_code" "text" NOT NULL,
    "billing_interval" "text" NOT NULL,
    "max_listings" integer DEFAULT 1 NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "canceled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "business_memberships_billing_interval_check" CHECK (("billing_interval" = ANY (ARRAY['month'::"text", 'year'::"text"]))),
    CONSTRAINT "business_memberships_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'past_due'::"text", 'unpaid'::"text", 'canceled'::"text", 'incomplete'::"text", 'incomplete_expired'::"text", 'paused'::"text"])))
)
ALTER TABLE "public"."business_memberships" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" NOT NULL,
    "stripe_customer_id" "text"
)
ALTER TABLE "public"."customers" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."investor_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "city" "text",
    "organization_entity" "text",
    "industry_experience" "text",
    "primary_industry" "text",
    "additional_industries" "text"[],
    "years_in_target_industry" "text",
    "target_ebitda" "text",
    "target_cash_flow" "text",
    "net_worth" "text",
    "willing_to_sign_nda" boolean,
    "is_accredited_investor" boolean,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "avatar_path" "text",
    "avatar_updated_at" timestamp with time zone DEFAULT "now"(),
    "avatar_alt" "text",
    "avatar_w" integer,
    "avatar_h" integer,
    "status" "text" DEFAULT 'incomplete'::"text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "ownership_min" integer,
    "ownership_max" integer,
    "full_name_lc" "text" GENERATED ALWAYS AS (TRIM(BOTH ' '::"text" FROM "lower"(((COALESCE("first_name", ''::"text") || ' '::"text") || COALESCE("last_name", ''::"text"))))) STORED,
    "org_name_lc" "text" GENERATED ALWAYS AS ("lower"(COALESCE("organization_entity", ''::"text"))) STORED,
    "contact_email" "text",
    CONSTRAINT "investor_status_chk" CHECK (("status" = ANY (ARRAY['incomplete'::"text", 'pending_review'::"text", 'published'::"text", 'archived'::"text", 'suspended'::"text"])))
)
ALTER TABLE "public"."investor_profiles" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."legacy_pmpro_members" (
    "id" integer,
    "username" "text",
    "firstname" "text",
    "lastname" "text",
    "email" "text",
    "membership" "text",
    "discount_code_id" integer,
    "discount_code" "text",
    "subscription_transaction_id" "text",
    "billing_amount" numeric,
    "cycle_number" integer,
    "cycle_period" "text",
    "next_payment_date" "date",
    "joined" "date",
    "startdate" "date",
    "expires" "text"
)
ALTER TABLE "public"."legacy_pmpro_members" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."listing_evaluations" (
    "id" bigint NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listing_evaluations_status_check" CHECK (("status" = ANY (ARRAY['none'::"text", 'purchased'::"text", 'in_progress'::"text", 'completed'::"text"])))
)
ALTER TABLE "public"."listing_evaluations" OWNER TO "postgres"
CREATE SEQUENCE IF NOT EXISTS "public"."listing_evaluations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
ALTER SEQUENCE "public"."listing_evaluations_id_seq" OWNER TO "postgres"
ALTER SEQUENCE "public"."listing_evaluations_id_seq" OWNED BY "public"."listing_evaluations"."id"
CREATE TABLE IF NOT EXISTS "public"."listing_promotions" (
    "id" bigint NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "listing_promotions_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'past_due'::"text", 'canceled'::"text", 'unpaid'::"text", 'paused'::"text", 'incomplete'::"text", 'incomplete_expired'::"text"])))
)
ALTER TABLE "public"."listing_promotions" OWNER TO "postgres"
CREATE SEQUENCE IF NOT EXISTS "public"."listing_promotions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
ALTER SEQUENCE "public"."listing_promotions_id_seq" OWNER TO "postgres"
ALTER SEQUENCE "public"."listing_promotions_id_seq" OWNED BY "public"."listing_promotions"."id"
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "user_type" "text" DEFAULT 'member'::"text" NOT NULL,
    "username" "text",
    "first_name" "text",
    "last_name" "text",
    "display_name" "text",
    "avatar_url" "text",
    "wordpress_user_id" integer,
    "migration_status" "text" DEFAULT 'pending'::"text",
    "migrated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_user_type_check" CHECK (("lower"("user_type") = ANY (ARRAY['member'::"text", 'investor'::"text", 'business'::"text"])))
)
ALTER TABLE "public"."profiles" OWNER TO "postgres"
CREATE OR REPLACE VIEW "public"."public_profiles" WITH ("security_invoker"='true') AS
 SELECT "id",
    "first_name",
    "last_name"
   FROM "public"."profiles"
ALTER VIEW "public"."public_profiles" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."public_valuations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_session_id" "text",
    "stripe_payment_intent_id" "text",
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
)
ALTER TABLE "public"."public_valuations" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."subscription_status",
    "metadata" "jsonb",
    "price_id" "text",
    "quantity" integer,
    "cancel_at_period_end" boolean,
    "created" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "current_period_end" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ended_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cancel_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "canceled_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "trial_start" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "trial_end" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "product_id" "text",
    "product_name" "text",
    "price_currency" "text",
    "price_unit_amount" integer,
    "price_interval" "text",
    "price_interval_count" integer,
    "price_nickname" "text",
    "price_lookup_key" "text",
    "price_metadata" "jsonb",
    "product_metadata" "jsonb",
    "purpose_sub" "text" GENERATED ALWAYS AS (("metadata" ->> 'purpose'::"text")) STORED,
    "listing_id" "uuid" GENERATED ALWAYS AS ((("metadata" ->> 'listing_id'::"text"))::"uuid") STORED
)
ALTER TABLE "public"."subscriptions" OWNER TO "postgres"
CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['business_owner'::"text", 'investor'::"text"])))
)
ALTER TABLE "public"."user_profiles" OWNER TO "postgres"
CREATE OR REPLACE VIEW "public"."v_business_listings_with_promo" WITH ("security_invoker"='on') AS
 SELECT "id",
    "title",
    "industry",
    "ownership_percentage",
    "annual_revenue_range",
    "cash_flow_range" AS "book_value_range",
    "ebitda_range",
    "years_in_business",
    "employee_count_range",
    "county",
    "can_provide_financials",
    "can_provide_tax_returns",
    "contact_email",
    "description",
    "is_active",
    "created_at",
    "updated_at",
    "owner_id",
    "city",
    "status",
    "listing_image_path",
    "listing_image_alt",
    "listing_image_w",
    "listing_image_h",
    "state_code",
    "country_code",
    "postal_code",
    "geocoded_lat",
    "geocoded_lng",
    "geocode_place_id",
    "geocoded_at",
    "geocode_confidence",
    "listing_image_choice",
    (EXISTS ( SELECT 1
           FROM "public"."listing_promotions" "lp"
          WHERE (("lp"."listing_id" = "bl"."id") AND ("lp"."status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text"])) AND (COALESCE("lp"."current_period_end", "now"()) > "now"())))) AS "is_promoted_effective",
    COALESCE(( SELECT ("le"."status" = 'purchased'::"text")
           FROM "public"."listing_evaluations" "le"
          WHERE ("le"."listing_id" = "bl"."id")
         LIMIT 1), false) AS "has_purchased_valuation"
   FROM "public"."business_listings" "bl"
ALTER VIEW "public"."v_business_listings_with_promo" OWNER TO "postgres"
CREATE OR REPLACE VIEW "public"."v_user_listing_entitlements" WITH ("security_invoker"='on') AS
 SELECT "user_id",
    ("sum"("max_listings") FILTER (WHERE (("status" = ANY (ARRAY['active'::"text", 'trialing'::"text"])) AND ("now"() >= "current_period_start") AND ("now"() < "current_period_end"))))::integer AS "allowed_active_listings"
   FROM "public"."business_memberships" "bm"
  GROUP BY "user_id"
ALTER VIEW "public"."v_user_listing_entitlements" OWNER TO "postgres"
ALTER TABLE ONLY "public"."listing_evaluations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."listing_evaluations_id_seq"'::"regclass")
ALTER TABLE ONLY "public"."listing_promotions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."listing_promotions_id_seq"'::"regclass")
ALTER TABLE ONLY "analytics"."weekly_user_metrics"
    ADD CONSTRAINT "weekly_user_metrics_pkey" PRIMARY KEY ("week_start")
ALTER TABLE ONLY "public"."business_listings"
    ADD CONSTRAINT "business_listings_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id")
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."investor_profiles"
    ADD CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."investor_profiles"
    ADD CONSTRAINT "investor_profiles_user_id_key" UNIQUE ("user_id")
ALTER TABLE ONLY "public"."listing_evaluations"
    ADD CONSTRAINT "listing_evaluations_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."listing_promotions"
    ADD CONSTRAINT "listing_promotions_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."listing_promotions"
    ADD CONSTRAINT "listing_promotions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id")
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username")
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_wordpress_user_id_key" UNIQUE ("wordpress_user_id")
ALTER TABLE ONLY "public"."public_valuations"
    ADD CONSTRAINT "public_valuations_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."public_valuations"
    ADD CONSTRAINT "public_valuations_stripe_session_id_key" UNIQUE ("stripe_session_id")
ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
CREATE INDEX "business_listings_country_code_postal_code_idx" ON "public"."business_listings" USING "btree" ("country_code", "postal_code")
CREATE INDEX "business_listings_country_code_state_code_city_idx" ON "public"."business_listings" USING "btree" ("country_code", "state_code", "city")
CREATE UNIQUE INDEX "business_listings_one_per_sub" ON "public"."business_listings" USING "btree" ("stripe_subscription_id") WHERE ("stripe_subscription_id" IS NOT NULL)
CREATE INDEX "idx_business_memberships_period_end" ON "public"."business_memberships" USING "btree" ("current_period_end")
CREATE INDEX "idx_business_memberships_status" ON "public"."business_memberships" USING "btree" ("status")
CREATE INDEX "idx_business_memberships_user_id" ON "public"."business_memberships" USING "btree" ("user_id")
CREATE INDEX "idx_investor_profiles_status" ON "public"."investor_profiles" USING "btree" ("status")
CREATE INDEX "idx_subscriptions_listing_id" ON "public"."subscriptions" USING "btree" ("listing_id")
CREATE INDEX "idx_subscriptions_purpose_sub" ON "public"."subscriptions" USING "btree" ("purpose_sub")
CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status")
CREATE INDEX "investor_profiles_full_name_trgm" ON "public"."investor_profiles" USING "gin" ("full_name_lc" "public"."gin_trgm_ops")
CREATE INDEX "investor_profiles_org_name_trgm" ON "public"."investor_profiles" USING "gin" ("org_name_lc" "public"."gin_trgm_ops")
CREATE UNIQUE INDEX "listing_evaluations_listing_id_idx" ON "public"."listing_evaluations" USING "btree" ("listing_id")
CREATE INDEX "listing_promotions_listing_id_idx" ON "public"."listing_promotions" USING "btree" ("listing_id")
CREATE UNIQUE INDEX "listing_promotions_sub_unique" ON "public"."listing_promotions" USING "btree" ("stripe_subscription_id")
CREATE UNIQUE INDEX "profiles_username_unique" ON "public"."profiles" USING "btree" ("lower"("username")) WHERE ("username" IS NOT NULL)
CREATE OR REPLACE TRIGGER "Monday.com board update" AFTER INSERT OR UPDATE ON "analytics"."weekly_user_metrics" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://hook.us2.make.com/y468qtnigyjncae76fom2es1oc23pjy6', 'POST', '{"Content-type":"application/json"}', '{}', '5000')
CREATE OR REPLACE TRIGGER "trg_business_listings_updated_at" BEFORE UPDATE ON "public"."business_listings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"()
CREATE OR REPLACE TRIGGER "trg_business_memberships_touch" BEFORE UPDATE ON "public"."business_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"()
ALTER TABLE ONLY "public"."business_listings"
    ADD CONSTRAINT "business_listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
ALTER TABLE ONLY "public"."business_memberships"
    ADD CONSTRAINT "business_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
ALTER TABLE ONLY "public"."investor_profiles"
    ADD CONSTRAINT "investor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id")
ALTER TABLE ONLY "public"."listing_evaluations"
    ADD CONSTRAINT "listing_evaluations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."business_listings"("id") ON DELETE CASCADE
ALTER TABLE ONLY "public"."listing_promotions"
    ADD CONSTRAINT "listing_promotions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."business_listings"("id") ON DELETE CASCADE
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id")
ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id")
CREATE POLICY "Business owners can manage own listings" ON "public"."business_listings" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"))
CREATE POLICY "Business owners can view their listings" ON "public"."business_listings" FOR SELECT USING (("auth"."uid"() = "owner_id"))
CREATE POLICY "Can only view own subs data." ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"))
CREATE POLICY "Enable read access for all users" ON "public"."investor_profiles" FOR SELECT USING (true)
CREATE POLICY "Investors can read published listings" ON "public"."business_listings" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."user_type" = 'investor'::"text")))) AND ("status" ~~* 'published'::"text") AND ("is_active" IS TRUE)))
CREATE POLICY "Investors can view active listings" ON "public"."business_listings" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'investor'::"text"))))))
CREATE POLICY "Only business owners can insert listings" ON "public"."business_listings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'business_owner'::"text")))))
CREATE POLICY "Owners manage promotions" ON "public"."listing_promotions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."business_listings" "l"
  WHERE (("l"."id" = "listing_promotions"."listing_id") AND ("l"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."business_listings" "l"
  WHERE (("l"."id" = "listing_promotions"."listing_id") AND ("l"."owner_id" = "auth"."uid"())))))
CREATE POLICY "Read promotions for published listings" ON "public"."listing_promotions" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."business_listings" "l"
  WHERE (("l"."id" = "listing_promotions"."listing_id") AND ("l"."status" = 'published'::"text")))))
CREATE POLICY "Users can insert own profile" ON "public"."investor_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"))
CREATE POLICY "Users can manage their own listings" ON "public"."business_listings" TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()))
CREATE POLICY "Users can read own valuation record" ON "public"."public_valuations" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()))
CREATE POLICY "Users can update own profile" ON "public"."investor_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"))
CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"))
CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"))
CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"))
ALTER TABLE "public"."business_listings" ENABLE ROW LEVEL SECURITY
ALTER TABLE "public"."business_memberships" ENABLE ROW LEVEL SECURITY
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY
CREATE POLICY "eval insert owner" ON "public"."listing_evaluations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."business_listings" "bl"
  WHERE (("bl"."id" = "listing_evaluations"."listing_id") AND ("bl"."owner_id" = "auth"."uid"())))))
CREATE POLICY "eval read" ON "public"."listing_evaluations" FOR SELECT TO "authenticated" USING (true)
ALTER TABLE "public"."investor_profiles" ENABLE ROW LEVEL SECURITY
ALTER TABLE "public"."legacy_pmpro_members" ENABLE ROW LEVEL SECURITY
CREATE POLICY "listing delete requires active listing_plan" ON "public"."business_listings" FOR DELETE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."user_id" = "auth"."uid"()) AND ("s"."listing_id" = "business_listings"."id") AND ("s"."purpose_sub" = 'listing_plan'::"text") AND ("s"."status" = ANY (ARRAY['active'::"public"."subscription_status", 'trialing'::"public"."subscription_status"])))))))
CREATE POLICY "listing select by owner" ON "public"."business_listings" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()))
CREATE POLICY "listing update requires active listing_plan" ON "public"."business_listings" FOR UPDATE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."subscriptions" "s"
  WHERE (("s"."user_id" = "auth"."uid"()) AND ("s"."listing_id" = "business_listings"."id") AND ("s"."purpose_sub" = 'listing_plan'::"text") AND ("s"."status" = ANY (ARRAY['active'::"public"."subscription_status", 'trialing'::"public"."subscription_status"])))))))
ALTER TABLE "public"."listing_evaluations" ENABLE ROW LEVEL SECURITY
ALTER TABLE "public"."listing_promotions" ENABLE ROW LEVEL SECURITY
CREATE POLICY "memberships_no_client_writes" ON "public"."business_memberships" TO "authenticated" USING (false) WITH CHECK (false)
CREATE POLICY "memberships_select_own" ON "public"."business_memberships" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"))
CREATE POLICY "owner can read" ON "public"."business_listings" FOR SELECT USING (("auth"."uid"() = "owner_id"))
CREATE POLICY "owner can update" ON "public"."business_listings" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"))
CREATE POLICY "owner can write" ON "public"."business_listings" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"))
CREATE POLICY "owner_select_listings" ON "public"."business_listings" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()))
CREATE POLICY "owners insert" ON "public"."business_listings" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"))
CREATE POLICY "owners read" ON "public"."business_listings" FOR SELECT USING (("auth"."uid"() = "owner_id"))
CREATE POLICY "owners update" ON "public"."business_listings" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"))
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY
CREATE POLICY "profiles_select_business_investor_cross_view" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((("public"."current_user_type"() = 'business'::"text") AND ("user_type" = 'investor'::"text")) OR (("public"."current_user_type"() = 'investor'::"text") AND ("user_type" = 'business'::"text"))))
ALTER TABLE "public"."public_valuations" ENABLE ROW LEVEL SECURITY
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY
CREATE POLICY "subscriptions owner can read" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()))
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres"
GRANT USAGE ON SCHEMA "public" TO "postgres"
GRANT USAGE ON SCHEMA "public" TO "anon"
GRANT USAGE ON SCHEMA "public" TO "authenticated"
GRANT USAGE ON SCHEMA "public" TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role"
REVOKE ALL ON FUNCTION "public"."current_user_type"() FROM PUBLIC
GRANT ALL ON FUNCTION "public"."current_user_type"() TO "anon"
GRANT ALL ON FUNCTION "public"."current_user_type"() TO "authenticated"
GRANT ALL ON FUNCTION "public"."current_user_type"() TO "service_role"
REVOKE ALL ON FUNCTION "public"."get_investor_email_by_profile_id"("p_profile_id" "uuid") FROM PUBLIC
GRANT ALL ON FUNCTION "public"."get_investor_email_by_profile_id"("p_profile_id" "uuid") TO "anon"
GRANT ALL ON FUNCTION "public"."get_investor_email_by_profile_id"("p_profile_id" "uuid") TO "authenticated"
GRANT ALL ON FUNCTION "public"."get_investor_email_by_profile_id"("p_profile_id" "uuid") TO "service_role"
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres"
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon"
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated"
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role"
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon"
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated"
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role"
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres"
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon"
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated"
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role"
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon"
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated"
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role"
GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres"
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon"
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated"
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role"
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres"
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon"
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role"
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon"
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated"
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role"
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role"
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres"
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon"
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated"
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role"
GRANT ALL ON TABLE "public"."business_listings" TO "anon"
GRANT ALL ON TABLE "public"."business_listings" TO "authenticated"
GRANT ALL ON TABLE "public"."business_listings" TO "service_role"
GRANT ALL ON TABLE "public"."business_memberships" TO "anon"
GRANT ALL ON TABLE "public"."business_memberships" TO "authenticated"
GRANT ALL ON TABLE "public"."business_memberships" TO "service_role"
GRANT ALL ON TABLE "public"."customers" TO "anon"
GRANT ALL ON TABLE "public"."customers" TO "authenticated"
GRANT ALL ON TABLE "public"."customers" TO "service_role"
GRANT ALL ON TABLE "public"."investor_profiles" TO "anon"
GRANT ALL ON TABLE "public"."investor_profiles" TO "authenticated"
GRANT ALL ON TABLE "public"."investor_profiles" TO "service_role"
GRANT ALL ON TABLE "public"."legacy_pmpro_members" TO "service_role"
GRANT ALL ON TABLE "public"."listing_evaluations" TO "anon"
GRANT ALL ON TABLE "public"."listing_evaluations" TO "authenticated"
GRANT ALL ON TABLE "public"."listing_evaluations" TO "service_role"
GRANT ALL ON SEQUENCE "public"."listing_evaluations_id_seq" TO "anon"
GRANT ALL ON SEQUENCE "public"."listing_evaluations_id_seq" TO "authenticated"
GRANT ALL ON SEQUENCE "public"."listing_evaluations_id_seq" TO "service_role"
GRANT ALL ON TABLE "public"."listing_promotions" TO "anon"
GRANT ALL ON TABLE "public"."listing_promotions" TO "authenticated"
GRANT ALL ON TABLE "public"."listing_promotions" TO "service_role"
GRANT ALL ON SEQUENCE "public"."listing_promotions_id_seq" TO "anon"
GRANT ALL ON SEQUENCE "public"."listing_promotions_id_seq" TO "authenticated"
GRANT ALL ON SEQUENCE "public"."listing_promotions_id_seq" TO "service_role"
GRANT ALL ON TABLE "public"."profiles" TO "anon"
GRANT ALL ON TABLE "public"."profiles" TO "authenticated"
GRANT ALL ON TABLE "public"."profiles" TO "service_role"
GRANT ALL ON TABLE "public"."public_profiles" TO "anon"
GRANT ALL ON TABLE "public"."public_profiles" TO "authenticated"
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role"
GRANT ALL ON TABLE "public"."public_valuations" TO "service_role"
GRANT ALL ON TABLE "public"."subscriptions" TO "anon"
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated"
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role"
GRANT ALL ON TABLE "public"."user_profiles" TO "anon"
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated"
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role"
GRANT ALL ON TABLE "public"."v_business_listings_with_promo" TO "anon"
GRANT ALL ON TABLE "public"."v_business_listings_with_promo" TO "authenticated"
GRANT ALL ON TABLE "public"."v_business_listings_with_promo" TO "service_role"
GRANT ALL ON TABLE "public"."v_user_listing_entitlements" TO "anon"
GRANT ALL ON TABLE "public"."v_user_listing_entitlements" TO "authenticated"
GRANT ALL ON TABLE "public"."v_user_listing_entitlements" TO "service_role"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated"
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role"
drop policy "Read promotions for published listings" on "public"."listing_promotions"
revoke delete on table "public"."legacy_pmpro_members" from "anon"
revoke insert on table "public"."legacy_pmpro_members" from "anon"
revoke references on table "public"."legacy_pmpro_members" from "anon"
revoke select on table "public"."legacy_pmpro_members" from "anon"
revoke trigger on table "public"."legacy_pmpro_members" from "anon"
revoke truncate on table "public"."legacy_pmpro_members" from "anon"
revoke update on table "public"."legacy_pmpro_members" from "anon"
revoke delete on table "public"."legacy_pmpro_members" from "authenticated"
revoke insert on table "public"."legacy_pmpro_members" from "authenticated"
revoke references on table "public"."legacy_pmpro_members" from "authenticated"
revoke select on table "public"."legacy_pmpro_members" from "authenticated"
revoke trigger on table "public"."legacy_pmpro_members" from "authenticated"
revoke truncate on table "public"."legacy_pmpro_members" from "authenticated"
revoke update on table "public"."legacy_pmpro_members" from "authenticated"
revoke delete on table "public"."public_valuations" from "anon"
revoke insert on table "public"."public_valuations" from "anon"
revoke references on table "public"."public_valuations" from "anon"
revoke select on table "public"."public_valuations" from "anon"
revoke trigger on table "public"."public_valuations" from "anon"
revoke truncate on table "public"."public_valuations" from "anon"
revoke update on table "public"."public_valuations" from "anon"
revoke delete on table "public"."public_valuations" from "authenticated"
revoke insert on table "public"."public_valuations" from "authenticated"
revoke references on table "public"."public_valuations" from "authenticated"
revoke select on table "public"."public_valuations" from "authenticated"
revoke trigger on table "public"."public_valuations" from "authenticated"
revoke truncate on table "public"."public_valuations" from "authenticated"
revoke update on table "public"."public_valuations" from "authenticated"
create policy "Read promotions for published listings"
  on "public"."listing_promotions"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.business_listings l
  WHERE ((l.id = listing_promotions.listing_id) AND (l.status = 'published'::text)))))
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()
create policy "authenticated can view investor avatars"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'investors'::text))
create policy "investors_delete_own_folder"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'investors'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
create policy "investors_insert_own_folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'investors'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
create policy "investors_select_own_folder"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'investors'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
create policy "investors_update_own_folder"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'investors'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
with check (((bucket_id = 'investors'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
create policy "listings delete own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'listings'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
create policy "listings insert own"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'listings'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
create policy "listings modify own"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'listings'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
with check (((bucket_id = 'listings'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))
create policy "listings select own"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'listings'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))))