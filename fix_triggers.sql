-- 通用触发器管理函数
-- 创建或替换触发器函数
CREATE OR REPLACE FUNCTION create_trigger_if_not_exists(
  table_name TEXT,
  trigger_name TEXT,
  function_name TEXT,
  trigger_timing TEXT DEFAULT 'BEFORE',
  trigger_event TEXT DEFAULT 'UPDATE'
) RETURNS VOID AS $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  -- 检查触发器是否已存在
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = trigger_name 
    AND tgrelid = table_name::regclass
  ) INTO trigger_exists;

  IF NOT trigger_exists THEN
    EXECUTE format('CREATE TRIGGER %I %s %s ON %I FOR EACH ROW EXECUTE FUNCTION %I()',
      trigger_name, trigger_timing, trigger_event, table_name, function_name);
    RAISE NOTICE '触发器 % 已在表 % 上创建', trigger_name, table_name;
  ELSE
    RAISE NOTICE '触发器 % 在表 % 上已存在，跳过创建', trigger_name, table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 通用时间戳更新函数（如果不存在）
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有需要更新时间戳的表创建触发器
SELECT create_trigger_if_not_exists('test_type_counters', 'update_test_counters_updated_at', 'update_timestamp');
SELECT create_trigger_if_not_exists('test_records', 'update_test_records_updated_at', 'update_timestamp');
SELECT create_trigger_if_not_exists('admins', 'update_admins_timestamp', 'update_timestamp');
SELECT create_trigger_if_not_exists('user_ips', 'update_user_ips_timestamp', 'update_timestamp');

-- 清理函数
DROP FUNCTION IF EXISTS create_trigger_if_not_exists(TEXT, TEXT, TEXT, TEXT, TEXT);