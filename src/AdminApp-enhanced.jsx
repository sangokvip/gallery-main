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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { supabase } from './utils/supabase.js'
import './styles/admin-theme.css'

// 增强版后台管理组件，带有详细调试功能
function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [systemStats, setSystemStats] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [userIPs, setUserIPs] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [openDebugDialog, setOpenDebugDialog] = useState(false);

  // 添加调试信息
  const addDebugInfo = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setDebugInfo(prev => [...prev, debugEntry]);
    console.log(`[Admin Debug ${timestamp}]`, message, data);
  };

  // 检查管理员会话
  useEffect(() => {
    addDebugInfo('开始检查管理员会话');
    checkAdminSession();
  }, []);

  // 加载数据
  useEffect(() => {
    if (admin) {
      addDebugInfo('管理员已登录，开始加载数据');
      loadDashboardData();
    }
  }, [admin]);

  // 检查管理员会话
  const checkAdminSession = async () => {
    try {
      addDebugInfo('检查本地存储的管理员数据');
      const adminData = localStorage.getItem('admin_data');
      addDebugInfo('本地存储数据存在性', { exists: !!adminData });
      
      if (adminData) {
        try {
          const parsed = JSON.parse(adminData);
          addDebugInfo('解析管理员数据成功', parsed);
          if (parsed.username && parsed.role) {
            setAdmin(parsed);
            addDebugInfo('管理员会话有效');
          } else {
            localStorage.removeItem('admin_data');
            addDebugInfo('管理员数据格式无效，已清除');
          }
        } catch (error) {
          addDebugInfo('解析管理员数据失败', error.message);
          localStorage.removeItem('admin_data');
        }
      } else {
        addDebugInfo('没有找到管理员会话数据');
      }
    } catch (error) {
      addDebugInfo('检查管理员会话失败', error.message);
      localStorage.removeItem('admin_data');
    } finally {
      setLoading(false);
      addDebugInfo('管理员会话检查完成');
    }
  };

  // 管理员登录（增强版）
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    addDebugInfo('开始登录流程', { username: loginForm.username });

    try {
      // 简化的登录验证
      if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
        const adminData = {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@example.com',
          role: 'super_admin'
        };
        
        localStorage.setItem('admin_data', JSON.stringify(adminData));
        setAdmin(adminData);
        addDebugInfo('登录成功', adminData);
      } else {
        throw new Error('用户名或密码错误');
      }
    } catch (error) {
      setLoginError(error.message);
      addDebugInfo('登录失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 管理员登出
  const handleLogout = async () => {
    addDebugInfo('执行登出操作');
    localStorage.removeItem('admin_data');
    setAdmin(null);
    addDebugInfo('登出完成');
  };

  // 加载仪表板数据（增强版）
  const loadDashboardData = async () => {
    addDebugInfo('开始加载仪表板数据');
    setStatsLoading(true);
    setResultsLoading(true);

    try {
      // 获取系统信息
      await loadSystemInfo();
      
      // 获取系统统计
      await loadSystemStats();
      
      // 获取测试记录
      await loadTestResults();
      
      // 获取IP地址记录
      await loadUserIPs();
      
      addDebugInfo('仪表板数据加载完成');
    } catch (error) {
      addDebugInfo('加载仪表板数据失败', error.message);
      console.error('加载仪表板数据失败:', error);
    } finally {
      setStatsLoading(false);
      setResultsLoading(false);
    }
  };

  // 获取系统信息
  const loadSystemInfo = async () => {
    try {
      addDebugInfo('开始获取系统信息');
      
      // 检查数据库连接
      const { data: connectionTest, error: connectionError } = await supabase
        .from('test_records')
        .select('id')
        .limit(1);
      
      addDebugInfo('数据库连接测试', { 
        success: !connectionError, 
        error: connectionError?.message,
        dataCount: connectionTest?.length || 0
      });

      // 获取表结构信息
      const systemInfo = {
        connection: !connectionError ? '正常' : '异常',
        testRecordsCount: 0,
        userIPsCount: 0,
        lastSync: new Date().toISOString()
      };

      setSystemInfo(systemInfo);
      addDebugInfo('系统信息获取完成', systemInfo);
    } catch (error) {
      addDebugInfo('获取系统信息失败', error.message);
      setSystemInfo({
        connection: '异常',
        error: error.message,
        lastSync: new Date().toISOString()
      });
    }
  };

  // 获取系统统计（增强版）
  const loadSystemStats = async () => {
    try {
      addDebugInfo('开始获取系统统计');
      
      // 获取用户总数
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      addDebugInfo('用户总数查询', { 
        count: totalUsers, 
        error: usersError?.message 
      });

      // 获取测试记录总数
      const { count: totalTests, error: testsError } = await supabase
        .from('test_records')
        .select('*', { count: 'exact', head: true });
      
      addDebugInfo('测试总数查询', { 
        count: totalTests, 
        error: testsError?.message 
      });

      // 获取今日测试（简化版）
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayUsers, error: todayError } = await supabase
        .from('test_records')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());
      
      addDebugInfo('今日测试查询', { 
        count: todayUsers, 
        error: todayError?.message 
      });

      // 获取测试类型统计
      const { data: testTypeStats, error: typeError } = await supabase
        .from('test_records')
        .select('test_type, count(*)')
        .group('test_type');
      
      addDebugInfo('测试类型统计', { 
        dataCount: testTypeStats?.length || 0, 
        error: typeError?.message 
      });

      const stats = {
        overview: {
          totalUsers: totalUsers || 0,
          totalTests: totalTests || 0,
          todayUsers: todayUsers || 0
        },
        testTypes: testTypeStats || []
      };
      
      setSystemStats(stats);
      addDebugInfo('系统统计设置完成', stats.overview);
    } catch (error) {
      addDebugInfo('获取系统统计失败', error.message);
      // 设置空数据避免页面崩溃
      setSystemStats({
        overview: { totalUsers: 0, totalTests: 0, todayUsers: 0 },
        testTypes: []
      });
    }
  };

  // 获取测试记录（增强版）
  const loadTestResults = async () => {
    try {
      addDebugInfo('开始获取测试记录');
      
      // 首先检查表是否存在和数据总量
      const { count: totalCount, error: countError } = await supabase
        .from('test_records')
        .select('*', { count: 'exact', head: true });
      
      addDebugInfo('测试记录总数', { 
        totalCount: totalCount || 0, 
        error: countError?.message 
      });

      // 获取最新的测试记录
      const { data, error } = await supabase
        .from('test_records')
        .select(`
          id,
          user_id_text,
          test_type,
          nickname,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      addDebugInfo('测试记录查询结果', { 
        dataCount: data?.length || 0, 
        error: error?.message,
        sampleData: data?.slice(0, 2) // 只显示前2条作为样本
      });

      if (error) {
        addDebugInfo('测试记录查询错误', error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        addDebugInfo('没有找到测试记录', '数据库可能为空或查询条件有问题');
        setTestResults([]);
        return;
      }

      // 获取每个记录的详细结果
      addDebugInfo('开始获取测试记录详情', { recordCount: data.length });
      
      const resultsWithDetails = await Promise.all(
        data.map(async (record, index) => {
          try {
            const { data: details, error: detailError } = await supabase
              .from('test_results')
              .select('category, item, rating')
              .eq('record_id', record.id);

            if (detailError) {
              addDebugInfo(`获取记录 ${record.id} 详情失败`, detailError.message);
              return {
                ...record,
                test_results: [],
                detailError: detailError.message
              };
            }

            return {
              ...record,
              test_results: details || [],
              resultCount: details?.length || 0
            };
          } catch (detailError) {
            addDebugInfo(`处理记录 ${record.id} 时出错`, detailError.message);
            return {
              ...record,
              test_results: [],
              detailError: detailError.message
            };
          }
        })
      );

      addDebugInfo('测试记录处理完成', { 
        processedCount: resultsWithDetails.length,
        sampleRecord: resultsWithDetails[0] // 显示第一条记录作为样本
      });

      setTestResults(resultsWithDetails);
    } catch (error) {
      addDebugInfo('获取测试记录失败', error.message);
      console.error('获取测试记录失败:', error);
      setTestResults([]);
    }
  };

  // 获取用户IP地址（增强版）
  const loadUserIPs = async () => {
    try {
      addDebugInfo('开始获取用户IP地址');
      
      // 首先检查IP表是否存在
      const { count: ipCount, error: ipCountError } = await supabase
        .from('user_ips')
        .select('*', { count: 'exact', head: true });
      
      addDebugInfo('IP地址总数', { 
        count: ipCount || 0, 
        error: ipCountError?.message 
      });

      // 获取IP地址记录
      const { data, error } = await supabase
        .from('user_ips')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(50);

      addDebugInfo('IP地址查询结果', { 
        dataCount: data?.length || 0, 
        error: error?.message,
        sampleData: data?.slice(0, 2) // 只显示前2条作为样本
      });

      if (error) {
        addDebugInfo('IP地址查询错误', error.message);
        throw error;
      }

      addDebugInfo('IP地址设置完成', { count: (data || []).length });
      setUserIPs(data || []);
    } catch (error) {
      addDebugInfo('获取用户IP失败', error.message);
      console.error('获取用户IP失败:', error);
      setUserIPs([]);
    }
  };

  // 查看测试记录详情
  const viewTestDetails = (record) => {
    addDebugInfo('查看测试记录详情', { 
      id: record.id,
      userId: record.user_id_text,
      testType: record.test_type,
      resultCount: record.test_results?.length || 0
    });
    
    alert(`测试记录详情:\nID: ${record.id}\n用户ID: ${record.user_id_text}\n测试类型: ${record.test_type}\n用户昵称: ${record.nickname || '匿名用户'}\n完成项数: ${record.test_results?.length || 0}\n测试时间: ${new Date(record.created_at).toLocaleString('zh-CN')}`);
  };

  // 删除测试记录（增强版）
  const deleteTestRecord = async (recordId) => {
    if (!window.confirm('确定要删除这条测试记录吗？此操作不可恢复。')) {
      return;
    }

    try {
      addDebugInfo('开始删除测试记录', { recordId });
      
      // 首先获取记录信息
      const { data: recordInfo, error: infoError } = await supabase
        .from('test_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (infoError) {
        addDebugInfo('获取记录信息失败', infoError.message);
        throw infoError;
      }

      addDebugInfo('准备删除的记录信息', recordInfo);

      // 删除相关的测试结果
      const { error: deleteResultsError } = await supabase
        .from('test_results')
        .delete()
        .eq('record_id', recordId);

      if (deleteResultsError) {
        addDebugInfo('删除测试结果失败', deleteResultsError.message);
        throw deleteResultsError;
      }

      addDebugInfo('删除测试结果成功', { recordId });

      // 删除测试记录
      const { error: deleteRecordError } = await supabase
        .from('test_records')
        .delete()
        .eq('id', recordId);

      if (deleteRecordError) {
        addDebugInfo('删除测试记录失败', deleteRecordError.message);
        throw deleteRecordError;
      }

      addDebugInfo('删除测试记录成功', { recordId });
      await loadTestResults();
      alert('删除成功！');
    } catch (error) {
      addDebugInfo('删除测试记录失败', error.message);
      console.error('删除测试记录失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  // 登录页面
  if (!admin && !loading) {
    return (
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
    );
  }

  // 加载状态
  if (loading || !admin) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            正在加载管理后台...
          </Typography>
        </Box>
      </Container>
    );
  }

  // 主管理界面
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* 顶部导航栏 */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            M-Profile Lab 管理后台
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            欢迎，{admin.username}
          </Typography>
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

        {/* 系统状态面板 */}
        <Accordion sx={{ mb: 4 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReportIcon color="primary" />
              系统调试信息
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>系统状态：</Typography>
              {systemInfo && (
                <Typography variant="body2" component="pre" sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(systemInfo, null, 2)}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>调试日志：</Typography>
              <Paper elevation={1} sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
                {debugInfo.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    暂无调试信息
                  </Typography>
                ) : (
                  debugInfo.map((entry, index) => (
                    <Box key={index} sx={{ mb: 1, fontSize: '0.75rem' }}>
                      <Typography component="span" color="text.secondary">
                        [{entry.timestamp}]
                      </Typography>
                      <Typography component="span" sx={{ ml: 1 }}>
                        {entry.message}
                      </Typography>
                      {entry.data && (
                        <Typography component="pre" sx={{ ml: 2, fontSize: '0.7rem', whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                          {entry.data}
                        </Typography>
                      )}
                    </Box>
                  ))
                )}
              </Paper>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadDashboardData}
              >
                重新加载数据
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<BugReportIcon />}
                onClick={() => setDebugInfo([])}
              >
                清除调试信息
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

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

            {/* 测试类型分布 */}
            <Grid container spacing={3}>
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
                    )}
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
            
            {resultsLoading && (
              <Alert severity="info" sx={{ mb: 2 }}>
                正在加载测试记录数据...
              </Alert>
            )}
            
            {testResults.length === 0 && !resultsLoading && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                没有找到测试记录。请确保：
                1. 已有用户在前台完成了测试
                2. 数据库连接正常
                3. 数据保存功能正常工作
              </Alert>
            )}
            
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
                        <CircularProgress />
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
                          {result.test_results?.length || 0} 项
                          {result.resultCount && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              共 {result.resultCount} 项
                            </Typography>
                          )}
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
            
            {userIPs.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                没有找到IP地址记录。IP地址会在用户访问时自动记录。
              </Alert>
            )}
            
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
  );
}

export default AdminApp;