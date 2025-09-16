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
  CssBaseline
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
  BarChart as BarChartIcon,
  ExitToApp as ExitToAppIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { supabase } from './utils/supabase.js'
import './styles/admin-theme.css'

// 调试版本的后台管理组件
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
  const [debugInfo, setDebugInfo] = useState('');

  // 添加调试信息
  const addDebugInfo = (info) => {
    console.log('[Admin Debug]', info);
    setDebugInfo(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + info);
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
      addDebugInfo('本地存储数据: ' + (adminData ? '存在' : '不存在'));
      
      if (adminData) {
        try {
          const parsed = JSON.parse(adminData);
          addDebugInfo('解析管理员数据: ' + JSON.stringify(parsed));
          if (parsed.username && parsed.role) {
            setAdmin(parsed);
            addDebugInfo('管理员会话有效');
          } else {
            localStorage.removeItem('admin_data');
            addDebugInfo('管理员数据格式无效，已清除');
          }
        } catch (error) {
          addDebugInfo('解析管理员数据失败: ' + error.message);
          localStorage.removeItem('admin_data');
        }
      } else {
        addDebugInfo('没有找到管理员会话数据');
      }
    } catch (error) {
      addDebugInfo('检查管理员会话失败: ' + error.message);
      localStorage.removeItem('admin_data');
    } finally {
      setLoading(false);
      addDebugInfo('管理员会话检查完成');
    }
  };

  // 管理员登录（调试版）
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    addDebugInfo('开始登录流程，用户名: ' + loginForm.username);

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
        addDebugInfo('登录成功');
      } else {
        throw new Error('用户名或密码错误');
      }
    } catch (error) {
      setLoginError(error.message);
      addDebugInfo('登录失败: ' + error.message);
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

  // 加载仪表板数据（调试版）
  const loadDashboardData = async () => {
    addDebugInfo('开始加载仪表板数据');
    setStatsLoading(true);
    setResultsLoading(true);

    try {
      // 获取系统统计
      await loadSystemStats();
      
      // 获取测试记录
      await loadTestResults();
      
      // 获取IP地址记录
      await loadUserIPs();
      
      addDebugInfo('仪表板数据加载完成');
    } catch (error) {
      addDebugInfo('加载仪表板数据失败: ' + error.message);
      console.error('加载仪表板数据失败:', error);
    } finally {
      setStatsLoading(false);
      setResultsLoading(false);
    }
  };

  // 获取系统统计（调试版）
  const loadSystemStats = async () => {
    try {
      addDebugInfo('开始获取系统统计');
      
      // 获取用户总数
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      addDebugInfo('用户总数查询结果: ' + (totalUsers || 0) + (usersError ? ' 错误: ' + usersError.message : ' 成功'));

      // 获取测试记录总数
      const { count: totalTests, error: testsError } = await supabase
        .from('test_records')
        .select('*', { count: 'exact', head: true });
      
      addDebugInfo('测试总数查询结果: ' + (totalTests || 0) + (testsError ? ' 错误: ' + testsError.message : ' 成功'));

      // 获取今日测试（简化版）
      const { count: todayUsers, error: todayError } = await supabase
        .from('test_records')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      addDebugInfo('今日测试查询结果: ' + (todayUsers || 0) + (todayError ? ' 错误: ' + todayError.message : ' 成功'));

      // 获取测试类型统计
      const { data: testTypeStats, error: typeError } = await supabase
        .from('test_records')
        .select('test_type, count(*)')
        .group('test_type');
      
      addDebugInfo('测试类型统计结果: ' + (testTypeStats ? testTypeStats.length + ' 条' : '0 条') + (typeError ? ' 错误: ' + typeError.message : ' 成功'));

      const stats = {
        overview: {
          totalUsers: totalUsers || 0,
          totalTests: totalTests || 0,
          todayUsers: todayUsers || 0
        },
        testTypes: testTypeStats || []
      };
      
      setSystemStats(stats);
      addDebugInfo('系统统计设置完成: ' + JSON.stringify(stats.overview));
    } catch (error) {
      addDebugInfo('获取系统统计失败: ' + error.message);
      console.error('获取系统统计失败:', error);
      // 设置空数据避免页面崩溃
      setSystemStats({
        overview: { totalUsers: 0, totalTests: 0, todayUsers: 0 },
        testTypes: []
      });
    }
  };

  // 获取测试记录（调试版）
  const loadTestResults = async () => {
    try {
      addDebugInfo('开始获取测试记录');
      
      const { data, error } = await supabase
        .from('test_records')
        .select(`
          *,
          users:nickname
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      addDebugInfo('测试记录查询结果: ' + (data ? data.length + ' 条' : '0 条') + (error ? ' 错误: ' + error.message : ' 成功'));

      if (error) {
        addDebugInfo('测试记录查询错误: ' + error.message);
        throw error;
      }

      // 获取每个记录的详细结果
      const resultsWithDetails = await Promise.all(
        (data || []).map(async (record) => {
          try {
            const { data: details } = await supabase
              .from('test_results')
              .select('category, item, rating')
              .eq('record_id', record.id);

            return {
              ...record,
              test_results: details || []
            };
          } catch (detailError) {
            addDebugInfo('获取记录详情失败: ' + detailError.message);
            return {
              ...record,
              test_results: []
            };
          }
        })
      );

      addDebugInfo('测试记录处理完成: ' + resultsWithDetails.length + ' 条');
      setTestResults(resultsWithDetails);
    } catch (error) {
      addDebugInfo('获取测试记录失败: ' + error.message);
      console.error('获取测试记录失败:', error);
      setTestResults([]);
    }
  };

  // 获取用户IP地址（调试版）
  const loadUserIPs = async () => {
    try {
      addDebugInfo('开始获取用户IP地址');
      
      const { data, error } = await supabase
        .from('user_ips')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(50);

      addDebugInfo('IP地址查询结果: ' + (data ? data.length + ' 条' : '0 条') + (error ? ' 错误: ' + error.message : ' 成功'));

      if (error) {
        addDebugInfo('IP地址查询错误: ' + error.message);
        throw error;
      }

      addDebugInfo('IP地址设置完成: ' + (data || []).length + ' 条');
      setUserIPs(data || []);
    } catch (error) {
      addDebugInfo('获取用户IP失败: ' + error.message);
      console.error('获取用户IP失败:', error);
      setUserIPs([]);
    }
  };

  // 查看测试记录详情
  const viewTestDetails = (record) => {
    addDebugInfo('查看测试记录详情: ' + record.id);
    alert(`测试记录详情:\nID: ${record.id}\n用户: ${record.nickname || '匿名用户'}\n类型: ${record.test_type}\n完成项数: ${record.test_results?.length || 0}`);
  };

  // 删除测试记录
  const deleteTestRecord = async (recordId) => {
    if (!window.confirm('确定要删除这条测试记录吗？此操作不可恢复。')) {
      return;
    }

    try {
      addDebugInfo('开始删除测试记录: ' + recordId);
      
      // 删除相关的测试结果
      const { error: deleteResultsError } = await supabase
        .from('test_results')
        .delete()
        .eq('record_id', recordId);

      if (deleteResultsError) {
        addDebugInfo('删除测试结果失败: ' + deleteResultsError.message);
        throw deleteResultsError;
      }

      // 删除测试记录
      const { error: deleteRecordError } = await supabase
        .from('test_records')
        .delete()
        .eq('id', recordId);

      if (deleteRecordError) {
        addDebugInfo('删除测试记录失败: ' + deleteRecordError.message);
        throw deleteRecordError;
      }

      addDebugInfo('删除测试记录成功: ' + recordId);
      await loadTestResults();
      alert('删除成功！');
    } catch (error) {
      addDebugInfo('删除测试记录失败: ' + error.message);
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

          {/* 调试信息显示 */}
          {debugInfo && (
            <Paper elevation={1} sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>调试信息</Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                {debugInfo}
              </Typography>
            </Paper>
          )}
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
          {debugInfo && (
            <Paper elevation={1} sx={{ mt: 2, p: 2, maxWidth: 600 }}>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                {debugInfo}
              </Typography>
            </Paper>
          )}
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

        {/* 调试信息面板 */}
        <Paper elevation={2} sx={{ mb: 4, p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>调试信息</Typography>
          <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
            {debugInfo || '暂无调试信息'}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => setDebugInfo('')}
            sx={{ mt: 1 }}
          >
            清除调试信息
          </Button>
        </Paper>

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
  );
}

export default AdminApp;