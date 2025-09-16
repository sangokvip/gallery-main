// 数据库连接诊断工具
import { supabase } from './supabase.js';

// 运行数据库诊断
export async function diagnoseDatabase() {
  console.log('=== 数据库连接诊断开始 ===');
  
  const results = {
    connection: false,
    tables: {},
    errors: [],
    envStatus: {
      url: !!import.meta.env.VITE_SUPABASE_URL,
      key: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  };

  try {
    // 1. 检查环境变量
    console.log('1. 检查环境变量:');
    console.log('   VITE_SUPABASE_URL:', results.envStatus.url ? '已配置' : '未配置');
    console.log('   VITE_SUPABASE_ANON_KEY:', results.envStatus.key ? '已配置' : '未配置');

    if (!results.envStatus.url || !results.envStatus.key) {
      results.errors.push('环境变量未配置，请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
      console.warn('⚠️ 环境变量缺失，数据库功能被禁用');
      return results;
    }

    // 2. 测试基本连接
    console.log('2. 测试数据库连接:');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (testError) {
      results.errors.push(`连接测试失败: ${testError.message}`);
      console.error('❌ 数据库连接失败:', testError.message);
    } else {
      results.connection = true;
      console.log('✅ 数据库连接正常');
    }

    // 3. 检查核心表
    const tables = ['users', 'test_records', 'test_results', 'user_ips'];
    console.log('3. 检查数据表:');
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          results.tables[tableName] = { exists: false, error: error.message };
          results.errors.push(`表 ${tableName} 访问失败: ${error.message}`);
          console.error(`❌ 表 ${tableName} 访问失败:`, error.message);
        } else {
          results.tables[tableName] = { exists: true, count: data ? data.length : 0 };
          console.log(`✅ 表 ${tableName} 正常，记录数: ${data ? data.length : 0}`);
        }
      } catch (error) {
        results.tables[tableName] = { exists: false, error: error.message };
        results.errors.push(`检查表 ${tableName} 时出错: ${error.message}`);
        console.error(`❌ 检查表 ${tableName} 时出错:`, error.message);
      }
    }

    // 4. 检查测试记录数据
    console.log('4. 检查测试记录数据:');
    try {
      const { data: records, error: recordsError } = await supabase
        .from('test_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recordsError) {
        results.errors.push(`获取测试记录失败: ${recordsError.message}`);
        console.error('❌ 获取测试记录失败:', recordsError.message);
      } else {
        console.log(`✅ 找到 ${records ? records.length : 0} 条测试记录`);
        if (records && records.length > 0) {
          console.log('   最新记录:', records[0]);
        }
      }
    } catch (error) {
      results.errors.push(`检查测试记录时出错: ${error.message}`);
      console.error('❌ 检查测试记录时出错:', error.message);
    }

    // 5. 检查用户数据
    console.log('5. 检查用户数据:');
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      if (usersError) {
        results.errors.push(`获取用户数据失败: ${usersError.message}`);
        console.error('❌ 获取用户数据失败:', usersError.message);
      } else {
        console.log(`✅ 找到 ${users ? users.length : 0} 个用户`);
        if (users && users.length > 0) {
          console.log('   示例用户:', users[0]);
        }
      }
    } catch (error) {
      results.errors.push(`检查用户数据时出错: ${error.message}`);
      console.error('❌ 检查用户数据时出错:', error.message);
    }

  } catch (error) {
    results.errors.push(`诊断过程出错: ${error.message}`);
    console.error('❌ 诊断过程出错:', error);
  }

  console.log('=== 数据库连接诊断完成 ===');
  return results;
}

// 在控制台打印诊断结果
export function printDiagnosisResults(results) {
  console.log('=== 数据库诊断结果 ===');
  console.log('环境变量状态:', results.envStatus);
  console.log('数据库连接:', results.connection ? '正常' : '失败');
  console.log('数据表状态:', results.tables);
  
  if (results.errors.length > 0) {
    console.warn('发现的问题:');
    results.errors.forEach((error, index) => {
      console.warn(`${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ 未发现问题');
  }
  console.log('=== 诊断结果结束 ===');
}

// 自动运行诊断（如果环境允许）
if (typeof window !== 'undefined') {
  window.runDatabaseDiagnosis = async function() {
    console.log('运行数据库诊断...');
    const results = await diagnoseDatabase();
    printDiagnosisResults(results);
    return results;
  };
}