# 🔧 环境变量配置指南

## 🎯 问题解决

### 问题描述
内页显示空白的原因是缺少Supabase环境变量配置。应用需要连接到Supabase数据库来获取和存储数据。

### 解决方案
已创建 `.env` 文件并配置了正确的Supabase连接信息。

## 📋 环境变量说明

### 必需的环境变量

```bash
VITE_SUPABASE_URL=https://xnknzqyhdvthchbmbqop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 变量说明

1. **VITE_SUPABASE_URL**
   - Supabase项目的URL
   - 格式：`https://[project-id].supabase.co`
   - 用途：连接到Supabase后端服务

2. **VITE_SUPABASE_ANON_KEY**
   - Supabase匿名访问密钥
   - 用途：客户端身份验证和API访问
   - 安全性：这是公开密钥，可以在客户端使用

## 🔒 安全配置

### .gitignore 配置
`.env` 文件已添加到 `.gitignore` 中，确保敏感信息不会被提交到Git仓库：

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### .env.example 文件
创建了 `.env.example` 文件作为模板，包含：
- 变量名称和格式说明
- 获取配置值的步骤指引
- 不包含实际的敏感值

## 🚀 部署配置

### 本地开发
1. 确保 `.env` 文件存在于项目根目录
2. 重启开发服务器以加载环境变量
3. 检查浏览器控制台确认连接成功

### Cloudflare Pages 部署
在Cloudflare Pages中设置环境变量：

1. 进入项目设置
2. 找到 "Environment variables" 部分
3. 添加以下变量：
   ```
   VITE_SUPABASE_URL = https://xnknzqyhdvthchbmbqop.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Vercel 部署
在Vercel中设置环境变量：

1. 进入项目设置
2. 找到 "Environment Variables" 部分
3. 添加相同的变量

## 🔍 故障排除

### 检查环境变量是否加载
在浏览器控制台中运行：
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### 常见问题

1. **页面空白**
   - 检查 `.env` 文件是否存在
   - 确认环境变量名称正确（必须以 `VITE_` 开头）
   - 重启开发服务器

2. **Supabase连接失败**
   - 验证URL格式是否正确
   - 检查API密钥是否有效
   - 确认Supabase项目状态正常

3. **构建时错误**
   - 确保生产环境也配置了相同的环境变量
   - 检查部署平台的环境变量设置

## 📊 数据库表结构

应用需要以下Supabase表：

1. **messages** - 留言数据
2. **message_reactions** - 留言反应（点赞/点踩）
3. **message_replies** - 留言回复
4. **test_records** - 测试记录
5. **gallery_images** - 图库图片
6. **gallery_votes** - 图片投票

## 🔄 环境变量更新流程

1. **本地更新**：
   - 修改 `.env` 文件
   - 重启开发服务器
   - 测试功能正常

2. **部署更新**：
   - 在部署平台更新环境变量
   - 重新部署应用
   - 验证生产环境功能

## 💡 最佳实践

1. **版本控制**：
   - 永远不要提交 `.env` 文件到Git
   - 保持 `.env.example` 文件更新
   - 在README中说明环境变量要求

2. **团队协作**：
   - 为新团队成员提供环境变量值
   - 文档化所有必需的配置
   - 使用密码管理器共享敏感信息

3. **安全性**：
   - 定期轮换API密钥
   - 监控API使用情况
   - 限制API密钥权限范围

## ✅ 验证清单

- [ ] `.env` 文件已创建并包含正确的值
- [ ] 开发服务器已重启
- [ ] 浏览器控制台无错误信息
- [ ] 所有页面正常加载
- [ ] 数据库连接成功
- [ ] 部署环境已配置相同变量
