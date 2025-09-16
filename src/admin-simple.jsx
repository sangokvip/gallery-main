import React from 'react'
import ReactDOM from 'react-dom/client'
import MergedRecordsIP from './MergedRecordsIP.jsx'

// 后台管理入口 - 简化版本，移除路由依赖
const root = ReactDOM.createRoot(document.getElementById('root'))

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h2>管理后台加载失败</h2>
          <p style={{ marginTop: '10px', opacity: 0.8 }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'white',
              color: '#f44336',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 渲染应用
  root.render(
    <ErrorBoundary>
      <MergedRecordsIP />
    </ErrorBoundary>
  )

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global Admin Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Global Admin Promise Rejection:', event.reason)
})