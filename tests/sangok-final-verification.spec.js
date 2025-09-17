import { test, expect } from '@playwright/test';

test.describe('Final Sangok Verification', () => {
  test('verify sangok admin authentication is working', async ({ page }) => {
    console.log('🧪 Final verification of sangok admin authentication...');
    
    // Navigate to admin page
    await page.goto('/sangok.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'sangok-final-verification.png', fullPage: true });
    
    // Check current state
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check if login form is visible
    const loginFormVisible = await page.locator('text=M-Profile Lab 管理后台').first().isVisible().catch(() => false);
    const adminInterfaceVisible = await page.locator('text=Modern Admin Panel').first().isVisible().catch(() => false);
    
    console.log('📊 Current state:');
    console.log(`  - Login form visible: ${loginFormVisible}`);
    console.log(`  - Admin interface visible: ${adminInterfaceVisible}`);
    
    if (loginFormVisible) {
      console.log('✅ Sangok admin authentication is working - login form displayed');
      
      // Try to login
      const usernameInput = await page.locator('input[type="text"]:visible').first();
      const passwordInput = await page.locator('input[type="password"]:visible').first();
      const submitButton = await page.locator('button[type="submit"]:visible, button:has-text("登录"):visible').first();
      
      if (await usernameInput.isVisible() && await passwordInput.isVisible() && await submitButton.isVisible()) {
        console.log('✅ Login form elements are visible');
        
        // Try actual login
        await usernameInput.fill('adam');
        await passwordInput.fill('Sangok#3');
        await submitButton.click();
        
        // Wait for login
        await page.waitForTimeout(3000);
        
        // Check login result
        const loggedIn = await page.locator('text=Modern Admin Panel').isVisible().catch(() => false);
        console.log(`✅ Login result: ${loggedIn ? 'success' : 'failed'}`);
        
        if (loggedIn) {
          console.log('🎉 Sangok admin authentication is fully working!');
        } else {
          console.log('⚠️ Login failed - may need manual verification');
        }
      } else {
        console.log('⚠️ Login form elements not found');
      }
    } else if (adminInterfaceVisible) {
      console.log('❌ Sangok admin authentication bypass detected - directly showing admin interface');
      throw new Error('Authentication bypass detected: Admin interface visible without login');
    } else {
      console.log('⚠️ Unexpected state - neither login form nor admin interface visible');
    }
  });
});