import React, { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material'
import {
  DataUsage as DataUsageIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { supabase } from './utils/supabase.js'
import { mockDataGenerator } from './utils/mockDataGenerator.js'

// 数据管理工具组件
function DataManager() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [dataStats, setDataStats] = useState({
    users: 0,
    testRecords: 0,
    testResults: 0,
    userIPs: 0
  })
  const [generationConfig, setGenerationConfig] = useState({
    userCount: 30,
    recordsPerUser: 2,
    includeIPData: true,
    includeTestDetails: true
  })

  // 加载数据统计
  const loadDataStats = async () => {
    try {
      const queries = [
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('test_records').select('id', { count: 'exact' }),
        supabase.from('test_results').select('id', { count: 'exact' }),
        supabase.from('user_ips').select('id', { count: 'exact' })
      ]

      const results = await Promise.allSettled(queries)
      
      setDataStats({
        users: results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0,
        testRecords: results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0,
        testResults: results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0,
        userIPs: results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0
      })
    } catch (error) {
      console.error('加载数据统计失败:', error)
      setDataStats({ users: 0, testRecords: 0, testResults: 0, userIPs: 0 })
    }
  }

  // 生成虚拟数据
  const generateMockData = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔄 开始生成虚拟数据...')
      
      const mockData = mockDataGenerator.generateCompleteMockData(
        generationConfig.userCount,
        generationConfig.recordsPerUser
      )
      
      console.log('💾 开始保存虚拟数据到数据库...')
      
      // 保存用户数据
      if (mockData.users.length > 0) {
        const { error: userError } = await supabase
          .from('users')
          .insert(mockData.users)
        
        if (userError) {
          console.warn('用户数据保存失败（可能已存在）:', userError.message)
        } else {
          console.log(`✅ 用户数据保存成功: ${mockData.users.length}条`)
        }
      }
      
      // 保存IP数据
      if (generationConfig.includeIPData && mockData.userIPs.length > 0) {
        const { error: ipError } = await supabase
          .from('user_ips')
          .insert(mockData.userIPs)
        
        if (ipError) {
          console.warn('IP数据保存失败（可能已存在）:', ipError.message)
        } else {
          console.log(`✅ IP数据保存成功: ${mockData.userIPs.length}条`)
        }
      }
      
      // 保存测试记录
      if (mockData.testRecords.length > 0) {
        const testRecordsData = mockData.testRecords.map(record => ({
          id: record.id,
          user_id_text: record.user_id_text,
          test_type: record.test_type,
          created_at: record.created_at
        }))
        
        const { error: recordError } = await supabase
          .from('test_records')
          .insert(testRecordsData)
        
        if (recordError) {
          console.warn('测试记录保存失败（可能已存在）:', recordError.message)
        } else {
          console.log(`✅ 测试记录保存成功: ${testRecordsData.length}条`)
        }
      }
      
      // 保存测试详情
      if (generationConfig.includeTestDetails && mockData.testResults.length > 0) {
        const { error: detailError } = await supabase
          .from('test_results')
          .insert(mockData.testResults)
        
        if (detailError) {
          console.warn('测试详情保存失败（可能已存在）:', detailError.message)
        } else {
          console.log(`✅ 测试详情保存成功: ${mockData.testResults.length}条`)
        }
      }
      
      console.log('🎉 虚拟数据生成和保存完成！')
      setMessageType('success')
      setMessage(`虚拟数据生成成功！已创建 ${mockData.users.length} 个用户，${mockData.testRecords.length} 条测试记录`)
      
      // 重新加载数据统计
      await loadDataStats()
      
    } catch (error) {
      console.error('❌ 生成虚拟数据失败:', error)
      setMessageType('error')
      setMessage(`生成虚拟数据失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 清空所有数据
  const clearAllData = async () => {
    if (!window.confirm('⚠️ 警告：此操作将删除所有数据（用户、测试记录、IP数据等），是否继续？')) {
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🗑️ 开始清空所有数据...')
      
      // 按顺序删除数据（避免外键约束问题）
      const deleteOrder = [
        'test_results',
        'test_records', 
        'user_ips',
        'users'
      ]
      
      for (const table of deleteOrder) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '') // 删除所有记录
          
          if (error) {
            console.warn(`删除表 ${table} 失败:`, error.message)
          } else {
            console.log(`✅ 表 ${table} 已清空`)
          }
        } catch (error) {
          console.warn(`删除表 ${table} 时出错:`, error.message)
        }
      }
      
      console.log('🎉 所有数据已清空！')
      setMessageType('success')
      setMessage('所有数据已清空！')
      
      // 重新加载数据统计
      await loadDataStats()
      
    } catch (error) {
      console.error('❌ 清空数据失败:', error)
      setMessageType('error')
      setMessage(`清空数据失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDataStats()
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DataUsageIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            数据管理工具
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* 数据统计 */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          📊 当前数据统计
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      用户数量
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {dataStats.users}
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
                      测试记录
                    </Typography>
                    <Typography variant="h4" color="secondary">
                      {dataStats.testRecords}
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
                      测试详情
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {dataStats.testResults}
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                      IP记录
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {dataStats.userIPs}
                    </Typography>
                  </Box>
                  <LocationIcon sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* 操作按钮 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDataStats}
            disabled={loading}
          >
            刷新统计
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={clearAllData}
            disabled={loading}
          >
            清空数据
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* 虚拟数据生成 */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          🎯 虚拟数据生成
        </Typography>
        
        {message && (
          <Alert 
            severity={messageType} 
            sx={{ mb: 3 }}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <TextField
                label="用户数量"
                type="number"
                value={generationConfig.userCount}
                onChange={(e) => setGenerationConfig({...generationConfig, userCount: parseInt(e.target.value) || 0})}
                inputProps={{ min: 1, max: 100 }}
                helperText="建议范围: 10-50个"
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <TextField
                label="每用户测试记录数"
                type="number"
                value={generationConfig.recordsPerUser}
                onChange={(e) => setGenerationConfig({...generationConfig, recordsPerUser: parseInt(e.target.value) || 0})}
                inputProps={{ min: 1, max: 10 }}
                helperText="建议范围: 1-5条"
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <FormControl fullWidth>
                <input
                  type="checkbox"
                  checked={generationConfig.includeIPData}
                  onChange={(e) => setGenerationConfig({...generationConfig, includeIPData: e.target.checked})}
                />
                <label>包含IP地址数据</label>
              </FormControl>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <input
                type="checkbox"
                checked={generationConfig.includeTestDetails}
                onChange={(e) => setGenerationConfig({...generationConfig, includeTestDetails: e.target.checked})}
              />
              <label>包含测试详情</label>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            onClick={generateMockData}
            disabled={loading}
            size="large"
          >
            生成虚拟数据
          </Button>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* 使用说明 */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          📋 使用说明
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="虚拟数据生成"
              secondary="用于演示和测试，生成包含用户、测试记录、IP地址等完整数据集"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="数据统计"
              secondary="实时显示当前数据库中的各类数据数量"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ErrorIcon color="warning" />
            </ListItemIcon>
            <ListItemText 
              primary="清空数据"
              secondary="谨慎使用，将删除所有现有数据，包括用户、测试记录、IP数据等"
            />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>提示：</strong>如果后台显示数据为空或测试记录没有详情，请使用此工具生成虚拟数据进行演示。
            生成的数据包含真实的IP地址信息、详细的测试结果和完整的用户信息。
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default DataManager