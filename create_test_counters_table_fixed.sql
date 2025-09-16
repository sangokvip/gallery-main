-- 创建测试类型编号计数器表 - 修复版本
-- 这个版本修复了触发器重复创建的问题

-- 创建表（如果不存在）
CREATE TABLE IF NOT EXISTS test_type_counters (
  test_type TEXT PRIMARY KEY,
  current_number INTEGER DEFAULT 0,
  start_number INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 插入各测试类型的初始数据
INSERT INTO test_type_counters (test_type, current_number, start_number) VALUES 
('female', 7878, 7878),
('male', 1560, 1560),
('s', 780, 780),
('lgbt', 2340, 2340)
ON CONFLICT (test_type) DO NOTHING;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_test_counters_type ON test_type_counters(test_type);
CREATE INDEX IF NOT EXISTS idx_test_counters_current ON test_type_counters(current_number);

-- 通用时间戳更新函数（如果不存在）
CREATE OR REPLACE FUNCTION update_test_counters_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 使用通用函数创建触发器（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_test_counters_updated_at' 
    AND tgrelid = 'test_type_counters'::regclass
  ) THEN
    CREATE TRIGGER update_test_counters_updated_at
      BEFORE UPDATE ON test_type_counters
      FOR EACH ROW
      EXECUTE FUNCTION update_test_counters_timestamp();
  END IF;
END $$;

-- 添加表注释
COMMENT ON TABLE test_type_counters IS '测试类型编号计数器表，用于管理不同类型测试的编号序列';
COMMENT ON COLUMN test_type_counters.test_type IS '测试类型：female, male, s, lgbt';
COMMENT ON COLUMN test_type_counters.current_number IS '当前编号';
COMMENT ON COLUMN test_type_counters.start_number IS '起始编号';
COMMENT ON COLUMN test_type_counters.last_updated IS '最后更新时间';

-- 显示当前状态
DO $$
DECLARE
  table_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- 检查表中的数据
  SELECT COUNT(*) INTO table_count FROM test_type_counters;
  RAISE NOTICE '测试计数器表已创建/更新，当前记录数: %', table_count;
  
  -- 显示当前数据
  RAISE NOTICE '当前计数器数据:';
  FOR rec IN SELECT test_type, current_number, start_number FROM test_type_counters LOOP
    RAISE NOTICE '  %: 当前=% , 起始=%', rec.test_type, rec.current_number, rec.start_number;
  END LOOP;
  
  -- 检查触发器
  SELECT COUNT(*) INTO trigger_count 
  FROM pg_trigger 
  WHERE tgname = 'update_test_counters_updated_at' 
  AND tgrelid = 'test_type_counters'::regclass;
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ 触发器 update_test_counters_updated_at 已存在或创建成功';
  ELSE
    RAISE NOTICE '⚠️ 触发器创建可能失败';
  END IF;
END $$;