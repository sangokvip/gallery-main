// 虚拟数据生成器 - 用于演示和测试
export const mockDataGenerator = {
  // 生成虚拟用户数据
  generateMockUsers(count = 50) {
    const users = []
    const nicknames = [
      '小明', '小红', '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
      'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack',
      '夜影', '星辰', '月光', '阳光', '彩虹', '雪花', '微风', '细雨', '雷电', '火焰',
      '学霸', '学神', '学渣', '学弱', '学酥', '学糕', '学饼', '学馍', '学团', '学球'
    ]
    
    for (let i = 0; i < count; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      users.push({
        id: `user_${i + 1}`,
        nickname: nicknames[Math.floor(Math.random() * nicknames.length)] + (i + 1),
        created_at: createdAt.toISOString(),
        last_active: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    return users
  },

  // 生成虚拟IP数据
  generateMockIPData(userId) {
    const countries = [
      { country: '中国', city: '北京', region: '北京' },
      { country: '中国', city: '上海', region: '上海' },
      { country: '中国', city: '广州', region: '广东' },
      { country: '中国', city: '深圳', region: '广东' },
      { country: '中国', city: '杭州', region: '浙江' },
      { country: '中国', city: '成都', region: '四川' },
      { country: '中国', city: '武汉', region: '湖北' },
      { country: '中国', city: '西安', region: '陕西' },
      { country: '美国', city: '纽约', region: '纽约州' },
      { country: '美国', city: '洛杉矶', region: '加利福尼亚' },
      { country: '日本', city: '东京', region: '东京都' },
      { country: '韩国', city: '首尔', region: '首尔特别市' },
      { country: '英国', city: '伦敦', region: '大伦敦' },
      { country: '法国', city: '巴黎', region: '法兰西岛' },
      { country: '德国', city: '柏林', region: '柏林' }
    ]
    
    const deviceTypes = ['desktop', 'mobile', 'tablet']
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']
    const osList = ['Windows', 'macOS', 'Linux', 'Android', 'iOS']
    
    const location = countries[Math.floor(Math.random() * countries.length)]
    const ipParts = [
      Math.floor(Math.random() * 223) + 1,
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255)
    ]
    
    return {
      user_id: userId,
      ip_address: ipParts.join('.'),
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      country: location.country,
      city: location.city,
      region: location.region,
      timezone: location.country === '中国' ? 'Asia/Shanghai' : 'UTC',
      latitude: (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6),
      isp: 'Mock ISP',
      device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: osList[Math.floor(Math.random() * osList.length)],
      first_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_seen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  },

  // 生成虚拟测试记录
  generateMockTestRecords(userId, count = 3) {
    const testTypes = ['female', 'male', 's', 'lgbt']
    const records = []
    
    for (let i = 0; i < count; i++) {
      const testType = testTypes[Math.floor(Math.random() * testTypes.length)]
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      
      records.push({
        id: `record_${userId}_${i + 1}`,
        user_id_text: userId,
        test_type: testType,
        created_at: createdAt.toISOString(),
        test_results: this.generateMockTestResults(testType)
      })
    }
    
    return records
  },

  // 生成虚拟测试结果详情
  generateMockTestResults(testType) {
    const categories = {
      female: ['情感表达', '社交倾向', '独立性', '适应性', '创造力', '责任感', '自信心', '同理心'],
      male: ['领导力', '决策能力', '冒险精神', '稳定性', '逻辑思维', '竞争意识', '责任感', '独立性'],
      s: ['支配倾向', '控制欲', '责任感', '保护欲', '决策风格', '情绪管理', '人际关系', '自我认知'],
      lgbt: ['身份认同', '社交适应', '情感表达', '自我接纳', '人际关系', '社会支持', '心理健康', '生活满意度']
    }
    
    const ratings = ['SSS', 'SS', 'S', 'Q', 'N', 'W']
    const results = []
    
    const categoryList = categories[testType] || categories.female
    
    categoryList.forEach((category, index) => {
      // 每个分类生成3-5个测试项目
      const itemCount = Math.floor(Math.random() * 3) + 3
      for (let i = 0; i < itemCount; i++) {
        results.push({
          category: category,
          item: `${category} - 项目${i + 1}`,
          rating: ratings[Math.floor(Math.random() * ratings.length)],
          score: Math.floor(Math.random() * 100) + 1
        })
      }
    })
    
    return results
  },

  // 生成完整的虚拟数据集
  generateCompleteMockData(userCount = 30, recordsPerUser = 2) {
    console.log(`🔄 生成虚拟数据: ${userCount}个用户，每个用户${recordsPerUser}条测试记录`)
    
    const users = this.generateMockUsers(userCount)
    const allRecords = []
    const allIPData = []
    const allTestDetails = []
    
    users.forEach(user => {
      // 为每个用户生成IP数据
      const ipData = this.generateMockIPData(user.id)
      allIPData.push(ipData)
      
      // 为每个用户生成测试记录
      const records = this.generateMockTestRecords(user.id, recordsPerUser)
      records.forEach(record => {
        allRecords.push(record)
        
        // 为每条测试记录生成详细的测试结果
        if (record.test_results && record.test_results.length > 0) {
          record.test_results.forEach((result, index) => {
            allTestDetails.push({
              id: `detail_${record.id}_${index}`,
              record_id: record.id,
              category: result.category,
              item: result.item,
              rating: result.rating,
              score: result.score,
              created_at: record.created_at
            })
          })
        }
      })
    })
    
    console.log(`✅ 虚拟数据生成完成:`)
    console.log(`   - 用户: ${users.length}个`)
    console.log(`   - 测试记录: ${allRecords.length}条`)
    console.log(`   - IP数据: ${allIPData.length}条`)
    console.log(`   - 测试详情: ${allTestDetails.length}条`)
    
    return {
      users,
      testRecords: allRecords,
      userIPs: allIPData,
      testResults: allTestDetails
    }
  },

  // 将虚拟数据保存到Supabase（用于演示）
  async saveMockDataToSupabase() {
    try {
      const mockData = this.generateCompleteMockData()
      
      console.log('💾 开始保存虚拟数据到Supabase...')
      
      // 保存用户数据
      const { data: users, error: userError } = await supabase
        .from('users')
        .insert(mockData.users)
      
      if (userError) {
        console.warn('用户数据保存失败（可能已存在）:', userError.message)
      } else {
        console.log(`✅ 用户数据保存成功: ${users?.length || 0}条`)
      }
      
      // 保存IP数据
      const { data: ips, error: ipError } = await supabase
        .from('user_ips')
        .insert(mockData.userIPs)
      
      if (ipError) {
        console.warn('IP数据保存失败（可能已存在）:', ipError.message)
      } else {
        console.log(`✅ IP数据保存成功: ${ips?.length || 0}条`)
      }
      
      // 保存测试记录
      const { data: records, error: recordError } = await supabase
        .from('test_records')
        .insert(mockData.testRecords.map(r => ({
          id: r.id,
          user_id_text: r.user_id_text,
          test_type: r.test_type,
          created_at: r.created_at
        })))
      
      if (recordError) {
        console.warn('测试记录保存失败（可能已存在）:', recordError.message)
      } else {
        console.log(`✅ 测试记录保存成功: ${records?.length || 0}条`)
      }
      
      // 保存测试详情
      const { data: details, error: detailError } = await supabase
        .from('test_results')
        .insert(mockData.testResults)
      
      if (detailError) {
        console.warn('测试详情保存失败（可能已存在）:', detailError.message)
      } else {
        console.log(`✅ 测试详情保存成功: ${details?.length || 0}条`)
      }
      
      console.log('🎉 虚拟数据保存完成！')
      return mockData
      
    } catch (error) {
      console.error('❌ 保存虚拟数据失败:', error)
      throw error
    }
  }
}

export default mockDataGenerator