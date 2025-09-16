import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Computer as DeviceIcon,
  Schedule as TimeIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Map as MapIcon,
  DeviceHub as DeviceHubIcon
} from '@mui/icons-material';
import { supabase } from './utils/supabase.js';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

// 增强的用户行为分析组件
const EnhancedUserBehavior = () => {
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [userBehaviors, setUserBehaviors] = useState([]);
  const [userIPs, setUserIPs] = useState([]);
  const [testRecords, setTestRecords] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    testType: '',
    dateFrom: '',
    dateTo: '',
    country: '',
    deviceType: ''
  });

  // 获取用户行为数据（整合IP和测试记录）
  const loadUserBehaviorData = async () => {
    setLoading(true);
    try {
      console.log('🔄 开始加载用户行为数据...');
      
      // 1. 获取测试记录
      console.log('📋 获取测试记录...');
      const { data: records, error: recordsError } = await supabase
        .from('test_records')
        .select(`
          id,
          user_id_text,
          test_type,
          created_at,
          report_data
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (recordsError) throw recordsError;
      
      console.log(`✅ 获取到 ${records?.length || 0} 条测试记录`);

      // 2. 获取用户IP信息
      console.log('🌍 获取用户IP信息...');
      const { data: userIPData, error: ipError } = await supabase
        .from('user_ips')
        .select(`
          user_id,
          ip_address,
          country,
          city,
          device_type,
          browser,
          os,
          last_seen,
          created_at
        `)
        .order('last_seen', { ascending: false });

      if (ipError) throw ipError;
      
      console.log(`✅ 获取到 ${userIPData?.length || 0} 条IP记录`);

      // 3. 获取用户信息
      console.log('👥 获取用户信息...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nickname, created_at, last_active');

      if (usersError) throw usersError;

      // 4. 整合数据
      console.log('🔗 整合用户行为数据...');
      const behaviors = await Promise.all(
        (records || []).map(async (record) => {
          // 找到对应的用户信息
          const user = users?.find(u => u.id === record.user_id_text);
          
          // 找到对应的IP信息（可能有多个IP，取最新的）
          const userIPs = (userIPData || []).filter(ip => ip.user_id === record.user_id_text);
          const latestIP = userIPs.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0];
          
          // 获取测试详细信息
          const { data: testDetails } = await supabase
            .from('test_results')
            .select('category, item, rating')
            .eq('record_id', record.id);

          return {
            id: record.id,
            userId: record.user_id_text,
            nickname: user?.nickname || '匿名用户',
            testType: record.test_type,
            testDate: record.created_at,
            completionRate: testDetails?.length || 0,
            ipAddress: latestIP?.ip_address || '未知',
            country: latestIP?.country || '未知',
            city: latestIP?.city || '未知',
            deviceType: latestIP?.device_type || '未知',
            browser: latestIP?.browser || '未知',
            os: latestIP?.os || '未知',
            lastSeen: latestIP?.last_seen || record.created_at,
            testResults: testDetails || [],
            totalTests: testDetails?.length || 0,
            userCreatedAt: user?.created_at || record.created_at,
            userLastActive: user?.last_active || record.created_at
          };
        })
      );

      console.log(`✅ 整合完成，共 ${behaviors.length} 条用户行为记录`);
      
      setUserBehaviors(behaviors);
      setTestRecords(records || []);
      setUserIPs(userIPData || []);
      
    } catch (error) {
      console.error('❌ 加载用户行为数据失败:', error);
      setSnackbarMessage(`加载数据失败: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 获取用户详细行为分析
  const getUserDetailedAnalysis = (userId) => {
    const userBehaviors = userBehaviors.filter(b => b.userId === userId);
    const userIPData = userIPs.filter(ip => ip.user_id === userId);
    
    if (userBehaviors.length === 0) return null;
    
    return {
      userId,
      nickname: userBehaviors[0].nickname,
      totalTests: userBehaviors.length,
      testTypes: [...new Set(userBehaviors.map(b => b.testType))],
      firstTest: userBehaviors.sort((a, b) => new Date(a.testDate) - new Date(b.testDate))[0],
      lastTest: userBehaviors.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0],
      completionRate: Math.round((userBehaviors.reduce((sum, b) => sum + b.totalTests, 0) / userBehaviors.length) * 100),
      ipAddresses: [...new Set(userBehaviors.map(b => b.ipAddress))],
      countries: [...new Set(userBehaviors.map(b => b.country))],
      devices: [...new Set(userBehaviors.map(b => b.deviceType))],
      browsers: [...new Set(userBehaviors.map(b => b.browser))],
      behaviorTimeline: userBehaviors.sort((a, b) => new Date(a.testDate) - new Date(b.testDate)),
      ipHistory: userIPData.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))
    };
  };

  // 表格列定义
  const columns = [
    {
      field: 'userId',
      headerName: '用户ID',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
            {params.row.nickname.charAt(0)}
          </Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'nickname',
      headerName: '用户昵称',
      width: 150
    },
    {
      field: 'testType',
      headerName: '测试类型',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={
            params.value === 'female' ? '女M测试' :
            params.value === 'male' ? '男M测试' :
            params.value === 's' ? 'S型测试' : 'LGBT+测试'
          }
          color="primary"
          size="small"
        />
      )
    },
    {
      field: 'ipAddress',
      headerName: 'IP地址',
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <LocationIcon fontSize="small" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'country',
      headerName: '国家/地区',
      width: 100,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <MapIcon fontSize="small" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'deviceType',
      headerName: '设备类型',
      width: 100,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <DeviceIcon fontSize="small" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'completionRate',
      headerName: '完成度',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={`${params.value} 项`}
          color={params.value > 10 ? 'success' : params.value > 5 ? 'warning' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'testDate',
      headerName: '测试时间',
      width: 180,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTimeIcon fontSize="small" />
          <Typography variant="body2">
            {new Date(params.value).toLocaleString('zh-CN')}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 100,
      renderCell: (params) => (
        <IconButton 
          onClick={() => setSelectedUser(params.row.userId)}
          color="primary"
          size="small"
        >
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  // 用户详情对话框
  const UserDetailDialog = () => {
    if (!selectedUser) return null;
    
    const userAnalysis = getUserDetailedAnalysis(selectedUser);
    if (!userAnalysis) return null;
    
    return (
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar>{userAnalysis.nickname.charAt(0)}</Avatar>
            <Box>
              <Typography variant="h6">{userAnalysis.nickname}</Typography>
              <Typography variant="body2" color="text.secondary">
                {userAnalysis.userId}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* 基本信息 */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    基本信息
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><AssessmentIcon /></ListItemIcon>
                      <ListItemText 
                        primary="总测试次数" 
                        secondary={`${userAnalysis.totalTests} 次`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TimeIcon /></ListItemIcon>
                      <ListItemText 
                        primary="首次测试" 
                        secondary={new Date(userAnalysis.firstTest.testDate).toLocaleDateString('zh-CN')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TimeIcon /></ListItemIcon>
                      <ListItemText 
                        primary="最近测试" 
                        secondary={new Date(userAnalysis.lastTest.testDate).toLocaleDateString('zh-CN')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><AssessmentIcon /></ListItemIcon>
                      <ListItemText 
                        primary="平均完成度" 
                        secondary={`${userAnalysis.completionRate}%`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* IP地址分析 */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    IP地址分析
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><LocationIcon /></ListItemIcon>
                      <ListItemText 
                        primary="IP地址数量" 
                        secondary={`${userAnalysis.ipAddresses.length} 个`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><MapIcon /></ListItemIcon>
                      <ListItemText 
                        primary="访问国家" 
                        secondary={userAnalysis.countries.join(', ')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><DeviceIcon /></ListItemIcon>
                      <ListItemText 
                        primary="设备类型" 
                        secondary={userAnalysis.devices.join(', ')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><DeviceHubIcon /></ListItemIcon>
                      <ListItemText 
                        primary="浏览器" 
                        secondary={userAnalysis.browsers.join(', ')}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            {/* 测试类型分布 */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    测试类型分布
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {userAnalysis.testTypes.map(type => (
                      <Chip 
                        key={type}
                        label={
                          type === 'female' ? '女M测试' :
                          type === 'male' ? '男M测试' :
                          type === 's' ? 'S型测试' : 'LGBT+测试'
                        }
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* 行为时间线 */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    行为时间线
                  </Typography>
                  <List dense>
                    {userAnalysis.behaviorTimeline.slice(0, 10).map((behavior, index) => (
                      <ListItem key={index} divider={index < userAnalysis.behaviorTimeline.length - 1}>
                        <ListItemIcon>
                          <TimeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">
                                {behavior.testType === 'female' ? '女M测试' :
                                 behavior.testType === 'male' ? '男M测试' :
                                 behavior.testType === 's' ? 'S型测试' : 'LGBT+测试'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(behavior.testDate).toLocaleString('zh-CN')}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box display="flex" gap={2}>
                              <Typography variant="caption">
                                📍 {behavior.country}
                              </Typography>
                              <Typography variant="caption">
                                💻 {behavior.deviceType}
                              </Typography>
                              <Typography variant="caption">
                                ✅ {behavior.totalTests}项
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 过滤功能
  const filteredBehaviors = userBehaviors.filter(behavior => {
    if (filters.testType && behavior.testType !== filters.testType) return false;
    if (filters.country && behavior.country !== filters.country) return false;
    if (filters.deviceType && behavior.deviceType !== filters.deviceType) return false;
    if (filters.dateFrom && new Date(behavior.testDate) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(behavior.testDate) > new Date(filters.dateTo)) return false;
    return true;
  });

  // 获取过滤选项
  const getFilterOptions = () => {
    const testTypes = [...new Set(userBehaviors.map(b => b.testType))];
    const countries = [...new Set(userBehaviors.map(b => b.country))];
    const deviceTypes = [...new Set(userBehaviors.map(b => b.deviceType))];
    
    return { testTypes, countries, deviceTypes };
  };

  const filterOptions = getFilterOptions();

  // 加载数据
  useEffect(() => {
    loadUserBehaviorData();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            用户行为分析
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadUserBehaviorData}
              disabled={loading}
            >
              刷新数据
            </Button>
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={() => setSelectedTab(selectedTab === 1 ? 0 : 1)}
            >
              {selectedTab === 1 ? '显示数据' : '高级筛选'}
            </Button>
          </Box>
        </Box>

        {/* 统计概览 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      总用户数
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {loading ? <CircularProgress size={24} /> : [...new Set(userBehaviors.map(b => b.userId))].length}
                    </Typography>
                  </Box>
                  <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      总测试数
                    </Typography>
                    <Typography variant="h4" color="secondary">
                      {loading ? <CircularProgress size={24} /> : userBehaviors.length}
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
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      国家/地区数
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {loading ? <CircularProgress size={24} /> : [...new Set(userBehaviors.map(b => b.country))].length}
                    </Typography>
                  </Box>
                  <LocationIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      设备类型数
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {loading ? <CircularProgress size={24} /> : [...new Set(userBehaviors.map(b => b.deviceType))].length}
                    </Typography>
                  </Box>
                  <DeviceIcon sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 筛选面板 */}
        {selectedTab === 1 && (
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              高级筛选
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>测试类型</InputLabel>
                  <Select
                    value={filters.testType}
                    onChange={(e) => setFilters({...filters, testType: e.target.value})}
                  >
                    <MenuItem value="">全部</MenuItem>
                    {filterOptions.testTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type === 'female' ? '女M测试' :
                         type === 'male' ? '男M测试' :
                         type === 's' ? 'S型测试' : 'LGBT+测试'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>国家/地区</InputLabel>
                  <Select
                    value={filters.country}
                    onChange={(e) => setFilters({...filters, country: e.target.value})}
                  >
                    <MenuItem value="">全部</MenuItem>
                    {filterOptions.countries.map(country => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>设备类型</InputLabel>
                  <Select
                    value={filters.deviceType}
                    onChange={(e) => setFilters({...filters, deviceType: e.target.value})}
                  >
                    <MenuItem value="">全部</MenuItem>
                    {filterOptions.deviceTypes.map(device => (
                      <MenuItem key={device} value={device}>
                        {device}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="开始日期"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="结束日期"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* 数据表格 */}
        <Card>
          <CardContent>
            <DataGrid
              rows={filteredBehaviors}
              columns={columns}
              loading={loading}
              pageSize={20}
              rowsPerPageOptions={[10, 20, 50]}
              checkboxSelection
              disableSelectionOnClick
              autoHeight
              components={{
                Toolbar: GridToolbar,
              }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '2px solid rgba(255,255,255,0.2)',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* 用户详情对话框 */}
        <UserDetailDialog />
      </Paper>
    </Container>
  );
};

export default EnhancedUserBehavior;