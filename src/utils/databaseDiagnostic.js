// 数据库诊断工具
import { supabase } from './supabase';

export class DatabaseDiagnostic {
  constructor() {
    this.results = {
      connection: false,
      tables: {
        users: false,
        test_records: false,
        test_results: false
      },
      columns: {
        users: [],
        test_records: [],
        test_results: []
      },
      errors: []
    };
  }

  // 运行完整诊断
  async runDiagnostic() {
    console.log('开始数据库诊断...');
    
    try {
      // 测试连接
      await this.testConnection();
      
      // 检查表存在性
      await this.checkTables();
      
      // 检查列结构
      await this.checkColumns();
      
      // 测试基本操作
      await this.testBasicOperations();
      
    } catch (error) {
      this.results.errors.push(`诊断过程出错: ${error.message}`);
    }
    
    return this.results;
  }

  // 测试数据库连接
  async testConnection() {
    try {
      // 尝试查询一个简单的表来测试连接
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        this.results.errors.push(`连接失败: ${error.message}`);
        return false;
      }

      this.results.connection = true;
      console.log('✅ 数据库连接正常');
      return true;
    } catch (error) {
      this.results.errors.push(`连接测试失败: ${error.message}`);
      return false;
    }
  }

  // 检查表是否存在
  async checkTables() {
    const tables = ['users', 'test_records', 'test_results'];
    
    for (const tableName of tables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          this.results.errors.push(`表 ${tableName} 不存在或无法访问: ${error.message}`);
          this.results.tables[tableName] = false;
        } else {
          this.results.tables[tableName] = true;
          console.log(`✅ 表 ${tableName} 存在`);
        }
      } catch (error) {
        this.results.errors.push(`检查表 ${tableName} 时出错: ${error.message}`);
        this.results.tables[tableName] = false;
      }
    }
  }

  // 检查列结构
  async checkColumns() {
    const expectedColumns = {
      users: ['id', 'nickname', 'created_at', 'last_active'],
      test_records: ['id', 'user_id_text', 'test_type', 'report_data', 'created_at'],
      test_results: ['id', 'record_id', 'category', 'item', 'rating', 'created_at']
    };

    for (const [tableName, expectedCols] of Object.entries(expectedColumns)) {
      if (!this.results.tables[tableName]) {
        continue; // 跳过不存在的表
      }

      try {
        // 直接查询表来获取列信息
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!sampleError) {
          const actualColumns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
          this.results.columns[tableName] = actualColumns;

          // 检查关键列是否存在
          const missingColumns = expectedCols.filter(col => !actualColumns.includes(col));
          if (missingColumns.length > 0) {
            this.results.errors.push(`表 ${tableName} 缺少关键列: ${missingColumns.join(', ')}`);
          }

          // 特别检查 test_records 表的关键列
          if (tableName === 'test_records') {
            if (!actualColumns.includes('user_id_text')) {
              this.results.errors.push('test_records 表缺少 user_id_text 列，需要运行数据库更新脚本');
            }
            if (!actualColumns.includes('report_data')) {
              this.results.errors.push('test_records 表缺少 report_data 列，需要运行数据库更新脚本');
            }
          }
        } else {
          this.results.errors.push(`无法获取表 ${tableName} 的列信息: ${sampleError.message}`);
        }
      } catch (error) {
        this.results.errors.push(`检查表 ${tableName} 列结构时出错: ${error.message}`);
      }
    }
  }

  // 测试基本操作
  async testBasicOperations() {
    if (!this.results.tables.users) {
      return;
    }

    try {
      // 测试插入用户
      const testUserId = `test_${Date.now()}`;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert([{
          id: testUserId,
          nickname: '测试用户',
          last_active: new Date().toISOString()
        }], {
          onConflict: 'id'
        })
        .select();

      if (userError) {
        this.results.errors.push(`用户操作测试失败: ${userError.message}`);
      } else {
        console.log('✅ 用户操作测试通过');
        
        // 清理测试数据
        await supabase
          .from('users')
          .delete()
          .eq('id', testUserId);
      }
    } catch (error) {
      this.results.errors.push(`基本操作测试失败: ${error.message}`);
    }
  }

  // 生成诊断报告
  generateReport() {
    const report = {
      summary: {
        connection: this.results.connection ? '✅ 正常' : '❌ 失败',
        tablesCount: Object.values(this.results.tables).filter(Boolean).length,
        totalTables: Object.keys(this.results.tables).length,
        errorsCount: this.results.errors.length
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  // 生成修复建议
  generateRecommendations() {
    const recommendations = [];

    if (!this.results.connection) {
      recommendations.push('检查Supabase环境变量配置是否正确');
      recommendations.push('确认Supabase项目是否正常运行');
    }

    const missingTables = Object.entries(this.results.tables)
      .filter(([name, exists]) => !exists)
      .map(([name]) => name);

    if (missingTables.length > 0) {
      recommendations.push(`需要创建缺失的表: ${missingTables.join(', ')}`);
      recommendations.push('在Supabase SQL编辑器中运行 fix_database_tables.sql 脚本');
    }

    if (this.results.errors.length > 0) {
      recommendations.push('查看错误详情并根据错误信息进行修复');
    }

    if (recommendations.length === 0) {
      recommendations.push('数据库配置正常，可以正常使用');
    }

    return recommendations;
  }
}

// 便捷函数
export const runDatabaseDiagnostic = async () => {
  const diagnostic = new DatabaseDiagnostic();
  await diagnostic.runDiagnostic();
  return diagnostic.generateReport();
};

export default DatabaseDiagnostic;
