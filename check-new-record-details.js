// 检查新测试记录是否生成测试详情
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xnknzqyhdvthchbmbqop.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhua256cXloZHZ0aGNoYm1icW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NTUwODEsImV4cCI6MjA2MDQzMTA4MX0.5xAG3BEZcWP71lNB6Gh1HgIiLDR6oaAJ2NNnQ50s0i4'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNewRecordDetails() {
  console.log('🔍 检查新测试记录的详情生成情况...')
  
  try {
    // 1. 获取今天创建的所有测试记录
    const today = new Date().toISOString().split('T')[0]
    console.log(`1️⃣ 获取今天 (${today}) 创建的测试记录:`)
    
    const { data: todayRecords, error: todayError } = await supabase
      .from('test_records')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })
    
    if (todayError) {
      console.log('❌ 查询错误:', todayError.message)
      return
    }
    
    console.log(`📊 今天创建的测试记录: ${todayRecords?.length || 0}`)
    
    if (!todayRecords || todayRecords.length === 0) {
      console.log('⚠️ 今天没有测试记录')
      return
    }
    
    // 2. 检查每条记录的详情
    let totalRecords = 0
    let recordsWithDetails = 0
    let recordsWithoutDetails = 0
    
    for (const record of todayRecords) {
      totalRecords++
      
      const { data: details, error: detailsError } = await supabase
        .from('test_results')
        .select('*')
        .eq('record_id', record.id)
      
      if (detailsError) {
        console.log(`❌ 记录 ${record.id} 查询错误: ${detailsError.message}`)
        recordsWithoutDetails++
      } else if (details && details.length > 0) {
        recordsWithDetails++
        console.log(`✅ 记录 ${record.id}: ${details.length} 个详情`)
      } else {
        recordsWithoutDetails++
        console.log(`⚠️ 记录 ${record.id}: 无详情`)
      }
    }
    
    console.log(`
📈 今天测试记录详情统计:`)
    console.log(`   总记录数: ${totalRecords}`)
    console.log(`   有详情记录: ${recordsWithDetails}`)
    console.log(`   无详情记录: ${recordsWithoutDetails}`)
    console.log(`   详情生成率: ${((recordsWithDetails / totalRecords) * 100).toFixed(1)}%`)
    
    // 3. 检查记录创建时间分布
    console.log('\n2️⃣ 检查记录创建时间分布:')
    
    const timeGroups = {
      '最近1小时': new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      '最近6小时': new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      '最近12小时': new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      '今天': `${today}T00:00:00`
    }
    
    for (const [period, startTime] of Object.entries(timeGroups)) {
      const { data: records, error } = await supabase
        .from('test_records')
        .select('id, created_at')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
      
      if (!error && records && records.length > 0) {
        console.log(`\n   ${period} (${records.length} 条记录):`)
        
        // 检查前3条的详情
        for (let i = 0; i < Math.min(3, records.length); i++) {
          const record = records[i]
          const { data: details } = await supabase
            .from('test_results')
            .select('id')
            .eq('record_id', record.id)
          
          const hasDetails = details && details.length > 0
          console.log(`     ${record.created_at}: ${record.id} → ${hasDetails ? details.length + '个详情' : '无详情'}`)
        }
      }
    }
    
    // 4. 检查数据同步问题
    console.log('\n3️⃣ 检查数据同步问题:')
    
    // 找最新的有详情的记录
    const { data: latestRecords } = await supabase
      .from('test_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    let latestWithDetails = null
    let latestWithoutDetails = null
    
    for (const record of latestRecords) {
      const { data: details } = await supabase
        .from('test_results')
        .select('id')
        .eq('record_id', record.id)
      
      if (details && details.length > 0) {
        if (!latestWithDetails) {
          latestWithDetails = record
        }
      } else {
        if (!latestWithoutDetails) {
          latestWithoutDetails = record
        }
      }
      
      if (latestWithDetails && latestWithoutDetails) break
    }
    
    if (latestWithDetails) {
      console.log(`✅ 最新有详情的记录:`)
      console.log(`   时间: ${latestWithDetails.created_at}`)
      console.log(`   ID: ${latestWithDetails.id}`)
      console.log(`   类型: ${latestWithDetails.test_type}`)
    }
    
    if (latestWithoutDetails) {
      console.log(`\n❌ 最新无详情的记录:`)
      console.log(`   时间: ${latestWithoutDetails.created_at}`)
      console.log(`   ID: ${latestWithoutDetails.id}`)
      console.log(`   类型: ${latestWithoutDetails.test_type}`)
    }
    
    console.log('\n✅ 新记录详情生成检查完成')
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message)
  }
}

checkNewRecordDetails()