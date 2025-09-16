// 最终检查IP地址数据问题
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnknzqyhdvthchbmbqop.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua256cXloZHZ0aGNoYm1icW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3NzQ1NzMsImV4cCI6MjA0MTM1MDU3M30.kpMwJcT7iTcheAyfGCcKqfgn0dGdmUp3lX7WFH3dVZk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIPDataFinal() {
  console.log('🔍 开始最终检查IP地址数据问题...')
  
  try {
    // 1. 直接查询user_ips表的前几条记录
    console.log('\n1️⃣ 查询user_ips表数据:')
    const { data: ipRecords, error: ipError } = await supabase
      .from('user_ips')
      .select('*')
      .limit(10)
    
    if (ipError) {
      console.log('❌ IP记录查询错误:', ipError.message)
      console.log('错误详情:', ipError)
    } else {
      console.log('📊 找到的IP记录数:', ipRecords?.length || 0)
      if (ipRecords && ipRecords.length > 0) {
        console.log('🌐 IP数据示例:')
        ipRecords.forEach((ip, index) => {
          console.log(`  ${index + 1}. 用户:${ip.user_id} IP:${ip.ip_address} 国家:${ip.country || '未知'} 城市:${ip.city || '未知'}`)
        })
      } else {
        console.log('⚠️ 没有找到IP记录 - 这是问题的根本原因！')
      }
    }
    
    // 2. 检查测试记录
    console.log('\n2️⃣ 检查测试记录:')
    const { data: testRecords, error: testError } = await supabase
      .from('test_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (testError) {
      console.log('❌ 测试记录查询错误:', testError.message)
    } else {
      console.log('📋 测试记录数:', testRecords?.length || 0)
      if (testRecords && testRecords.length > 0) {
        console.log('📝 测试记录示例:')
        testRecords.forEach((record, index) => {
          console.log(`  ${index + 1}. ID:${record.id} 用户:${record.user_id_text} 类型:${record.test_type} 时间:${record.created_at}`)
        })
      }
    }
    
    // 3. 尝试关联查询
    if (testRecords && testRecords.length > 0) {
      console.log('\n3️⃣ 尝试关联查询IP信息:')
      const userIds = testRecords.map(r => r.user_id_text)
      
      const { data: userIPs, error: userIPError } = await supabase
        .from('user_ips')
        .select('*')
        .in('user_id', userIds.slice(0, 5))
      
      if (userIPError) {
        console.log('❌ 关联查询错误:', userIPError.message)
      } else {
        console.log('🔗 关联查询结果数:', userIPs?.length || 0)
        if (userIPs && userIPs.length > 0) {
          console.log('🌐 关联IP数据:')
          userIPs.forEach((ip, index) => {
            const hasGeo = ip.country && ip.country !== '未知' && ip.country !== ''
            console.log(`  ${index + 1}. 用户:${ip.user_id} IP:${ip.ip_address} 国家:${ip.country || '未知'} 城市:${ip.city || '未知'} ${hasGeo ? '✅' : '❌'}`)
          })
        } else {
          console.log('⚠️ 没有找到关联的IP记录')
        }
      }
    }
    
    // 4. 检查数据库连接状态
    console.log('\n4️⃣ 检查数据库连接:')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('test_records')
      .select('id')
      .limit(1)
    
    if (connectionError) {
      console.log('❌ 数据库连接失败:', connectionError.message)
    } else {
      console.log('✅ 数据库连接正常')
    }
    
    // 5. 检查是否存在IP记录但地理位置为空的情况
    console.log('\n5️⃣ 检查IP记录但地理位置为空的情况:')
    const { data: emptyGeoIPs, error: emptyError } = await supabase
      .from('user_ips')
      .select('*')
      .or('country.is.null,country.eq.未知,country.eq."",city.is.null,city.eq.未知,city.eq.""')
      .limit(5)
    
    if (emptyError) {
      console.log('❌ 空地理位置查询错误:', emptyError.message)
    } else {
      console.log('🈳 无地理位置的IP记录数:', emptyGeoIPs?.length || 0)
      if (emptyGeoIPs && emptyGeoIPs.length > 0) {
        console.log('📍 无地理位置的IP示例:')
        emptyGeoIPs.forEach((ip, index) => {
          console.log(`  ${index + 1}. IP:${ip.ip_address} 国家:${ip.country || 'null'} 城市:${ip.city || 'null'} 设备:${ip.device_type || '未知'} 浏览器:${ip.browser || '未知'}`)
        })
      }
    }
    
    // 6. 检查IP地址格式
    console.log('\n6️⃣ 检查IP地址格式:')
    if (ipRecords && ipRecords.length > 0) {
      const validIPs = ipRecords.filter(ip => {
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
        return ipPattern.test(ip.ip_address)
      })
      console.log('✅ 有效IP地址格式:', validIPs.length, '/', ipRecords.length)
      
      if (validIPs.length > 0) {
        console.log('🌐 有效IP示例:')
        validIPs.slice(0, 3).forEach((ip, index) => {
          console.log(`  ${index + 1}. ${ip.ip_address}`)
        })
      }
    }
    
    // 7. 提供解决方案建议
    console.log('\n💡 问题分析和解决方案:')
    if (!ipRecords || ipRecords.length === 0) {
      console.log('  🎯 问题发现: 数据库中没有IP记录！')
      console.log('  💡 解决方案:')
      console.log('     1. 确保用户访问时记录IP地址')
      console.log('     2. 检查IP记录逻辑是否正常工作') 
      console.log('     3. 考虑手动添加一些测试IP数据')
      console.log('     4. 检查用户行为记录功能是否启用')
    } else if (emptyGeoIPs && emptyGeoIPs.length > 0) {
      console.log('  🎯 问题发现: 有IP记录但无地理位置信息')
      console.log('  💡 解决方案:')
      console.log('     1. 集成IP地理位置API服务（如ipapi.co）')
      console.log('     2. 检查地理位置查询逻辑')
      console.log('     3. 考虑使用第三方IP地理位置服务')
      console.log('     4. 为现有IP记录补充地理位置信息')
    } else {
      console.log('  ✅ IP数据正常，检查前端显示逻辑')
    }
    
    console.log('\n✅ IP数据检查完成')
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message)
    console.error('错误堆栈:', error.stack)
  }
}

checkIPDataFinal()