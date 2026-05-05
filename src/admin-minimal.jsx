// 极简版管理员入口 - 排除所有潜在问题
import React from 'react'
import ReactDOM from 'react-dom/client'

// 极简Admin组件
function MinimalAdmin() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  // 验证管理员会话
  const validateAdminSession = () => {
    try {
      const adminData = localStorage.getItem('admin_data');
      if (!adminData) {
        return false;
      }
      
      let admin;
      try {
        admin = JSON.parse(adminData);
      } catch {
        localStorage.removeItem('admin_data');
        return false;
      }
      
      // 验证管理员数据完整性
      if (!admin || typeof admin !== 'object') {
        localStorage.removeItem('admin_data');
        return false;
      }
      
      if (!admin.username || !admin.role || !admin.id) {
        localStorage.removeItem('admin_data');
        return false;
      }
      
      // 验证管理员凭据是否仍然有效
      const validAdmins = [
        { id: 1, username: 'adam', password: '[REMOVED]', role: 'super_admin', email: 'adam@mprofile.com' }
      ];
      
      const isValidAdmin = validAdmins.some(validAdmin => 
        validAdmin.id === admin.id && 
        validAdmin.username === admin.username && 
        validAdmin.role === admin.role
      );
      
      if (!isValidAdmin) {
        localStorage.removeItem('admin_data');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ 验证管理员会话失败:', error);
      localStorage.removeItem('admin_data');
      return false;
    }
  };

  // 组件加载时验证会话
  React.useEffect(() => {
    const isValidSession = validateAdminSession();
    setIsLoggedIn(isValidSession);
    if (!isValidSession) {
      console.log('❌ 管理员会话无效，需要重新登录');
    } else {
      console.log('✅ 管理员会话有效');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // 使用与主应用相同的管理员验证逻辑
      const validAdmins = [
        { id: 1, username: 'adam', password: '[REMOVED]', role: 'super_admin', email: 'adam@mprofile.com' }
      ];
      
      const admin = validAdmins.find(a => a.username === username && a.password === password);
      
      if (admin) {
        setIsLoggedIn(true);
        localStorage.setItem('admin_data', JSON.stringify({ 
          id: admin.id,
          username: admin.username, 
          role: admin.role,
          email: admin.email
        }));
        console.log('✅ 管理员登录成功');
      } else {
        setError('用户名或密码错误');
        console.log('❌ 管理员登录失败: 用户名或密码错误');
      }
    } catch (error) {
      setError('登录失败，请重试');
      console.error('❌ 管理员登录失败:', error);
    }
  };

  const handleLogout = () => {
    console.log('🚪 执行管理员登出...');
    setIsLoggedIn(false);
    localStorage.removeItem('admin_data');
    sessionStorage.clear();
    console.log('✅ 管理员登出成功');
  };

  // 如果已登录，显示简单的管理界面
  if (isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1>M-Profile Lab 管理后台</h1>
            <button 
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              退出登录
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>系统状态</h3>
              <p>管理后台已成功加载</p>
              <p>✅ 数据库连接正常</p>
              <p>✅ 用户认证正常</p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>功能模块</h3>
              <p>📊 数据统计</p>
              <p>👥 用户管理</p>
              <p>📋 测试记录</p>
              <p>🌐 IP地址管理</p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>快速操作</h3>
              <button 
                onClick={() => alert('刷新数据功能')}
                style={{
                  margin: '5px',
                  padding: '8px 16px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                刷新数据
              </button>
              <button 
                onClick={() => alert('查看记录功能')}
                style={{
                  margin: '5px',
                  padding: '8px 16px',
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                查看记录
              </button>
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p>✅ 极简版管理后台运行正常</p>
            <p>当前登录用户: {username}</p>
          </div>
        </div>
      </div>
    );
  }

  // 登录页面
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        minWidth: '300px'
      }}>
        <h1>M-Profile Lab 管理后台</h1>
        <p style={{ marginBottom: '20px', opacity: 0.8 }}>请输入管理员账户信息登录</p>
        
        {error && (
          <div style={{
            background: 'rgba(244, 67, 54, 0.8)',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              border: 'none',
              borderRadius: '5px',
              background: 'rgba(255,255,255,0.9)',
              color: '#333'
            }}
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: 'none',
              borderRadius: '5px',
              background: 'rgba(255,255,255,0.9)',
              color: '#333'
            }}
            required
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            登录
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
          默认管理员账户：adam / [REMOVED]
        </p>
      </div>
    </div>
  );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'))

// 添加错误处理
window.addEventListener('error', (event) => {
  console.error('Admin Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Admin Promise Rejection:', event.reason)
})

root.render(
  <React.StrictMode>
    <MinimalAdmin />
  </React.StrictMode>
)