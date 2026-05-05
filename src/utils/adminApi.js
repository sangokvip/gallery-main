// 简化的管理员API - 基于test-stats-fix.html的成功逻辑
import { supabase } from './supabase.js';

export const simpleAdminApi = {
  // 获取系统统计 - 完全重写，使用test-stats-fix.html的成功方法
  async getSystemStats() {
    try {
      console.log('🔄 开始获取系统统计数据（新方法）...');
      
      // 基础统计查询 - 使用test-stats-fix.html的成功逻辑
      const queries = [
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('test_records').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('gallery_images').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }).gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('test_records').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ];
      
      console.log('📊 执行统计查询...');
      const results = await Promise.allSettled(queries);
      
      // 提取计数结果
      const totalUsers = results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0;
      const totalTests = results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0;
      const totalMessages = results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0;
      const totalImages = results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0;
      const todayUsers = results[4].status === 'fulfilled' ? (results[4].value.count || 0) : 0;
      const todayTests = results[5].status === 'fulfilled' ? (results[5].value.count || 0) : 0;
      
      console.log('✅ 基础统计完成:', {
        totalUsers, totalTests, totalMessages, totalImages, todayUsers, todayTests
      });
      
      // 获取测试类型分布
      let testTypeStats = [];
      try {
        // 获取所有测试记录的测试类型，然后手动统计
        const { data: testRecords, error } = await supabase
          .from('test_records')
          .select('test_type');
        
        if (!error && testRecords && testRecords.length > 0) {
          // 手动统计各类型数量
          const typeCounts = {};
          testRecords.forEach(record => {
            const type = record.test_type;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          
          testTypeStats = Object.entries(typeCounts).map(([type, count]) => ({
            name: type,
            count: count
          }));
          console.log('📈 测试类型统计:', testTypeStats);
        }
      } catch (error) {
        console.warn('⚠️ 获取测试类型统计失败:', error);
      }
      
      // 获取地理位置统计
      let geoStats = [];
      try {
        const { data, error } = await supabase
          .from('user_ips')
          .select('country, COUNT(*) as count')
          .not('country', 'is', null)
          .group('country')
          .order('count', { ascending: false })
          .limit(10);
        
        if (!error && data && data.length > 0) {
          geoStats = data;
          console.log('🌍 地理位置统计:', geoStats);
        }
      } catch (error) {
        console.warn('⚠️ 获取地理位置统计失败:', error);
      }
      
      console.log('🎉 系统统计获取完成！');
      
      return {
        overview: {
          totalUsers,
          totalTests,
          totalMessages,
          totalImages,
          todayUsers,
          todayTests
        },
        testTypes: testTypeStats,
        weeklyTrends: [],
        geoStats: geoStats
      };
      
    } catch (error) {
      console.error('❌ 获取系统统计失败:', error);
      
      // 如果主要方法失败，尝试备用方法
      console.log('🔄 尝试备用统计方法...');
      try {
        // 使用更简单的查询方法
        const { data: testRecords, count: testCount } = await supabase
          .from('test_records')
          .select('id', { count: 'exact' })
          .limit(1);
        
        const { data: users, count: userCount } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .limit(1);
        
        const { data: messages, count: messageCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .limit(1);
        
        console.log('✅ 备用方法成功:', {
          totalTests: testCount || 0,
          totalUsers: userCount || 0,
          totalMessages: messageCount || 0
        });
        
        return {
          overview: {
            totalUsers: userCount || 0,
            totalTests: testCount || 0,
            totalMessages: messageCount || 0,
            totalImages: 0,
            todayUsers: 0,
            todayTests: 0
          },
          testTypes: [],
          weeklyTrends: [],
          geoStats: []
        };
        
      } catch (backupError) {
        console.error('❌ 备用方法也失败:', backupError);
        
        // 返回默认值
        return {
          overview: {
            totalUsers: 0,
            totalTests: 0,
            totalMessages: 0,
            totalImages: 0,
            todayUsers: 0,
            todayTests: 0
          },
          testTypes: [],
          weeklyTrends: [],
          geoStats: []
        };
      }
    }
  },

  // 获取所有测试记录 - 简化版本
  async getAllTestResults(filters = {}, limit = 50, offset = 0) {
    try {
      console.log('🔄 开始获取测试记录...');
      
      let query = supabase
        .from('test_records')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // 应用过滤器
      if (filters.test_type) {
        query = query.eq('test_type', filters.test_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id_text', filters.user_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ 获取测试记录失败:', error);
        throw error;
      }
      
      console.log(`✅ 获取测试记录成功: ${data ? data.length : 0} 条，总计: ${count || 0}`);

      // 如果没有数据，直接返回
      if (!data || data.length === 0) {
        return {
          results: [],
          total: 0
        };
      }

      // 获取用户昵称（简化处理，不阻塞主查询）
      const resultsWithNicknames = await Promise.all(
        data.map(async (record) => {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('nickname')
              .eq('id', record.user_id_text)
              .single();
            
            return {
              ...record,
              nickname: userData?.nickname || '匿名用户'
            };
          } catch (error) {
            console.warn(`⚠️ 获取用户昵称失败: ${record.user_id_text}`, error);
            return {
              ...record,
              nickname: '匿名用户'
            };
          }
        })
      );

      return {
        results: resultsWithNicknames,
        total: count || 0
      };
      
    } catch (error) {
      console.error('❌ 获取测试记录失败:', error);
      throw error;
    }
  },

  // 管理员登录验证
  async login(username, password) {
    try {
      console.log('🔐 管理员登录:', username);
      
      // 管理员验证 - 已迁移至 Supabase RPC (verify_admin_password)
      // 此文件已废弃，请使用 adminBrutalApi.js
      const validAdmins = [];
      
      const admin = validAdmins.find(a => a.username === username && a.password === password);
      
      if (!admin) {
        throw new Error('用户名或密码错误');
      }
      
      console.log('✅ 管理员登录成功');
      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      };
      
    } catch (error) {
      console.error('❌ 管理员登录失败:', error);
      throw error;
    }
  },

  // 检查管理员会话
  async checkAdminSession() {
    try {
      // 简单的会话检查
      const adminData = localStorage.getItem('admin_data');
      if (!adminData) {
        console.log('❌ 未找到管理员会话数据');
        return null;
      }
      
      let admin;
      try {
        admin = JSON.parse(adminData);
      } catch (parseError) {
        console.log('❌ 管理员会话数据格式错误，清除会话');
        localStorage.removeItem('admin_data');
        return null;
      }
      
      // 验证管理员数据完整性 - 严格验证所有必需字段
      if (!admin || typeof admin !== 'object') {
        console.log('❌ 管理员数据不是有效对象，清除会话');
        localStorage.removeItem('admin_data');
        return null;
      }
      
      if (!admin.username || !admin.role || !admin.id) {
        console.log('❌ 管理员数据缺少必需字段，清除会话');
        localStorage.removeItem('admin_data');
        return null;
      }
      
      // 验证管理员凭据 - 已迁移至 Supabase (admins 表)
      // 此文件已废弃，请使用 adminBrutalApi.js
      const validAdmins = [];
      
      const isValidAdmin = validAdmins.some(validAdmin => 
        validAdmin.id === admin.id && 
        validAdmin.username === admin.username && 
        validAdmin.role === admin.role
      );
      
      if (!isValidAdmin) {
        console.log('❌ 管理员凭据无效，清除会话');
        localStorage.removeItem('admin_data');
        return null;
      }
      
      console.log('✅ 管理员会话有效');
      return admin;
      
    } catch (error) {
      console.error('❌ 检查管理员会话失败:', error);
      localStorage.removeItem('admin_data');
      return null;
    }
  },

  // 管理员登出
  async logout() {
    localStorage.removeItem('admin_data');
    console.log('👋 管理员已登出');
  }
};

export default simpleAdminApi;