import { test, expect } from '@playwright/test';

test.describe('Sangok Login Form Detection', () => {
  test('find and interact with login form', async ({ page }) => {
    console.log('🔍 Finding login form in sangok page...');
    
    await page.goto('/sangok.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'sangok-initial.png', fullPage: true });
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Look for login form with multiple strategies
    const strategies = [
      {
        name: 'TextField by label',
        selector: 'label:has-text("用户名")',
        type: 'label'
      },
      {
        name: 'TextField by placeholder',
        selector: 'input[placeholder*="用户"], input[placeholder*="username"]', 
        type: 'input'
      },
      {
        name: 'TextField by type',
        selector: 'input[type="text"]:visible',
        type: 'input'
      },
      {
        name: 'Password field',
        selector: 'input[type="password"]:visible',
        type: 'input'
      },
      {
        name: 'Submit button',
        selector: 'button[type="submit"]:visible, button:has-text("登录"):visible',
        type: 'button'
      },
      {
        name: 'Form element',
        selector: 'form:visible',
        type: 'form'
      }
    ];
    
    for (const strategy of strategies) {
      try {
        const elements = await page.locator(strategy.selector);
        const count = await elements.count();
        const isVisible = count > 0 ? await elements.first().isVisible().catch(() => false) : false;
        
        console.log(`🔍 ${strategy.name}: count=${count}, visible=${isVisible}`);
        
        if (isVisible) {
          console.log(`✅ Found visible ${strategy.type} with selector: ${strategy.selector}`);
          
          // If it's a form field, try to interact with it
          if (strategy.type === 'input') {
            await elements.first().click();
            await elements.first().fill('test');
            console.log(`✅ Successfully interacted with ${strategy.name}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${strategy.name}: error - ${error.message}`);
      }
    }
    
    // Check for specific text content
    const contentChecks = [
      'M-Profile Lab 管理后台',
      '用户名',
      '密码', 
      '登录',
      '默认管理员账户'
    ];
    
    for (const text of contentChecks) {
      const hasText = await page.locator(`text="${text}"`).isVisible().catch(() => false);
      console.log(`📋 Text "${text}": ${hasText ? 'found' : 'not found'}`);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'sangok-after-interaction.png', fullPage: true });
    
    // Check if we're in login state or admin state
    const isLoggedIn = await page.locator('text=Modern Admin Panel').isVisible().catch(() => false);
    const isLoginForm = await page.locator('text=M-Profile Lab 管理后台').first().isVisible().catch(() => false);
    
    console.log('📊 Current state:');
    console.log(`  - Admin interface visible: ${isLoggedIn}`);
    console.log(`  - Login form visible: ${isLoginForm}`);
    
    // If login form is found, try the actual login
    if (isLoginForm) {
      console.log('🎯 Attempting actual login...');
      
      // Find and fill username field
      const usernameField = await page.locator('input[type="text"]:visible').first();
      await usernameField.fill('adam');
      
      // Find and fill password field  
      const passwordField = await page.locator('input[type="password"]:visible').first();
      await passwordField.fill('Sangok#3');
      
      // Find and click submit button
      const submitButton = await page.locator('button[type="submit"]:visible, button:has-text("登录"):visible').first();
      await submitButton.click();
      
      // Wait for login to complete
      await page.waitForTimeout(3000);
      
      // Check login result
      const loggedIn = await page.locator('text=Modern Admin Panel').isVisible().catch(() => false);
      console.log(`✅ Login result: ${loggedIn ? 'success' : 'failed'}`);
      
      await page.screenshot({ path: 'sangok-after-login.png', fullPage: true });
    }
  });
});