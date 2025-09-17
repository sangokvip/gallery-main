import { test, expect } from '@playwright/test';

test.describe('Sangok Admin Navigation Simple Test', () => {
  test('verify navigation functionality is working', async ({ page, context }) => {
    console.log('🧪 Testing sangok admin navigation functionality...');
    
    // Navigate to admin page and login
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
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    console.log('✅ Logged in successfully');
    
    // Test 1: Verify navigation section exists
    const navigationSection = await page.locator('text=🧭 快速导航').isVisible();
    expect(navigationSection).toBeTruthy();
    console.log('✅ Navigation section found');
    
    // Test 2: Verify admin tools in sidebar
    const adminToolsVisible = await page.locator('text=🔧 管理员工具').isVisible();
    expect(adminToolsVisible).toBeTruthy();
    console.log('✅ Admin tools section found');
    
    // Test 3: Verify specific navigation buttons exist
    const navButtons = ['女M测试', '男M测试', 'S型测试', 'LGBT+测试', '留言板', '图库', '数据管理', '部署指南'];
    for (const button of navButtons) {
      const buttonElement = await page.locator(`button:has-text("${button}")`).first();
      const isVisible = await buttonElement.isVisible();
      expect(isVisible).toBeTruthy();
      console.log(`✅ ${button} button is visible`);
    }
    
    // Test 4: Verify admin tools exist
    const adminTools = ['极简管理后台', '管理后台测试', '当前实现验证', '部署指南'];
    for (const tool of adminTools) {
      const toolElement = await page.locator(`text="${tool}"`).first();
      const isVisible = await toolElement.isVisible();
      expect(isVisible).toBeTruthy();
      console.log(`✅ ${tool} admin tool is visible`);
    }
    
    // Test 5: Verify new window opening functionality with one example
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
    
    // Test 6: Verify visual indicators
    console.log('🎨 Testing visual indicators...');
    
    // Check for external link icons
    const externalIcons = await page.locator('[data-testid="OpenInNewIcon"]').count();
    expect(externalIcons).toBeGreaterThan(0);
    console.log(`✅ Found ${externalIcons} external link icons`);
    
    console.log('🎉 Navigation functionality test completed successfully!');
  });
});