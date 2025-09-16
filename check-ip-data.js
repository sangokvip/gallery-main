// 检查IP地址和地理位置数据情况
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnknzqyhdvthchbmbqop.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua256cXloZHZ0aGNoYm1icW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3NzQ1NzMsImV4cCI6MjA0MTM1MDU3M30.kpMwJcT7iTcheAyfGCcKqfgn0dGdmUp3lX7WFH3dVZk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIPData() {
  console.log('🔍 检查IP地址数据情况...')
  
  try {
    // 1. 检查user_ips表中的数据
    console.log('1️⃣ 检查user_ips表总数据量:')
    const { count: totalIPs, error: countError } = await supabase
      .from('user_ips')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('❌ 统计错误:', countError.message)
    } else {
      console.log('📊 总IP记录数:', totalIPs)
    }
    
    // 2. 检查有地理位置信息的记录
    console.log('2️⃣ 检查有地理位置信息的记录:')
    const { data: geoIPs, error: geoError } = await supabase
      .from('user_ips')
      .select('*')
      .not('country', 'is', null)
      .limit(10)
    
    if (geoError) {
      console.log('❌ 查询错误:', geoError.message)
    } else {
      console.log('🌍 有地理位置的IP记录数:', geoIPs?.length || 0)
      if (geoIPs && geoIPs.length > 0) {
        console.log('📍 示例数据:')
        geoIPs.slice(0, 3).forEach((ip, index) => {
          console.log(`  ${index + 1}. ${ip.ip_address} -> ${ip.country || '未知'} - ${ip.city || '未知'}`)
        })
      }
    }
    
    // 3. 检查测试记录关联的用户
    console.log('3️⃣ 检查测试记录关联的用户:')
    const { data: testRecords, error: testError } = await supabase
      .from('test_records')
      .select('user_id_text')
      .limit(10)
    
    if (testError) {
      console.log('❌ 测试记录查询错误:', testError.message)
    } else {
      const userIds = [...new Set(testRecords?.map(r => r.user_id_text) || [])]
      console.log('👥 测试记录中的用户ID数量:', userIds.length)
      console.log('📝 前几个用户ID:', userIds.slice(0, 5))
      
      // 4. 检查这些用户是否有IP记录
      if (userIds.length > 0) {
        console.log('4️⃣ 检查这些用户是否有IP记录:')
        const { data: userIPs, error: userIPError } = await supabase
          .from('user_ips')
          .select('*')
          .in('user_id', userIds.slice(0, 10))
          .limit(10)
        
        if (userIPError) {
          console.log('❌ IP记录查询错误:', userIPError.message)
        } else {
          console.log('🔗 找到的用户IP记录数:', userIPs?.length || 0)
          if (userIPs && userIPs.length > 0) {
            console.log('🌐 示例IP数据:')
            userIPs.slice(0, 3).forEach((ip, index) => {
              console.log(`  ${index + 1}. 用户:${ip.user_id} IP:${ip.ip_address} 国家:${ip.country || '未知'} 城市:${ip.city || '未知'}`)
            })
          }
        }
      }
    }
    
    // 5. 检查IP地理位置API调用情况
    console.log('5️⃣ 检查IP地理位置服务状态:')
    const { data: sampleIPs, error: sampleError } = await supabase
      .from('user_ips')
      .select('ip_address, country, city')
      .limit(5)
    
    if (sampleError) {
      console.log('❌ 示例查询错误:', sampleError.message)
    } else if (sampleIPs && sampleIPs.length > 0) {
      console.log('📍 IP地理位置分析:')
      sampleIPs.forEach((ip, index) => {
        const hasGeo = ip.country && ip.country !== '未知'
        console.log(`  ${index + 1}. ${ip.ip_address}: ${hasGeo ? '🌍 ' + ip.country + (ip.city ? ' - ' + ip.city : '') : '❌ 无地理位置信息'}`)
      })
    }
    
    console.log('✅ IP数据检查完成')
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message)
  }
}

checkIPData()