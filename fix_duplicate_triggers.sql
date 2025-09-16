-- 快速修复触发器重复问题
-- 如果遇到 "trigger already exists" 错误，请运行此脚本

-- 删除可能存在的重复触发器（如果存在）
DROP TRIGGER IF EXISTS update_test_counters_updated_at ON test_type_counters;
DROP TRIGGER IF EXISTS update_test_records_updated_at ON test_records;
DROP TRIGGER IF EXISTS update_admins_timestamp ON admins;
DROP TRIGGER IF EXISTS update_user_ips_timestamp ON user_ips;

-- 重新创建触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_test_counters_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_test_records_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重新创建触发器
CREATE TRIGGER update_test_counters_updated_at
  BEFORE UPDATE ON test_type_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_test_counters_timestamp();

CREATE TRIGGER update_test_records_updated_at
  BEFORE UPDATE ON test_records
  FOR EACH ROW
  EXECUTE FUNCTION update_test_records_timestamp();

CREATE TRIGGER update_admins_timestamp 
  BEFORE UPDATE ON admins 
  FOR EACH ROW 
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_ips_timestamp 
  BEFORE UPDATE ON user_ips 
  FOR EACH ROW 
  EXECUTE FUNCTION update_timestamp();

-- 显示修复结果
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== 触发器修复完成 ===';
  
  FOR trigger_record IN 
    SELECT tgname, tgrelid::regclass as table_name 
    FROM pg_trigger 
    WHERE tgname IN (
      'update_test_counters_updated_at',
      'update_test_records_updated_at', 
      'update_admins_timestamp',
      'update_user_ips_timestamp'
    )
  LOOP
    RAISE NOTICE '✅ % 已在表 % 上创建', trigger_record.tgname, trigger_record.table_name;
    trigger_count := trigger_count + 1;
  END LOOP;
  
  RAISE NOTICE '总共修复了 % 个触发器', trigger_count;
  RAISE NOTICE '=== 修复完成 ===';
END $$;