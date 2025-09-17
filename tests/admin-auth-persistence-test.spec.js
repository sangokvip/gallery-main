import { test, expect } from '@playwright/test';

test.describe('Admin Authentication Persistence Bug', () => {
  const ADMIN_URL = '/admin-new.html';
  const ADMIN_CREDENTIALS = {
    username: 'adam',
    password: 'Sangok#3'
  };

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should not allow automatic access after logout and page refresh', async ({ page }) => {
    console.log('🧪 Starting admin authentication persistence test...');
    
    // Step 1: Navigate to admin page
    console.log('📍 Step 1: Navigating to admin page');
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    // Step 2: Verify we're on login page (no admin in localStorage)
    console.log('🔍 Step 2: Verifying initial state - should show login');
    const initialLocalStorage = await page.evaluate(() => localStorage.getItem('admin_data'));
    expect(initialLocalStorage).toBeNull();
    console.log('✅ Initial state verified - no admin_data in localStorage');
    
    // Step 3: Login as admin
    console.log('🔐 Step 3: Logging in as admin');
    await page.fill('input[label="用户名"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(2000);
    
    // Step 4: Verify we're logged in
    console.log('✅ Step 4: Verifying successful login');
    const loggedInLocalStorage = await page.evaluate(() => localStorage.getItem('admin_data'));
    expect(loggedInLocalStorage).not.toBeNull();
    console.log('✅ Login successful - admin_data found in localStorage');
    
    // Step 5: Logout
    console.log('🚪 Step 5: Logging out');
    const logoutButton = await page.locator('button:has-text("退出")').first();
    await logoutButton.click();
    
    // Wait for logout to complete
    await page.waitForTimeout(2000);
    
    // Step 6: Verify we're logged out
    console.log('🔍 Step 6: Verifying logout state');
    const afterLogoutLocalStorage = await page.evaluate(() => localStorage.getItem('admin_data'));
    expect(afterLogoutLocalStorage).toBeNull();
    console.log('✅ Logout successful - admin_data removed from localStorage');
    
    // Step 7: Refresh the page
    console.log('🔄 Step 7: Refreshing the page');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Step 8: Verify we need to login again (this is where the bug occurs)
    console.log('🔍 Step 8: Verifying authentication state after refresh');
    const afterRefreshLocalStorage = await page.evaluate(() => localStorage.getItem('admin_data'));
    
    // Check if we're back at the login page
    const loginFormVisible = await page.locator('input[label="用户名"]').isVisible();
    const dashboardVisible = await page.locator('text=系统仪表板').isVisible().catch(() => false);
    
    console.log(`📊 After refresh state:`);
    console.log(`  - localStorage admin_data: ${afterRefreshLocalStorage}`);
    console.log(`  - Login form visible: ${loginFormVisible}`);
    console.log(`  - Dashboard visible: ${dashboardVisible}`);
    
    // This should pass if the bug is fixed
    expect(afterRefreshLocalStorage).toBeNull();
    expect(loginFormVisible).toBeTruthy();
    expect(dashboardVisible).toBeFalsy();
    
    console.log('✅ Test passed - authentication properly handled after refresh');
  });

  test('should handle edge case where localStorage is manually cleared but session persists', async ({ page }) => {
    console.log('🧪 Testing edge case with manually cleared localStorage...');
    
    // Step 1: Login first
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[label="用户名"]', ADMIN_CREDENTIALS.username);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Step 2: Manually clear localStorage while logged in
    console.log('🗑️ Manually clearing localStorage while logged in');
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Step 3: Try to navigate to admin functionality
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    // Step 4: Verify we're redirected to login
    const loginFormVisible = await page.locator('input[label="用户名"]').isVisible();
    const localStorageData = await page.evaluate(() => localStorage.getItem('admin_data'));
    
    expect(localStorageData).toBeNull();
    expect(loginFormVisible).toBeTruthy();
    
    console.log('✅ Edge case test passed - manual localStorage clear handled correctly');
  });

  test('should validate admin session data integrity', async ({ page }) => {
    console.log('🧪 Testing admin session data integrity validation...');
    
    // Step 1: Navigate to admin page
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    // Step 2: Inject invalid admin data
    console.log('📝 Injecting invalid admin data');
    await page.evaluate(() => {
      localStorage.setItem('admin_data', JSON.stringify({ 
        invalid: 'data',
        noUsername: true 
      }));
    });
    
    // Step 3: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Step 4: Verify invalid data is rejected
    const localStorageData = await page.evaluate(() => localStorage.getItem('admin_data'));
    const loginFormVisible = await page.locator('input[label="用户名"]').isVisible();
    
    // Invalid data should be cleared and user should be redirected to login
    expect(localStorageData).toBeNull();
    expect(loginFormVisible).toBeTruthy();
    
    console.log('✅ Session integrity test passed - invalid data properly rejected');
  });
});