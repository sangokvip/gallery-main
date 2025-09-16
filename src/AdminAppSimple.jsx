import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  Button, 
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Toolbar,
  AppBar,
  CssBaseline,
  createTheme,
  ThemeProvider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
  BarChart as BarChartIcon,
  ExitToApp as ExitToAppIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { supabase } from './utils/supabase.js'
import { diagnoseDatabase, printDiagnosisResults } from './utils/databaseCheck.js'
import './styles/admin-theme.css'

// 获取评分的颜色
const getRatingColor = (rating) => {
  switch (rating) {
    case 'SSS': return 'error';
    case 'SS': return 'warning';
    case 'S': return 'info';
    case 'Q': return 'success';
    case 'N': return 'default';
    case 'W': return 'secondary';
    default: return 'default';
  }
}

// 计算平均分
const calculateAverageScore = (results) => {
  if (!results || results.length === 0) return 'N/A';
  
  const scoreMap = {
    'SSS': 6,
    'SS': 5,
    'S': 4,
    'Q': 3,
    'N': 2,
    'W': 1,
    '': 0
  };
  
  let totalScore = 0;
  let validCount = 0;
  
  results.forEach(result => {
    const score = scoreMap[result.rating] || 0;
    totalScore += score;
    if (result.rating && result.rating !== '') {
      validCount++;
    }
  });
  
  if (validCount === 0) return 'N/A';
  
  const averageScore = totalScore / validCount;
  
  // 转换回评分等级
  if (averageScore >= 5.5) return 'SSS';
  if (averageScore >= 4.5) return 'SS';
  if (averageScore >= 3.5) return 'S';
  if (averageScore >= 2.5) return 'Q';
  if (averageScore >= 1.5) return 'N';
  return 'W';
}

// 打开对应的测试页面函数将在组件内部定义

// 简化的后台管理主题
const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
        },
      },
    },
  },
});

// 简化的后台管理主组件
function AdminAppSimple() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [systemStats, setSystemStats] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [userIPs, setUserIPs] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [filters, setFilters] = useState({
    testType: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState({ connected: true, errors: [] });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // 检查管理员会话
  useEffect(() => {
    checkAdminSession();
  }, []);

  // 加载数据
  useEffect(() => {
    if (admin) {
      loadDashboardData();
    }
  }, [admin]);

  // 检查管理员会话
  const checkAdminSession = async () => {
    try {
      const adminData = localStorage.getItem('admin_data');
      if (adminData) {
        const parsed = JSON.parse(adminData);
        // 简单的会话验证
        if (parsed.username && parsed.role) {
          setAdmin(parsed);
        } else {
          localStorage.removeItem('admin_data');
        }
      }
    } catch (error) {
      console.error('检查管理员会话失败:', error);
      localStorage.removeItem('admin_data');
    } finally {
      setLoading(false);
    }
  };

  // 管理员登录（简化版）
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      // 简化的登录验证（生产环境应该使用真实的密码验证）
      if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
        const adminData = {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@example.com',
          role: 'super_admin'
        };
        
        localStorage.setItem('admin_data', JSON.stringify(adminData));
        setAdmin(adminData);
      } else {
        throw new Error('用户名或密码错误');
      }
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 管理员登出
  const handleLogout = async () => {
    localStorage.removeItem('admin_data');
    setAdmin(null);
  };

  // 加载仪表板数据
  const loadDashboardData = async () => {
    setStatsLoading(true);
    setResultsLoading(true);

    try {
      console.log('开始加载仪表板数据...');
      
      // 首先测试数据库连接
      console.log('测试数据库连接...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('test_records')
        .select('id')
        .limit(1);
      
      if (connectionError) {
        console.error('数据库连接测试失败:', connectionError);
        setDatabaseStatus({
          connected: false,
          errors: [`数据库连接失败: ${connectionError.message}`]
        });
        setSnackbarMessage('数据库连接失败，请检查配置');
        setSnackbarOpen(true);
        return;
      }
      
      console.log('✅ 数据库连接正常');
      setDatabaseStatus({
        connected: true,
        errors: []
      });
      
      // 获取系统统计
      console.log('开始加载系统统计...');
      await loadSystemStats();
      
      // 获取测试记录
      console.log('开始加载测试记录...');
      await loadTestResults();
      
      // 获取IP地址统计
      console.log('开始加载IP统计...');
      await loadUserIPs();
      
      // 获取管理员日志（简化版，暂时不实现完整功能）
      console.log('管理员日志功能暂未实现');
      setAdminLogs([]); // 设置为空数组
      
      console.log('✅ 所有数据加载完成');
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      const errorMessage = `加载数据失败: ${error.message}`;
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      
      // 设置空数据避免页面崩溃
      setSystemStats({
        overview: { totalUsers: 0, totalTests: 0, todayUsers: 0 },
        testTypes: []
      });
      setTestResults([]);
      setUserIPs([]);
      setAdminLogs([]);
    } finally {
      setStatsLoading(false);
      setResultsLoading(false);
    }
  };

  // 获取系统统计
  const loadSystemStats = async () => {
    try {
      console.log('开始加载系统统计...');
      
      // 使用Promise.allSettled来避免单个查询失败影响整体
      console.log('执行系统统计查询...');
      const results = await Promise.allSettled([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('test_records').select('*', { count: 'exact', head: true }),
        supabase.from('test_records').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('test_records').select('test_type')
      ]);
      
      console.log('系统统计查询完成，处理结果...');
      const [usersResult, testsResult, todayResult, typeStatsResult] = results;
      
      console.log('各查询结果状态:');
      console.log('- 用户查询:', usersResult.status, usersResult.status === 'fulfilled' ? `count: ${usersResult.value.count}` : `error: ${usersResult.reason}`);
      console.log('- 测试记录查询:', testsResult.status, testsResult.status === 'fulfilled' ? `count: ${testsResult.value.count}` : `error: ${testsResult.reason}`);
      console.log('- 今日测试查询:', todayResult.status, todayResult.status === 'fulfilled' ? `count: ${todayResult.value.count}` : `error: ${todayResult.reason}`);
      console.log('- 测试类型统计:', typeStatsResult.status, typeStatsResult.status === 'fulfilled' ? `data长度: ${typeStatsResult.value.data?.length}` : `error: ${typeStatsResult.reason}`);
      
      const totalUsers = usersResult.status === 'fulfilled' ? usersResult.value.count : 0;
      const totalTests = testsResult.status === 'fulfilled' ? testsResult.value.count : 0;
      const todayTests = todayResult.status === 'fulfilled' ? todayResult.value.count : 0;
      
      // 处理测试类型统计 - 使用新的查询方法
      let testTypeStats = [];
      if (typeStatsResult.status === 'fulfilled' && typeStatsResult.value.data) {
        // 手动统计各类型数量
        const typeCounts = {};
        typeStatsResult.value.data.forEach(record => {
          const type = record.test_type;
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        testTypeStats = Object.entries(typeCounts).map(([type, count]) => ({
          name: type,
          count: count
        }));
      }
      
      console.log('系统统计最终结果:', {
        totalUsers,
        totalTests,
        todayTests,
        testTypeCount: testTypeStats.length
      });

      const newStats = {
        overview: {
          totalUsers: totalUsers || 0,
          totalTests: totalTests || 0,
          todayUsers: todayTests || 0  // 这里用今日测试数作为今日用户数的近似
        },
        testTypes: testTypeStats || []
      };
      
      console.log('设置系统统计状态:', newStats);
      setSystemStats(newStats);
      
      console.log('系统统计设置完成');
    } catch (error) {
      console.error('获取系统统计失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // 设置默认值避免页面崩溃
      const defaultStats = {
        overview: {
          totalUsers: 0,
          totalTests: 0,
          todayUsers: 0
        },
        testTypes: []
      };
      
      console.log('设置默认系统统计:', defaultStats);
      setSystemStats(defaultStats);
    }
  };

  // 获取测试记录
  const loadTestResults = async () => {
    try {
      console.log('开始加载测试记录...');
      
      // 首先执行简单查询测试
      const { data: simpleData, error: simpleError } = await supabase
        .from('test_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (simpleError) {
        console.error('简单查询失败:', simpleError);
        throw simpleError;
      }
      
      console.log(`简单查询成功，获取到 ${simpleData ? simpleData.length : 0} 条记录`);

      if (!simpleData || simpleData.length === 0) {
        console.log('没有找到测试记录');
        setTestResults([]);
        return;
      }

      // 获取每个记录的详细结果和用户信息
      console.log('开始获取详细信息...');
      const resultsWithDetails = await Promise.all(
        (simpleData || []).map(async (record) => {
          try {
            console.log(`处理记录 ${record.id}...`);
            
            // 获取详细测试结果
            const { data: details } = await supabase
              .from('test_results')
              .select('category, item, rating')
              .eq('record_id', record.id);

            // 获取用户信息
            const { data: userData } = await supabase
              .from('users')
              .select('nickname')
              .eq('id', record.user_id_text)
              .single();

            const result = {
              ...record,
              nickname: userData?.nickname || '匿名用户',
              test_results: details || []
            };
            
            console.log(`记录 ${record.id} 处理完成，昵称: ${result.nickname}`);
            return result;
          } catch (detailError) {
            console.error(`获取记录 ${record.id} 的详细信息失败:`, detailError);
            return {
              ...record,
              nickname: '匿名用户',
              test_results: []
            };
          }
        })
      );

      console.log(`所有记录处理完成，共 ${resultsWithDetails.length} 条`);
      setTestResults(resultsWithDetails);
    } catch (error) {
      console.error('获取测试记录失败:', error);
    }
  };

  // 获取用户IP地址
  const loadUserIPs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_ips')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(50);

      if (error) throw error;

      setUserIPs(data || []);
    } catch (error) {
      console.error('获取用户IP失败:', error);
    }
  };

  // 查看测试记录详情
  const viewTestDetails = async (record) => {
    console.log('查看测试记录详情:', record);
    
    try {
      // 获取完整的测试记录详情
      const { data: recordDetails, error: recordError } = await supabase
        .from('test_records')
        .select('*')
        .eq('id', record.id)
        .single();
      
      if (recordError) {
        throw new Error(`获取测试记录失败: ${recordError.message}`);
      }
      
      if (!recordDetails) {
        throw new Error('测试记录不存在');
      }
      
      // 获取详细的测试结果
      const { data: testResults, error: resultsError } = await supabase
        .from('test_results')
        .select('category, item, rating')
        .eq('record_id', record.id);
      
      if (resultsError) {
        throw new Error(`获取测试结果失败: ${resultsError.message}`);
      }
      
      // 获取用户信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', recordDetails.user_id_text)
        .single();
      
      if (userError) {
        console.warn('获取用户信息失败:', userError);
      }
      
      const completeRecord = {
        ...recordDetails,
        nickname: userData?.nickname || '匿名用户',
        test_results: testResults || []
      };
      
      console.log('完整的测试记录详情:', completeRecord);
      
      // 打开详情对话框
      setSelectedRecord(completeRecord);
      setOpenDetailsDialog(true);
      
    } catch (error) {
      console.error('查看测试记录详情失败:', error);
      setSnackbarMessage('获取详情失败: ' + error.message);
      setSnackbarOpen(true);
    }
  };

  // 删除测试记录
  const deleteTestRecord = async (recordId) => {
    if (!window.confirm('确定要删除这条测试记录吗？此操作不可恢复。')) {
      return;
    }

    try {
      // 删除相关的测试结果
      const { error: deleteResultsError } = await supabase
        .from('test_results')
        .delete()
        .eq('record_id', recordId);

      if (deleteResultsError) throw deleteResultsError;

      // 删除测试记录
      const { error: deleteRecordError } = await supabase
        .from('test_records')
        .delete()
        .eq('id', recordId);

      if (deleteRecordError) throw deleteRecordError;

      // 重新加载数据
      await loadTestResults();
      alert('删除成功！');
    } catch (error) {
      console.error('删除测试记录失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  // 登录页面
  if (!admin && !loading) {
    return (
      <ThemeProvider theme={adminTheme}>
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h4" align="center" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
              M-Profile Lab 管理后台
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              请输入管理员账户信息登录
            </Typography>
            
            {loginError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {loginError}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="用户名"
                variant="outlined"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="密码"
                type="password"
                variant="outlined"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                margin="normal"
                required
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '登录'}
              </Button>
            </form>

            <Typography variant="body2" align="center" color="text.secondary">
              默认管理员账户：admin / admin123
            </Typography>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  // 加载状态
  if (loading || !admin) {
    return (
      <ThemeProvider theme={adminTheme}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress size={60} />
        </Container>
      </ThemeProvider>
    );
  }

  // 打开对应的测试页面
  const openTestPage = (record) => {
    console.log('打开测试页面:', record);
    
    // 构建测试页面的URL
    const testType = record.test_type;
    const userId = record.user_id_text;
    const recordId = record.id;
    const nickname = record.nickname || '匿名用户';
    
    // 根据测试类型确定页面URL
    let pageUrl;
    switch (testType) {
      case 'female':
        pageUrl = '/female.html';
        break;
      case 'male':
        pageUrl = '/male.html';
        break;
      case 's':
        pageUrl = '/s.html';
        break;
      case 'lgbt':
        pageUrl = '/lgbt.html';
        break;
      default:
        pageUrl = '/index.html';
    }
    
    // 构建查询参数
    const params = new URLSearchParams({
      userId: userId,
      recordId: recordId,
      nickname: nickname,
      mode: 'view', // 查看模式
      admin: 'true' // 管理员查看模式
    });
    
    const fullUrl = `${pageUrl}?${params.toString()}`;
    
    console.log('打开测试页面URL:', fullUrl);
    
    // 在新标签页中打开
    window.open(fullUrl, '_blank');
    
    // 显示友好的提示消息
    setSnackbarMessage(`正在打开 ${testType} 测试页面...`);
    setSnackbarOpen(true);
  };

  // 主管理界面
  return (
    <ThemeProvider theme={adminTheme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* 顶部导航栏 */}
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  M-Profile Lab 管理后台
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                  <Chip 
                    icon={databaseStatus.connected ? <div style={{width: 8, height: 8, backgroundColor: '#4caf50', borderRadius: '50%'}} /> : <div style={{width: 8, height: 8, backgroundColor: '#f44336', borderRadius: '50%'}} />} 
                    label={databaseStatus.connected ? '数据库已连接' : '数据库未连接'} 
                    color={databaseStatus.connected ? "success" : "error"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    icon={<PeopleIcon />} 
                    label={`欢迎，${admin.username}`} 
                    color="secondary"
                  />
                </Box>
            <Button
              color="inherit"
              startIcon={<ExitToAppIcon />}
              onClick={handleLogout}
            >
              退出
            </Button>
          </Toolbar>
        </AppBar>

        {/* 主内容区域 */}
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
          {/* 标签导航 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant={selectedTab === 0 ? "contained" : "outlined"}
                startIcon={<DashboardIcon />}
                onClick={() => setSelectedTab(0)}
              >
                仪表板
              </Button>
              <Button
                variant={selectedTab === 1 ? "contained" : "outlined"}
                startIcon={<AssessmentIcon />}
                onClick={() => setSelectedTab(1)}
              >
                测评记录
              </Button>
              <Button
                variant={selectedTab === 2 ? "contained" : "outlined"}
                startIcon={<LocationIcon />}
                onClick={() => setSelectedTab(2)}
              >
                IP地址
              </Button>
            </Box>
          </Box>

          {/* 仪表板内容 */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                系统仪表板
              </Typography>
              
              {/* 统计卡片 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            总用户数
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {systemStats?.overview?.totalUsers || 0}
                          </Typography>
                        </Box>
                        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            总测试数
                          </Typography>
                          <Typography variant="h4" color="secondary">
                            {systemStats?.overview?.totalTests || 0}
                          </Typography>
                        </Box>
                        <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            今日测试
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {systemStats?.overview?.todayUsers || 0}
                          </Typography>
                        </Box>
                        <BarChartIcon sx={{ fontSize: 40, color: 'success.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* 数据库状态显示 */}
          {databaseStatus.errors.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                  <CardContent>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      ⚠️ 数据库连接问题
                    </Typography>
                    {databaseStatus.errors.map((error, index) => (
                      <Typography key={index} variant="body2" color="warning.dark" sx={{ mb: 1 }}>
                        • {error}
                      </Typography>
                    ))}
                    <Typography variant="body2" color="warning.dark" sx={{ mt: 2 }}>
                      请检查环境变量配置：VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* 测试类型分布 */}
          <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        测试类型分布
                      </Typography>
                      <List dense>
                        {(systemStats?.testTypes || []).map((stat, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <AssessmentIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={
                                stat.test_type === 'female' ? '女M测试' :
                                stat.test_type === 'male' ? '男M测试' :
                                stat.test_type === 's' ? 'S型测试' : 'LGBT+测试'
                              }
                              secondary={`${stat.count} 次测试`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        快速操作
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={loadDashboardData}
                          disabled={statsLoading}
                        >
                          刷新数据
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<AssessmentIcon />}
                          onClick={() => setSelectedTab(1)}
                        >
                          查看测评记录
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<LocationIcon />}
                          onClick={() => setSelectedTab(2)}
                        >
                          查看IP地址
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* 测评记录内容 */}
          {selectedTab === 1 && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                测评记录管理
              </Typography>
              
              {/* 快捷操作栏 */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DashboardIcon />}
                  onClick={() => {
                    // 跳转到对应的测试页面进行新测试
                    const testTypes = ['female', 'male', 's', 'lgbt'];
                    const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
                    window.open(`/${randomType}.html`, '_blank');
                  }}
                >
                  新建测试
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AssessmentIcon />}
                  onClick={() => {
                    // 导出当前显示的数据
                    const dataToExport = testResults.map(record => ({
                      id: record.id,
                      userId: record.user_id_text,
                      nickname: record.nickname,
                      testType: record.test_type,
                      resultCount: record.test_results?.length || 0,
                      createdAt: record.created_at
                    }));
                    
                    const jsonData = JSON.stringify(dataToExport, null, 2);
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `test_records_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    setSnackbarMessage('数据导出成功');
                    setSnackbarOpen(true);
                  }}
                >
                  导出数据
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BarChartIcon />}
                  onClick={() => {
                    // 显示数据统计
                    const stats = {
                      total: testResults.length,
                      byType: {},
                      byDate: {}
                    };
                    
                    testResults.forEach(record => {
                      // 按类型统计
                      stats.byType[record.test_type] = (stats.byType[record.test_type] || 0) + 1;
                      
                      // 按日期统计（简化）
                      const date = new Date(record.created_at).toLocaleDateString();
                      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
                    });
                    
                    let message = `数据统计：

总记录数: ${stats.total}

按类型分布:
`;
                    Object.entries(stats.byType).forEach(([type, count]) => {
                      const typeName = type === 'female' ? '女M测试' : 
                                     type === 'male' ? '男M测试' : 
                                     type === 's' ? 'S型测试' : 'LGBT+测试';
                      message += `${typeName}: ${count}
`;
                    });
                    
                    alert(message);
                  }}
                >
                  数据统计
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>用户ID</TableCell>
                      <TableCell>测试类型</TableCell>
                      <TableCell>用户昵称</TableCell>
                      <TableCell>完成度</TableCell>
                      <TableCell>测试时间</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                              正在加载测试数据...
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : testResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              暂无测试数据
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              系统中还没有任何测试记录
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              提示：确保用户已完成测试并保存了数据
                            </Typography>
                            {databaseStatus.connected === false && (
                              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                数据库连接失败，请检查配置
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      testResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>{result.user_id_text}</TableCell>
                          <TableCell>
                            <Chip 
                              label={
                                result.test_type === 'female' ? '女M测试' :
                                result.test_type === 'male' ? '男M测试' :
                                result.test_type === 's' ? 'S型测试' : 'LGBT+测试'
                              }
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{result.nickname || '匿名用户'}</TableCell>
                          <TableCell>
                            {result.test_results?.length || 0} 项结果
                          </TableCell>
                          <TableCell>{new Date(result.created_at).toLocaleString('zh-CN')}</TableCell>
                          <TableCell>
                            <IconButton 
                              color="primary" 
                              onClick={() => viewTestDetails(result)}
                              title="查看详情"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => deleteTestRecord(result.id)}
                              title="删除记录"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* IP地址内容 */}
          {selectedTab === 2 && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                IP地址管理
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>用户ID</TableCell>
                      <TableCell>IP地址</TableCell>
                      <TableCell>地理位置</TableCell>
                      <TableCell>设备信息</TableCell>
                      <TableCell>最后访问</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell>{ip.user_id}</TableCell>
                        <TableCell>{ip.ip_address}</TableCell>
                        <TableCell>
                          {ip.country && ip.city ? `${ip.country} - ${ip.city}` : '未知'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ip.device_type || '未知'} / {ip.browser || '未知'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ip.os || '未知'}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(ip.last_seen).toLocaleString('zh-CN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Container>
      </Box>

      {/* 测试记录详情对话框 */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          测试记录详情
          <IconButton
            aria-label="close"
            onClick={() => setOpenDetailsDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              {/* 页面操作提示 */}
              <Alert 
                severity="info" 
                sx={{ mb: 3 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => openTestPage(selectedRecord)}
                  >
                    立即打开
                  </Button>
                }
              >
                点击"打开测试页面"可以查看完整的测试结果和可视化报告
              </Alert>

              {/* 基本信息 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      基本信息
                    </Typography>
                    <Chip 
                      label={
                        selectedRecord.test_type === 'female' ? '女M测试' :
                        selectedRecord.test_type === 'male' ? '男M测试' :
                        selectedRecord.test_type === 's' ? 'S型测试' : 'LGBT+测试'
                      }
                      color="primary"
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        记录ID
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {selectedRecord.id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        用户ID
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {selectedRecord.user_id_text}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        用户昵称
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedRecord.nickname}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        测试结果数
                      </Typography>
                      <Typography variant="body1" color="primary" fontWeight="bold">
                        {selectedRecord.test_results?.length || 0} 项
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        创建时间
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedRecord.created_at).toLocaleString('zh-CN')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        完成度
                      </Typography>
                      <Typography variant="body1" color={selectedRecord.test_results?.length > 0 ? "success.main" : "text.secondary"}>
                        {selectedRecord.test_results?.length > 0 ? '已完成' : '未完成'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 测试结果详情 */}
              {selectedRecord.test_results && selectedRecord.test_results.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" color="primary">
                        测试结果详情 ({selectedRecord.test_results.length} 项)
                      </Typography>
                      <Chip 
                        label={`平均分: ${calculateAverageScore(selectedRecord.test_results)}`}
                        color="info"
                      />
                    </Box>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>类别</strong></TableCell>
                            <TableCell><strong>项目</strong></TableCell>
                            <TableCell><strong>评分</strong></TableCell>
                            <TableCell><strong>操作</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedRecord.test_results.map((result, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{result.category}</TableCell>
                              <TableCell>{result.item}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={result.rating}
                                  color={getRatingColor(result.rating)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton 
                                  size="small"
                                  onClick={() => {
                                    // 可以添加单独项目的详情查看
                                    setSnackbarMessage(`查看项目: ${result.category} - ${result.item}`);
                                    setSnackbarOpen(true);
                                  }}
                                  title="查看项目详情"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* 报告数据 */}
              {selectedRecord.report_data && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      报告数据
                    </Typography>
                    <Box sx={{ 
                      backgroundColor: 'rgba(0,0,0,0.05)', 
                      p: 2, 
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      maxHeight: 200,
                      overflow: 'auto'
                    }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedRecord.report_data, null, 2)}
                      </pre>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* 操作提示 */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    快捷操作
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        // 重新加载这个记录的详情
                        viewTestDetails(selectedRecord);
                      }}
                    >
                      刷新详情
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => {
                        if (window.confirm('确定要删除这条测试记录吗？此操作不可恢复。')) {
                          deleteTestRecord(selectedRecord.id);
                          setOpenDetailsDialog(false);
                        }
                      }}
                    >
                      删除记录
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)} color="primary">
            关闭
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            onClick={() => {
              // 可以在这里添加导出功能
              console.log('导出测试记录:', selectedRecord);
              setSnackbarMessage('导出功能开发中...');
              setSnackbarOpen(true);
            }} 
            color="secondary"
            variant="outlined"
          >
            导出
          </Button>
          <Button 
            onClick={() => {
              // 打开对应的测试页面
              openTestPage(selectedRecord);
              setOpenDetailsDialog(false);
            }} 
            color="primary"
            variant="contained"
            startIcon={<AssessmentIcon />}
          >
            打开测试页面
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.includes('失败') || snackbarMessage.includes('错误') ? "error" : "success"}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default AdminAppSimple;