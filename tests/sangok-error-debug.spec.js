import { test, expect } from '@playwright/test';

test.describe('Sangok Error Debug', () => {
  test('check sangok page for errors and actual content', async ({ page }) => {
    console.log('🔍 Debugging sangok page errors...');
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    await page.goto('/sangok.html');
    
    // Wait longer for React to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check for loading spinner
    const loadingSpinner = await page.locator('.admin-loading-spinner').isVisible().catch(() => false);
    const loadingText = await page.locator('.admin-loading-text').isVisible().catch(() => false);
    
    console.log('⏳ Loading state:', {
      spinner: loadingSpinner,
      text: loadingText
    });
    
    // Take screenshot
    await page.screenshot({ path: 'sangok-error-debug.png', fullPage: true });
    
    // Check console errors
    console.log('🚨 Console errors:', consoleErrors);
    console.log('🚨 Page errors:', pageErrors);
    
    // Check if there's actual content
    const hasContent = await page.locator('#root').innerHTML();
    console.log('📄 Root content length:', hasContent.length);
    console.log('📄 Root content preview:', hasContent.substring(0, 500));
    
    // Check for specific error states
    const hasErrorContainer = await page.locator('.admin-error').isVisible().catch(() => false);
    console.log('❌ Has error container:', hasErrorContainer);
    
    // Check if React is loaded by looking for React-specific elements
    const hasReact = await page.evaluate(() => {
      return typeof React !== 'undefined' || typeof ReactDOM !== 'undefined' || window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
    });
    console.log('⚛️ React detected:', hasReact);
    
    // Check localStorage state
    const localStorageState = await page.evaluate(() => {
      try {
        return {
          hasAdminData: !!localStorage.getItem('admin_data'),
          localStorageCount: Object.keys(localStorage).length
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('💾 LocalStorage state:', localStorageState);
    
    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      console.log('❌ Errors detected in sangok page');
    } else {
      console.log('✅ No JavaScript errors detected');
    }
  });
});