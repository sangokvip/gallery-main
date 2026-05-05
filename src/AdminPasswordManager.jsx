import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const AdminPasswordManager = ({ currentAdmin, onPasswordChange }) => {
  if (!currentAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" color="error" align="center">
            请先登录管理员账户
          </Typography>
        </Paper>
      </Container>
    );
  }
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const validatePassword = (password) => {
    // 密码强度验证
    if (password.length < 8) {
      return '密码长度至少为8位';
    }
    if (!/[A-Z]/.test(password)) {
      return '密码必须包含至少一个大写字母';
    }
    if (!/[a-z]/.test(password)) {
      return '密码必须包含至少一个小写字母';
    }
    if (!/[0-9]/.test(password)) {
      return '密码必须包含至少一个数字';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return '密码必须包含至少一个特殊字符';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 验证当前密码
    if (currentPassword !== '[REMOVED]') {
      setError('当前密码不正确');
      return;
    }

    // 验证新密码
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 验证密码匹配
    if (newPassword !== confirmPassword) {
      setError('新密码与确认密码不匹配');
      return;
    }

    // 验证新密码与当前密码不同
    if (newPassword === currentPassword) {
      setError('新密码不能与当前密码相同');
      return;
    }

    setOpenConfirmDialog(true);
  };

  const confirmPasswordChange = async () => {
    setOpenConfirmDialog(false);
    setLoading(true);

    try {
      // 模拟API调用 - 在实际应用中这里会调用后端API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地存储的管理员信息（实际应用中应该通过API更新）
      const updatedAdmin = {
        ...currentAdmin,
        username: 'adam',
        password: newPassword
      };
      
      // 更新localStorage中的管理员数据
      localStorage.setItem('admin_data', JSON.stringify(updatedAdmin));
      
      // 调用父组件的回调函数
      if (onPasswordChange) {
        onPasswordChange(updatedAdmin);
      }
      
      setSuccess('密码修改成功！请记住您的新密码。');
      
      // 清空表单
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      setError('密码修改失败，请稍后重试。');
      console.error('密码修改错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const passwordStrength = (password) => {
    if (!password) return { score: 0, label: '无', color: '#ccc' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    const levels = [
      { score: 0, label: '无', color: '#ccc' },
      { score: 1, label: '弱', color: '#f44336' },
      { score: 2, label: '一般', color: '#ff9800' },
      { score: 3, label: '良好', color: '#2196f3' },
      { score: 4, label: '强', color: '#4caf50' },
      { score: 5, label: '非常强', color: '#2e7d32' }
    ];
    
    return levels[score];
  };

  const strength = passwordStrength(newPassword);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
            管理员密码管理
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Card sx={{ mb: 3, backgroundColor: 'rgba(25, 118, 210, 0.05)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              当前登录用户: <strong>{currentAdmin?.username || '未知'}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              角色: <strong>{currentAdmin?.role || '未知'}</strong>
            </Typography>
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="当前密码"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="新密码"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              helperText="密码必须包含大小写字母、数字和特殊字符，长度至少8位"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 1 }}
            />
            
            {newPassword && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  密码强度:
                </Typography>
                <Box
                  sx={{
                    width: 100,
                    height: 8,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 4,
                    overflow: 'hidden',
                    mr: 1
                  }}
                >
                  <Box
                    sx={{
                      width: `${(strength.score / 5) * 100}%`,
                      height: '100%',
                      backgroundColor: strength.color,
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: strength.color, fontWeight: 'bold' }}
                >
                  {strength.label}
                </Typography>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="确认新密码"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              startIcon={<SaveIcon />}
            >
              {loading ? '修改中...' : '修改密码'}
            </Button>
          </Box>
        </form>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', p: 2, borderRadius: 2, borderLeft: '4px solid #ffc107' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
            🔒 安全提示：
          </Typography>
          <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2, m: 0 }}>
            <li>请使用强密码，包含大小写字母、数字和特殊字符</li>
            <li>建议每3-6个月更换一次密码</li>
            <li>不要将密码告诉他人或在其他网站使用相同密码</li>
            <li>修改密码后请妥善保管，避免遗忘</li>
          </Typography>
        </Box>
      </Paper>
      
      {/* 确认对话框 */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>
          确认修改密码
        </DialogTitle>
        <DialogContent>
          <Typography>
            您确定要修改管理员密码吗？修改后需要重新登录。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>
            取消
          </Button>
          <Button onClick={confirmPasswordChange} variant="contained" autoFocus>
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPasswordManager;