-- 创建测试类型编号计数器表
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

-- 添加更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_test_counters_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_test_counters_updated_at
  BEFORE UPDATE ON test_type_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_test_counters_timestamp();

-- 添加表注释
COMMENT ON TABLE test_type_counters IS '测试类型编号计数器表，用于管理不同类型测试的编号序列';
COMMENT ON COLUMN test_type_counters.test_type IS '测试类型：female, male, s, lgbt';
COMMENT ON COLUMN test_type_counters.current_number IS '当前编号';
COMMENT ON COLUMN test_type_counters.start_number IS '起始编号';
COMMENT ON COLUMN test_type_counters.last_updated IS '最后更新时间';