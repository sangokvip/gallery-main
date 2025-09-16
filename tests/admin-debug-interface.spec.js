// 调试脚本 - 检查AdminApp实际界面结构
import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const ADMIN_URL = `${BASE_URL}/sangok.html`

test.describe('AdminApp界面结构调试', () => {
  test('检查实际界面元素和文本', async ({ page }) => {
    console.log('🔍 开始AdminApp界面结构调试...')
    
    // 访问管理页面
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' })
    
    // 等待页面加载
    await page.waitForLoadState('networkidle')
    
    // 检查页面标题
    const title = await page.title()
    console.log('📋 页面标题:', title)
    
    // 检查所有文本内容
    const allText = await page.locator('body').textContent()
    console.log('📄 页面文本内容前500字符:', allText.substring(0, 500))
    
    // 查找所有按钮文本
    const buttons = await page.locator('button, a, [role="button"]').allTextContents()
    console.log('🔘 找到的所有按钮文本:')
    buttons.forEach((text, index) => {
      console.log(`  ${index + 1}. "${text.trim()}"`)
    })
    
    // 查找所有导航元素
    const navElements = await page.locator('nav, [role="navigation"], .MuiDrawer-root, .MuiList-root').allTextContents()
    console.log('🧭 导航元素文本:')
    navElements.forEach((text, index) => {
      console.log(`  ${index + 1}. "${text.trim().substring(0, 100)}..."`)
    })
    
    // 查找表格
    const tables = await page.locator('table').count()
    console.log(`📊 找到的表格数量: ${tables}`)
    
    // 截图保存
    await page.screenshot({ path: 'test-results/admin-debug-interface.png', fullPage: true })
    console.log('💾 界面截图已保存: test-results/admin-debug-interface.png')
    
    // 检查是否有登录表单
    const hasLoginForm = await page.locator('input[type="text"], input[type="password"]').count()
    console.log(`🔐 找到的输入框数量: ${hasLoginForm}`)
    
    if (hasLoginForm > 0) {
      console.log('🔐 检测到登录表单，需要登录')
      // 执行登录
      await page.fill('input[type="text"], input[placeholder*="用户"], input[name*="user"]', 'admin')
      await page.fill('input[type="password"], input[placeholder*="密码"], input[name*="pass"]', 'admin123')
      
      const loginButton = page.locator('button[type="submit"], button:has-text("登录"), input[type="submit"]')
      await loginButton.click()
      
      // 等待登录后的界面
      await page.waitForLoadState('networkidle')
      
      // 重新检查界面
      const loggedInButtons = await page.locator('button, a, [role="button"]').allTextContents()
      console.log('🔘 登录后的按钮文本:')
      loggedInButtons.forEach((text, index) => {
        console.log(`  ${index + 1}. "${text.trim()}"`)
      })
    }
  })

  test('检查测评记录管理标签', async ({ page }) => {
    console.log('🎯 检查测评记录管理相关元素...')
    
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' })
    await page.waitForLoadState('networkidle')
    
    // 尝试登录
    try {
      await page.fill('input[type="text"], input[placeholder*="用户"], input[name*="user"]', 'admin')
      await page.fill('input[type="password"], input[placeholder*="密码"], input[name*="pass"]', 'admin123')
      const loginButton = page.locator('button[type="submit"], button:has-text("登录"), input[type="submit"]')
      await loginButton.click()
      await page.waitForLoadState('networkidle')
    } catch (error) {
      console.log('⚠️ 登录失败或无需登录')
    }
    
    // 查找所有包含"记录"或"测试"的文本
    const recordElements = await page.locator('*').filter({ hasText: /记录|测试|详情/ }).allTextContents()
    console.log('🔍 包含"记录/测试/详情"的元素:')
    recordElements.forEach((text, index) => {
      if (text.trim().length > 0) {
        console.log(`  ${index + 1}. "${text.trim()}"`)
      }
    })
    
    // 尝试点击可能的导航项
    const possibleTabs = [
      '测评记录', '测试记录', '记录管理', '测评管理', '测试管理',
      '记录', '测评', '测试', '管理', '详情'
    ]
    
    for (const tabText of possibleTabs) {
      try {
        const tabElement = page.locator(`button, a, div, span`).filter({ hasText: tabText }).first()
        const isVisible = await tabElement.isVisible({ timeout: 1000 })
        if (isVisible) {
          console.log(`✅ 找到可能的标签: "${tabText}"`)
          
          // 点击并检查结果
          await tabElement.click()
          await page.waitForTimeout(2000)
          
          // 检查是否有表格或内容变化
          const hasTable = await page.locator('table').isVisible({ timeout: 1000 })
          const hasButton = await page.locator('button:has-text("查看"), button:has-text("详情")').isVisible({ timeout: 1000 })
          
          console.log(`📊 点击"${tabText}"后的结果:`)
          console.log(`  表格显示: ${hasTable ? '✅' : '❌'}`)
          console.log(`  查看按钮: ${hasButton ? '✅' : '❌'}`)
          
          if (hasTable && hasButton) {
            console.log(`🎯 找到目标标签: "${tabText}"`)
            break
          }
        }
      } catch (error) {
        // 继续尝试下一个
      }
    }
  })
})