import { chromium } from '@playwright/test';

async function checkAdminInterface() {
  console.log('🚀 开始检查管理员后台界面...');
  
  const browser = await chromium.launch({
    headless: false, // 设置为false以便观察浏览器操作
    slowMo: 1000     // 减慢操作速度以便观察
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 访问管理员登录页面...');
    await page.goto('http://localhost:3000/sangok.html');
    
    console.log('⏳ 等待页面加载...');
    await page.waitForLoadState('networkidle');
    
    // 截图保存当前状态
    await page.screenshot({ path: 'admin-login-page.png', fullPage: true });
    
    console.log('📋 当前页面信息:');
    const title = await page.title();
    const url = page.url();
    console.log(`标题: ${title}`);
    console.log(`URL: ${url}`);
    
    // 检查页面内容
    const bodyText = await page.textContent('body');
    console.log('页面文本内容预览:', bodyText.substring(0, 200) + '...');
    
    // 查找登录表单元素
    const usernameInput = await page.locator('input[type="text"], input[placeholder*="用户"], input[name*="user"]').first();
    const passwordInput = await page.locator('input[type="password"], input[placeholder*="密码"], input[name*="pass"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("登录"), .btn-primary').first();
    
    if (await usernameInput.isVisible() && await passwordInput.isVisible()) {
      console.log('✅ 找到登录表单');
      
      // 填写登录信息
      console.log('📝 填写登录信息...');
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      
      // 截图保存填写状态
      await page.screenshot({ path: 'admin-login-filled.png', fullPage: true });
      
      // 点击登录
      console.log('🔑 点击登录按钮...');
      await loginButton.click();
      
      // 等待登录完成
      console.log('⏳ 等待登录完成...');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // 给数据加载时间
      
      // 截图保存登录后状态
      await page.screenshot({ path: 'admin-dashboard-after-login.png', fullPage: true });
      
      console.log('📊 检查统计数据的显示...');
      
      // 查找统计数据元素
      const statElements = await page.locator('[class*="stat"], [class*="card"], h4, h3, .stat-number').all();
      console.log(`找到 ${statElements.length} 个可能的统计元素`);
      
      for (let i = 0; i < statElements.length && i < 10; i++) {
        const element = statElements[i];
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.evaluate(el => el.className);
        console.log(`元素 ${i}: [${tagName}] ${className} - 文本: "${text.trim()}"`);
      }
      
      // 检查具体的统计数字
      const numberElements = await page.locator('h4, h3, .MuiTypography-h4, .MuiTypography-h3, [class*="number"]').all();
      console.log(`找到 ${numberElements.length} 个数字元素`);
      
      let foundNonZero = false;
      for (let i = 0; i < numberElements.length; i++) {
        const element = numberElements[i];
        const text = await element.textContent();
        const number = parseInt(text.replace(/[^0-9]/g, '')) || 0;
        
        if (number > 0) {
          foundNonZero = true;
          console.log(`✅ 找到非零数字: ${number}`);
        } else {
          console.log(`⚠️ 零或无效数字: "${text.trim()}" (解析为: ${number})`);
        }
      }
      
      if (foundNonZero) {
        console.log('🎉 SUCCESS: 找到非零统计数据！');
      } else {
        console.log('❌ ISSUE: 所有统计数字都是0或无效');
      }
      
      // 检查控制台日志
      console.log('🔍 检查控制台日志...');
      const logs = await page.evaluate(() => {
        return Array.from(console.log.logs || []);
      });
      
      if (logs.length > 0) {
        logs.forEach(log => {
          console.log(`[${log.type}] ${log.text}`);
        });
      }
      
      // 检查网络请求
      console.log('🌐 检查网络请求状态...');
      const response = await page.evaluate(() => {
        return {
          url: window.location.href,
          status: document.readyState,
          userAgent: navigator.userAgent
        };
      });
      
      console.log('页面状态:', response);
      
    } else {
      console.log('❌ 未找到登录表单，当前可能是已登录状态或其他页面');
      
      // 检查是否已经是登录状态
      const dashboardElements = await page.locator('[class*="dashboard"], [class*="统计"], [class*="数据"]').all();
      if (dashboardElements.length > 0) {
        console.log('✅ 看起来已经是登录状态，直接检查统计数据...');
        
        // 截图保存当前状态
        await page.screenshot({ path: 'admin-dashboard-logged-in.png', fullPage: true });
        
        // 检查统计数据
        const statElements = await page.locator('[class*="stat"], [class*="card"], h4, h3').all();
        console.log(`找到 ${statElements.length} 个统计元素`);
        
        // 这里可以添加具体的统计检查逻辑
        for (let i = 0; i < Math.min(statElements.length, 5); i++) {
          const element = statElements[i];
          const text = await element.textContent();
          console.log(`统计元素 ${i}: "${text.trim()}"`);
        }
      }
    }
    
    console.log('✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
    
    // 截图保存错误状态
    try {
      await page.screenshot({ path: 'admin-error-state.png', fullPage: true });
      console.log('💾 错误状态已保存到 admin-error-state.png');
    } catch (screenshotError) {
      console.error('截图失败:', screenshotError);
    }
  } finally {
    await browser.close();
    console.log('🚪 浏览器已关闭');
  }
}

// 运行测试
console.log('🚀 开始管理员界面检查...');
checkAdminInterface().then(() => {
  console.log('✅ 检查完成！');
}).catch(error => {
  console.error('❌ 检查失败:', error);
  process.exit(1);
});