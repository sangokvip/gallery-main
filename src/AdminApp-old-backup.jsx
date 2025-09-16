import React, { useState, useEffect } from 'react'
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
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
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Toolbar,
  AppBar,
  Drawer,
  CssBaseline,
  createTheme,
  ThemeProvider
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { adminApi, analyticsApi } from './utils/adminApi'
import { testRecordsApi, supabase } from './utils/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import './styles/admin-theme.css'

// 后台管理主题
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

// 后台管理主组件
function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const navigate = useNavigate();
  const location = useLocation();

  // 检查管理员会话
  useEffect(() => {
    checkAdminSession();
  }, []);

  // 加载数据
  useEffect(() => {
    if (admin) {
      console.log('管理员已登录，开始加载仪表板数据...');
      loadDashboardData();
    } else {
      console.log('管理员未登录，跳过数据加载');
    }
  }, [admin]);

  // 检查管理员会话
  const checkAdminSession = async () => {
    try {
      console.log('检查管理员会话...');
      const adminData = await adminApi.checkAdminSession();
      console.log('管理员会话检查结果:', adminData ? '已登录' : '未登录');
      setAdmin(adminData);
    } catch (error) {
      console.error('检查管理员会话失败:', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  // 管理员登录
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const adminData = await adminApi.login(loginForm.username, loginForm.password);
      localStorage.setItem('admin_data', JSON.stringify(adminData));
      setAdmin(adminData);
      await adminApi.logAdminAction(adminData.id, 'login_success', 'admin', adminData.id);
    } catch (error) {
      setLoginError(error.message);
      await adminApi.logAdminAction(null, 'login_failed', 'admin', null, {
        username: loginForm.username,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 管理员登出
  const handleLogout = async () => {
    try {
      if (admin) {
        await adminApi.logAdminAction(admin.id, 'logout', 'admin', admin.id);
      }
      adminApi.logout();
      setAdmin(null);
      navigate('/admin');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 加载仪表板数据
  const loadDashboardData = async () => {
    setStatsLoading(true);
    setResultsLoading(true);

    try {
      console.log('开始加载仪表板数据...');
      
      // 首先检查数据库连接
      console.log('检查数据库连接状态...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('test_records')
        .select('id')
        .limit(1);
      
      if (connectionError) {
        console.error('数据库连接测试失败:', connectionError);
        throw new Error(`数据库连接失败: ${connectionError.message}`);
      }
      
      console.log('数据库连接正常');
      
      // 加载系统统计
      console.log('加载系统统计...');
      let stats;
      try {
        stats = await adminApi.getSystemStats();
        console.log('系统统计加载成功:', stats);
        
        // 验证统计数据
        if (stats && stats.overview) {
          console.log('统计概览:', {
            totalUsers: stats.overview.totalUsers,
            totalTests: stats.overview.totalTests,
            totalMessages: stats.overview.totalMessages,
            totalImages: stats.overview.totalImages,
            todayUsers: stats.overview.todayUsers,
            todayTests: stats.overview.todayTests
          });
        }
        
        setSystemStats(stats);
      } catch (statsError) {
        console.error('系统统计加载失败:', statsError);
        throw statsError;
      }

      // 加载测试记录 - 使用更宽松的查询条件
      console.log('加载测试记录，过滤器:', filters);
      
      // 首先尝试不加任何过滤器的简单查询
      console.log('尝试简单查询...');
      const { data: simpleData, error: simpleError, count: simpleCount } = await supabase
        .from('test_records')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (simpleError) {
        console.error('简单查询失败:', simpleError);
        throw simpleError;
      }
      
      console.log(`简单查询成功: ${simpleData.length} 条记录，总计: ${simpleCount}`);
      
      // 如果简单查询成功，再使用管理员API的完整查询
      if (simpleData && simpleData.length > 0) {
        console.log('使用管理员API进行完整查询...');
        const { results, total } = await adminApi.getAllTestResults(filters, 20, 0);
        console.log(`管理员查询成功: ${results.length} 条记录，总计: ${total}`);
        setTestResults(results);
      } else {
        console.log('数据库中没有测试记录');
        setTestResults([]);
      }

      // 加载IP统计
      console.log('加载IP统计...');
      const ipStats = await adminApi.getAllIPsStats(20, 0);
      console.log('IP统计加载成功:', ipStats);
      setUserIPs(ipStats);

      // 加载管理员日志
      console.log('加载管理员日志...');
      const { data: logs } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log(`管理员日志加载成功: ${logs?.length || 0} 条`);
      setAdminLogs(logs || []);
      
      console.log('仪表板数据加载完成');
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // 检查是否是数据库未配置的错误
      if (error.message === 'DATABASE_NOT_CONFIGURED') {
        console.warn('数据库未配置，显示警告状态');
        // 设置一个特殊的状态来显示数据库未配置的警告
        setSystemStats({
          overview: { 
            totalUsers: -1, // 使用-1作为特殊标记
            totalTests: -1, 
            totalMessages: -1, 
            totalImages: -1, 
            todayUsers: -1, 
            todayTests: -1 
          },
          testTypes: [],
          weeklyTrends: [],
          geoStats: [],
          databaseNotConfigured: true
        });
      } else {
        // 显示详细的错误提示
        const errorMessage = `加载数据失败: ${error.message}\n\n错误详情:\n${error.stack || '无堆栈信息'}`;
        console.error(errorMessage);
        
        // 更新UI显示错误状态
        setTestResults([]);
        setSystemStats({
          overview: { totalUsers: 0, totalTests: 0, totalMessages: 0, totalImages: 0, todayUsers: 0, todayTests: 0 },
          testTypes: [],
          weeklyTrends: [],
          geoStats: []
        });
      }
    } finally {
      setStatsLoading(false);
      setResultsLoading(false);
    }
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // 查看测试记录详情
  const viewTestDetails = async (recordId) => {
    try {
      const recordDetails = await testRecordsApi.getTestRecordDetails(recordId);
      // 这里可以打开详情对话框或跳转到详情页面
      console.log('测试记录详情:', recordDetails);
    } catch (error) {
      console.error('获取测试记录详情失败:', error);
    }
  };

  // 删除测试记录
  const deleteTestRecord = async (recordId) => {
    if (!window.confirm('确定要删除这条测试记录吗？此操作不可恢复。')) {
      return;
    }

    try {
      await adminApi.deleteTestRecord(recordId, admin.id);
      // 重新加载数据
      await loadDashboardData();
    } catch (error) {
      console.error('删除测试记录失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  // 刷新数据
  const refreshData = async () => {
    await loadDashboardData();
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

  // 主管理界面
  return (
    <ThemeProvider theme={adminTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* 顶部导航栏 */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              M-Profile Lab 管理后台
            </Typography>
            <Chip 
              icon={<PeopleIcon />} 
              label={`欢迎，${admin.username}`} 
              color="secondary"
              sx={{ mr: 2 }}
            />
            <Button
              color="inherit"
              startIcon={<ExitToAppIcon />}
              onClick={handleLogout}
            >
              退出
            </Button>
          </Toolbar>
        </AppBar>

        {/* 侧边导航栏 */}
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem button onClick={() => setSelectedTab(0)} selected={selectedTab === 0}>
                <ListItemIcon><DashboardIcon color={selectedTab === 0 ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary="仪表板" />
              </ListItem>
              <ListItem button onClick={() => setSelectedTab(1)} selected={selectedTab === 1}>
                <ListItemIcon><AssessmentIcon color={selectedTab === 1 ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary="测评记录" />
              </ListItem>
              <ListItem button onClick={() => setSelectedTab(2)} selected={selectedTab === 2}>
                <ListItemIcon><PeopleIcon color={selectedTab === 2 ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary="用户分析" />
              </ListItem>
              <ListItem button onClick={() => setSelectedTab(3)} selected={selectedTab === 3}>
                <ListItemIcon><LocationIcon color={selectedTab === 3 ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary="IP地址" />
              </ListItem>
              <ListItem button onClick={() => setSelectedTab(4)} selected={selectedTab === 4}>
                <ListItemIcon><BarChartIcon color={selectedTab === 4 ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary="系统日志" />
              </ListItem>
              {admin.role === 'super_admin' && (
                <ListItem button onClick={() => setSelectedTab(5)} selected={selectedTab === 5}>
                  <ListItemIcon><SettingsIcon color={selectedTab === 5 ? 'primary' : 'inherit'} /></ListItemIcon>
                  <ListItemText primary="系统设置" />
                </ListItem>
              )}
            </List>
          </Box>
        </Drawer>

        {/* 主内容区域 */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
            ml: '240px',
            mt: '64px'
          }}
        >
          {/* 仪表板标签页 */}
          {selectedTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  系统仪表板
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={refreshData}
                  disabled={statsLoading}
                >
                  刷新数据
                </Button>
              </Box>

              {/* 统计卡片 */}
              {systemStats?.databaseNotConfigured && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    ⚠️ 数据库未配置
                  </Typography>
                  <Typography variant="body2">
                    系统无法连接到数据库，请检查环境变量配置：
                  </Typography>
                  <ul>
                    <li>VITE_SUPABASE_URL</li>
                    <li>VITE_SUPABASE_ANON_KEY</li>
                  </ul>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => window.open('/env-check.html', '_blank')}
                  >
                    🔧 环境检查工具
                  </Button>
                </Alert>
              )}
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            总用户数
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {systemStats?.overview?.totalUsers === -1 ? '未配置' : (systemStats?.overview?.totalUsers || 0)}
                          </Typography>
                        </Box>
                        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            总测试数
                          </Typography>
                          <Typography variant="h4" color="secondary">
                            {systemStats?.overview?.totalTests === -1 ? '未配置' : (systemStats?.overview?.totalTests || 0)}
                          </Typography>
                        </Box>
                        <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            今日用户
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {systemStats?.overview?.todayUsers === -1 ? '未配置' : (systemStats?.overview?.todayUsers || 0)}
                          </Typography>
                        </Box>
                        <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            今日测试
                          </Typography>
                          <Typography variant="h4" color="info.main">
                            {systemStats?.overview?.todayTests === -1 ? '未配置' : (systemStats?.overview?.todayTests || 0)}
                          </Typography>
                        </Box>
                        <BarChartIcon sx={{ fontSize: 40, color: 'info.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* 测试类型分布 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        测试类型分布
                      </Typography>
                      {statsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <Box sx={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={systemStats?.testTypes || []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                              >
                                {(systemStats?.testTypes || []).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300'][index % 4]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        地理位置分布
                      </Typography>
                      {statsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <List dense>
                          {(systemStats?.geoStats || []).slice(0, 10).map((stat, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <PublicIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={stat.country || '未知'} 
                                secondary={`${stat.count} 次访问`}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {((stat.count / (systemStats?.geoStats?.reduce((sum, s) => sum + s.count, 0) || 1)) * 100).toFixed(1)}%
                              </Typography>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* 测试记录标签页 */}
          {selectedTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  测评记录管理
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>测试类型</InputLabel>
                    <Select
                      value={filters.testType}
                      onChange={(e) => setFilters({...filters, testType: e.target.value})}
                      label="测试类型"
                    >
                      <MenuItem value="">全部</MenuItem>
                      <MenuItem value="female">女M测试</MenuItem>
                      <MenuItem value="male">男M测试</MenuItem>
                      <MenuItem value="s">S型测试</MenuItem>
                      <MenuItem value="lgbt">LGBT+测试</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={refreshData}
                    disabled={resultsLoading}
                  >
                    刷新
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      console.log('手动触发数据刷新');
                      loadDashboardData();
                    }}
                    disabled={resultsLoading}
                    sx={{ ml: 1 }}
                  >
                    强制刷新
                  </Button>
                </Box>
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
                              {filters.testType 
                                ? `当前筛选条件: ${filters.testType === 'female' ? '女M测试' : 
                                   filters.testType === 'male' ? '男M测试' : 
                                   filters.testType === 's' ? 'S型测试' : 'LGBT+测试'}`
                                : '系统中还没有任何测试记录'
                              }
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              提示：确保用户已完成测试并保存了数据
                            </Typography>
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
                              onClick={() => viewTestDetails(result.id)}
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

          {/* 用户分析标签页 */}
          {selectedTab === 2 && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                用户行为分析
              </Typography>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    功能开发中...
                  </Typography>
                  <Typography color="text.secondary">
                    用户行为分析功能正在开发中，将包括用户活跃度、测试完成率、行为路径分析等功能。
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* IP地址标签页 */}
          {selectedTab === 3 && (
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
                    {userIPs.ips?.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell>{ip.user_id}</TableCell>
                        <TableCell>{ip.ip_address}</TableCell>
                        <TableCell>
                          {ip.country && ip.city ? `${ip.country} - ${ip.city}` : '未知'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ip.device_type} / {ip.browser}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ip.os}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(ip.last_seen).toLocaleString('zh-CN')}</TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          暂无IP地址记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* 系统日志标签页 */}
          {selectedTab === 4 && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                系统操作日志
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>管理员</TableCell>
                      <TableCell>操作</TableCell>
                      <TableCell>目标类型</TableCell>
                      <TableCell>目标ID</TableCell>
                      <TableCell>时间</TableCell>
                      <TableCell>IP地址</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.admin_id}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.action} 
                            color={log.action.includes('delete') ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.target_type || '-'}</TableCell>
                        <TableCell>{log.target_id || '-'}</TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString('zh-CN')}</TableCell>
                        <TableCell>{log.ip_address || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* 系统设置标签页 */}
          {selectedTab === 5 && admin.role === 'super_admin' && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                系统设置
              </Typography>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    超级管理员功能
                  </Typography>
                  <Typography color="text.secondary">
                    系统设置功能正在开发中，将包括系统配置、管理员管理、数据备份等功能。
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AdminApp;