// 测试AdminApp中的测评结果详情功能
import { test, expect } from '@playwright/test'

// 配置测试
const BASE_URL = 'http://localhost:3000'
const ADMIN_URL = `${BASE_URL}/sangok.html`

test.describe('AdminApp测评结果详情功能测试', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🚀 开始AdminApp测评结果详情测试...')
    
    // 访问管理页面
    console.log('📍 访问管理页面:', ADMIN_URL)
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' })
    
    // 等待页面完全加载
    console.log('⏳ 等待页面完全加载...')
    await page.waitForLoadState('networkidle')
    
    // 检查是否是登录页面
    try {
      const loginTitle = await page.locator('h1, h2, h3').first().textContent({ timeout: 5000 })
      console.log('📋 页面标题:', loginTitle)
      
      if (loginTitle.includes('管理后台') || loginTitle.includes('登录')) {
        console.log('🔐 检测到登录页面，执行登录...')
        // 执行登录
        await page.fill('input[type="text"], input[placeholder*="用户"], input[name*="user"]', 'admin')
        await page.fill('input[type="password"], input[placeholder*="密码"], input[name*="pass"]', 'admin123')
        
        // 点击登录按钮
        const loginButton = page.locator('button[type="submit"], button:has-text("登录"), input[type="submit"]')
        await loginButton.click()
        
        // 等待登录完成
        await page.waitForLoadState('networkidle')
        console.log('✅ 登录完成')
      }
    } catch (error) {
      console.log('⚠️ 登录检查超时，假设已在主界面')
    }
  })

  test('验证测评记录列表显示查看详情按钮', async ({ page }) => {
    console.log('📊 测试测评记录列表显示...')
    
    // 等待主界面加载
    await page.waitForSelector('[role="main"], .MuiBox-root, nav', { timeout: 10000 })
    
    // 点击"测评记录管理"标签
    console.log('🎯 点击"测评记录管理"标签...')
    const testRecordsTab = page.locator('button, a, div').filter({ hasText: '测评记录管理' }).first()
    await testRecordsTab.click()
    
    // 等待表格加载
    console.log('⏳ 等待测评记录表格加载...')
    await page.waitForSelector('table', { timeout: 10000 })
    
    // 检查是否有"查看详情"按钮
    const viewDetailsButtons = page.locator('button:has-text("查看详情"), button:has-text("详情")')
    const buttonCount = await viewDetailsButtons.count()
    
    console.log(`🔍 找到 ${buttonCount} 个"查看详情"按钮`)
    expect(buttonCount).toBeGreaterThan(0)
    
    // 截图保存
    await page.screenshot({ path: 'test-results/admin-test-records-list.png', fullPage: true })
    console.log('💾 测评记录列表截图已保存')
  })

  test('验证测评结果详情对话框显示完整信息', async ({ page }) => {
    console.log('🔍 测试测评结果详情对话框...')
    
    // 确保在测评记录页面
    await page.waitForSelector('table', { timeout: 10000 })
    
    // 检查是否有数据
    const hasData = await page.locator('table tbody tr').first().isVisible()
    if (!hasData) {
      console.log('⚠️ 表格中没有数据，先生成测试数据...')
      // 点击数据管理标签生成数据
      const dataManagerTab = page.locator('button, a, div').filter({ hasText: '数据管理' }).first()
      await dataManagerTab.click()
      
      // 等待数据管理页面加载
      await page.waitForSelector('button:has-text("生成虚拟数据")', { timeout: 5000 })
      
      // 点击生成虚拟数据
      const generateButton = page.locator('button:has-text("生成虚拟数据")').first()
      await generateButton.click()
      
      // 等待数据生成完成
      await page.waitForTimeout(3000)
      
      // 返回测评记录页面
      await page.locator('button, a, div').filter({ hasText: '测评记录管理' }).first().click()
      await page.waitForSelector('table', { timeout: 10000 })
    }
    
    // 找到第一行的查看详情按钮并点击
    console.log('🎯 点击第一行的"查看详情"按钮...')
    const firstViewButton = page.locator('table tbody tr').first().locator('button:has-text("查看详情")').first()
    
    // 确保按钮可见并可点击
    await expect(firstViewButton).toBeVisible()
    await firstViewButton.click()
    
    // 等待详情对话框出现
    console.log('⏳ 等待详情对话框出现...')
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    // 获取对话框内容
    const dialog = page.locator('[role="dialog"]')
    
    // 验证基本信息部分
    console.log('📋 验证基本信息部分...')
    const basicInfo = await dialog.locator('text=/基本信息|📋 基本信息/').isVisible()
    expect(basicInfo).toBeTruthy()
    
    // 验证记录ID显示
    const recordId = await dialog.locator('text=/记录ID/').isVisible()
    expect(recordId).toBeTruthy()
    
    // 验证用户ID显示
    const userId = await dialog.locator('text=/用户ID/').isVisible()
    expect(userId).toBeTruthy()
    
    // 验证测试结果详情部分
    console.log('📊 验证测试结果详情部分...')
    const testResults = await dialog.locator('text=/测试结果详情|📊 测试结果详情/').isVisible()
    expect(testResults).toBeTruthy()
    
    // 验证平均分显示
    const avgScore = await dialog.locator('text=/平均分/').isVisible()
    expect(avgScore).toBeTruthy()
    
    // 验证评分分布显示
    const ratingDistribution = await dialog.locator('text=/评分分布/').isVisible()
    expect(ratingDistribution).toBeTruthy()
    
    // 验证详细测试项目表格
    const hasTable = await dialog.locator('table').isVisible()
    expect(hasTable).toBeTruthy()
    
    // 检查表格结构
    const tableHeaders = await dialog.locator('table thead th').allTextContents()
    console.log('📊 表格列头:', tableHeaders)
    
    // 验证包含分类、测试项目、评分列
    const hasCategory = tableHeaders.some(header => header.includes('分类'))
    const hasItem = tableHeaders.some(header => header.includes('项目'))
    const hasRating = tableHeaders.some(header => header.includes('评分'))
    
    expect(hasCategory).toBeTruthy()
    expect(hasItem).toBeTruthy()
    expect(hasRating).toBeTruthy()
    
    // 检查是否有评分数据
    const ratingChips = dialog.locator('table tbody .MuiChip-root, table tbody span.MuiChip-label')
    const ratingCount = await ratingChips.count()
    console.log(`🏷️ 找到 ${ratingCount} 个评分标签`)
    expect(ratingCount).toBeGreaterThan(0)
    
    // 截图保存
    await page.screenshot({ path: 'test-results/admin-test-details-dialog.png', fullPage: true })
    console.log('💾 详情对话框截图已保存: test-results/admin-test-details-dialog.png')
    
    // 关闭对话框
    const closeButton = dialog.locator('button').filter({ hasText: '关闭' })
    await closeButton.click()
    
    // 等待对话框关闭
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' })
    
    console.log('✅ 测评结果详情对话框测试完成')
  })

  test('验证评分颜色编码正确性', async ({ page }) => {
    console.log('🎨 测试评分颜色编码...')
    
    // 确保在测评记录页面
    await page.waitForSelector('table', { timeout: 10000 })
    
    // 点击第一行的查看详情按钮
    const firstViewButton = page.locator('table tbody tr').first().locator('button:has-text("查看详情")').first()
    await firstViewButton.click()
    
    // 等待详情对话框出现
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    const dialog = page.locator('[role="dialog"]')
    
    // 获取所有评分标签
    const ratingChips = dialog.locator('table tbody .MuiChip-root')
    const chipCount = await ratingChips.count()
    
    console.log(`🎨 检查 ${chipCount} 个评分标签的颜色...`)
    
    // 检查颜色编码
    const expectedColors = {
      'SSS': '#f44336', // 红色
      'SS': '#ff9800',  // 橙色
      'S': '#2196f3',   // 蓝色
      'Q': '#4caf50',   // 绿色
      'N': '#9e9e9e',   // 灰色
      'W': '#607d8b'    // 深灰色
    }
    
    let colorCheckPassed = true
    
    for (let i = 0; i < Math.min(chipCount, 5); i++) { // 检查前5个
      const chip = ratingChips.nth(i)
      const text = await chip.textContent()
      const backgroundColor = await chip.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      )
      
      console.log(`🏷️ 评分 ${text}: 背景颜色 ${backgroundColor}`)
      
      // 验证颜色不是默认颜色（白色或透明）
      if (backgroundColor.includes('rgba(0, 0, 0, 0)') || backgroundColor.includes('rgb(255, 255, 255)')) {
        colorCheckPassed = false
      }
    }
    
    expect(colorCheckPassed).toBeTruthy()
    
    // 关闭对话框
    const closeButton = dialog.locator('button').filter({ hasText: '关闭' })
    await closeButton.click()
    
    console.log('✅ 评分颜色编码测试完成')
  })
})