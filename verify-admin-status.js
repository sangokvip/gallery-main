// 简单验证admin页面状态
import { chromium } from '@playwright/test'

async function verifyAdminStatus() {
  console.log('🔍 验证admin页面状态...')
  
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  try {
    // 访问admin页面
    const response = await page.goto('http://localhost:3000/sangok.html', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    })
    
    console.log('📡 页面响应状态:', response.status())
    console.log('📄 页面标题:', await page.title())
    
    // 等待基本内容加载
    await page.waitForTimeout(3000)
    
    // 检查是否有错误信息
    const errorElements = await page.locator('text=/错误|Error|失败|Failed/').count()
    console.log('❌ 错误元素数量:', errorElements)
    
    // 检查是否显示加载状态
    const loadingElements = await page.locator('text=/加载|Loading|正在/').count()
    console.log('⏳ 加载元素数量:', loadingElements)
    
    // 检查主要内容区域
    const mainContent = await page.locator('#root').isVisible().catch(() => false)
    console.log('🎯 主内容区域显示:', mainContent)
    
    // 获取页面文本内容
    const pageText = await page.textContent('body')
    const hasAdminTitle = pageText.includes('管理后台') || pageText.includes('Admin')
    const hasMergedTitle = pageText.includes('测试记录与IP地址管理')
    const hasDataLoading = pageText.includes('正在加载') || pageText.includes('Loading')
    
    console.log('📋 页面内容检查:')
    console.log('  - 包含管理后台标题:', hasAdminTitle)
    console.log('  - 包含合并功能标题:', hasMergedTitle)
    console.log('  - 包含加载状态:', hasDataLoading)
    
    // 截图保存当前状态
    await page.screenshot({ path: 'admin-current-status.png', fullPage: true })
    console.log('💾 当前状态截图已保存: admin-current-status.png')
    
    // 简单判断
    if (response.status() === 200 && hasAdminTitle) {
      console.log('✅ admin页面基本功能正常')
      if (hasMergedTitle && !hasDataLoading) {
        console.log('🎉 合并功能已加载完成')
      } else if (hasDataLoading) {
        console.log('⏳ 页面正在加载中')
      } else {
        console.log('⚠️ 合并功能可能有问题')
      }
    } else {
      console.log('❌ admin页面存在严重问题')
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
    console.log('🔍 可能的原因:')
    console.log('  - 服务器未运行')
    console.log('  - admin.html文件不存在')
    console.log('  - 网络连接问题')
    console.log('  - React组件加载失败')
  } finally {
    await browser.close()
    console.log('🚪 浏览器已关闭')
  }
}

// 运行验证
verifyAdminStatus().then(() => {
  console.log('✅ 验证完成')
}).catch(error => {
  console.error('❌ 验证过程出错:', error)
})