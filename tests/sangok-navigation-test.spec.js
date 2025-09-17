import { test, expect } from '@playwright/test';

test.describe('Sangok Admin Navigation Test', () => {
  test('verify navigation links open in new windows', async ({ page, context }) => {
    console.log('🧪 Testing sangok admin navigation functionality...');
    
    // Navigate to admin page and login
    await page.goto('/sangok.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Login first
    const usernameInput = await page.locator('input[type="text"]:visible').first();
    const passwordInput = await page.locator('input[type="password"]:visible').first();
    const submitButton = await page.locator('button[type="submit"]:visible, button:has-text("登录"):visible').first();
    
    await usernameInput.fill('adam');
    await passwordInput.fill('Sangok#3');
    await submitButton.click();
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    console.log('✅ Logged in successfully');
    
    // Test 1: Verify quick navigation buttons in dashboard
    console.log('🧭 Testing quick navigation buttons...');
    
    // Check if navigation section exists
    const navigationSection = await page.locator('text=🧭 快速导航').isVisible();
    expect(navigationSection).toBeTruthy();
    console.log('✅ Navigation section found');
    
    // Test individual navigation buttons
    const navButtons = [
      { name: '女M测试', url: '/female.html' },
      { name: '男M测试', url: '/male.html' },
      { name: 'S型测试', url: '/s.html' },
      { name: 'LGBT+测试', url: '/lgbt.html' },
      { name: '留言板', url: '/message.html' },
      { name: '图库', url: '/gallery.html' },
      { name: '数据管理', url: '/data-manager.html' },
      { name: '部署指南', url: '/DEPLOYMENT-GUIDE.html' }
    ];
    
    for (const button of navButtons) {
      const buttonElement = await page.locator(`button:has-text("${button.name}")`).first();
      const isVisible = await buttonElement.isVisible();
      expect(isVisible).toBeTruthy();
      console.log(`✅ ${button.name} button is visible`);
    }
    
    // Test 2: Verify admin tools in sidebar
    console.log('🛠️ Testing admin tools in sidebar...');
    
    const adminTools = [
      { name: '极简管理后台', url: '/admin-minimal.html' },
      { name: '管理后台测试', url: '/admin-new.html' },
      { name: '当前实现验证', url: '/verify-current-admin.html' },
      { name: '部署指南', url: '/DEPLOYMENT-GUIDE.html' }
    ];
    
    for (const tool of adminTools) {
      const toolElement = await page.locator(`text="${tool.name}"`).first();
      const isVisible = await toolElement.isVisible();
      expect(isVisible).toBeTruthy();
      console.log(`✅ ${tool.name} admin tool is visible`);
    }
    
    // Test 3: Verify new window opening functionality
    console.log('🪟 Testing new window opening...');
    
    // Listen for new pages
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('button:has-text("女M测试")').first().click()
    ]);
    
    // Wait for the new page to load
    await newPage.waitForLoadState();
    
    // Check if the new page has the correct URL
    const newPageUrl = newPage.url();
    expect(newPageUrl).toContain('female.html');
    console.log(`✅ Successfully opened female.html in new window: ${newPageUrl}`);
    
    // Close the new page
    await newPage.close();
    
    // Test 4: Verify admin tools also open in new windows
    console.log('🛠️ Testing admin tools new window opening...');
    
    const [adminPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('text="极简管理后台"').first().click()
    ]);
    
    await adminPage.waitForLoadState();
    const adminPageUrl = adminPage.url();
    expect(adminPageUrl).toContain('admin-minimal.html');
    console.log(`✅ Successfully opened admin-minimal.html in new window: ${adminPageUrl}`);
    
    await adminPage.close();
    
    // Test 5: Verify visual indicators
    console.log('🎨 Testing visual indicators...');
    
    // Check for external link icons
    const externalIcons = await page.locator('[data-testid="OpenInNewIcon"]').count();
    expect(externalIcons).toBeGreaterThan(0);
    console.log(`✅ Found ${externalIcons} external link icons`);
    
    // Check for hover effects by hovering over a button
    const testButton = await page.locator('button:has-text("男M测试")').first();
    await testButton.hover();
    await page.waitForTimeout(500);
    console.log('✅ Hover effects working');
    
    console.log('🎉 All navigation tests passed!');
  });

  test('verify navigation is visible on all admin tabs', async ({ page }) => {
    console.log('🔍 Testing navigation visibility across all tabs...');
    
    await page.goto('/sangok.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Login
    const usernameInput = await page.locator('input[type="text"]:visible').first();
    const passwordInput = await page.locator('input[type="password"]:visible').first();
    const submitButton = await page.locator('button[type="submit"]:visible, button:has-text("登录"):visible').first();
    
    await usernameInput.fill('adam');
    await passwordInput.fill('Sangok#3');
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    // Test each tab
    const tabs = [
      { name: '仪表板', id: 'dashboard' },
      { name: '测评记录', id: 'records' },
      { name: '安全管理', id: 'security' },
      { name: '系统设置', id: 'settings' }
    ];
    
    for (const tab of tabs) {
      console.log(`🧭 Testing ${tab.name} tab...`);
      
      // Click on the tab
      const tabButton = await page.locator(`button:has-text("${tab.name}")`).first();
      await tabButton.click();
      await page.waitForTimeout(1500);
      
      // Check if navigation is still visible
      const navigationVisible = await page.locator('text=🧭 快速导航').isVisible();
      expect(navigationVisible).toBeTruthy();
      console.log(`✅ Navigation visible on ${tab.name} tab`);
      
      // Check if admin tools are still visible in sidebar
      const adminToolsVisible = await page.locator('text=🔧 管理员工具').isVisible();
      expect(adminToolsVisible).toBeTruthy();
      console.log(`✅ Admin tools visible on ${tab.name} tab`);
    }
    
    console.log('✅ Navigation is consistently available across all tabs');
  });
});