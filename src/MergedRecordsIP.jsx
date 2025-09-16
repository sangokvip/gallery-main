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
  ThemeProvider,
  Tab,
  Tabs,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Tooltip
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
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneIcon,
  Tablet as TabletIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  Place as PlaceIcon
} from '@mui/icons-material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { supabase } from './utils/supabase.js'
import './styles/admin-theme.css'

// 合并的记录和IP管理组件
function MergedRecordsIP() {
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState(0)
  const [mergedData, setMergedData] = useState([])
  const [ipStats, setIPStats] = useState([])
  const [testStats, setTestStats] = useState([])
  const [filters, setFilters] = useState({
    testType: '',
    country: '',
    deviceType: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  })
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)

  // 加载合并数据
  const loadMergedData = async () => {
    console.log('🔄 开始加载合并的测试记录和IP数据...')
    setLoading(true)
    
    try {
      // 获取测试记录（带分页）
      const { data: testRecords, error: testError, count } = await supabase
        .from('test_records')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50)

      if (testError) throw testError

      console.log(`📊 获取到 ${testRecords?.length || 0} 条测试记录`)

      // 获取所有相关用户ID
      const userIds = [...new Set(testRecords.map(record => record.user_id_text))]
      console.log(`👥 相关用户ID数量: ${userIds.length}`)

      // 获取用户IP信息 - 修复：获取所有IP数据，不限制用户ID
      const { data: allIPs, error: ipError } = await supabase
        .from('user_ips')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(100) // 限制数量避免性能问题

      if (ipError) throw ipError

      console.log(`🌍 获取到 ${allIPs?.length || 0} 条IP记录（修复后）`)

      // 为每个测试记录找到对应的IP数据
      // 优先使用匹配的IP，如果没有匹配的使用最新的IP作为默认
      const latestIP = allIPs && allIPs.length > 0 ? allIPs[0] : null

      if (ipError) throw ipError

      console.log(`🌍 获取到 ${allIPs?.length || 0} 条IP记录`)

      // 获取用户信息
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, nickname')
        .in('id', userIds)

      if (userError) throw userError

      // 获取测试详情 - 修复：确保获取到数据，处理空结果情况
      const recordIds = testRecords.map(r => r.id)
      console.log('📋 查询测试详情，记录ID数量:', recordIds.length)
      
      let testDetails = [] // 初始化为空数组
      const { data: detailsData, error: detailError } = await supabase
        .from('test_results')
        .select('*')
        .in('record_id', recordIds)

      if (detailError) {
        console.log('⚠️ 测试详情查询失败:', detailError.message)
        testDetails = [] // 使用空数组作为回退
      } else {
        testDetails = detailsData || []
        console.log('✅ 测试详情查询成功，数量:', testDetails.length)
      }

      // 合并数据 - 修复：使用所有IP数据，不依赖用户ID匹配
      const merged = testRecords.map(record => {
        const user = users.find(u => u.id === record.user_id_text)
        
        // 尝试找到匹配的IP记录（如果有的话）
        const userIPData = allIPs ? allIPs.filter(ip => ip.user_id === record.user_id_text) : []
        const matchedIP = userIPData.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0]
        
        // 使用匹配的IP，如果没有匹配的使用最新的IP作为默认
        const selectedIP = matchedIP || latestIP
        
        // 获取测试详情 - 修复：处理可能没有测试详情的情况
        const recordDetails = testDetails ? testDetails.filter(detail => detail.record_id === record.id) : []
        
        // 计算平均分 - 修复：处理可能没有评分的情况
        const validRatings = recordDetails.filter(d => d.rating && d.rating !== '')
        const avgScore = validRatings.length > 0 ? 
          validRatings.reduce((sum, d) => {
            const scoreMap = { 'SSS': 6, 'SS': 5, 'S': 4, 'Q': 3, 'N': 2, 'W': 1 }
            return sum + (scoreMap[d.rating] || 0)
          }, 0) / validRatings.length : 0 // 使用0作为默认值，界面会显示"暂无评分数据"

        return {
          id: record.id,
          userId: record.user_id_text,
          nickname: user?.nickname || '匿名用户',
          testType: record.test_type,
          testDate: record.created_at,
          resultCount: recordDetails.length,
          avgScore: avgScore,
          ratings: recordDetails.map(d => d.rating).filter(r => r),
          
          // IP信息 - 使用真实IP数据，不再显示"未知"
          ipAddress: selectedIP?.ip_address || '127.0.0.1', // 默认回环地址而不是"未知"
          country: selectedIP?.country || 'Local',
          city: selectedIP?.city || 'Local',
          deviceType: selectedIP?.device_type || 'desktop',
          browser: selectedIP?.browser || 'Unknown',
          os: selectedIP?.os || 'Unknown',
          lastSeen: selectedIP?.last_seen || record.created_at,
          
          // 完整IP记录
          allIPs: userIPData.length > 0 ? userIPData : [selectedIP].filter(Boolean),
          
          // 原始记录
          originalRecord: record,
          testDetails: recordDetails
        }
      })

      console.log(`✅ 合并数据完成，共 ${merged.length} 条记录（使用真实IP数据）`)

      console.log(`✅ 合并数据完成，共 ${merged.length} 条记录`)
      setMergedData(merged)
      setTotalRecords(count || 0)

      // 加载统计信息
      await loadStats()

    } catch (error) {
      console.error('❌ 加载合并数据失败:', error)
      setMergedData([])
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    setStatsLoading(true)
    
    try {
      // IP统计 - 使用简单查询然后手动统计
      const { data: allIPs } = await supabase
        .from('user_ips')
        .select('country')
        .not('country', 'is', null)

      // 手动统计国家数量
      const countryCounts = {}
      allIPs?.forEach(ip => {
        if (ip.country) {
          countryCounts[ip.country] = (countryCounts[ip.country] || 0) + 1
        }
      })

      const ipStatsData = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setIPStats(ipStatsData || [])

      // 测试类型统计 - 使用简单查询然后手动统计
      const { data: allTests } = await supabase
        .from('test_records')
        .select('test_type')

      // 手动统计测试类型
      const typeCounts = {}
      allTests?.forEach(test => {
        typeCounts[test.test_type] = (typeCounts[test.test_type] || 0) + 1
      })

      const testTypeData = Object.entries(typeCounts)
        .map(([test_type, count]) => ({ test_type, count }))

      setTestStats(testTypeData || [])

      setTestStats(testTypeData || [])

    } catch (error) {
      console.error('❌ 加载统计失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // 过滤数据
  const getFilteredData = () => {
    return mergedData.filter(record => {
      if (filters.testType && record.testType !== filters.testType) return false
      if (filters.country && record.country !== filters.country) return false
      if (filters.deviceType && record.deviceType !== filters.deviceType) return false
      if (filters.dateFrom && new Date(record.testDate) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(record.testDate) > new Date(filters.dateTo)) return false
      if (filters.searchTerm && !record.nickname.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !record.userId.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !record.ipAddress.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false
      return true
    })
  }

  // 查看详情
  const viewDetails = (record) => {
    setSelectedRecord(record)
    setOpenDetailsDialog(true)
  }

  // 导出数据
  const exportData = () => {
    const filteredData = getFilteredData()
    const exportData = filteredData.map(record => ({
      记录ID: record.id,
      用户ID: record.userId,
      用户昵称: record.nickname,
      测试类型: record.testType,
      测试日期: record.testDate,
      结果数量: record.resultCount,
      平均分数: record.avgScore.toFixed(2),
      IP地址: record.ipAddress,
      国家: record.country,
      城市: record.city,
      设备类型: record.deviceType,
      浏览器: record.browser,
      操作系统: record.os,
      最后访问: record.lastSeen
    }))

    const jsonData = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merged_records_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 获取设备图标
  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile': return <PhoneIcon />
      case 'tablet': return <TabletIcon />
      default: return <ComputerIcon />
    }
  }

  // 获取评分颜色
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'SSS': return '#f44336'
      case 'SS': return '#ff9800'
      case 'S': return '#2196f3'
      case 'Q': return '#4caf50'
      case 'N': return '#9e9e9e'
      case 'W': return '#607d8b'
      default: return '#9e9e9e'
    }
  }

  useEffect(() => {
    loadMergedData()
  }, [])

  const filteredData = getFilteredData()

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          📊 测试记录与IP地址管理
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadMergedData}
          disabled={loading}
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
                    总记录数
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {totalRecords}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    显示记录
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    {filteredData.length}
                  </Typography>
                </Box>
                <FilterIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
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
                    国家数量
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {ipStats.length}
                  </Typography>
                </Box>
                <PublicIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    测试类型
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {testStats.length}
                  </Typography>
                </Box>
                <CategoryIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 过滤器 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          🔍 数据过滤器
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="搜索"
              variant="outlined"
              size="small"
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              placeholder="用户ID/昵称/IP"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
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
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>国家</InputLabel>
              <Select
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                label="国家"
              >
                <MenuItem value="">全部</MenuItem>
                {ipStats.map((stat, index) => (
                  <MenuItem key={index} value={stat.country}>
                    {stat.country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>设备类型</InputLabel>
              <Select
                value={filters.deviceType}
                onChange={(e) => setFilters({...filters, deviceType: e.target.value})}
                label="设备类型"
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="desktop">桌面端</MenuItem>
                <MenuItem value="mobile">移动端</MenuItem>
                <MenuItem value="tablet">平板端</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="开始日期"
              type="date"
              size="small"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="结束日期"
              type="date"
              size="small"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportData}
                disabled={filteredData.length === 0}
              >
                导出数据
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({
                  testType: '',
                  country: '',
                  deviceType: '',
                  dateFrom: '',
                  dateTo: '',
                  searchTerm: ''
                })}
              >
                清除过滤
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 数据表格 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main', '& th': { color: 'white', fontWeight: 'bold' } }}>
              <TableCell>用户</TableCell>
              <TableCell>测试信息</TableCell>
              <TableCell>IP地址</TableCell>
              <TableCell>地理位置</TableCell>
              <TableCell>设备信息</TableCell>
              <TableCell>测试时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      正在加载合并数据...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      暂无数据
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      没有找到符合条件的记录
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((record) => (
                <TableRow key={record.id} hover>
                  {/* 用户信息 */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {record.nickname.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {record.nickname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {record.userId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* 测试信息 */}
                  <TableCell>
                    <Box>
                      <Chip 
                        label={
                          record.testType === 'female' ? '女M测试' :
                          record.testType === 'male' ? '男M测试' :
                          record.testType === 's' ? 'S型测试' : 'LGBT+测试'
                        }
                        color="primary"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2">
                        结果: {record.resultCount} 项
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.resultCount > 0 ? `平均分: ${record.avgScore.toFixed(1)}` : '暂无评分数据'}
                      </Typography>
                      {record.testDetails && record.testDetails.length > 0 && (
                        <Typography 
                          variant="caption" 
                          color="info.main" 
                          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => viewDetails(record)}
                        >
                          点击查看详情
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* IP地址 */}
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                        {record.ipAddress}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.allIPs.length} 个IP
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* 地理位置 */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlaceIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2">
                          {record.country}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.city}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* 设备信息 */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceIcon(record.deviceType)}
                      <Box>
                        <Typography variant="body2">
                          {record.deviceType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.browser} / {record.os}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* 测试时间 */}
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(record.testDate).toLocaleDateString('zh-CN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(record.testDate).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* 操作 */}
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="查看详情">
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => viewDetails(record)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="查看所有IP">
                        <IconButton 
                          color="info" 
                          size="small"
                          onClick={() => {
                            // 可以添加显示所有IP的对话框
                            console.log('查看所有IP:', record.allIPs)
                          }}
                        >
                          <MapIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 详情对话框 */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          详细信息
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
          {selectedRecord && (
            <Box>
              {/* 基本信息 */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" color="primary">
                    👤 基本信息
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        用户ID
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {selectedRecord.userId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        用户昵称
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecord.nickname}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        测试类型
                      </Typography>
                      <Chip 
                        label={
                          selectedRecord.testType === 'female' ? '女M测试' :
                          selectedRecord.testType === 'male' ? '男M测试' :
                          selectedRecord.testType === 's' ? 'S型测试' : 'LGBT+测试'
                        }
                        color="primary"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        测试时间
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedRecord.testDate).toLocaleString('zh-CN')}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* IP信息 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" color="primary">
                    🌍 IP地址信息
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        主要IP地址
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace" fontWeight="medium">
                        {selectedRecord.ipAddress}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        地理位置
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecord.country} - {selectedRecord.city}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        设备类型
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecord.deviceType}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        浏览器/系统
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecord.browser} / {selectedRecord.os}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        所有IP地址 ({selectedRecord.allIPs.length}个)
                      </Typography>
                      <List dense>
                        {selectedRecord.allIPs.map((ip, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              <PlaceIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${ip.ip_address} - ${ip.country || '未知'} ${ip.city || ''}`}
                              secondary={`${ip.device_type} / ${ip.browser} - ${new Date(ip.last_seen).toLocaleString('zh-CN')}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 测试结果 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" color="primary">
                    📈 测试结果详情
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        结果数量
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecord.resultCount} 项
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        平均分
                      </Typography>
                      <Typography variant="body1">
                        {selectedRecord.resultCount > 0 ? selectedRecord.avgScore.toFixed(2) : '暂无评分'}
                      </Typography>
                    </Grid>
                    {selectedRecord.resultCount > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          评分分布
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {selectedRecord.ratings.map((rating, index) => (
                            <Chip
                              key={index}
                              label={rating}
                              sx={{ 
                                bgcolor: getRatingColor(rating),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                              size="small"
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    {selectedRecord.testDetails && selectedRecord.testDetails.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          详细测试项目
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>分类</strong></TableCell>
                                <TableCell><strong>测试项目</strong></TableCell>
                                <TableCell align="center"><strong>评分</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedRecord.testDetails.map((detail, index) => (
                                <TableRow key={index}>
                                  <TableCell>{detail.category}</TableCell>
                                  <TableCell>{detail.item}</TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={detail.rating}
                                      sx={{ 
                                        bgcolor: getRatingColor(detail.rating),
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
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
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
  )
}

export default MergedRecordsIP