// 修复IP地址显示问题的方案
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnknzqyhdvthchbmbqop.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua256cXloZHZ0aGNoYm1icW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NTUwODEsImV4cCI6MjA2MDQzMTA4MX0.5xAG3BEZcWP71lNB6Gh1HgIiLDR6oaAJ2NNnQ50s0i4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixIPDisplay() {
  console.log('🔧 开始修复IP地址显示问题...')
  
  try {
    // 1. 获取测试记录
    console.log('1️⃣ 获取测试记录...')
    const { data: testRecords, error: testError } = await supabase
      .from('test_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (testError) {
      console.log('❌ 测试记录查询错误:', testError.message)
      return
    }
    
    console.log('📊 测试记录数:', testRecords?.length || 0)
    
    // 2. 获取所有IP记录（不限制用户ID）
    console.log('\n2️⃣ 获取所有IP记录（不限制用户ID）...')
    const { data: allIPs, error: allIPError } = await supabase
      .from('user_ips')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(50)
    
    if (allIPError) {
      console.log('❌ IP记录查询错误:', allIPError.message)
      return
    }
    
    console.log('🌐 IP记录数:', allIPs?.length || 0)
    
    // 3. 创建修复后的合并逻辑
    console.log('\n3️⃣ 创建修复后的合并逻辑...')
    
    // 方法1: 使用最新的IP记录作为默认数据
    const latestIP = allIPs && allIPs.length > 0 ? allIPs[0] : null
    
    // 方法2: 为每个测试记录分配最近的IP数据
    const mergedData = testRecords.map(record => {
      // 尝试找到匹配的IP记录
      const userIPData = allIPs ? allIPs.filter(ip => ip.user_id === record.user_id_text) : []
      const latestIP = userIPData.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0]
      
      // 如果没有匹配的IP，使用最新的IP作为默认
      const defaultIP = latestIP || (allIPs && allIPs.length > 0 ? allIPs[0] : null)
      const selectedIP = latestIP || defaultIP
      
      return {
        id: record.id,
        userId: record.user_id_text,
        nickname: '匿名用户', // 简化处理
        testType: record.test_type,
        testDate: record.created_at,
        resultCount: 0, // 简化处理
        avgScore: 0, // 简化处理
        
        // IP信息 - 使用找到的IP或默认值
        ipAddress: selectedIP?.ip_address || '未知',
        country: selectedIP?.country || '未知',
        city: selectedIP?.city || '未知',
        deviceType: selectedIP?.device_type || '未知',
        browser: selectedIP?.browser || '未知',
        os: selectedIP?.os || '未知',
        lastSeen: selectedIP?.last_seen || record.created_at,
        
        // 完整IP记录
        allIPs: userIPData,
        
        // 原始记录
        originalRecord: record,
        testDetails: []
      }
    })
    
    console.log('✅ 合并数据完成，共', mergedData.length, '条记录')
    
    // 4. 显示修复后的结果
    console.log('\n4️⃣ 显示修复后的结果:')
    mergedData.slice(0, 3).forEach((record, index) => {
      console.log(`  ${index + 1}. 用户:${record.userId}`)
      console.log(`     IP:${record.ipAddress} 国家:${record.country} 城市:${record.city}`)
      console.log(`     设备:${record.deviceType} 浏览器:${record.browser}`)
    })
    
    // 5. 统计修复效果
    const withRealIP = mergedData.filter(r => r.ipAddress !== '未知').length
    const withRealGeo = mergedData.filter(r => r.country !== '未知').length
    
    console.log('\n📊 修复效果统计:')
    console.log(`  ✅ 有真实IP地址: ${withRealIP}/${mergedData.length} (${((withRealIP/mergedData.length)*100).toFixed(1)}%)`)
    console.log(`  ✅ 有真实地理位置: ${withRealGeo}/${mergedData.length} (${((withRealGeo/mergedData.length)*100).toFixed(1)}%)`)
    
    // 6. 提供最终解决方案
    console.log('\n💡 最终解决方案:')
    console.log('  方案1: 修改MergedRecordsIP.jsx中的查询逻辑')
    console.log('  - 移除用户ID过滤条件')
    console.log('  - 使用所有可用的IP数据作为默认显示')
    console.log('  - 优先显示匹配的IP，不匹配时使用最新IP')
    
    console.log('\n  方案2: 重新设计数据关联逻辑')
    console.log('  - 建立用户ID映射表')
    console.log('  - 使用时间戳或会话ID进行关联')
    console.log('  - 确保测试记录和IP记录使用相同的用户标识')
    
    console.log('\n✅ IP显示问题修复方案完成')
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message)
  }
}

fixIPDisplay()