// 简单的页面检查测试
import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const ADMIN_URL = `${BASE_URL}/sangok.html`

test.describe('Admin页面简单检查', () => {
  test('检查页面是否可访问', async ({ page }) => {
    console.log('🔍 访问管理页面:', ADMIN_URL)
    
    try {
      await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 15000 })
      
      // 等待页面基本加载
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      // 检查页面标题
      const title = await page.title()
      console.log('📋 页面标题:', title)
      
      // 检查页面内容
      const bodyText = await page.locator('body').textContent()
      console.log('📄 页面内容前200字符:', bodyText.substring(0, 200))
      
      // 检查是否有登录表单
      const hasLoginInputs = await page.locator('input[type="text"], input[type="password"]').count()
      console.log('🔐 登录输入框数量:', hasLoginInputs)
      
      if (hasLoginInputs > 0) {
        console.log('✅ 检测到登录页面')
        
        // 尝试登录
        await page.fill('input[type="text"], input[placeholder*="用户"], input[name*="user"]', 'admin')
        await page.fill('input[type="password"], input[placeholder*="密码"], input[name*="pass"]', 'admin123')
        
        const loginButton = page.locator('button[type="submit"], button:has-text("登录"), input[type="submit"]')
        await loginButton.click()
        
        // 等待登录后的页面
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        
        const loggedInBodyText = await page.locator('body').textContent()
        console.log('✅ 登录后的页面内容前200字符:', loggedInBodyText.substring(0, 200))
      } else {
        console.log('✅ 已登录，检查主界面')
      }
      
      // 检查是否有测评记录相关元素
      const hasTestRecords = await page.locator('*:has-text("测评")').count()
      console.log('🎯 找到测评相关元素数量:', hasTestRecords)
      
      // 截图保存
      await page.screenshot({ path: 'test-results/admin-page-current-state.png', fullPage: true })
      console.log('💾 页面截图已保存')
      
      console.log('✅ 页面检查完成')
      
    } catch (error) {
      console.error('页面检查失败:', error.message)
      
      // 截图保存失败状态
      await page.screenshot({ path: 'test-results/admin-page-error-state.png', fullPage: true })
      console.log('💾 错误状态截图已保存')
      
      throw error
    }
  })

  test('检查测评结果详情功能', async ({ page }) => {
    console.log('🎯 检查测评结果详情功能...')
    
    try {
      await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 15000 })
      
      // 尝试登录
      const hasLoginInputs = await page.locator('input[type="text"], input[type="password"]').count()
      if (hasLoginInputs > 0) {
        await page.fill('input[type="text"], input[placeholder*="用户"], input[name*="user"]', 'admin')
        await page.fill('input[type="password"], input[placeholder*="密码"], input[name*="pass"]', 'admin123')
        const loginButton = page.locator('button[type="submit"], button:has-text("登录"), input[type="submit"]')
        await loginButton.click()
        await page.waitForLoadState('networkidle', { timeout: 10000 })
      }
      
      // 查找测评记录相关按钮或链接
      const testRecordsButton = page.locator('button, a, div').filter({ hasText: /测评|测试|记录/ }).first()
      const isVisible = await testRecordsButton.isVisible({ timeout: 5000 })
      
      if (isVisible) {
        console.log('✅ 找到测评记录按钮:', await testRecordsButton.textContent())
        
        // 点击测评记录
        await testRecordsButton.click()
        await page.waitForTimeout(2000)
        
        // 检查是否有表格
        const hasTable = await page.locator('table').isVisible({ timeout: 5000 })
        console.log('📊 表格显示:', hasTable)
        
        if (hasTable) {
          // 检查是否有查看详情按钮
          const hasViewDetailsButton = await page.locator('button:has-text("查看"), button:has-text("详情")').isVisible({ timeout: 3000 })
          console.log('🔍 查看详情按钮显示:', hasViewDetailsButton)
          
          if (hasViewDetailsButton) {
            console.log('🎉 测评结果详情功能可用！')
          } else {
            console.log('⚠️ 未找到查看详情按钮')
          }
        } else {
          console.log('⚠️ 未找到表格')
        }
      } else {
        console.log('⚠️ 未找到测评记录相关按钮')
      }
      
    } catch (error) {
      console.error('测评结果详情功能检查失败:', error.message)
      throw error
    }
  })
})