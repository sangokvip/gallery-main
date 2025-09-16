import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Box, CircularProgress, Typography, Button } from '@mui/material'
import MergedRecordsIP from './MergedRecordsIP.jsx'

// 创建主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// 后台管理主组件 - 修复版本
function AdminAppFixed() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // 模拟加载过程
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          p: 3
        }}
      >
        <CircularProgress size={60} sx={{ mb: 3, color: 'white' }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          M-Profile Lab 管理后台
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8 }}>
          正在加载合并的测试记录和IP地址管理功能...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          textAlign: 'center',
          p: 3
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          ❌ 加载失败
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{
            backgroundColor: 'white',
            color: '#f44336',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            }
          }}
        >
          重新加载
        </Button>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* 简单的头部 */}
        <Box
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            p: 3,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            M-Profile Lab 管理后台
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
            测试记录与IP地址管理
          </Typography>
        </Box>
        
        {/* 主要内容 */}
        <Box sx={{ p: 3 }}>
          <MergedRecordsIP />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
            textAlign: 'center',
            p: 3
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            ⚠️ 系统错误
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
            {this.state.error?.message || '未知错误'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              backgroundColor: 'white',
              color: '#f44336',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              }
            }}
          >
            重新加载
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <AdminAppFixed />
  </ErrorBoundary>
);

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global Admin Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Global Admin Promise Rejection:', event.reason);
});