import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Chip,
  Avatar,
  Badge,
  Divider,
  Tooltip,
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
  Menu,
  MenuItem,
  Fab,
  Zoom,
  Fade,
  Slide,
  TablePagination,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Today as TodayIcon,
  AccessTime as AccessTimeIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
  Info as InfoIcon,
  OpenInNew as OpenInNewIcon,
  Forum as ForumIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Storage as StorageIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { supabase } from './utils/supabase.js';

// 🎨 现代配色方案 - 玻璃拟态风格
const modernColors = {
  primary: '#6366f1',      // 现代紫色
  secondary: '#8b5cf6',    // 深紫色
  accent: '#06b6d4',       // 青色
  success: '#10b981',      // 绿色
  warning: '#f59e0b',      // 橙色
  error: '#ef4444',        // 红色
  
  // 背景色
  background: {
    main: '#0f172a',       // 深蓝灰背景
    card: '#1e293b',       // 卡片背景
    hover: '#334155',      // 悬停背景
    glass: 'rgba(30, 41, 59, 0.8)' // 玻璃效果
  },
  
  // 文字色
  text: {
    primary: '#f1f5f9',    // 主要文字
    secondary: '#cbd5e1',  // 次要文字
    muted: '#94a3b8'       // 弱化文字
  },
  
  // 边框和分隔线
  border: '#334155',
  divider: '#475569'
};

// 🎨 现代主题配置
const modernTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: modernColors.primary,
      light: '#818cf8',
      dark: '#4f46e5'
    },
    secondary: {
      main: modernColors.secondary,
      light: '#a78bfa',
      dark: '#7c3aed'
    },
    background: {
      default: modernColors.background.main,
      paper: modernColors.background.card
    },
    text: {
      primary: modernColors.text.primary,
      secondary: modernColors.text.secondary
    },
    divider: modernColors.divider
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.025em'
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    }
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: modernColors.background.card,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${modernColors.border}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }
        }
      }
    }
  }
});

// 🎨 自定义样式组件
const GlassCard = styled(Paper)(({ theme }) => ({
  background: 'rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(51, 65, 85, 0.5)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
  }
}));

const GradientCard = styled(Card)(({ gradient, theme }) => ({
  background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
  }
}));

const ModernButton = styled(Button)(({ variant = 'contained', gradient, theme }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.5, 3),
  ...(gradient && {
    background: gradient,
    '&:hover': {
      background: gradient,
      filter: 'brightness(1.1)'
    }
  })
}));

// 🚀 现代管理员应用主组件
function ModernAdminApp() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [systemStats, setSystemStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [filters, setFilters] = useState({ testType: '', dateFrom: '', dateTo: '', searchTerm: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [dashboardRecords, setDashboardRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [recordDetailsLoading, setRecordDetailsLoading] = useState(false);

  // 🎨 现代管理员API
  const modernAdminApi = {
    async getSystemStats() {
      try {
        console.log('🚀 获取现代系统统计...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        // 并行查询所有统计数据
        const [
          { data: users, count: totalUsers },
          { data: tests, count: totalTests },
          { data: todayUsers, count: todayUsersCount },
          { data: todayTests, count: todayTestsCount }
        ] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact' }),
          supabase.from('test_records').select('id', { count: 'exact' }),
          supabase.from('users').select('id', { count: 'exact' }).gte('created_at', todayISO),
          supabase.from('test_records').select('id', { count: 'exact' }).gte('created_at', todayISO)
        ]);
        
        // 获取各类型测试统计
        const testTypes = await Promise.all([
          { name: '女M测试', type: 'female', color: '#ec4899' },
          { name: '男M测试', type: 'male', color: '#3b82f6' },
          { name: 'S型测试', type: 's', color: '#f59e0b' },
          { name: 'LGBT+测试', type: 'lgbt', color: '#8b5cf6' }
        ].map(async (type) => {
          const [{ count: total }, { count: today }] = await Promise.all([
            supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', type.type),
            supabase.from('test_records').select('id', { count: 'exact' }).eq('test_type', type.type).gte('created_at', todayISO)
          ]);
          
          return {
            ...type,
            count: total || 0,
            todayCount: today || 0
          };
        }));
        
        return {
          overview: {
            totalUsers: totalUsers || 0,
            totalTests: totalTests || 0,
            todayUsers: todayUsersCount || 0,
            todayTests: todayTestsCount || 0
          },
          testTypes,
          recentActivity: [],
          weeklyTrends: []
        };
        
      } catch (error) {
        console.error('❌ 获取现代系统统计失败:', error);
        return {
          overview: { totalUsers: 0, totalTests: 0, todayUsers: 0, todayTests: 0 },
          testTypes: [],
          recentActivity: [],
          weeklyTrends: []
        };
      }
    },

    async login(username, password) {
      try {
        const validAdmins = [
          { id: 1, username: 'adam', password: 'Sangok#3', role: 'super_admin', email: 'adam@mprofile.com' }
        ];
        
        const admin = validAdmins.find(a => a.username === username && a.password === password);
        if (!admin) throw new Error('用户名或密码错误');
        
        return admin;
      } catch (error) {
        throw error;
      }
    },

    async getAllTestResults(filters = {}, limit = 50, offset = 0) {
      try {
        console.log('🚀 获取测评记录...', filters);
        
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
    }
  };

  // 🔐 现代认证函数 - 基于admin-minimal.html的成功逻辑
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
        { id: 1, username: 'adam', password: 'Sangok#3', role: 'super_admin', email: 'adam@mprofile.com' }
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

  // 🔐 管理员登录
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      console.log('🔐 执行管理员登录...');
      const adminData = await modernAdminApi.login(loginForm.username, loginForm.password);
      localStorage.setItem('admin_data', JSON.stringify(adminData));
      setAdmin(adminData);
      console.log('✅ 管理员登录成功');
    } catch (error) {
      console.error('❌ 管理员登录失败:', error);
      setLoginError(error.message);
    }
  };

  // 🔐 管理员登出
  const handleLogout = () => {
    console.log('🚪 执行管理员登出...');
    setAdmin(null);
    localStorage.removeItem('admin_data');
    sessionStorage.clear();
    console.log('✅ 管理员登出成功');
  };

  // 🔐 初始化应用 - 验证会话而不是自动登录
  useEffect(() => {
    const initializeApp = () => {
      try {
        console.log('🔍 初始化应用，验证管理员会话...');
        const isValidSession = validateAdminSession();
        
        if (isValidSession) {
          const adminData = JSON.parse(localStorage.getItem('admin_data'));
          setAdmin(adminData);
          console.log('✅ 管理员会话有效，自动登录');
        } else {
          console.log('❌ 管理员会话无效，需要登录');
          setAdmin(null);
        }
      } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // 加载仪表板数据 - 添加会话验证
  useEffect(() => {
    if (admin && selectedTab === 'dashboard') {
      // 双重验证管理员会话仍然有效
      const isValidSession = validateAdminSession();
      if (isValidSession) {
        loadDashboardData();
      } else {
        console.log('❌ 管理员会话验证失败，需要重新登录');
        setAdmin(null);
        localStorage.removeItem('admin_data');
      }
    }
  }, [admin, selectedTab]);

  // 加载测评记录数据 - 添加会话验证
  useEffect(() => {
    if (admin && selectedTab === 'records') {
      // 双重验证管理员会话仍然有效
      const isValidSession = validateAdminSession();
      if (isValidSession) {
        loadTestResults();
      } else {
        console.log('❌ 管理员会话验证失败，需要重新登录');
        setAdmin(null);
        localStorage.removeItem('admin_data');
      }
    }
  }, [admin, selectedTab]);

  const initializeApp = async () => {
    try {
      console.log('🔍 初始化应用，验证管理员会话...');
      const isValidSession = validateAdminSession();
      
      if (isValidSession) {
        const adminData = JSON.parse(localStorage.getItem('admin_data'));
        setAdmin(adminData);
        console.log('✅ 管理员会话有效，自动登录');
      } else {
        console.log('❌ 管理员会话无效，需要登录');
        setAdmin(null);
      }
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setStatsLoading(true);
    try {
      const stats = await modernAdminApi.getSystemStats();
      setSystemStats(stats);
      // 加载最近5条记录用于仪表板展示
      const { results } = await modernAdminApi.getAllTestResults({}, 5, 0);
      setDashboardRecords(results);
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTestResults = async (queryFilters = filters, queryPage = page, queryRpp = rowsPerPage) => {
    setResultsLoading(true);
    try {
      const offset = queryPage * queryRpp;
      const { results, total } = await modernAdminApi.getAllTestResults(queryFilters, queryRpp, offset);
      setTestResults(results);
      setTotalRecords(total);
      console.log(`✅ 加载了 ${results.length} 条测评记录，总计: ${total}`);
    } catch (error) {
      console.error('加载测评记录失败:', error);
      setTestResults([]);
      setTotalRecords(0);
    } finally {
      setResultsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadTestResults(filters, newPage, rowsPerPage);
  };

  const handleRowsPerPageChange = (newRpp) => {
    setRowsPerPage(newRpp);
    setPage(0);
    loadTestResults(filters, 0, newRpp);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(0);
    loadTestResults(newFilters, 0, rowsPerPage);
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // 📱 移动端菜单
  const drawer = (
    <Box sx={{ height: '100%', background: modernColors.background.main }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
        <Typography variant="h6" sx={{ color: modernColors.text.primary, fontWeight: 'bold' }}>
          管理后台
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: modernColors.text.primary }}>
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Divider sx={{ borderColor: modernColors.border }} />
      <List sx={{ px: 1, py: 2 }}>
        {[
          { id: 'dashboard', label: '仪表板', icon: <DashboardIcon />, color: modernColors.primary },
          { id: 'records', label: '测评记录', icon: <AssessmentIcon />, color: modernColors.secondary },
          { id: 'security', label: '安全管理', icon: <SecurityIcon />, color: modernColors.accent },
          { id: 'settings', label: '系统设置', icon: <SettingsIcon />, color: modernColors.text.muted }
        ].map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => {
                setSelectedTab(item.id);
                setMobileOpen(false);
              }}
              selected={selectedTab === item.id}
              sx={{
                borderRadius: '12px',
                mb: 1,
                backgroundColor: selectedTab === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: selectedTab === item.id ? item.color : modernColors.text.secondary,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.05)'
                }
              }}
            >
              <ListItemIcon sx={{ color: selectedTab === item.id ? item.color : modernColors.text.secondary }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={modernTheme}>
      <Box sx={{ minHeight: '100vh', background: modernColors.background.main }}>
        {!admin ? (
          // 🚪 现代登录界面
          <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', py: 4 }}>
            <GlassCard sx={{ maxWidth: 400, width: '100%' }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 1 }}>
                  M-Profile Lab 
                </Typography>
                <Typography variant="body1" sx={{ color: modernColors.text.secondary }}>
                  Y R U HERE?
                </Typography>
              </Box>
              
              {loginError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
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
                  sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px' }}}
                  InputProps={{
                    startAdornment: <PeopleIcon sx={{ mr: 1, color: modernColors.text.muted }} />
                  }}
                />
                <TextField
                  fullWidth
                  label="密码"
                  type="password"
                  variant="outlined"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px' }}}
                  InputProps={{
                    startAdornment: <SecurityIcon sx={{ mr: 1, color: modernColors.text.muted }} />
                  }}
                />
                <ModernButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                  disabled={loading}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : '登录'}
                </ModernButton>
              </form>
              
              <Typography variant="body2" sx={{ color: modernColors.text.muted, textAlign: 'center' }}>
                Life is A Fucking Party
              </Typography>
            </GlassCard>
          </Container>
        ) : (
          // 🚀 现代管理界面
          <Box sx={{ display: 'flex' }}>
            {/* 🎯 现代顶部导航栏 */}
            <AppBar
              position="fixed"
              sx={{
                background: `linear-gradient(135deg, ${modernColors.background.main} 0%, ${modernColors.background.card} 100%)`,
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${modernColors.border}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { md: 'none' } }}
                >
                  <MenuIcon />
                </IconButton>
                
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: modernColors.text.primary, fontWeight: 'bold' }}>
                  M-Profile Lab
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    avatar={<Avatar sx={{ bgcolor: modernColors.primary }}>{admin.username[0]}</Avatar>}
                    label={admin.username}
                    sx={{
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: modernColors.text.primary,
                      border: `1px solid ${modernColors.border}`
                    }}
                  />
                  <Tooltip title="退出登录">
                    <IconButton onClick={handleLogout} sx={{ color: modernColors.text.secondary }}>
                      <ExitToAppIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Toolbar>
            </AppBar>

            {/* 📱 现代侧边导航 - 玻璃拟态风格 */}
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', md: 'block' },
                width: 280,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: 280,
                  background: `linear-gradient(135deg, ${modernColors.background.card} 0%, ${modernColors.background.hover} 100%)`,
                  backdropFilter: 'blur(20px)',
                  borderRight: `1px solid ${modernColors.border}`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              <Toolbar />
              <Box sx={{ p: 2, height: '100%' }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 1 }}>
                    管理后台
                  </Typography>
                  <Typography variant="body2" sx={{ color: modernColors.text.muted }}>
                    Modern Admin Panel
                  </Typography>
                </Box>
                
                <List sx={{ py: 0 }}>
                  {[
                    { id: 'dashboard', label: '仪表板', icon: <DashboardIcon />, color: modernColors.primary },
                    { id: 'records', label: '测评记录', icon: <AssessmentIcon />, color: modernColors.secondary },
                    { id: 'security', label: '安全管理', icon: <SecurityIcon />, color: modernColors.accent },
                    { id: 'settings', label: '系统设置', icon: <SettingsIcon />, color: modernColors.text.muted }
                  ].map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        onClick={() => setSelectedTab(item.id)}
                        selected={selectedTab === item.id}
                        sx={{
                          borderRadius: '12px',
                          backgroundColor: selectedTab === item.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          color: selectedTab === item.id ? item.color : modernColors.text.secondary,
                          '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.08)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: selectedTab === item.id ? item.color : modernColors.text.secondary }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>

                {/* 🔧 管理员工具 - 快速访问 */}
                <Divider sx={{ my: 3, backgroundColor: modernColors.border }} />
                <Typography variant="subtitle2" sx={{ color: modernColors.text.muted, mb: 2, px: 2, fontWeight: '600' }}>
                  🔧 管理员工具
                </Typography>
                <List sx={{ py: 0 }}>
                  {[
                    { label: '极简管理后台', icon: <DashboardIcon />, url: '/admin-minimal.html', color: modernColors.primary },
                    { label: '管理后台测试', icon: <AssessmentIcon />, url: '/admin-new.html', color: modernColors.secondary },
                    { label: '当前实现验证', icon: <SecurityIcon />, url: '/verify-current-admin.html', color: modernColors.accent },
                    { label: '部署指南', icon: <HelpOutlineIcon />, url: '/DEPLOYMENT-GUIDE.html', color: modernColors.text.muted }
                  ].map((item, index) => (
                    <ListItem key={`admin-tool-${index}`} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                        sx={{
                          borderRadius: '12px',
                          backgroundColor: 'transparent',
                          color: item.color,
                          '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.08)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: item.color }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.label} />
                        <OpenInNewIcon sx={{ fontSize: 16, color: modernColors.text.muted, ml: 1 }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Drawer>

            {/* 📱 移动端抽屉 */}
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true
              }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': {
                  width: 280,
                  background: modernColors.background.card,
                  backdropFilter: 'blur(20px)'
                }
              }}
            >
              {drawer}
            </Drawer>

            {/* 🎯 主内容区域 */}
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                background: modernColors.background.main,
                minHeight: '100vh',
                pl: { md: '280px' },
                pt: '64px'
              }}
            >
              <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
                {selectedTab === 'dashboard' && <DashboardView stats={systemStats} loading={statsLoading} onRefresh={loadDashboardData} recentRecords={dashboardRecords} onViewDetails={viewRecordDetails} />}
                {selectedTab === 'records' && 
                  <RecordsView 
                    testResults={testResults}
                    resultsLoading={resultsLoading}
                    onViewDetails={viewRecordDetails}
                    onRefresh={() => loadTestResults(filters, page, rowsPerPage)}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalRecords={totalRecords}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                }
                {selectedTab === 'security' && <SecurityView />}
                {selectedTab === 'settings' && <SettingsView />}

      {/* 测评记录详情对话框 */}
      <RecordDetailsDialog 
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        record={selectedRecord}
        loading={recordDetailsLoading}
      />
              </Container>
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

// 🧭 快速访问按钮组件
function QuickAccessButton({ label, icon, color, url }) {
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="outlined"
      fullWidth
      startIcon={icon}
      onClick={handleClick}
      sx={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        py: 2,
        px: 1,
        fontWeight: '500',
        fontSize: '0.875rem',
        '&:hover': {
          background: `linear-gradient(135deg, ${color}dd 0%, ${color} 100%)`,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 20px ${color}40`
        },
        transition: 'all 0.3s ease',
        textTransform: 'none',
        '& .MuiButton-startIcon': {
          mr: 1
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        {icon}
        <span>{label}</span>
        <OpenInNewIcon sx={{ fontSize: 16, opacity: 0.8 }} />
      </Box>
    </Button>
  );
}

// 🎯 仪表板视图组件
function DashboardView({ stats, loading, onRefresh, recentRecords = [], onViewDetails }) {
  return (
    <Box>
      {/* 🎯 页面标题和操作区 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 1 }}>
            仪表板
          </Typography>
          <Typography variant="body2" sx={{ color: modernColors.text.muted }}>
            实时数据概览与分析
          </Typography>
        </Box>
        <ModernButton
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
          gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : '刷新数据'}
        </ModernButton>
      </Box>

      {/* 🧭 快速导航 - 玻璃卡片 */}
      <GlassCard sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: modernColors.text.primary, mb: 3, fontWeight: '600' }}>
            🧭 快速导航
          </Typography>
          <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 3 }}>
            点击以下链接在新窗口中访问各个功能板块
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="女M测试" 
                icon={<PeopleIcon />} 
                color="#ec4899"
                url="/female.html"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="男M测试" 
                icon={<PeopleIcon />} 
                color="#3b82f6"
                url="/male.html"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="S型测试" 
                icon={<AssessmentIcon />} 
                color="#f59e0b"
                url="/s.html"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="LGBT+测试" 
                icon={<SecurityIcon />} 
                color="#8b5cf6"
                url="/lgbt.html"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="留言板" 
                icon={<ForumIcon />} 
                color="#06b6d4"
                url="/message.html"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="图库" 
                icon={<PhotoLibraryIcon />} 
                color="#10b981"
                url="/gallery.html"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="数据管理" 
                icon={<StorageIcon />} 
                color="#f59e0b"
                url="/data-manager.html"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickAccessButton 
                label="部署指南" 
                icon={<HelpOutlineIcon />} 
                color="#6366f1"
                url="/DEPLOYMENT-GUIDE.html"
              />
            </Grid>
          </Grid>
        </CardContent>
      </GlassCard>

      {/* 📊 今日实时统计 - 玻璃卡片 */}
      <Typography variant="h6" sx={{ color: modernColors.text.primary, mb: 3, fontWeight: '600' }}>
        📊 今日实时数据
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)">
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TodayIcon sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {loading ? <CircularProgress size={32} color="inherit" /> : stats?.overview?.todayUsers || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                今日新增用户
              </Typography>
            </CardContent>
          </GradientCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)">
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AssessmentIcon sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {loading ? <CircularProgress size={32} color="inherit" /> : stats?.overview?.todayTests || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                今日测试数量
              </Typography>
            </CardContent>
          </GradientCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)">
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PeopleIcon sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {loading ? <CircularProgress size={32} color="inherit" /> : stats?.overview?.totalUsers || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                总用户数
              </Typography>
            </CardContent>
          </GradientCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GradientCard gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)">
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 2, opacity: 0.8 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {loading ? <CircularProgress size={32} color="inherit" /> : stats?.overview?.totalTests || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                总测试数
              </Typography>
            </CardContent>
          </GradientCard>
        </Grid>
      </Grid>

      {/* 📈 各项目详细统计 */}
      <Typography variant="h6" sx={{ color: modernColors.text.primary, mb: 3, fontWeight: '600' }}>
        📈 各项目详细统计
      </Typography>
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: modernColors.primary }} />
            </Box>
          </Grid>
        ) : (
          stats?.testTypes?.map((testType, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <GradientCard gradient={`linear-gradient(135deg, ${testType.color} 0%, ${testType.color}aa 100%)`}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {testType.count}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                    {testType.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <TodayIcon sx={{ fontSize: 16, opacity: 0.7 }} />
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      今日: {testType.todayCount}
                    </Typography>
                    {testType.todayCount > 0 && (
                      <Chip
                        label="活跃"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </GradientCard>
            </Grid>
          ))
        )}
      </Grid>

      {/* 📊 详细数据表格 */}
      <Typography variant="h6" sx={{ color: modernColors.text.primary, mb: 3, fontWeight: '600', mt: 4 }}>
        📋 最近测试记录
      </Typography>
      <GlassCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: modernColors.text.secondary, fontWeight: 'bold' }}>测试类型</TableCell>
                <TableCell sx={{ color: modernColors.text.secondary, fontWeight: 'bold' }}>用户</TableCell>
                <TableCell sx={{ color: modernColors.text.secondary, fontWeight: 'bold' }}>完成度</TableCell>
                <TableCell sx={{ color: modernColors.text.secondary, fontWeight: 'bold' }}>时间</TableCell>
                <TableCell sx={{ color: modernColors.text.secondary, fontWeight: 'bold' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: modernColors.text.muted }}>
                    加载中...
                  </TableCell>
                </TableRow>
              ) : recentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: modernColors.text.muted }}>
                    暂无最近测试记录
                  </TableCell>
                </TableRow>
              ) : (
                recentRecords.map((result) => (
                  <TableRow key={result.id} sx={{ '&:hover': { backgroundColor: modernColors.background.hover } }}>
                    <TableCell>
                      <Chip 
                        label={
                          result.test_type === 'female' ? '女M测试' :
                          result.test_type === 'male' ? '男M测试' :
                          result.test_type === 's' ? 'S型测试' : 'LGBT+测试'
                        }
                        sx={{
                          background: result.test_type === 'female' ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' :
                                    result.test_type === 'male' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                                    result.test_type === 's' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                    'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          color: 'white', fontWeight: 'bold', border: 'none'
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: modernColors.text.primary }}>{result.nickname || '匿名用户'}</TableCell>
                    <TableCell sx={{ color: modernColors.text.secondary }}>{result.test_results?.length || 0} 项</TableCell>
                    <TableCell sx={{ color: modernColors.text.muted, fontSize: '0.875rem' }}>
                      {new Date(result.created_at).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <ModernButton variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => onViewDetails(result)} sx={{ minWidth: 'auto' }}>
                        详情
                      </ModernButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
    </Box>
  );
}

// 📊 测评记录视图
function RecordsView({ testResults, resultsLoading, onViewDetails, onRefresh, page, rowsPerPage, totalRecords, onPageChange, onRowsPerPageChange, filters, onFilterChange }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: modernColors.text.primary, fontWeight: 'bold' }}>
            测评记录管理
          </Typography>
          <Typography variant="body2" sx={{ color: modernColors.text.muted, mt: 0.5 }}>
            共 {totalRecords} 条记录
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '12px', color: modernColors.text.primary }, '& .MuiInputLabel-root': { color: modernColors.text.muted }, '& .MuiOutlinedInput-notchedOutline': { borderColor: modernColors.border } }}>
            <InputLabel>测试类型</InputLabel>
            <Select
              value={filters.testType}
              onChange={(e) => onFilterChange('testType', e.target.value)}
              label="测试类型"
            >
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="female">女M测试</MenuItem>
              <MenuItem value="male">男M测试</MenuItem>
              <MenuItem value="s">S型测试</MenuItem>
              <MenuItem value="lgbt">LGBT+测试</MenuItem>
            </Select>
          </FormControl>
          <ModernButton
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={resultsLoading}
          >
            刷新
          </ModernButton>
        </Box>
      </Box>
      
      <GlassCard>
        {resultsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: modernColors.primary }} />
          </Box>
        ) : testResults.length === 0 ? (
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: modernColors.text.secondary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: modernColors.text.secondary, mb: 1 }}>
              暂无测评记录
            </Typography>
            <Typography variant="body2" sx={{ color: modernColors.text.muted }}>
              {filters.testType ? '当前筛选条件下没有记录，请尝试其他筛选' : '系统中还没有任何测评记录'}
            </Typography>
          </CardContent>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    background: `linear-gradient(135deg, ${modernColors.primary} 0%, ${modernColors.secondary} 100%)`,
                    '& th': { 
                      color: 'white', 
                      fontWeight: 'bold',
                      border: 'none',
                      py: 2
                    }
                  }}>
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
                  {testResults.map((result) => (
                    <TableRow 
                      key={result.id}
                      sx={{
                        borderColor: modernColors.border,
                        '&:hover': { backgroundColor: modernColors.background.hover }
                      }}
                    >
                      <TableCell sx={{ color: modernColors.text.primary }}>{result.id}</TableCell>
                      <TableCell sx={{ color: modernColors.text.secondary, fontFamily: 'monospace' }}>
                        {result.user_id_text}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            result.test_type === 'female' ? '女M测试' :
                            result.test_type === 'male' ? '男M测试' :
                            result.test_type === 's' ? 'S型测试' : 'LGBT+测试'
                          }
                          sx={{
                            background: result.test_type === 'female' ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' :
                                      result.test_type === 'male' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                                      result.test_type === 's' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            fontWeight: 'bold',
                            border: 'none'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: modernColors.text.primary }}>
                        {result.nickname || '匿名用户'}
                      </TableCell>
                      <TableCell sx={{ color: modernColors.text.secondary }}>
                        {result.test_results?.length || 0} 项
                      </TableCell>
                      <TableCell sx={{ color: modernColors.text.muted, fontSize: '0.875rem' }}>
                        {new Date(result.created_at).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <ModernButton
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => onViewDetails(result)}
                          sx={{ minWidth: 'auto' }}
                        >
                          查看详情
                        </ModernButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalRecords}
              page={page}
              onPageChange={(e, newPage) => onPageChange(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="每页显示"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 条`}
              sx={{
                color: modernColors.text.secondary,
                borderTop: `1px solid ${modernColors.border}`,
                '& .MuiTablePagination-selectIcon': { color: modernColors.text.muted },
                '& .MuiIconButton-root': { color: modernColors.text.secondary },
                '& .MuiIconButton-root.Mui-disabled': { color: modernColors.text.muted }
              }}
            />
          </>
        )}
      </GlassCard>
    </Box>
  );
}

function SecurityView() {
  return (
    <Box>
      <Typography variant="h4" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 3 }}>
        安全管理
      </Typography>
      <GlassCard>
        <CardContent>
          <Typography variant="body1" sx={{ color: modernColors.text.secondary }}>
            安全管理功能开发中...
          </Typography>
        </CardContent>
      </GlassCard>
    </Box>
  );
}

function SettingsView() {
  return (
    <Box>
      <Typography variant="h4" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 3 }}>
        系统设置
      </Typography>
      <GlassCard>
        <CardContent>
          <Typography variant="body1" sx={{ color: modernColors.text.secondary }}>
            系统设置功能开发中...
          </Typography>
        </CardContent>
      </GlassCard>
    </Box>
  );
}

// 📋 测评记录详情对话框
function RecordDetailsDialog({ open, onClose, record, loading }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: modernColors.background.glass,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${modernColors.border}`,
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${modernColors.primary} 0%, ${modernColors.secondary} 100%)`,
        color: 'white',
        fontWeight: 'bold',
        position: 'relative',
        pb: 2
      }}>
        测评结果详情
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: modernColors.primary }} />
          </Box>
        ) : record ? (
          <Box sx={{ p: 3 }}>
            {/* 基本信息 */}
            <GlassCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 2 }}>
                  📋 基本信息
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                      记录ID
                    </Typography>
                    <Typography variant="body1" sx={{ color: modernColors.text.secondary, fontFamily: 'monospace' }}>
                      {record.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                      用户ID
                    </Typography>
                    <Typography variant="body1" sx={{ color: modernColors.text.secondary, fontFamily: 'monospace' }}>
                      {record.user_id_text}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                      用户昵称
                    </Typography>
                    <Typography variant="body1" sx={{ color: modernColors.text.primary }}>
                      {record.nickname || '匿名用户'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                      测试类型
                    </Typography>
                    <Chip 
                      label={
                        record.test_type === 'female' ? '女M测试' :
                        record.test_type === 'male' ? '男M测试' :
                        record.test_type === 's' ? 'S型测试' : 'LGBT+测试'
                      }
                      sx={{
                        background: record.test_type === 'female' ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' :
                                  record.test_type === 'male' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                                  record.test_type === 's' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                  'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                      测试时间
                    </Typography>
                    <Typography variant="body1" sx={{ color: modernColors.text.primary }}>
                      {new Date(record.created_at).toLocaleString('zh-CN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                      结果数量
                    </Typography>
                    <Typography variant="body1" sx={{ color: modernColors.text.primary }}>
                      {record.resultCount || 0} 项
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>

            {/* 测试结果详情 */}
            {record.testDetails && record.testDetails.length > 0 && (
              <GlassCard>
                <CardContent>
                  <Typography variant="h6" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 2 }}>
                    📊 测试结果详情
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                        平均分
                      </Typography>
                      <Typography variant="h5" sx={{ color: modernColors.accent, fontWeight: 'bold' }}>
                        {record.avgScore ? record.avgScore.toFixed(2) : '0.00'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ color: modernColors.text.muted, mb: 1 }}>
                        评分分布
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {record.ratings.map((rating, index) => (
                          <Chip
                            key={index}
                            label={rating}
                            sx={{
                              backgroundColor: rating === 'SSS' ? modernColors.error :
                                              rating === 'SS' ? modernColors.warning :
                                              rating === 'S' ? modernColors.success :
                                              rating === 'Q' ? modernColors.primary :
                                              rating === 'N' ? modernColors.secondary :
                                              modernColors.text.muted,
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>

                  {/* 按评分分组显示 */}
                  {['SSS', 'SS', 'S', 'Q', 'N', 'W'].map(rating => {
                    const details = record.groupedDetails[rating] || [];
                    if (details.length === 0) return null;
                    
                    return (
                      <Box key={rating} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: modernColors.text.primary, fontWeight: 'bold', mb: 1 }}>
                          {rating} 级 ({details.length}项)
                        </Typography>
                        <Grid container spacing={1}>
                          {details.map((detail, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Paper 
                                sx={{ 
                                  p: 1.5, 
                                  background: modernColors.background.card,
                                  border: `1px solid ${modernColors.border}`,
                                  borderRadius: 2
                                }}
                              >
                                <Typography variant="body2" sx={{ color: modernColors.text.primary, fontWeight: 500 }}>
                                  {detail.category}
                                </Typography>
                                <Typography variant="caption" sx={{ color: modernColors.text.muted }}>
                                  {detail.item || detail.subcategory || '未分类'}
                                </Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    );
                  })}
                </CardContent>
              </GlassCard>
            )}
          </Box>
        ) : (
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <InfoIcon sx={{ fontSize: 64, color: modernColors.text.secondary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: modernColors.text.secondary }}>
              无详细数据
            </Typography>
          </CardContent>
        )}
      </DialogContent>
      
      <DialogActions sx={{ background: modernColors.background.card, borderTop: `1px solid ${modernColors.border}` }}>
        <ModernButton onClick={onClose} variant="outlined">
        关闭
      </ModernButton>
      </DialogActions>
    </Dialog>
  );
}

// 🚀 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ModernAdminApp />);