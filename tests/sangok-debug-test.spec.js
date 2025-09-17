import { test, expect } from '@playwright/test';

test.describe('Sangok Admin Debug Test', () => {
  const ADMIN_URL = '/sangok.html';

  test('debug current sangok page state', async ({ page }) => {
    console.log('🔍 Debugging sangok page state...');
    
    // Clear any existing session data first
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to admin page
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'sangok-debug-initial.png', fullPage: true });
    
    // Check what's currently visible
    const pageContent = await page.content();
    console.log('📄 Page content includes:');
    console.log('- Contains "Y R U HERE?":', pageContent.includes('Y R U HERE?'));
    console.log('- Contains "M-Profile Lab 管理后台":', pageContent.includes('M-Profile Lab 管理后台'));
    console.log('- Contains "用户名":', pageContent.includes('用户名'));
    console.log('- Contains "密码":', pageContent.includes('密码'));
    console.log('- Contains "登录":', pageContent.includes('登录'));
    
    // Check for specific elements
    const elements = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const buttons = document.querySelectorAll('button');
      const textAreas = document.querySelectorAll('textarea');
      
      return {
        inputCount: inputs.length,
        buttonCount: buttons.length,
        textAreaCount: textAreas.length,
        inputTypes: Array.from(inputs).map(i => ({ type: i.type, placeholder: i.placeholder, label: i.labels?.[0]?.textContent })),
        buttonTexts: Array.from(buttons).map(b => b.textContent?.trim()).filter(t => t)
      };
    });
    
    console.log('🎯 Found elements:', {
      inputs: elements.inputCount,
      buttons: elements.buttonCount,
      textareas: elements.textAreaCount,
      inputDetails: elements.inputTypes,
      buttonTexts: elements.buttonTexts
    });
    
    // Check localStorage state
    const localStorageState = await page.evaluate(() => {
      const adminData = localStorage.getItem('admin_data');
      return {
        hasAdminData: !!adminData,
        adminData: adminData ? JSON.parse(adminData) : null
      };
    });
    
    console.log('💾 LocalStorage state:', localStorageState);
    
    // Try to find login form with different selectors
    const loginSelectors = [
      'input[type="text"]',
      'input[type="password"]',
      'input[label*="用户"]',
      'input[placeholder*="用户"]',
      'button[type="submit"]',
      'button:has-text("登录")',
      'form'
    ];
    
    for (const selector of loginSelectors) {
      try {
        const element = await page.locator(selector).first();
        const count = await element.count();
        const isVisible = count > 0 ? await element.isVisible().catch(() => false) : false;
        console.log(`🔍 ${selector}: count=${count}, visible=${isVisible}`);
      } catch (error) {
        console.log(`❌ ${selector}: error - ${error.message}`);
      }
    }
  });
});