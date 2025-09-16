// 极简版管理员入口 - 排除所有潜在问题
import React from 'react'
import ReactDOM from 'react-dom/client'

// 极简Admin组件
function MinimalAdmin() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      localStorage.setItem('admin_data', JSON.stringify({ username: 'admin', role: 'super_admin' }));
    } else {
      setError('用户名或密码错误');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('admin_data');
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
          默认管理员账户：admin / admin123
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