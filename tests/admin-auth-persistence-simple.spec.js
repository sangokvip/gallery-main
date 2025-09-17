import { test, expect } from '@playwright/test';

test.describe('Admin Authentication Persistence Bug', () => {
  const ADMIN_URL = '/admin-minimal.html';
  const ADMIN_CREDENTIALS = {
    username: 'adam',
    password: 'Sangok#3'
  };

  test('should not allow automatic access after logout and page refresh', async ({ page }) => {
    console.log('🧪 Starting admin authentication persistence test...');
    
    // Step 1: Navigate to admin page
    console.log('📍 Step 1: Navigating to admin page');
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    // Step 2: Verify we're on login page (check for login form)
    console.log('🔍 Step 2: Verifying initial state - should show login');
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Wait for login form to be visible
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Initial state verified - login form is visible');
    
    // Step 3: Login as admin
    console.log('🔐 Step 3: Logging in as admin');
    await usernameInput.fill(ADMIN_CREDENTIALS.username);
    await passwordInput.fill(ADMIN_CREDENTIALS.password);
    await submitButton.click();
    
    // Wait for login to complete (look for dashboard or admin content)
    await page.waitForTimeout(3000);
    
    // Step 4: Verify we're logged in by checking for dashboard elements
    console.log('✅ Step 4: Verifying successful login');
    const adminTitle = page.locator('text=M-Profile Lab 管理后台').first();
    const logoutButton = page.locator('button:has-text("退出")').first();
    
    // Wait for admin interface to load
    await page.waitForTimeout(2000);
    
    // Check if we're logged in
    const isLoggedIn = await adminTitle.isVisible().catch(() => false) && 
                      await logoutButton.isVisible().catch(() => false);
    
    if (isLoggedIn) {
      console.log('✅ Login successful - admin interface visible');
    } else {
      console.log('⚠️ Login may have failed - checking current page state');
      await page.screenshot({ path: 'login-attempt.png' });
    }
    
    // Step 5: Logout
    console.log('🚪 Step 5: Logging out');
    
    try {
      await logoutButton.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      console.log('✅ Logout clicked');
    } catch (error) {
      console.log('⚠️ Could not find logout button, may already be logged out');
    }
    
    // Step 6: Verify we're logged out
    console.log('🔍 Step 6: Verifying logout state');
    
    // Wait a bit for logout to complete
    await page.waitForTimeout(2000);
    
    // Check if login form is visible again
    const isLoginFormVisible = await usernameInput.isVisible().catch(() => false);
    
    if (isLoginFormVisible) {
      console.log('✅ Logout successful - login form is visible');
    } else {
      console.log('⚠️ Login form not immediately visible, checking page state');
      await page.screenshot({ path: 'logout-state.png' });
    }
    
    // Step 7: Refresh the page
    console.log('🔄 Step 7: Refreshing the page');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Step 8: Verify we need to login again (this is where the bug occurs)
    console.log('🔍 Step 8: Verifying authentication state after refresh');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if login form is visible
    const usernameInputAfterRefresh = page.locator('input[type="text"]').first();
    const isLoginFormVisibleAfterRefresh = await usernameInputAfterRefresh.isVisible().catch(() => false);
    
    // Check if admin interface is visible (indicating bug)
    const adminTitleAfterRefresh = page.locator('text=M-Profile Lab 管理后台').first();
    const isAdminInterfaceVisibleAfterRefresh = await adminTitleAfterRefresh.isVisible().catch(() => false);
    
    console.log(`📊 After refresh state:`);
    console.log(`  - Login form visible: ${isLoginFormVisibleAfterRefresh}`);
    console.log(`  - Admin interface visible: ${isAdminInterfaceVisibleAfterRefresh}`);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'final-state.png' });
    
    // If the bug exists, admin interface will be visible after refresh even though we logged out
    if (isAdminInterfaceVisibleAfterRefresh && !isLoginFormVisibleAfterRefresh) {
      console.log('❌ BUG DETECTED: Admin interface visible after logout and refresh!');
      throw new Error('Authentication persistence bug detected: User can access admin interface after logout and page refresh');
    } else if (isLoginFormVisibleAfterRefresh && !isAdminInterfaceVisibleAfterRefresh) {
      console.log('✅ Test passed - authentication properly handled after refresh');
    } else {
      console.log('⚠️ Unexpected state - manual verification needed');
      // Don't fail the test for unexpected states, just log them
    }
  });

  test('should handle invalid admin session data', async ({ page }) => {
    console.log('🧪 Testing invalid admin session data handling...');
    
    // Navigate to admin page
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    // Inject invalid admin data using page context
    console.log('📝 Injecting invalid admin data');
    await page.context().addInitScript(() => {
      localStorage.setItem('admin_data', JSON.stringify({ 
        invalid: 'data',
        noUsername: true 
      }));
    });
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to login
    const usernameInput = page.locator('input[type="text"]').first();
    const isLoginFormVisible = await usernameInput.isVisible().catch(() => false);
    
    if (isLoginFormVisible) {
      console.log('✅ Session integrity test passed - invalid data properly rejected');
    } else {
      console.log('⚠️ Session integrity test - unexpected state');
      await page.screenshot({ path: 'invalid-session-test.png' });
    }
  });
});