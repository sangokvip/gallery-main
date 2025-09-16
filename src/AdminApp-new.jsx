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
import { supabase } from './utils/supabase'
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

// 简单的管理员API（基于test-stats-fix.html的成功逻辑）
const simpleAdminApi = {
  // 获取系统统计 - 完全重写，使用test-stats-fix.html的成功方法
  async getSystemStats() {
    try {
      console.log('🔄 开始获取系统统计数据（新方法）...');
      
      // 基础统计查询 - 使用test-stats-fix.html的成功逻辑
      const queries = [
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('test_records').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('gallery_images').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }).gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('test_records').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ];
      
      console.log('📊 执行统计查询...');
      const results = await Promise.allSettled(queries);
      
      // 提取计数结果
      const totalUsers = results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0;
      const totalTests = results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0;
      const totalMessages = results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0;
      const totalImages = results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0;
      const todayUsers = results[4].status === 'fulfilled' ? (results[4].value.count || 0) : 0;
      const todayTests = results[5].status === 'fulfilled' ? (results[5].value.count || 0) : 0;
      
      console.log('✅ 基础统计完成:', {
        totalUsers, totalTests, totalMessages, totalImages, todayUsers, todayTests
      });
      
      // 获取测试类型分布
      let testTypeStats = [];
      try {
        const { data, error } = await supabase
          .from('test_records')
          .select('test_type, count(*)')
          .group('test_type');
        
        if (!error && data && data.length > 0) {
          testTypeStats = data.map(item => ({
            name: item.test_type,
            count: parseInt(item.count) || 0
          }));
          console.log('📈 测试类型统计:', testTypeStats);
        }
      } catch (error) {
        console.warn('⚠️ 获取测试类型统计失败:', error);
      }
      
      // 获取地理位置统计
      let geoStats = [];
      try {
        const { data, error } = await supabase
          .from('user_ips')
          .select('country, COUNT(*) as count')
          .not('country', 'is', null)
          .group('country')
          .order('count', { ascending: false })
          .limit(10);
        
        if (!error && data && data.length > 0) {
          geoStats = data;
          console.log('🌍 地理位置统计:', geoStats);
        }
      } catch (error) {
        console.warn('⚠️ 获取地理位置统计失败:', error);
      }
      
      console.log('🎉 系统统计获取完成！');
      
      return {
        overview: {
          totalUsers,
          totalTests,
          totalMessages,
          totalImages,
          todayUsers,
          todayTests
        },
        testTypes: testTypeStats,
        weeklyTrends: [],
        geoStats: geoStats
      };
      
    } catch (error) {
      console.error('❌ 获取系统统计失败:', error);
      
      // 如果主要方法失败，尝试备用方法
      console.log('🔄 尝试备用统计方法...');
      try {
        // 使用更简单的查询方法
        const { data: testRecords, count: testCount } = await supabase
          .from('test_records')
          .select('id', { count: 'exact' })
          .limit(1);
        
        const { data: users, count: userCount } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .limit(1);
        
        const { data: messages, count: messageCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .limit(1);
        
        console.log('✅ 备用方法成功:', {
          totalTests: testCount || 0,
          totalUsers: userCount || 0,
          totalMessages: messageCount || 0
        });
        
        return {
          overview: {
            totalUsers: userCount || 0,
            totalTests: testCount || 0,
            totalMessages: messageCount || 0,
            totalImages: 0,
            todayUsers: 0,
            todayTests: 0
          },
          testTypes: [],
          weeklyTrends: [],
          geoStats: []
        };
        
      } catch (backupError) {
        console.error('❌ 备用方法也失败:', backupError);
        
        // 返回默认值
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
    }
  },

  // 获取所有测试记录 - 简化版本
  async getAllTestResults(filters = {}, limit = 50, offset = 0) {
    try {
      console.log('🔄 开始获取测试记录...');
      
      let query = supabase
        .from('test_records')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // 应用过滤器
      if (filters.test_type) {
        query = query.eq('test_type', filters.test_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id_text', filters.user_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ 获取测试记录失败:', error);
        throw error;
      }
      
      console.log(`✅ 获取测试记录成功: ${data ? data.length : 0} 条，总计: ${count || 0}`);

      // 如果没有数据，直接返回
      if (!data || data.length === 0) {
        return {
          results: [],
          total: 0
        };
      }

      // 获取用户昵称（简化处理，不阻塞主查询）
      const resultsWithNicknames = await Promise.all(
        data.map(async (record) => {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('nickname')
              .eq('id', record.user_id_text)
              .single();
            
            return {
              ...record,
              nickname: userData?.nickname || '匿名用户'
            };
          } catch (error) {
            console.warn(`⚠️ 获取用户昵称失败: ${record.user_id_text}`, error);
            return {
              ...record,
              nickname: '匿名用户'
            };
          }
        })
      );

      return {
        results: resultsWithNicknames,
        total: count || 0
      };
      
    } catch (error) {
      console.error('❌ 获取测试记录失败:', error);
      throw error;
    }
  },

  // 管理员登录验证
  async login(username, password) {
    try {
      console.log('🔐 管理员登录:', username);
      
      // 简单的管理员验证（实际项目中应该更严格）
      const validAdmins = [
        { id: 1, username: 'admin', password: 'admin123', role: 'super_admin', email: 'admin@mprofile.com' }
      ];
      
      const admin = validAdmins.find(a => a.username === username && a.password === password);
      
      if (!admin) {
        throw new Error('用户名或密码错误');
      }
      
      console.log('✅ 管理员登录成功');
      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      };
      
    } catch (error) {
      console.error('❌ 管理员登录失败:', error);
      throw error;
    }
  },

  // 检查管理员会话
  async checkAdminSession() {
    try {
      // 简单的会话检查
      const adminData = localStorage.getItem('admin_data');
      if (!adminData) {
        return null;
      }
      
      const admin = JSON.parse(adminData);
      console.log('✅ 管理员会话有效');
      return admin;
      
    } catch (error) {
      console.error('❌ 检查管理员会话失败:', error);
      return null;
    }
  },

  // 管理员登出
  async logout() {
    localStorage.removeItem('admin_data');
    console.log('👋 管理员已登出');
  }
};

// 后台管理主组件 - 完全重写
function AdminAppNew() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [systemStats, setSystemStats] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [filters, setFilters] = useState({
    testType: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });
  const navigate = useNavigate();

  // 检查管理员会话
  useEffect(() => {
    checkAdminSession();
  }, []);

  // 加载仪表板数据
  useEffect(() => {
    if (admin) {
      console.log('🎯 管理员已登录，开始加载仪表板数据...');
      loadDashboardData();
    }
  }, [admin]);

  // 检查管理员会话
  const checkAdminSession = async () => {
    try {
      console.log('🔍 检查管理员会话...');
      const adminData = await simpleAdminApi.checkAdminSession();
      console.log('📋 管理员会话检查结果:', adminData ? '已登录' : '未登录');
      setAdmin(adminData);
    } catch (error) {
      console.error('❌ 检查管理员会话失败:', error);
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
      console.log('🔐 执行管理员登录...');
      const adminData = await simpleAdminApi.login(loginForm.username, loginForm.password);
      localStorage.setItem('admin_data', JSON.stringify(adminData));
      setAdmin(adminData);
      console.log('✅ 管理员登录成功');
    } catch (error) {
      console.error('❌ 管理员登录失败:', error);
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 管理员登出
  const handleLogout = async () => {
    try {
      console.log('🚪 执行管理员登出...');
      await simpleAdminApi.logout();
      setAdmin(null);
      navigate('/admin');
      console.log('✅ 管理员登出成功');
    } catch (error) {
      console.error('❌ 管理员登出失败:', error);
    }
  };

  // 加载仪表板数据 - 完全重写
  const loadDashboardData = async () => {
    console.log('🚀 开始加载仪表板数据...');
    setStatsLoading(true);
    setResultsLoading(true);

    try {
      // 1. 加载系统统计（主要数据）
      console.log('📊 步骤1: 加载系统统计...');
      const stats = await simpleAdminApi.getSystemStats();
      console.log('✅ 系统统计加载完成:', stats);
      setSystemStats(stats);

      // 2. 加载测试记录列表
      console.log('📋 步骤2: 加载测试记录...');
      const { results, total } = await simpleAdminApi.getAllTestResults(filters, 20, 0);
      console.log(`✅ 测试记录加载完成: ${results.length} 条，总计: ${total}`);
      setTestResults(results);

      console.log('🎉 仪表板数据加载完成！');
      
    } catch (error) {
      console.error('❌ 加载仪表板数据失败:', error);
      
      // 设置错误状态但不崩溃
      setSystemStats({
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
      });
      setTestResults([]);
      
    } finally {
      setStatsLoading(false);
      setResultsLoading(false);
    }
  };

  // 刷新数据
  const refreshData = async () => {
    console.log('🔄 刷新仪表板数据...');
    await loadDashboardData();
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
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
                            {statsLoading ? (
                              <CircularProgress size={32} />
                            ) : (
                              systemStats?.overview?.totalUsers || 0
                            )}
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
                            {statsLoading ? (
                              <CircularProgress size={32} />
                            ) : (
                              systemStats?.overview?.totalTests || 0
                            )}
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
                            {statsLoading ? (
                              <CircularProgress size={32} />
                            ) : (
                              systemStats?.overview?.todayUsers || 0
                            )}
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
                            {statsLoading ? (
                              <CircularProgress size={32} />
                            ) : (
                              systemStats?.overview?.todayTests || 0
                            )}
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
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
                        <TableCell colSpan={5} align="center">
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* 其他标签页内容 */}
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

          {selectedTab === 3 && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                IP地址管理
              </Typography>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    功能开发中...
                  </Typography>
                  <Typography color="text.secondary">
                    IP地址管理功能正在开发中。
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {selectedTab === 4 && (
            <Box>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                系统操作日志
              </Typography>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    功能开发中...
                  </Typography>
                  <Typography color="text.secondary">
                    系统日志功能正在开发中。
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

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

export default AdminAppNew;