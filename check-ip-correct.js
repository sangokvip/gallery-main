// 使用正确的API密钥检查IP数据
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnknzqyhdvthchbmbqop.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua256cXloZHZ0aGNoYm1icW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NTUwODEsImV4cCI6MjA2MDQzMTA4MX0.5xAG3BEZcWP71lNB6Gh1HgIiLDR6oaAJ2NNnQ50s0i4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIPCorrect() {
  console.log('🔍 使用正确的API密钥检查IP数据...')
  
  try {
    // 1. 查询user_ips表数据
    console.log('\n1️⃣ 查询user_ips表数据:')
    const { data: ipRecords, error: ipError } = await supabase
      .from('user_ips')
      .select('*')
      .limit(10)
    
    if (ipError) {
      console.log('❌ IP记录查询错误:', ipError.message)
    } else {
      console.log('📊 找到的IP记录数:', ipRecords?.length || 0)
      if (ipRecords && ipRecords.length > 0) {
        console.log('🌐 IP数据示例:')
        ipRecords.forEach((ip, index) => {
          console.log(`  ${index + 1}. 用户:${ip.user_id} IP:${ip.ip_address} 国家:${ip.country || '未知'} 城市:${ip.city || '未知'} 设备:${ip.device_type || '未知'}`)
        })
      } else {
        console.log('⚠️ 数据库中没有IP记录！')
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
          console.log(`  ${index + 1}. ID:${record.id} 用户:${record.user_id_text} 类型:${record.test_type}`)
        })
      }
    }
    
    // 3. 检查地理位置分布
    if (ipRecords && ipRecords.length > 0) {
      console.log('\n3️⃣ 检查地理位置分布:')
      const { data: geoStats, error: geoError } = await supabase
        .from('user_ips')
        .select('country, city')
        .not('country', 'is', null)
        .not('country', 'eq', '未知')
        .not('country', 'eq', '')
        .limit(20)
      
      if (geoError) {
        console.log('❌ 地理位置统计错误:', geoError.message)
      } else {
        console.log('🌍 有地理位置的IP记录数:', geoStats?.length || 0)
        if (geoStats && geoStats.length > 0) {
          console.log('📍 地理位置示例:')
          geoStats.slice(0, 5).forEach((ip, index) => {
            console.log(`  ${index + 1}. ${ip.country}${ip.city ? ' - ' + ip.city : ''}`)
          })
        }
      }
    }
    
    // 4. 检查IP地址格式有效性
    if (ipRecords && ipRecords.length > 0) {
      console.log('\n4️⃣ 检查IP地址格式:')
      const validIPs = ipRecords.filter(ip => {
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
        return ipPattern.test(ip.ip_address)
      })
      console.log('✅ 有效IP地址数量:', validIPs.length, '/', ipRecords.length)
      
      if (validIPs.length > 0) {
        console.log('🌐 有效IP示例:')
        validIPs.slice(0, 3).forEach((ip, index) => {
          console.log(`  ${index + 1}. ${ip.ip_address} -> ${ip.country || '未知'} - ${ip.city || '未知'}`)
        })
      }
    }
    
    // 5. 检查是否有地理位置信息
    if (ipRecords && ipRecords.length > 0) {
      const withGeo = ipRecords.filter(ip => ip.country && ip.country !== '未知' && ip.country !== '').length
      const withoutGeo = ipRecords.length - withGeo
      
      console.log('\n📊 地理位置信息统计:')
      console.log(`  ✅ 有地理位置信息: ${withGeo} 条`)
      console.log(`  ❌ 无地理位置信息: ${withoutGeo} 条`)
      console.log(`  📈 地理位置覆盖率: ${((withGeo / ipRecords.length) * 100).toFixed(1)}%`)
      
      if (withoutGeo > 0) {
        console.log('\n💡 建议:')
        console.log('  1. 集成IP地理位置API服务（如ipapi.co）')
        console.log('  2. 为现有IP记录补充地理位置信息')
        console.log('  3. 检查IP地理位置查询逻辑')
      }
    }
    
    console.log('\n✅ IP数据检查完成')
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message)
  }
}

checkIPCorrect()