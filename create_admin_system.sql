-- 后台管理系统数据库架构
-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 用户IP地址记录表
CREATE TABLE IF NOT EXISTS user_ips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  timezone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  isp TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'test_result', 'message', 'image'
  target_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admins(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 用户行为分析表
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  test_type TEXT NOT NULL,
  action TEXT NOT NULL, -- 'start_test', 'complete_test', 'export_report', 'share_report'
  session_id TEXT,
  duration_seconds INTEGER,
  completion_rate DECIMAL(5, 2),
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 测试报告导出记录表
CREATE TABLE IF NOT EXISTS report_exports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  test_type TEXT NOT NULL,
  test_record_id UUID REFERENCES test_records(id),
  export_format TEXT NOT NULL CHECK (export_format IN ('image', 'pdf')),
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  last_downloaded TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 系统统计表（每日汇总）
CREATE TABLE IF NOT EXISTS daily_statistics (
  date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  tests_by_type JSONB DEFAULT '{}',
  total_messages INTEGER DEFAULT 0,
  total_images INTEGER DEFAULT 0,
  report_exports INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_ips_user_id ON user_ips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ips_ip_address ON user_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_ips_last_seen ON user_ips(last_seen);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_test_type ON user_analytics(test_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_report_exports_user_id ON report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_test_type ON report_exports(test_type);
CREATE INDEX IF NOT EXISTS idx_daily_statistics_date ON daily_statistics(date);

-- 添加表注释
COMMENT ON TABLE admins IS '后台管理员账户表';
COMMENT ON TABLE user_ips IS '用户IP地址和设备信息记录表';
COMMENT ON TABLE admin_logs IS '管理员操作日志表';
COMMENT ON TABLE system_settings IS '系统配置表';
COMMENT ON TABLE user_analytics IS '用户行为分析表';
COMMENT ON TABLE report_exports IS '测试报告导出记录表';
COMMENT ON TABLE daily_statistics IS '系统每日统计数据表';

-- 插入默认管理员账户（密码：admin123）
-- 注意：生产环境请使用更安全的密码
INSERT INTO admins (username, password_hash, email, role, is_active) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', 'super_admin', true)
ON CONFLICT (username) DO NOTHING;

-- 插入系统默认配置
INSERT INTO system_settings (key, value, description) VALUES 
('site_title', 'M-Profile Lab 管理系统', '网站标题'),
('site_description', '专业的人格测试平台管理系统', '网站描述'),
('admin_email', 'admin@example.com', '管理员邮箱'),
('max_login_attempts', '5', '最大登录尝试次数'),
('session_timeout', '3600', '会话超时时间（秒）'),
('enable_user_registration', 'false', '是否允许用户注册'),
('enable_ip_tracking', 'true', '是否启用IP地址追踪'),
('enable_analytics', 'true', '是否启用用户行为分析'),
('data_retention_days', '365', '数据保留天数')
ON CONFLICT (key) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表创建更新时间触发器（如果不存在）
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_admins_timestamp' 
    AND tgrelid = 'admins'::regclass
  ) THEN
    CREATE TRIGGER update_admins_timestamp 
      BEFORE UPDATE ON admins 
      FOR EACH ROW 
      EXECUTE FUNCTION update_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_ips_timestamp' 
    AND tgrelid = 'user_ips'::regclass
  ) THEN
    CREATE TRIGGER update_user_ips_timestamp 
      BEFORE UPDATE ON user_ips 
      FOR EACH ROW 
      EXECUTE FUNCTION update_timestamp();
  END IF;
END $;