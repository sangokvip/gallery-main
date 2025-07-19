// SEO分析和监控脚本
// 这个文件包含了Google Analytics、Search Console验证等SEO相关的脚本

// Google Analytics 4 配置
// 请替换 'GA_MEASUREMENT_ID' 为实际的Google Analytics测量ID
/*
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
*/

// Google Search Console验证
// 请替换为实际的验证代码
/*
<meta name="google-site-verification" content="your-verification-code" />
*/

// 百度站长工具验证
// 请替换为实际的验证代码
/*
<meta name="baidu-site-verification" content="your-baidu-verification-code" />
*/

// 性能监控
if ('performance' in window) {
  window.addEventListener('load', function() {
    // 监控页面加载性能
    const perfData = performance.getEntriesByType('navigation')[0];
    
    // 发送性能数据到分析服务
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_load_time', {
        'event_category': 'Performance',
        'event_label': window.location.pathname,
        'value': Math.round(perfData.loadEventEnd - perfData.loadEventStart)
      });
    }
  });
}

// Core Web Vitals监控
function sendToAnalytics(metric) {
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      'event_category': 'Web Vitals',
      'event_label': metric.id,
      'value': Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      'non_interaction': true
    });
  }
}

// 如果支持Web Vitals API
if ('web-vitals' in window) {
  import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  });
}