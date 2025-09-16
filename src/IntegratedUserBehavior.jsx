import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box as MuiBox
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Computer as DeviceIcon,
  Schedule as TimeIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { supabase } from './utils/supabase.js';

// 简化的用户行为整合组件
const IntegratedUserBehavior = () => {
  const [loading, setLoading] = useState(false);
  const [userBehaviors, setUserBehaviors] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalTests: 0,
    totalCountries: 0,
    totalDevices: 0
  });

  // 加载用户行为数据（整合IP和测试记录）
  const loadUserBehaviorData = async () => {
    setLoading(true);
    try {
      console.log('🔄 开始加载用户行为数据...');
      
      // 1. 获取测试记录
      console.log('📋 获取测试记录...');
      const { data: records, error: recordsError, count } = await supabase
        .from('test_records')
        .select(`
          id,
          user_id_text,
          test_type,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (recordsError) throw recordsError;
      
      console.log(`✅ 获取到 ${records?.length || 0} 条测试记录`);

      if (!records || records.length === 0) {
        setUserBehaviors([]);
        setSummary({
          totalUsers: 0,
          totalTests: 0,
          totalCountries: 0,
          totalDevices: 0
        });
        return;
      }

      // 2. 获取用户IP信息
      console.log('🌍 获取用户IP信息...');
      const userIds = [...new Set(records.map(r => r.user_id_text))];
      
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
          last_seen
        `)
        .in('user_id', userIds);

      if (ipError) throw ipError;
      
      console.log(`✅ 获取到 ${userIPData?.length || 0} 条IP记录`);

      // 3. 获取用户信息
      console.log('👥 获取用户信息...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', userIds);

      if (usersError) throw usersError;

      // 4. 整合数据
      console.log('🔗 整合用户行为数据...');
      const behaviors = await Promise.all(
        records.map(async (record) => {
          // 找到对应的用户信息
          const user = users?.find(u => u.id === record.user_id_text);
          
          // 找到对应的IP信息（可能有多个IP，取最新的）
          const userIPs = (userIPData || []).filter(ip => ip.user_id === record.user_id_text);
          const latestIP = userIPs.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0];
          
          return {
            id: record.id,
            userId: record.user_id_text,
            nickname: user?.nickname || '匿名用户',
            testType: record.test_type,
            testDate: record.created_at,
            completionRate: 0, // 将在后续查询中获取
            ipAddress: latestIP?.ip_address || '未知',
            country: latestIP?.country || '未知',
            city: latestIP?.city || '未知',
            deviceType: latestIP?.device_type || '未知',
            browser: latestIP?.browser || '未知',
            os: latestIP?.os || '未知',
            lastSeen: latestIP?.last_seen || record.created_at
          };
        })
      );

      console.log(`✅ 整合完成，共 ${behaviors.length} 条用户行为记录`);
      
      // 5. 生成汇总统计
      const summary = {
        totalUsers: [...new Set(behaviors.map(b => b.userId))].length,
        totalTests: behaviors.length,
        totalCountries: [...new Set(behaviors.map(b => b.country))].length,
        totalDevices: [...new Set(behaviors.map(b => b.deviceType))].length
      };

      setUserBehaviors(behaviors);
      setSummary(summary);
      
    } catch (error) {
      console.error('❌ 加载用户行为数据失败:', error);
      // 可以设置错误状态或显示错误消息
    } finally {
      setLoading(false);
    }
  };

  // 获取用户详细信息
  const getUserDetailedAnalysis = (userId) => {
    const userBehaviors = userBehaviors.filter(b => b.userId === userId);
    const userRecord = userBehaviors.find(b => b.userId === userId);
    
    if (!userRecord) return null;
    
    return {
      userId,
      nickname: userRecord.nickname,
      totalTests: userBehaviors.length,
      testTypes: [...new Set(userBehaviors.map(b => b.testType))],
      firstTest: userBehaviors.sort((a, b) => new Date(a.testDate) - new Date(b.testDate))[0],
      lastTest: userBehaviors.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0],
      ipAddresses: [...new Set(userBehaviors.map(b => b.ipAddress))],
      countries: [...new Set(userBehaviors.map(b => b.country))],
      devices: [...new Set(userBehaviors.map(b => b.deviceType))],
      browsers: [...new Set(userBehaviors.map(b => b.browser))],
      behaviorTimeline: userBehaviors.sort((a, b) => new Date(a.testDate) - new Date(b.testDate))
    };
  };

  // 表格数据
  const tableData = userBehaviors.map((behavior, index) => ({
    id: index,
    ...behavior
  }));

  // 加载数据
  useEffect(() => {
    loadUserBehaviorData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* 标题和操作区 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          用户行为分析
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadUserBehaviorData}
          disabled={loading}
        >
          刷新数据
        </Button>
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
                    {loading ? <CircularProgress size={24} /> : summary.totalUsers}
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
                    {loading ? <CircularProgress size={24} /> : summary.totalTests}
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
                    {loading ? <CircularProgress size={24} /> : summary.totalCountries}
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
                    {loading ? <CircularProgress size={24} /> : summary.totalDevices}
                  </Typography>
                </Box>
                <DeviceIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 数据表格 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            用户行为记录
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>用户</TableCell>
                    <TableCell>测试类型</TableCell>
                    <TableCell>IP地址</TableCell>
                    <TableCell>国家/地区</TableCell>
                    <TableCell>设备类型</TableCell>
                    <TableCell>测试时间</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {row.nickname.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{row.nickname}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.userId.substring(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            row.testType === 'female' ? '女M测试' :
                            row.testType === 'male' ? '男M测试' :
                            row.testType === 's' ? 'S型测试' : 'LGBT+测试'
                          }
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" />
                          <Typography variant="body2">{row.ipAddress}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <MapIcon fontSize="small" />
                          <Typography variant="body2">{row.country}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DeviceIcon fontSize="small" />
                          <Typography variant="body2">{row.deviceType}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body2">
                            {new Date(row.testDate).toLocaleString('zh-CN')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => {
                            setSelectedUser(row.userId);
                            // 这里可以打开详细对话框
                          }}
                          color="primary"
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 用户详情对话框 */}
      {selectedUser && (
        <Dialog 
          open={detailDialogOpen} 
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            用户详细信息
          </DialogTitle>
          <DialogContent>
            <Typography>
              用户ID: {selectedUser}
            </Typography>
            {/* 这里可以添加更多用户详细信息 */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default IntegratedUserBehavior;