// 修复后的AdminApp - 专注于测评结果详情显示
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Container, Typography, Paper, Grid, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Card, CardContent, List, ListItem, ListItemText, Toolbar, AppBar, IconButton, Drawer, CssBaseline
} from '@mui/material'
import {
  Dashboard as DashboardIcon, People as PeopleIcon, Assessment as AssessmentIcon, ExitToApp as ExitToAppIcon,
  Visibility as VisibilityIcon, BarChart as BarChartIcon, TrendingUp as TrendingUpIcon, Refresh as RefreshIcon,
  DataUsage as DataUsageIcon, Info as InfoIcon, Security as SecurityIcon, Settings as SettingsIcon,
  Today as TodayIcon, AccessTime as AccessTimeIcon, TrendingUp as TrendingIcon
} from '@mui/icons-material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { supabase } from './utils/supabase.js'
import AdminPasswordManager from './AdminPasswordManager.jsx'
import AdminNavigation from './AdminNavigation.jsx'

// 简化的管理员API
const simpleAdminApi = {
  async getSystemStats() {
    try {
      console.log('🔄 开始获取增强版系统统计...');
      
      // 获取今天的日期（UTC）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      console.log('📅 今天日期:', todayISO);
      
      // 基础统计查询
      const basicQueries = [
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('test_records').select('id', { count: 'exact' }),
        // 今日用户数
        supabase.from('users').select('id', { count: 'exact' }).gte('created_at', todayISO),
        // 今日测试数
        supabase.from('test_records').select('id', { count: 'exact' }).gte('created_at', todayISO)
      ];
      
      // 各个测试类型的统计
      const testTypeQueries = [
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 'female'),
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 'male'),
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 's'),
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 'lgbt')
      ];
      
      // 今日各个测试类型的统计
      const todayTestTypeQueries = [
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 'female').gte('created_at', todayISO),
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 'male').gte('created_at', todayISO),
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 's').gte('created_at', todayISO),
        supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', 'lgbt').gte('created_at', todayISO)
      ];
      
      console.log('📊 执行所有统计查询...');
      
      // 并行执行所有查询
      const [basicResults, testTypeResults, todayTestTypeResults] = await Promise.all([
        Promise.allSettled(basicQueries),
        Promise.allSettled(testTypeQueries),
        Promise.allSettled(todayTestTypeQueries)
      ]);
      
      // 提取基础统计结果
      const totalUsers = basicResults[0].status === 'fulfilled' ? (basicResults[0].value.count || 0) : 0;
      const totalTests = basicResults[1].status === 'fulfilled' ? (basicResults[1].value.count || 0) : 0;
      const todayUsers = basicResults[2].status === 'fulfilled' ? (basicResults[2].value.count || 0) : 0;
      const todayTests = basicResults[3].status === 'fulfilled' ? (basicResults[3].value.count || 0) : 0;
      
      // 提取各个测试类型的统计
      const testTypeStats = [
        {
          name: '女M测试',
          type: 'female',
          count: testTypeResults[0].status === 'fulfilled' ? (testTypeResults[0].value.count || 0) : 0,
          todayCount: todayTestTypeResults[0].status === 'fulfilled' ? (todayTestTypeResults[0].value.count || 0) : 0,
          color: '#e91e63'
        },
        {
          name: '男M测试',
          type: 'male',
          count: testTypeResults[1].status === 'fulfilled' ? (testTypeResults[1].value.count || 0) : 0,
          todayCount: todayTestTypeResults[1].status === 'fulfilled' ? (todayTestTypeResults[1].value.count || 0) : 0,
          color: '#2196f3'
        },
        {
          name: 'S型测试',
          type: 's',
          count: testTypeResults[2].status === 'fulfilled' ? (testTypeResults[2].value.count || 0) : 0,
          todayCount: todayTestTypeResults[2].status === 'fulfilled' ? (todayTestTypeResults[2].value.count || 0) : 0,
          color: '#ff9800'
        },
        {
          name: 'LGBT+测试',
          type: 'lgbt',
          count: testTypeResults[3].status === 'fulfilled' ? (testTypeResults[3].value.count || 0) : 0,
          todayCount: todayTestTypeResults[3].status === 'fulfilled' ? (todayTestTypeResults[3].value.count || 0) : 0,
          color: '#9c27b0'
        }
      ];
      
      console.log('📈 统计结果:');
      console.log('   总用户数:', totalUsers);
      console.log('   总测试数:', totalTests);
      console.log('   今日用户数:', todayUsers);
      console.log('   今日测试数:', todayTests);
      console.log('   各类型统计:', testTypeStats);
      
      return {
        overview: {
          totalUsers,
          totalTests,
          totalMessages: 0,
          totalImages: 0,
          todayUsers,
          todayTests
        },
        testTypes: testTypeStats,
        weeklyTrends: [],
        geoStats: []
      };
      
    } catch (error) {
      console.error('❌ 获取增强版系统统计失败:', error);
      
      // 如果主要方法失败，返回基础统计
      return {
        overview: { 
          totalUsers: 0, 
          totalTests: 0, 
          totalMessages: 0, 
          totalImages: 0, 
          todayUsers: 0, 
          todayTests: 0 
        },
        testTypes: [],
        weeklyTrends: [],
        geoStats: []
      };
    }
  },

  async getAllTestResults(filters = {}, limit = 50, offset = 0) {
    try {
      let query = supabase.from('test_records').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      
      if (filters.testType) query = query.eq('test_type', filters.testType);
      if (filters.userId) query = query.eq('user_id_text', filters.userId);
      
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      
      if (error) {
        console.error('获取测试记录失败:', error);
        return { results: [], total: 0 };
      }
      
      // 获取用户昵称
      const resultsWithNicknames = await Promise.all(
        (data || []).map(async (record) => {
          try {
            const { data: userData } = await supabase.from('users').select('nickname').eq('id', record.user_id_text).single();
            return { ...record, nickname: userData?.nickname || '匿名用户' };
          } catch {
            return { ...record, nickname: '匿名用户' };
          }
        })
      );
      
      return { results: resultsWithNicknames, total: count || 0 };
    } catch (error) {
      console.error('获取测试记录失败:', error);
      return { results: [], total: 0 };
    }
  },

  async login(username, password) {
    try {
      console.log('管理员登录:', username);
      // 管理员验证 - 更新为新的凭据
      const validAdmins = [
        { id: 1, username: 'adam', password: '[REMOVED]', role: 'super_admin', email: 'adam@mprofile.com' }
      ];
      
      const admin = validAdmins.find(a => a.username === username && a.password === password);
      if (!admin) throw new Error('用户名或密码错误');
      
      return { id: admin.id, username: admin.username, email: admin.email, role: admin.role };
    } catch (error) {
      console.error('管理员登录失败:', error);
      throw error;
    }
  },

  async checkAdminSession() {
    try {
      const adminData = localStorage.getItem('admin_data');
      if (!adminData) return null;
      return JSON.parse(adminData);
    } catch (error) {
      console.error('检查管理员会话失败:', error);
      return null;
    }
  },

  async logout() {
    localStorage.removeItem('admin_data');
    console.log('管理员已登出');
  }
};

// 后台管理主题
const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: '#dc004e', light: '#ff5983', dark: '#9a0036' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
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
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [systemStats, setSystemStats] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [recordDetailsLoading, setRecordDetailsLoading] = useState(false);
  const [filters, setFilters] = useState({ testType: '', dateFrom: '', dateTo: '', searchTerm: '' });

  // 初始化检查
  useEffect(() => {
    initializeApp();
  }, []);

  // 加载数据
  useEffect(() => {
    if (admin && selectedTab === 0) {
      loadDashboardData();
    }
  }, [admin, selectedTab]);

  const initializeApp = async () => {
    try {
      const adminData = await simpleAdminApi.checkAdminSession();
      setAdmin(adminData);
    } catch (error) {
      console.error('初始化失败:', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const adminData = await simpleAdminApi.login(loginForm.username, loginForm.password);
      localStorage.setItem('admin_data', JSON.stringify(adminData));
      setAdmin(adminData);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await simpleAdminApi.logout();
    setAdmin(null);
  };

  const loadDashboardData = async () => {
    setStatsLoading(true);
    setResultsLoading(true);

    try {
      const [stats, testData] = await Promise.all([
        simpleAdminApi.getSystemStats(),
        simpleAdminApi.getAllTestResults(filters, 20, 0)
      ]);

      setSystemStats(stats);
      setTestResults(testData.results);
    } catch (error) {
      console.error('加载数据失败:', error);
      setSystemStats({
        overview: { totalUsers: 0, totalTests: 0, totalMessages: 0, totalImages: 0, todayUsers: 0, todayTests: 0 },
        testTypes: [],
        weeklyTrends: [],
        geoStats: []
      });
      setTestResults([]);
    } finally {
      setStatsLoading(false);
      setResultsLoading(false);
    }
  };

  const viewRecordDetails = async (record) => {
    console.log('查看测试记录详情:', record.id);
    setRecordDetailsLoading(true);
    setOpenDetailsDialog(true);

    try {
      const { data: testDetails, error: detailError } = await supabase
        .from('test_results')
        .select('*')
        .eq('record_id', record.id)
        .order('category', { ascending: true });

      if (detailError) {
        console.error('获取测试详情失败:', detailError);
        setSelectedRecord({
          ...record,
          testDetails: [],
          resultCount: 0,
          avgScore: 0,
          ratings: [],
          groupedDetails: {}
        });
        return;
      }

      const validRatings = testDetails?.filter(d => d.rating && d.rating !== '') || [];
      const avgScore = validRatings.length > 0 ? 
        validRatings.reduce((sum, d) => {
          const scoreMap = { 'SSS': 6, 'SS': 5, 'S': 4, 'Q': 3, 'N': 2, 'W': 1 };
          return sum + (scoreMap[d.rating] || 0);
        }, 0) / validRatings.length : 0;

      // 按评分分组并排序（SSS -> N）
      const groupedDetails = {};
      const ratingOrder = ['SSS', 'SS', 'S', 'Q', 'N', 'W'];
      
      // 初始化分组
      ratingOrder.forEach(rating => {
        groupedDetails[rating] = [];
      });
      
      // 分组数据
      testDetails?.forEach(detail => {
        if (detail.rating && groupedDetails[detail.rating]) {
          groupedDetails[detail.rating].push(detail);
        }
      });

      setSelectedRecord({
        ...record,
        testDetails: testDetails || [],
        resultCount: testDetails?.length || 0,
        avgScore: avgScore,
        ratings: testDetails?.map(d => d.rating).filter(r => r) || [],
        groupedDetails: groupedDetails
      });
    } catch (error) {
      console.error('查看详情失败:', error);
      setSelectedRecord({
        ...record,
        testDetails: [],
        resultCount: 0,
        avgScore: 0,
        ratings: [],
        groupedDetails: {}
      });
    } finally {
      setRecordDetailsLoading(false);
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
              管理员账户：adam / [REMOVED]
            </Typography>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  // 加载状态
  if (loading) {
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
                <DashboardIcon color={selectedTab === 0 ? 'primary' : 'inherit'} sx={{ mr: 2 }} />
                <ListItemText primary="仪表板" />
              </ListItem>
              <ListItem button onClick={() => setSelectedTab(1)} selected={selectedTab === 1}>
                <AssessmentIcon color={selectedTab === 1 ? 'primary' : 'inherit'} sx={{ mr: 2 }} />
                <ListItemText primary="测评记录" />
              </ListItem>
              <ListItem button onClick={() => setSelectedTab(2)} selected={selectedTab === 2}>
                <SecurityIcon color={selectedTab === 2 ? 'primary' : 'inherit'} sx={{ mr: 2 }} />
                <ListItemText primary="密码管理" />
              </ListItem>
              {admin?.role === 'super_admin' && (
                <ListItem button onClick={() => setSelectedTab(3)} selected={selectedTab === 3}>
                  <SettingsIcon color={selectedTab === 3 ? 'primary' : 'inherit'} sx={{ mr: 2 }} />
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
                  onClick={loadDashboardData}
                  disabled={statsLoading}
                >
                  刷新数据
                </Button>
              </Box>

              {/* 快速导航到所有板块 */}
              <AdminNavigation currentAdmin={admin} />

              {/* 今日统计卡片 */}
              <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                📊 今日实时数据
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography sx={{ opacity: 0.8, mb: 1 }} gutterBottom>
                            今日测试用户
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {statsLoading ? <CircularProgress size={32} color="inherit" /> : (systemStats?.overview?.todayUsers || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                            新增用户
                          </Typography>
                        </Box>
                        <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography sx={{ opacity: 0.8, mb: 1 }} gutterBottom>
                            今日测试数量
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {statsLoading ? <CircularProgress size={32} color="inherit" /> : (systemStats?.overview?.todayTests || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                            今日完成
                          </Typography>
                        </Box>
                        <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography sx={{ opacity: 0.8, mb: 1 }} gutterBottom>
                            总用户数
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {statsLoading ? <CircularProgress size={32} color="inherit" /> : (systemStats?.overview?.totalUsers || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                            累计用户
                          </Typography>
                        </Box>
                        <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography sx={{ opacity: 0.8, mb: 1 }} gutterBottom>
                            总测试数
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {statsLoading ? <CircularProgress size={32} color="inherit" /> : (systemStats?.overview?.totalTests || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                            累计测试
                          </Typography>
                        </Box>
                        <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* 各项目测试数量统计 */}
              <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                📈 各项目测试数量统计
              </Typography>
              <Grid container spacing={3}>
                {statsLoading ? (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  </Grid>
                ) : (
                  systemStats?.testTypes?.map((testType, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card 
                        sx={{ 
                          background: `linear-gradient(135deg, ${testType.color} 0%, ${testType.color}aa 100%)`, 
                          color: 'white',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
                          }
                        }}
                        onClick={() => {
                          // 点击可以筛选对应类型的测试记录
                          setFilters({...filters, testType: testType.type});
                          setSelectedTab(1); // 切换到测评记录标签
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography sx={{ opacity: 0.9, mb: 1 }} gutterBottom>
                                {testType.name}
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {testType.count}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                  今日: {testType.todayCount}
                                </Typography>
                                {testType.todayCount > 0 && (
                                  <Chip 
                                    label="+活跃" 
                                    size="small" 
                                    sx={{ 
                                      ml: 1, 
                                      backgroundColor: 'rgba(255,255,255,0.2)', 
                                      color: 'white',
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                            <AssessmentIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>

              {/* 今日活跃度提示 */}
              {!statsLoading && systemStats?.testTypes?.some(type => type.todayCount > 0) && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      '& .MuiAlert-icon': {
                        color: '#1976d2'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        <strong>今日活跃：</strong> 
                        {systemStats?.testTypes?.filter(type => type.todayCount > 0).length} 个项目有新增测试数据
                      </Typography>
                    </Box>
                  </Alert>
                </Box>
              )}

              {/* 原有统计卡片 - 保留作为对比 */}
              <Typography variant="h6" color="text.secondary" sx={{ mt: 4, mb: 2 }}>
                📊 基础数据统计
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            总用户数
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {statsLoading ? <CircularProgress size={32} /> : (systemStats?.overview?.totalUsers || 0)}
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
                            {statsLoading ? <CircularProgress size={32} /> : (systemStats?.overview?.totalTests || 0)}
                          </Typography>
                        </Box>
                        <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* 测评记录标签页 */}
          {selectedTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  测评记录管理
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadDashboardData}
                    disabled={resultsLoading}
                  >
                    刷新
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main', '& th': { color: 'white', fontWeight: 'bold' } }}>
                      <TableCell>记录ID</TableCell>
                      <TableCell>用户ID</TableCell>
                      <TableCell>测试类型</TableCell>
                      <TableCell>用户昵称</TableCell>
                      <TableCell>结果数量</TableCell>
                      <TableCell>测试时间</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
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
                        <TableCell colSpan={7} align="center">
                          <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              暂无测试数据
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              系统中还没有任何测试记录
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      testResults.map((result) => (
                        <TableRow key={result.id} hover>
                          <TableCell>{result.id}</TableCell>
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
                          <TableCell>{result.test_results?.length || 0} 项</TableCell>
                          <TableCell>{new Date(result.created_at).toLocaleString('zh-CN')}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<InfoIcon />}
                              onClick={() => viewRecordDetails(result)}
                            >
                              查看详情
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* 测试记录详情对话框 */}
          <Dialog 
            open={openDetailsDialog} 
            onClose={() => setOpenDetailsDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              测评结果详情
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
                <ExitToAppIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {recordDetailsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : selectedRecord ? (
                <Box>
                  {/* 基本信息 */}
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                      📋 基本信息
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          记录ID
                        </Typography>
                        <Typography variant="body1" fontFamily="monospace">
                          {selectedRecord.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          用户ID
                        </Typography>
                        <Typography variant="body1" fontFamily="monospace">
                          {selectedRecord.user_id_text}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          用户昵称
                        </Typography>
                        <Typography variant="body1">
                          {selectedRecord.nickname || '匿名用户'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          测试类型
                        </Typography>
                        <Chip 
                          label={
                            selectedRecord.test_type === 'female' ? '女M测试' :
                            selectedRecord.test_type === 'male' ? '男M测试' :
                            selectedRecord.test_type === 's' ? 'S型测试' : 'LGBT+测试'
                          }
                          color="primary"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          测试时间
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedRecord.created_at).toLocaleString('zh-CN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          结果数量
                        </Typography>
                        <Typography variant="body1">
                          {selectedRecord.resultCount || 0} 项
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 测试结果详情 */}
                  {selectedRecord.testDetails && selectedRecord.testDetails.length > 0 ? (
                    <Paper elevation={2} sx={{ p: 3 }}>
                      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        📊 测试结果详情
                      </Typography>
                      <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            平均分
                          </Typography>
                          <Typography variant="h5" color="primary">
                            {selectedRecord.avgScore ? selectedRecord.avgScore.toFixed(2) : '0.00'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            评分分布
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {selectedRecord.ratings.map((rating, index) => (
                              <Chip
                                key={index}
                                label={rating}
                                sx={{ 
                                  bgcolor: rating === 'SSS' ? '#f44336' :
                                          rating === 'SS' ? '#ff9800' :
                                          rating === 'S' ? '#2196f3' :
                                          rating === 'Q' ? '#4caf50' :
                                          rating === 'N' ? '#9e9e9e' : '#607d8b',
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                                size="small"
                              />
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {/* 按评分分组显示（SSS -> N） */}
                      {selectedRecord.groupedDetails && Object.keys(selectedRecord.groupedDetails).length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {['SSS', 'SS', 'S', 'Q', 'N', 'W'].map(rating => {
                            const ratingData = selectedRecord.groupedDetails[rating];
                            if (!ratingData || ratingData.length === 0) return null;
                            
                            return (
                              <Paper key={rating} elevation={2} sx={{ borderLeft: 4, borderColor: 
                                rating === 'SSS' ? '#f44336' :
                                rating === 'SS' ? '#ff9800' :
                                rating === 'S' ? '#2196f3' :
                                rating === 'Q' ? '#4caf50' :
                                rating === 'N' ? '#9e9e9e' : '#607d8b'
                              }}>
                                <Box sx={{ p: 2, backgroundColor: 'rgba(25, 118, 210, 0.05)' }}>
                                  <Typography variant="h6" sx={{ 
                                    color: 
                                      rating === 'SSS' ? '#f44336' :
                                      rating === 'SS' ? '#ff9800' :
                                      rating === 'S' ? '#2196f3' :
                                      rating === 'Q' ? '#4caf50' :
                                      rating === 'N' ? '#9e9e9e' : '#607d8b',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}>
                                    <Chip 
                                      label={rating} 
                                      sx={{ 
                                        backgroundColor: 
                                          rating === 'SSS' ? '#f44336' :
                                          rating === 'SS' ? '#ff9800' :
                                          rating === 'S' ? '#2196f3' :
                                          rating === 'Q' ? '#4caf50' :
                                          rating === 'N' ? '#9e9e9e' : '#607d8b',
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    {ratingData.length} 项
                                  </Typography>
                                </Box>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>分类</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>测试项目</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>评分</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {ratingData.map((detail, index) => (
                                        <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                                          <TableCell><strong>{detail.category}</strong></TableCell>
                                          <TableCell>{detail.item}</TableCell>
                                          <TableCell align="center">
                                            <Chip
                                              label={detail.rating}
                                              sx={{ 
                                                backgroundColor: 
                                                  rating === 'SSS' ? '#f44336' :
                                                  rating === 'SS' ? '#ff9800' :
                                                  rating === 'S' ? '#2196f3' :
                                                  rating === 'Q' ? '#4caf50' :
                                                  rating === 'N' ? '#9e9e9e' : '#607d8b',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '12px'
                                              }}
                                              size="small"
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Paper>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  ) : (
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">
                        暂无测试详情数据
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        该测试记录还没有详细的测评结果
                      </Typography>
                    </Paper>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    没有可显示的数据
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDetailsDialog(false)}>
                关闭
              </Button>
            </DialogActions>
          </Dialog>

          {/* 密码管理标签页 */}
          {selectedTab === 2 && admin && (
            <Box>
              {(() => {
                try {
                  return (
                    <AdminPasswordManager 
                      currentAdmin={admin} 
                      onPasswordChange={(newAdminData) => {
                        setAdmin(newAdminData);
                        localStorage.setItem('admin_data', JSON.stringify(newAdminData));
                      }}
                    />
                  );
                } catch (error) {
                  console.error('密码管理组件渲染错误:', error);
                  return (
                    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h6" color="error" align="center">
                          密码管理组件加载失败，请刷新页面重试
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                          错误详情: {error.message}
                        </Typography>
                      </Paper>
                    </Container>
                  );
                }
              })()}
            </Box>
          )}

          {/* 系统设置标签页 */}
          {selectedTab === 3 && admin?.role === 'super_admin' && (
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
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      🔐 管理员信息
                    </Typography>
                    <Paper elevation={1} sx={{ p: 2, backgroundColor: 'rgba(25, 118, 210, 0.05)' }}>
                      <Typography variant="body2">
                        <strong>用户名:</strong> {admin?.username || '未知'}<br/>
                        <strong>角色:</strong> {admin?.role || '未知'}<br/>
                        <strong>邮箱:</strong> {admin?.email || '未知'}<br/>
                        <strong>ID:</strong> {admin?.id || '未知'}
                      </Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<AdminApp />)