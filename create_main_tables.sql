-- 主数据库表结构 - M-Profile Lab 核心功能
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '匿名用户',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建测试记录表
CREATE TABLE IF NOT EXISTS test_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id_text TEXT NOT NULL, -- 关联到users表的id字段
  test_type TEXT NOT NULL CHECK (test_type IN ('female', 'male', 's', 'lgbt')),
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建测试结果详情表
CREATE TABLE IF NOT EXISTS test_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES test_records(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('SSS', 'SS', 'S', 'Q', 'N', 'W', '')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建消息表（留言板功能）
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  original_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_pinned BOOLEAN DEFAULT false
);

-- 创建消息反应表（点赞/点踩）
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_like BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建图库图片表
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建图片投票表
CREATE TABLE IF NOT EXISTS gallery_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES gallery_images(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_like BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

CREATE INDEX IF NOT EXISTS idx_test_records_user_id ON test_records(user_id_text);
CREATE INDEX IF NOT EXISTS idx_test_records_test_type ON test_records(test_type);
CREATE INDEX IF NOT EXISTS idx_test_records_created_at ON test_records(created_at);

CREATE INDEX IF NOT EXISTS idx_test_results_record_id ON test_results(record_id);
CREATE INDEX IF NOT EXISTS idx_test_results_category ON test_results(category);
CREATE INDEX IF NOT EXISTS idx_test_results_rating ON test_results(rating);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_pinned ON messages(is_pinned);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_created_at ON message_reactions(created_at);

CREATE INDEX IF NOT EXISTS idx_gallery_images_user_id ON gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at);
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_pinned ON gallery_images(is_pinned);
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_approved ON gallery_images(is_approved);

CREATE INDEX IF NOT EXISTS idx_gallery_votes_image_id ON gallery_votes(image_id);
CREATE INDEX IF NOT EXISTS idx_gallery_votes_user_id ON gallery_votes(user_id);

-- 添加表注释
COMMENT ON TABLE users IS '用户基本信息表';
COMMENT ON TABLE test_records IS '测试记录主表';
COMMENT ON TABLE test_results IS '测试结果详情表';
COMMENT ON TABLE messages IS '留言板消息表';
COMMENT ON TABLE message_reactions IS '消息反应表（点赞/点踩）';
COMMENT ON TABLE gallery_images IS '图库图片表';
COMMENT ON TABLE gallery_votes IS '图片投票表';

-- 添加列注释
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.nickname IS '用户昵称';
COMMENT ON COLUMN users.created_at IS '用户创建时间';
COMMENT ON COLUMN users.last_active IS '最后活跃时间';

COMMENT ON COLUMN test_records.id IS '测试记录唯一标识';
COMMENT ON COLUMN test_records.user_id_text IS '关联用户ID';
COMMENT ON COLUMN test_records.test_type IS '测试类型：female, male, s, lgbt';
COMMENT ON COLUMN test_records.report_data IS '报告数据（JSON格式）';
COMMENT ON COLUMN test_records.created_at IS '记录创建时间';

COMMENT ON COLUMN test_results.record_id IS '关联的测试记录ID';
COMMENT ON COLUMN test_results.category IS '测试类别';
COMMENT ON COLUMN test_results.item IS '测试项目';
COMMENT ON COLUMN test_results.rating IS '评分：SSS, SS, S, Q, N, W';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_test_records_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为test_records表创建更新时间触发器（如果不存在）
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_test_records_updated_at' 
    AND tgrelid = 'test_records'::regclass
  ) THEN
    CREATE TRIGGER update_test_records_updated_at
      BEFORE UPDATE ON test_records
      FOR EACH ROW
      EXECUTE FUNCTION update_test_records_timestamp();
  END IF;
END $;