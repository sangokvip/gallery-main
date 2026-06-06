-- Member center pre-deployment check
-- Run before create_member_center_tables.sql.
-- This script only creates a temporary result table in the current SQL session.

CREATE TEMP TABLE IF NOT EXISTS member_center_predeploy_results (
  check_type TEXT NOT NULL,
  name TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  detail TEXT NOT NULL
);

TRUNCATE member_center_predeploy_results;

DO $$
DECLARE
  relation_name TEXT;
  duplicate_count INTEGER;
  detail_text TEXT;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['users', 'test_records', 'test_results', 'messages', 'admins']
  LOOP
    INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
    VALUES (
      'required_base_table',
      relation_name,
      to_regclass('public.' || relation_name) IS NOT NULL,
      CASE
        WHEN to_regclass('public.' || relation_name) IS NOT NULL THEN 'found'
        ELSE 'missing: deploy the existing base schema before member center SQL'
      END
    );
  END LOOP;

  INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
  VALUES (
    'optional_base_table',
    'message_replies',
    true,
    CASE
      WHEN to_regclass('public.message_replies') IS NULL THEN 'missing: create_admin_member_session.sql will not create this table; deploy message replies schema first if留言回复 is used'
      WHEN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'message_replies'
          AND column_name = 'is_admin'
      ) THEN 'found with is_admin column'
      ELSE 'found; create_admin_member_session.sql will add is_admin column'
    END
  );

  INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
  VALUES (
    'extension',
    'pgcrypto_available',
    EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto'),
    CASE
      WHEN EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto') THEN 'available'
      ELSE 'missing: pgcrypto is required for crypt(), gen_salt(), gen_random_bytes()'
    END
  );

  IF to_regclass('public.member_subscriptions') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'member_subscriptions'
        AND column_name IN ('provider', 'provider_ref')
      GROUP BY table_name
      HAVING count(*) = 2
    )
  THEN
    EXECUTE $sql$
      SELECT count(*), COALESCE(string_agg(provider || ':' || provider_ref || ' x' || duplicate_total, ', '), 'none')
      FROM (
        SELECT provider, provider_ref, count(*) AS duplicate_total
        FROM member_subscriptions
        WHERE provider_ref IS NOT NULL
        GROUP BY provider, provider_ref
        HAVING count(*) > 1
        ORDER BY duplicate_total DESC, provider, provider_ref
        LIMIT 10
      ) duplicates
    $sql$ INTO duplicate_count, detail_text;

    INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
    VALUES (
      'duplicate_guard',
      'member_subscriptions_provider_ref_unique',
      duplicate_count = 0,
      CASE
        WHEN duplicate_count = 0 THEN 'no duplicates'
        ELSE 'duplicates must be merged before creating idx_member_subscriptions_provider_ref_unique: ' || detail_text
      END
    );
  ELSE
    INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
    VALUES (
      'duplicate_guard',
      'member_subscriptions_provider_ref_unique',
      true,
      'member_subscriptions table or provider/provider_ref columns not present yet'
    );
  END IF;

  IF to_regclass('public.member_orders') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'member_orders'
        AND column_name IN ('provider', 'provider_ref')
      GROUP BY table_name
      HAVING count(*) = 2
    )
  THEN
    EXECUTE $sql$
      SELECT count(*), COALESCE(string_agg(provider || ':' || provider_ref || ' x' || duplicate_total, ', '), 'none')
      FROM (
        SELECT provider, provider_ref, count(*) AS duplicate_total
        FROM member_orders
        WHERE provider_ref IS NOT NULL
        GROUP BY provider, provider_ref
        HAVING count(*) > 1
        ORDER BY duplicate_total DESC, provider, provider_ref
        LIMIT 10
      ) duplicates
    $sql$ INTO duplicate_count, detail_text;

    INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
    VALUES (
      'duplicate_guard',
      'member_orders_provider_ref_unique',
      duplicate_count = 0,
      CASE
        WHEN duplicate_count = 0 THEN 'no duplicates'
        ELSE 'duplicates must be merged before creating idx_member_orders_provider_ref_unique: ' || detail_text
      END
    );
  ELSE
    INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
    VALUES (
      'duplicate_guard',
      'member_orders_provider_ref_unique',
      true,
      'member_orders table or provider/provider_ref columns not present yet'
    );
  END IF;

  IF to_regclass('public.member_share_links') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'member_share_links'
        AND column_name = 'share_token'
    )
  THEN
    EXECUTE $sql$
      SELECT count(*), COALESCE(string_agg(share_token || ' x' || duplicate_total, ', '), 'none')
      FROM (
        SELECT share_token, count(*) AS duplicate_total
        FROM member_share_links
        WHERE share_token IS NOT NULL
        GROUP BY share_token
        HAVING count(*) > 1
        ORDER BY duplicate_total DESC, share_token
        LIMIT 10
      ) duplicates
    $sql$ INTO duplicate_count, detail_text;

    INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
    VALUES (
      'duplicate_guard',
      'member_share_links_share_token_unique',
      duplicate_count = 0,
      CASE
        WHEN duplicate_count = 0 THEN 'no duplicates'
        ELSE 'duplicate share_token values must be fixed before deployment: ' || detail_text
      END
    );
  ELSE
    INSERT INTO member_center_predeploy_results (check_type, name, ok, detail)
    VALUES (
      'duplicate_guard',
      'member_share_links_share_token_unique',
      true,
      'member_share_links table or share_token column not present yet'
    );
  END IF;
END;
$$;

SELECT check_type, name, ok, detail
FROM member_center_predeploy_results
ORDER BY check_type, name;
