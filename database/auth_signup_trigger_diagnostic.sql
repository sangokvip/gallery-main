-- Auth signup trigger diagnostic
-- Run this in Supabase SQL Editor only if /signup still returns:
-- Database error saving new user.
-- It does not write data. It lists the auth.users triggers and required user_settings columns
-- so the exact failing legacy trigger can be identified.

WITH auth_user_triggers AS (
  SELECT
    trigger_row.tgname AS trigger_name,
    CASE trigger_row.tgenabled
      WHEN 'O' THEN 'enabled'
      WHEN 'D' THEN 'disabled'
      WHEN 'R' THEN 'replica'
      WHEN 'A' THEN 'always'
      ELSE trigger_row.tgenabled::text
    END AS trigger_status,
    pg_get_triggerdef(trigger_row.oid) AS trigger_definition,
    proc_namespace.nspname AS function_schema,
    proc_row.proname AS function_name,
    pg_get_function_arguments(proc_row.oid) AS function_arguments
  FROM pg_trigger trigger_row
  JOIN pg_class relation_row ON relation_row.oid = trigger_row.tgrelid
  JOIN pg_namespace relation_namespace ON relation_namespace.oid = relation_row.relnamespace
  JOIN pg_proc proc_row ON proc_row.oid = trigger_row.tgfoid
  JOIN pg_namespace proc_namespace ON proc_namespace.oid = proc_row.pronamespace
  WHERE relation_namespace.nspname = 'auth'
    AND relation_row.relname = 'users'
    AND NOT trigger_row.tgisinternal
)
SELECT
  'auth_user_trigger' AS check_type,
  trigger_name AS name,
  trigger_status AS status,
  function_schema || '.' || function_name || '(' || function_arguments || ')' AS detail,
  trigger_definition
FROM auth_user_triggers
ORDER BY trigger_name;

SELECT
  'user_settings_required_column' AS check_type,
  column_name AS name,
  data_type AS status,
  'nullable=' || is_nullable || ', default=' || COALESCE(column_default, '<none>') AS detail,
  '' AS trigger_definition
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_settings'
  AND is_nullable = 'NO'
  AND column_default IS NULL
ORDER BY ordinal_position;

WITH ordinary_functions AS (
  SELECT
    proc_row.oid,
    proc_namespace.nspname AS function_schema,
    proc_row.proname AS function_name,
    pg_get_functiondef(proc_row.oid) AS function_definition
  FROM pg_proc proc_row
  JOIN pg_namespace proc_namespace ON proc_namespace.oid = proc_row.pronamespace
  WHERE proc_row.prokind = 'f'
)
SELECT
  'trigger_function_mentions_user_settings' AS check_type,
  function_schema || '.' || function_name AS name,
  'function' AS status,
  left(function_definition, 1200) AS detail,
  '' AS trigger_definition
FROM ordinary_functions
WHERE function_definition ILIKE '%user_settings%'
   OR function_definition ILIKE '%raw_user_meta_data%'
ORDER BY name;
