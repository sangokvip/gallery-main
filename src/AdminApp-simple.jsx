import React, { useState, useEffect } from 'react'
import {
  Container, Typography, Paper, Grid, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tabs, Tab, Card, CardContent, List, ListItem, ListItemText, Toolbar, AppBar, Drawer, CssBaseline,
  createTheme, ThemeProvider, IconButton
} from '@mui/material'
import {
  Dashboard as DashboardIcon, People as PeopleIcon, Assessment as AssessmentIcon, ExitToApp as ExitToAppIcon,
  Visibility as VisibilityIcon, BarChart as BarChartIcon, TrendingUp as TrendingUpIcon, Refresh as RefreshIcon,
  DataUsage as DataUsageIcon, Info as InfoIcon
} from '@mui/icons-material'
import { supabase } from './utils/supabase.js'
import './styles/admin-theme.css'

// 简化的管理员API
const simpleAdminApi = {
  // 获取系统统计
  async getSystemStats() {
    try {
      const queries = [
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('test_records').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('gallery_images').select('id', { count: 'exact' })
      ];
      
      const results = await Promise.allSettled(queries);
      
      return {
        overview: {
          totalUsers: results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0,
          totalTests: results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0,
          totalMessages: results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0,
          totalImages: results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0,
          todayUsers: 0,
          todayTests: 0
        },
        testTypes: [],
        weeklyTrends: [],
        geoStats: []
      };
    } catch (error) {
      console.error('获取系统统计失败:', error);
      return {
        overview: { totalUsers: 0, totalTests: 0, totalMessages: 0, totalImages: 0, todayUsers: 0, todayTests: 0 },
        testTypes: [],
        weeklyTrends: [],
        geoStats: []
      };
    }
  },

  // 获取所有测试记录
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

  // 管理员登录验证
  async login(username, password) {
    try {
      console.log('管理员登录:', username);
      const validAdmins = [
        { id: 1, username: 'admin', password: 'admin123', role: 'super_admin', email: 'admin@mprofile.com' }
      ];
      
      const admin = validAdmins.find(a => a.username === username && a.password === password);
      if (!admin) throw new Error('用户名或密码错误');
      
      return { id: admin.id, username: admin.username, email: admin.email, role: admin.role };
    } catch (error) {
      console.error('管理员登录失败:', error);
      throw error;
    }
  },

  // 检查管理员会话
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

  // 管理员登出
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
function AdminAppNew() {
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

  // 检查管理员会话
  useEffect(() => {
    checkAdminSession();
  }, []);

  // 加载仪表板数据
  useEffect(() => {
    if (admin) {
      loadDashboardData();
    }
  }, [admin]);

  // 检查管理员会话
  const checkAdminSession = async () => {
    try {
      const adminData = await simpleAdminApi.checkAdminSession();
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
      const adminData = await simpleAdminApi.login(loginForm.username, loginForm.password);
      localStorage.setItem('admin_data', JSON.stringify(adminData));
      setAdmin(adminData);
    } catch (error) {
      console.error('管理员登录失败:', error);
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 管理员登出
  const handleLogout = async () => {
    try {
      await simpleAdminApi.logout();
      setAdmin(null);
    } catch (error) {
      console.error('管理员登出失败:', error);
    }
  };

  // 加载仪表板数据
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
      console.error('加载仪表板数据失败:', error);
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

  // 查看测试记录详情
  const viewRecordDetails = async (record) => {
    console.log('查看测试记录详情:', record.id);
    setRecordDetailsLoading(true);
    setOpenDetailsDialog(true);

    try {
      // 获取详细的测试结果
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
          ratings: []
        });
        return;
      }

      // 计算统计数据
      const validRatings = testDetails?.filter(d => d.rating && d.rating !== '') || [];
      const avgScore = validRatings.length > 0 ? 
        validRatings.reduce((sum, d) => {
          const scoreMap = { 'SSS': 6, 'SS': 5, 'S': 4, 'Q': 3, 'N': 2, 'W': 1 };
          return sum + (scoreMap[d.rating] || 0);
        }, 0) / validRatings.length : 0;

      setSelectedRecord({
        ...record,
        testDetails: testDetails || [],
        resultCount: testDetails?.length || 0,
        avgScore: avgScore,
        ratings: testDetails?.map(d => d.rating).filter(r => r) || []
      });
    } catch (error) {
      console.error('查看详情失败:', error);
      setSelectedRecord({
        ...record,
        testDetails: [],
        resultCount: 0,
        avgScore: 0,
        ratings: []
      });
    } finally {
      setRecordDetailsLoading(false);
    }
  };

  // 刷新数据
  const refreshData = () => {
    loadDashboardData();
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
                <DashboardIcon color={selectedTab === 0 ? 'primary' : 'inherit'} sx={{ mr: 2 }} />
                <ListItemText primary="仪表板" />
              </ListItem>
              <ListItem button onClick={() => setSelectedTab(1)} selected={selectedTab === 1}>
                <AssessmentIcon color={selectedTab === 1 ? 'primary' : 'inherit'} sx={{ mr: 2 }} />
                <ListItemText primary="测评记录" />
              </ListItem>
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
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" gutterBottom>
                            总消息数
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {statsLoading ? <CircularProgress size={32} /> : (systemStats?.overview?.totalMessages || 0)}
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
                            图库图片
                          </Typography>
                          <Typography variant="h4" color="info.main">
                            {statsLoading ? <CircularProgress size={32} /> : (systemStats?.overview?.totalImages || 0)}
                          </Typography>
                        </Box>
                        <BarChartIcon sx={{ fontSize: 40, color: 'info.main' }} />
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
                      
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main', '& th': { color: 'white', fontWeight: 'bold' } }}>
                              <TableCell>分类</TableCell>
                              <TableCell>测试项目</TableCell>
                              <TableCell align="center">评分</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedRecord.testDetails.map((detail, index) => (
                              <TableRow key={index} hover>
                                <TableCell><strong>{detail.category}</strong></TableCell>
                                <TableCell>{detail.item}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={detail.rating}
                                    sx={{ 
                                      bgcolor: detail.rating === 'SSS' ? '#f44336' :
                                              detail.rating === 'SS' ? '#ff9800' :
                                              detail.rating === 'S' ? '#2196f3' :
                                              detail.rating === 'Q' ? '#4caf50' :
                                              detail.rating === 'N' ? '#9e9e9e' : '#607d8b',
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
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AdminAppNew;