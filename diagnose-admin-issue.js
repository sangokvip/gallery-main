// 诊断admin页面问题
import { chromium } from '@playwright/test'

async function diagnoseAdminIssue() {
  console.log('🔍 开始诊断admin页面问题...')
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 })
  const page = await browser.newPage()
  
  // 收集所有控制台输出
  const allLogs = []
  page.on('console', msg => {
    allLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    })
    console.log(`[${msg.type()}] ${msg.text()}`)
  })
  
  // 收集网络错误
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ 网络错误: ${response.status()} ${response.url()}`)
    }
  })
  
  page.on('requestfailed', request => {
    console.log(`❌ 请求失败: ${request.method()} ${request.url()}`)
  })
  
  try {
    console.log('📍 访问admin页面...')
    await page.goto('http://localhost:3000/sangok.html')
    
    console.log('⏳ 等待页面加载...')
    await page.waitForTimeout(5000)
    
    // 检查页面结构
    console.log('🔍 检查页面结构...')
    
    // 检查是否有React挂载点
    const hasReactRoot = await page.locator('#root').count()
    console.log('🎯 React根元素数量:', hasReactRoot)
    
    // 检查错误边界是否触发
    const hasErrorBoundary = await page.locator('text=/管理后台加载失败|系统错误|Error/i').count()
    console.log('⚠️ 错误边界触发:', hasErrorBoundary > 0)
    
    // 检查加载状态
    const loadingElements = await page.locator('text=/正在加载|加载中|Loading/i').count()
    console.log('⏳ 加载状态元素:', loadingElements)
    
    // 检查是否有JavaScript错误提示
    const jsErrors = await page.locator('text=/is not defined|ReferenceError|TypeError/i').count()
    console.log('❌ JavaScript错误提示:', jsErrors)
    
    // 获取页面HTML结构
    const htmlContent = await page.content()
    const hasMergedComponent = htmlContent.includes('测试记录与IP地址管理')
    const hasLoadingSpinner = htmlContent.includes('CircularProgress') || htmlContent.includes('加载')
    
    console.log('📄 HTML内容检查:')
    console.log('  - 包含合并组件:', hasMergedComponent)
    console.log('  - 包含加载指示器:', hasLoadingSpinner)
    
    // 检查特定的错误信息
    const specificErrors = [
      'Tooltip is not defined',
      'Button is not defined',
      'supabase.from(...).select(...).not(...).group',
      'MergedRecordsIP'
    ]
    
    console.log('🔍 特定错误检查:')
    specificErrors.forEach(error => {
      const found = htmlContent.includes(error) || allLogs.some(log => log.text.includes(error))
      console.log(`  - ${error}: ${found ? '❌ 发现' : '✅ 未发现'}`)
    })
    
    // 检查网络请求
    const failedRequests = allLogs.filter(log => 
      log.text.includes('Failed to load resource') || 
      log.text.includes('NetworkError') ||
      log.text.includes('500') ||
      log.text.includes('404')
    )
    
    console.log('🌐 网络请求问题:', failedRequests.length)
    if (failedRequests.length > 0) {
      failedRequests.slice(-3).forEach(log => console.log(`  - ${log.text}`))
    }
    
    // 分析控制台日志
    const errors = allLogs.filter(log => log.type === 'error')
    const warnings = allLogs.filter(log => log.type === 'warn')
    
    console.log('📊 日志分析:')
    console.log('  - 错误数量:', errors.length)
    console.log('  - 警告数量:', warnings.length)
    
    if (errors.length > 0) {
      console.log('📝 最近的错误:')
      errors.slice(-5).forEach(log => console.log(`    ${log.text}`))
    }
    
    // 检查React DevTools提示
    const hasReactDevTools = allLogs.some(log => log.text.includes('React DevTools'))
    console.log('🔧 React DevTools:', hasReactDevTools ? '已连接' : '未连接')
    
    // 最终诊断
    console.log('\n🔬 诊断结果:')
    
    if (hasErrorBoundary > 0) {
      console.log('❌ 错误边界已触发，组件渲染失败')
    } else if (jsErrors > 0) {
      console.log('❌ JavaScript运行时错误')
    } else if (failedRequests.length > 0) {
      console.log('❌ 网络请求失败')
    } else if (errors.length > 5) {
      console.log('❌ 多个控制台错误')
    } else if (loadingElements > 0 && !hasMergedComponent) {
      console.log('⏳ 组件正在加载但未完成')
    } else if (hasMergedComponent) {
      console.log('✅ 组件已成功加载')
    } else {
      console.log('❓ 未知状态，需要进一步检查')
    }
    
    // 截图保存
    await page.screenshot({ path: 'admin-diagnostic-result.png', fullPage: true })
    console.log('💾 诊断截图已保存: admin-diagnostic-result.png')
    
    // 输出所有日志供分析
    if (allLogs.length > 0) {
      console.log('\n📋 完整控制台日志:')
      allLogs.slice(-10).forEach(log => {
        console.log(`[${log.type}] ${log.text}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 诊断过程出错:', error.message)
  } finally {
    await browser.close()
    console.log('🚪 浏览器已关闭')
  }
}

// 运行诊断
console.log('🔍 开始admin页面问题诊断...')
diagnoseAdminIssue().then(() => {
  console.log('✅ 诊断完成')
}).catch(error => {
  console.error('❌ 诊断失败:', error)
})