// AnimationControlPanel.jsx - 动画控制面板组件
import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Divider,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SettingsIcon from '@mui/icons-material/Settings'
import SpeedIcon from '@mui/icons-material/Speed'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AccessibilityIcon from '@mui/icons-material/Accessibility'
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid'

import accessibilityManager from '../core/AccessibilityManager'
import performanceMonitor from '../core/PerformanceMonitor'
import mobilePerformanceOptimizer from '../core/MobilePerformanceOptimizer'
import mobileVisualAdapter from '../utils/MobileVisualAdapter'

/**
 * 动画控制面板组件
 * 提供用户自定义动画设置的界面
 */
const AnimationControlPanel = ({
  open = false,
  onClose = null,
  theme = 'female'
}) => {
  // 状态管理
  const [preferences, setPreferences] = useState({})
  const [performanceStatus, setPerformanceStatus] = useState({})
  const [mobileStatus, setMobileStatus] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  
  // 初始化数据
  useEffect(() => {
    if (open) {
      loadCurrentSettings()
    }
  }, [open])
  
  /**
   * 加载当前设置
   */
  const loadCurrentSettings = async () => {
    setIsLoading(true)
    
    try {
      // 获取可访问性偏好
      const accessibilityPrefs = accessibilityManager.getPreferences()
      
      // 获取性能状态
      const perfStatus = performanceMonitor.getPerformanceReport()
      
      // 获取移动端状态
      const mobilePerf = await mobilePerformanceOptimizer.getPerformanceStatus()
      const mobileAdapt = mobileVisualAdapter.getAdaptationStatus()
      
      setPreferences(accessibilityPrefs)
      setPerformanceStatus(perfStatus)
      setMobileStatus({ performance: mobilePerf, adaptation: mobileAdapt })
      
    } catch (error) {
      console.error('Failed to load animation settings:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * 更新偏好设置
   */
  const updatePreference = (key, value) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    
    // 立即应用设置
    accessibilityManager.updatePreference(key, value)
  }
  
  /**
   * 批量更新偏好设置
   */
  const updatePreferences = (updates) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    
    // 批量应用设置
    accessibilityManager.updatePreferences(updates)
  }
  
  /**
   * 重置为默认设置
   */
  const resetToDefaults = () => {
    accessibilityManager.resetToDefaults()
    loadCurrentSettings()
  }
  
  /**
   * 获取性能等级颜色
   */
  const getPerformanceLevelColor = (level) => {
    switch (level) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'error'
      default: return 'default'
    }
  }
  
  /**
   * 获取性能等级文本
   */
  const getPerformanceLevelText = (level) => {
    switch (level) {
      case 'high': return '高性能'
      case 'medium': return '中等性能'
      case 'low': return '低性能'
      default: return '未知'
    }
  }
  
  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>加载设置中...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        动画控制面板
      </DialogTitle>
      
      <DialogContent dividers>
        {/* 系统状态概览 */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            系统状态
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              icon={<SpeedIcon />}
              label={`性能: ${getPerformanceLevelText(performanceStatus.performanceLevel)}`}
              color={getPerformanceLevelColor(performanceStatus.performanceLevel)}
              variant="outlined"
            />
            {mobileStatus.adaptation?.deviceCapabilities?.isMobile && (
              <Chip 
                icon={<PhoneAndroidIcon />}
                label="移动设备"
                color="info"
                variant="outlined"
              />
            )}
            {preferences.reduceMotion && (
              <Chip 
                icon={<AccessibilityIcon />}
                label="减少动画"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* 基础动画设置 */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">基础动画设置</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box space={3}>
              {/* 启用/禁用动画 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.enableAnimations}
                    onChange={(e) => updatePreference('enableAnimations', e.target.checked)}
                  />
                }
                label="启用动画效果"
              />
              
              {/* 动画速度 */}
              <Box mt={2}>
                <Typography gutterBottom>
                  动画速度: {preferences.animationSpeed}x
                </Typography>
                <Slider
                  value={preferences.animationSpeed}
                  onChange={(e, value) => updatePreference('animationSpeed', value)}
                  min={0.1}
                  max={3}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '慢' },
                    { value: 1, label: '正常' },
                    { value: 2, label: '快' }
                  ]}
                  disabled={!preferences.enableAnimations}
                />
              </Box>
              
              {/* 减少动画 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.reduceMotion}
                    onChange={(e) => updatePreference('reduceMotion', e.target.checked)}
                  />
                }
                label="减少动画 (遵循系统偏好)"
              />
              
              {preferences.reduceMotion && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  启用此选项将大幅简化或禁用动画效果，适合对动画敏感的用户。
                </Alert>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* 视觉效果设置 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">视觉效果设置</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box space={3}>
              {/* 高对比度 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.highContrast}
                    onChange={(e) => updatePreference('highContrast', e.target.checked)}
                  />
                }
                label="高对比度模式"
              />
              
              {/* 色盲友好 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.colorBlindFriendly}
                    onChange={(e) => updatePreference('colorBlindFriendly', e.target.checked)}
                  />
                }
                label="色盲友好模式"
              />
              
              {/* 减少透明度 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.reducedTransparency}
                    onChange={(e) => updatePreference('reducedTransparency', e.target.checked)}
                  />
                }
                label="减少透明效果"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* 交互设置 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">交互设置</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box space={3}>
              {/* 更大的点击目标 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.largerClickTargets}
                    onChange={(e) => updatePreference('largerClickTargets', e.target.checked)}
                  />
                }
                label="更大的点击目标"
              />
              
              {/* 音效设置 */}
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.enableSoundEffects}
                    onChange={(e) => updatePreference('enableSoundEffects', e.target.checked)}
                  />
                }
                label="启用音效反馈"
              />
              
              {preferences.enableSoundEffects && (
                <Box mt={2}>
                  <Typography gutterBottom>
                    音效音量: {Math.round(preferences.soundVolume * 100)}%
                  </Typography>
                  <Slider
                    value={preferences.soundVolume}
                    onChange={(e, value) => updatePreference('soundVolume', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    marks={[
                      { value: 0, label: '静音' },
                      { value: 0.5, label: '50%' },
                      { value: 1, label: '100%' }
                    ]}
                  />
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* 性能信息 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">性能信息</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box space={2}>
              {/* 当前性能状态 */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  当前性能等级
                </Typography>
                <Chip 
                  label={getPerformanceLevelText(performanceStatus.performanceLevel)}
                  color={getPerformanceLevelColor(performanceStatus.performanceLevel)}
                />
              </Box>
              
              {/* 性能指标 */}
              {performanceStatus.metrics && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    性能指标
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                    <Typography variant="body2">
                      FPS: {performanceStatus.metrics.fps}
                    </Typography>
                    <Typography variant="body2">
                      帧时间: {performanceStatus.metrics.frameTime?.toFixed(2)}ms
                    </Typography>
                    <Typography variant="body2">
                      活跃动画: {performanceStatus.metrics.animationCount}
                    </Typography>
                    <Typography variant="body2">
                      掉帧次数: {performanceStatus.metrics.droppedFrames}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* 设备信息 */}
              {performanceStatus.deviceInfo && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    设备信息
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                    <Typography variant="body2">
                      CPU核心: {performanceStatus.deviceInfo.cores}
                    </Typography>
                    <Typography variant="body2">
                      内存: {performanceStatus.deviceInfo.memory}GB
                    </Typography>
                    <Typography variant="body2">
                      网络: {performanceStatus.deviceInfo.connection}
                    </Typography>
                    <Typography variant="body2">
                      平台: {performanceStatus.deviceInfo.platform}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* 性能建议 */}
              {performanceStatus.recommendations && performanceStatus.recommendations.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    性能建议
                  </Typography>
                  {performanceStatus.recommendations.map((rec, index) => (
                    <Alert key={index} severity={rec.type} sx={{ mt: 1 }}>
                      {rec.message}
                    </Alert>
                  ))}
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        
        {/* 移动端设置 */}
        {mobileStatus.adaptation?.deviceCapabilities?.isMobile && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">移动端设置</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box space={2}>
                {/* 设备信息 */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    设备信息
                  </Typography>
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                    <Typography variant="body2">
                      屏幕尺寸: {mobileStatus.adaptation.screenInfo?.size}
                    </Typography>
                    <Typography variant="body2">
                      方向: {mobileStatus.adaptation.currentOrientation}
                    </Typography>
                    <Typography variant="body2">
                      像素比: {mobileStatus.adaptation.screenInfo?.pixelRatio}
                    </Typography>
                    <Typography variant="body2">
                      触摸支持: {mobileStatus.adaptation.deviceCapabilities?.hasTouch ? '是' : '否'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* 适配状态 */}
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    适配状态
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip 
                      label={`时长倍数: ${mobileStatus.adaptation.durationMultiplier?.toFixed(2)}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={`强度倍数: ${mobileStatus.adaptation.intensityMultiplier?.toFixed(2)}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                
                {/* 性能配置 */}
                {mobileStatus.performance?.performanceProfile && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      移动端性能配置
                    </Typography>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                      <Typography variant="body2">
                        质量: {mobileStatus.performance.performanceProfile.animationQuality}
                      </Typography>
                      <Typography variant="body2">
                        帧率: {mobileStatus.performance.performanceProfile.frameRate}fps
                      </Typography>
                      <Typography variant="body2">
                        最大并发: {mobileStatus.performance.performanceProfile.maxConcurrentAnimations}
                      </Typography>
                      <Typography variant="body2">
                        GPU加速: {mobileStatus.performance.performanceProfile.enableGPUAcceleration ? '启用' : '禁用'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
        
        {/* 预设配置 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">快速预设</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box space={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                选择预设配置快速应用常用设置组合
              </Typography>
              
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => updatePreferences({
                    enableAnimations: true,
                    animationSpeed: 1,
                    reduceMotion: false,
                    highContrast: false,
                    colorBlindFriendly: false
                  })}
                >
                  标准模式
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => updatePreferences({
                    enableAnimations: true,
                    animationSpeed: 2,
                    reduceMotion: false,
                    highContrast: false,
                    colorBlindFriendly: false
                  })}
                >
                  高速模式
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => updatePreferences({
                    enableAnimations: true,
                    animationSpeed: 0.5,
                    reduceMotion: true,
                    highContrast: true,
                    largerClickTargets: true
                  })}
                >
                  可访问性模式
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => updatePreferences({
                    enableAnimations: false,
                    reduceMotion: true,
                    highContrast: true,
                    reducedTransparency: true,
                    largerClickTargets: true
                  })}
                >
                  最小动画模式
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={resetToDefaults} color="secondary">
          重置默认
        </Button>
        <Button onClick={loadCurrentSettings}>
          刷新状态
        </Button>
        <Button onClick={onClose} variant="contained">
          完成
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AnimationControlPanel