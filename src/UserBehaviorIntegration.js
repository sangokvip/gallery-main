// 用户行为整合模块 - 可以集成到现有的AdminApp中

import { supabase } from './utils/supabase.js';

// 增强的用户行为API
export const userBehaviorApi = {
  // 获取用户行为数据（整合IP和测试记录）
  async getUserBehaviorData(limit = 50, offset = 0, filters = {}) {
    try {
      console.log('🔄 开始加载用户行为数据...');
      
      // 1. 获取测试记录
      console.log('📋 获取测试记录...');
      let testQuery = supabase
        .from('test_records')
        .select(`
          id,
          user_id_text,
          test_type,
          created_at,
          report_data
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // 应用过滤器
      if (filters.test_type) {
        testQuery = testQuery.eq('test_type', filters.test_type);
      }
      if (filters.date_from) {
        testQuery = testQuery.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        testQuery = testQuery.lte('created_at', filters.date_to);
      }

      const { data: records, error: recordsError, count } = await testQuery;

      if (recordsError) throw recordsError;
      
      console.log(`✅ 获取到 ${records?.length || 0} 条测试记录，总计: ${count || 0}`);

      if (!records || records.length === 0) {
        return {
          behaviors: [],
          total: 0,
          userIPs: [],
          summary: {
            totalUsers: 0,
            totalTests: 0,
            totalCountries: 0,
            totalDevices: 0
          }
        };
      }

      // 2. 获取用户IP信息
      console.log('🌍 获取用户IP信息...');
      const userIds = [...new Set(records.map(r => r.user_id_text))];
      
      const { data: userIPData, error: ipError } = await supabase
        .from('user_ips')
        .select(`
          user_id,
          ip_address,
          country,
          city,
          device_type,
          browser,
          os,
          last_seen,
          created_at
        `)
        .in('user_id', userIds)
        .order('last_seen', { ascending: false });

      if (ipError) throw ipError;
      
      console.log(`✅ 获取到 ${userIPData?.length || 0} 条IP记录`);

      // 3. 获取用户信息
      console.log('👥 获取用户信息...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nickname, created_at, last_active')
        .in('id', userIds);

      if (usersError) throw usersError;

      // 4. 整合数据
      console.log('🔗 整合用户行为数据...');
      const behaviors = await Promise.all(
        records.map(async (record) => {
          // 找到对应的用户信息
          const user = users?.find(u => u.id === record.user_id_text);
          
          // 找到对应的IP信息（可能有多个IP，取最新的）
          const userIPs = (userIPData || []).filter(ip => ip.user_id === record.user_id_text);
          const latestIP = userIPs.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0];
          
          // 获取测试详细信息
          const { data: testDetails } = await supabase
            .from('test_results')
            .select('category, item, rating')
            .eq('record_id', record.id);

          return {
            id: record.id,
            userId: record.user_id_text,
            nickname: user?.nickname || '匿名用户',
            testType: record.test_type,
            testDate: record.created_at,
            completionRate: testDetails?.length || 0,
            ipAddress: latestIP?.ip_address || '未知',
            country: latestIP?.country || '未知',
            city: latestIP?.city || '未知',
            deviceType: latestIP?.device_type || '未知',
            browser: latestIP?.browser || '未知',
            os: latestIP?.os || '未知',
            lastSeen: latestIP?.last_seen || record.created_at,
            testResults: testDetails || [],
            totalTests: testDetails?.length || 0,
            userCreatedAt: user?.created_at || record.created_at,
            userLastActive: user?.last_active || record.created_at
          };
        })
      );

      console.log(`✅ 整合完成，共 ${behaviors.length} 条用户行为记录`);
      
      // 5. 生成汇总统计
      const summary = {
        totalUsers: [...new Set(behaviors.map(b => b.userId))].length,
        totalTests: behaviors.length,
        totalCountries: [...new Set(behaviors.map(b => b.country))].length,
        totalDevices: [...new Set(behaviors.map(b => b.deviceType))].length
      };

      return {
        behaviors,
        total: count || 0,
        userIPs: userIPData || [],
        summary
      };
      
    } catch (error) {
      console.error('❌ 加载用户行为数据失败:', error);
      throw error;
    }
  },

  // 获取用户详细信息
  async getUserDetailedAnalysis(userId) {
    try {
      console.log(`🔍 获取用户 ${userId} 的详细分析...`);
      
      // 获取用户的所有测试记录
      const { data: userRecords, error: recordsError } = await supabase
        .from('test_records')
        .select(`
          id,
          test_type,
          created_at,
          user_id_text
        `)
        .eq('user_id_text', userId)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;

      // 获取用户的所有IP记录
      const { data: userIPData, error: ipError } = await supabase
        .from('user_ips')
        .select(`
          ip_address,
          country,
          city,
          device_type,
          browser,
          os,
          last_seen,
          created_at
        `)
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });

      if (ipError) throw ipError;

      // 获取用户信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, nickname, created_at, last_active')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // 生成详细分析
      const analysis = {
        userId,
        nickname: userData?.nickname || '匿名用户',
        totalTests: userRecords?.length || 0,
        testTypes: [...new Set(userRecords?.map(r => r.test_type) || [])],
        firstTest: userRecords?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0],
        lastTest: userRecords?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0],
        ipAddresses: [...new Set(userIPData?.map(ip => ip.ip_address) || [])],
        countries: [...new Set(userIPData?.map(ip => ip.country) || [])],
        cities: [...new Set(userIPData?.map(ip => ip.city) || [])],
        devices: [...new Set(userIPData?.map(ip => ip.device_type) || [])],
        browsers: [...new Set(userIPData?.map(ip => ip.browser) || [])],
        behaviorTimeline: userRecords?.map(record => ({
          type: 'test',
          testType: record.test_type,
          date: record.created_at,
          id: record.id
        })) || [],
        ipHistory: userIPData?.map(ip => ({
          ipAddress: ip.ip_address,
          country: ip.country,
          city: ip.city,
          deviceType: ip.device_type,
          browser: ip.browser,
          os: ip.os,
          lastSeen: ip.last_seen
        })) || []
      };

      return analysis;
      
    } catch (error) {
      console.error(`❌ 获取用户 ${userId} 详细分析失败:`, error);
      throw error;
    }
  },

  // 获取地理位置统计
  async getGeoStats() {
    try {
      console.log('🌍 获取地理位置统计...');
      
      const { data, error } = await supabase
        .from('user_ips')
        .select('country, city, COUNT(*) as count')
        .not('country', 'is', null)
        .group('country, city')
        .order('count', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      console.error('⚠️ 获取地理位置统计失败:', error);
      return [];
    }
  }
};

// 行为分析工具函数
export const behaviorAnalysisUtils = {
  // 分析用户活跃度
  analyzeUserActivity(userBehaviors) {
    const now = new Date();
    const behaviors = userBehaviors.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
    
    const lastTest = behaviors[0];
    const firstTest = behaviors[behaviors.length - 1];
    const timeSpan = new Date(lastTest.testDate) - new Date(firstTest.testDate);
    
    const daysBetweenTests = behaviors.length > 1 ? 
      timeSpan / (1000 * 60 * 60 * 24 * (behaviors.length - 1)) : 0;
    
    return {
      isActive: daysBetweenTests < 30, // 30天内活跃
      lastActivity: lastTest?.testDate,
      activitySpan: timeSpan,
      averageDaysBetweenTests: daysBetweenTests,
      testFrequency: behaviors.length / Math.max(1, timeSpan / (1000 * 60 * 60 * 24))
    };
  },

  // 分析设备使用模式
  analyzeDevicePattern(userBehaviors) {
    const devices = {};
    const browsers = {};
    const countries = {};
    
    userBehaviors.forEach(behavior => {
      devices[behavior.deviceType] = (devices[behavior.deviceType] || 0) + 1;
      browsers[behavior.browser] = (browsers[behavior.browser] || 0) + 1;
      countries[behavior.country] = (countries[behavior.country] || 0) + 1;
    });
    
    return {
      preferredDevice: Object.entries(devices).sort(([,a], [,b]) => b - a)[0]?.[0],
      preferredBrowser: Object.entries(browsers).sort(([,a], [,b]) => b - a)[0]?.[0],
      preferredCountry: Object.entries(countries).sort(([,a], [,b]) => b - a)[0]?.[0],
      deviceUsage: devices,
      browserUsage: browsers,
      countryUsage: countries
    };
  },

  // 分析测试行为模式
  analyzeTestPattern(userBehaviors) {
    const testTypes = {};
    const completionRates = [];
    
    userBehaviors.forEach(behavior => {
      testTypes[behavior.testType] = (testTypes[behavior.testType] || 0) + 1;
      completionRates.push(behavior.completionRate);
    });
    
    const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    const preferredTestType = Object.entries(testTypes).sort(([,a], [,b]) => b - a)[0]?.[0];
    
    return {
      preferredTestType,
      testTypeDistribution: testTypes,
      averageCompletionRate: avgCompletionRate,
      completionRateTrend: this.analyzeCompletionTrend(completionRates)
    };
  },

  // 分析完成率趋势
  analyzeCompletionTrend(completionRates) {
    if (completionRates.length < 2) return 'stable';
    
    const firstHalf = completionRates.slice(0, Math.floor(completionRates.length / 2));
    const secondHalf = completionRates.slice(Math.floor(completionRates.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }
};

export default { userBehaviorApi, behaviorAnalysisUtils };