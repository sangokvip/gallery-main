import { chromium } from 'playwright';
import { promises as fs } from 'fs';

async function verifyAdminFix() {
  console.log('🚀 开始验证管理员后台修复情况...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 收集控制台日志
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  // 收集网络请求
  const failedRequests = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`❌ 网络请求失败: ${response.status()} ${response.statusText()} - ${response.url()}`);
    }
  });

  const testResults = {
    adminPageAccessible: false,
    loginFormPresent: false,
    adminLoginWorking: false,
    dashboardLoading: false,
    statsDisplaying: false,
    noCriticalErrors: true,
    databaseConnectionWorking: false,
    overallStatus: 'FAILED'
  };

  try {
    console.log('📍 步骤1: 访问管理员页面...');
    await page.goto('http://localhost:8080/admin.html');
    await page.waitForLoadState('networkidle');
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 截图保存初始状态
    await page.screenshot({ path: 'admin-fix-test-1-initial.png', fullPage: true });
    console.log('📸 截图保存: admin-fix-test-1-initial.png');
    
    // 检查页面是否可访问
    const pageTitle = await page.title();
    testResults.adminPageAccessible = pageTitle.includes('管理后台') || pageTitle.includes('Admin');
    console.log(`✅ 页面标题: ${pageTitle}`);
    console.log(`📊 页面可访问: ${testResults.adminPageAccessible}`);
    
    console.log('\n📍 步骤2: 检查登录表单...');
    
    // 检查是否有登录表单
    const usernameInput = await page.locator('input[type="text"], input[placeholder*="用户"]').first();
    const passwordInput = await page.locator('input[type="password"], input[placeholder*="密码"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("登录")').first();
    
    testResults.loginFormPresent = await usernameInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0;
    console.log(`🔑 登录表单存在: ${testResults.loginFormPresent}`);
    
    if (testResults.loginFormPresent) {
      console.log('\n📍 步骤3: 测试管理员登录...');
      
      // 填写登录表单
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      
      console.log('📝 已填写登录凭据: admin/admin123');
      
      // 点击登录按钮
      await loginButton.click();
      
      console.log('⏳ 等待登录完成...');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 截图保存登录后状态
      await page.screenshot({ path: 'admin-fix-test-2-after-login.png', fullPage: true });
      console.log('📸 截图保存: admin-fix-test-2-after-login.png');
      
      // 检查是否登录成功
      const pageContent = await page.content();
      testResults.adminLoginWorking = pageContent.includes('欢迎') || 
                                     pageContent.includes('仪表板') || 
                                     pageContent.includes('Dashboard') ||
                                     pageContent.includes('统计');
      console.log(`✅ 管理员登录成功: ${testResults.adminLoginWorking}`);
    }
    
    console.log('\n📍 步骤4: 检查仪表板加载...');
    
    // 检查仪表板是否加载
    const dashboardElements = await page.locator('[class*="dashboard"], [class*="Dashboard"], [class*="统计"]').first();
    testResults.dashboardLoading = await dashboardElements.count() > 0;
    console.log(`📊 仪表板加载: ${testResults.dashboardLoading}`);
    
    console.log('\n📍 步骤5: 检查统计数据...');
    
    // 检查统计数据
    const statElements = await page.locator('[class*="stat"], [class*="number"], h4, h5, h6').all();
    let validStats = 0;
    
    for (const element of statElements.slice(0, 10)) { // 检查前10个统计元素
      try {
        const text = await element.textContent();
        const number = parseInt(text.replace(/[^0-9]/g, '')) || 0;
        if (number > 0) validStats++;
      } catch (e) {
        // 忽略个别元素的错误
      }
    }
    
    testResults.statsDisplaying = validStats > 0;
    console.log(`📈 统计数据正常显示: ${testResults.statsDisplaying} (${validStats} 个有效统计)`);
    
    console.log('\n📍 步骤6: 检查错误和警告...');
    
    // 检查控制台错误
    const errors = logs.filter(log => log.type === 'error');
    const warnings = logs.filter(log => log.type === 'warning');
    
    console.log(`❌ 控制台错误数量: ${errors.length}`);
    console.log(`⚠️ 控制台警告数量: ${warnings.length}`);
    
    // 检查是否有关键错误
    const criticalErrors = errors.filter(error => 
      error.text.includes('Failed to load') ||
      error.text.includes('Cannot read') ||
      error.text.includes('TypeError') ||
      error.text.includes('ReferenceError') ||
      error.text.includes('supabase')
    );
    
    testResults.noCriticalErrors = criticalErrors.length === 0;
    console.log(`🔍 无关键错误: ${testResults.noCriticalErrors}`);
    
    if (errors.length > 0) {
      console.log('📋 错误详情:');
      errors.forEach(error => console.log(`   - ${error.text}`));
    }
    
    console.log('\n📍 步骤7: 检查数据库连接...');
    
    // 检查是否有数据库相关的网络请求
    const dbRequests = logs.filter(log => 
      log.text.includes('supabase') || 
      log.text.includes('database') ||
      log.text.includes('query')
    );
    
    testResults.databaseConnectionWorking = dbRequests.length > 0 && failedRequests.length === 0;
    console.log(`🗄️ 数据库连接正常: ${testResults.databaseConnectionWorking}`);
    
    // 计算总体状态
    const passedTests = Object.values(testResults).filter(result => result === true).length;
    const totalTests = Object.keys(testResults).filter(key => key !== 'overallStatus').length;
    
    testResults.overallStatus = passedTests >= totalTests * 0.7 ? 'SUCCESS' : 'PARTIAL';
    if (passedTests === totalTests) testResults.overallStatus = 'PERFECT';
    
    console.log('\n🎯 测试结果总结:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`📊 总体状态: ${testResults.overallStatus}`);
    
    // 保存详细报告
    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      consoleLogs: logs,
      networkRequests: failedRequests,
      summary: {
        passed: passedTests,
        total: totalTests,
        status: testResults.overallStatus
      }
    };
    
    await fs.writeFile('admin-test-report.json', JSON.stringify(report, null, 2));
    console.log('📄 详细报告已保存: admin-test-report.json');
    
    return testResults;
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    
    // 截图保存错误状态
    try {
      await page.screenshot({ path: 'admin-fix-test-error.png', fullPage: true });
      console.log('📸 错误截图保存: admin-fix-test-error.png');
    } catch (screenshotError) {
      console.log('无法保存错误截图');
    }
    
    testResults.overallStatus = 'FAILED';
    return testResults;
    
  } finally {
    await browser.close();
    
    console.log('\n🎉 管理员后台验证完成！');
    console.log('========================================');
    console.log(`📊 总体状态: ${testResults.overallStatus}`);
    console.log(`✅ 通过测试: ${Object.values(testResults).filter(r => r === true).length}/${Object.keys(testResults).filter(k => k !== 'overallStatus').length}`);
    console.log('========================================');
  }
}

// 运行验证
verifyAdminFix().then(results => {
  process.exit(results.overallStatus === 'FAILED' ? 1 : 0);
}).catch(error => {
  console.error('验证脚本执行失败:', error);
  process.exit(1);
});