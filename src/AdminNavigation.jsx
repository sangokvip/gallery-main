import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Launch as LaunchIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Favorite as FavoriteIcon,
  Public as PublicIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Forum as ForumIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const AdminNavigation = ({ currentAdmin }) => {
  // 定义所有板块的导航链接
  const navigationItems = [
    {
      name: '主页',
      url: '/index.html',
      icon: <DashboardIcon />,
      description: 'M-Profile Lab 主页面',
      color: '#1976d2',
      category: '核心功能'
    },
    {
      name: '女M测试',
      url: '/female.html',
      icon: <PersonIcon />,
      description: '女性M型人格测试',
      color: '#e91e63',
      category: '人格测试'
    },
    {
      name: '男M测试',
      url: '/male.html',
      icon: <PersonIcon />,
      description: '男性M型人格测试',
      color: '#2196f3',
      category: '人格测试'
    },
    {
      name: 'S型测试',
      url: '/s.html',
      icon: <AssessmentIcon />,
      description: 'S型人格测试',
      color: '#ff9800',
      category: '人格测试'
    },
    {
      name: 'LGBT+测试',
      url: '/lgbt.html',
      icon: <PublicIcon />,
      description: 'LGBT+身份探索测试',
      color: '#9c27b0',
      category: '人格测试'
    },
    {
      name: '留言板',
      url: '/message.html',
      icon: <ForumIcon />,
      description: '社区留言和互动',
      color: '#4caf50',
      category: '社区功能'
    },
    {
      name: '图库',
      url: '/gallery.html',
      icon: <PhotoLibraryIcon />,
      description: '图片分享和投票',
      color: '#ff5722',
      category: '社区功能'
    },
    {
      name: '管理后台',
      url: '/sangok.html',
      icon: <SettingsIcon />,
      description: '系统管理和数据分析',
      color: '#607d8b',
      category: '系统管理'
    }
  ];

  // 按分类分组
  const groupedItems = navigationItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {});

  const handleNavigation = (url) => {
    // 在新窗口中打开链接
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const categories = Object.keys(groupedItems);

  return (
    <Box sx={{ mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LaunchIcon sx={{ mr: 2, color: 'white' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            快速导航
          </Typography>
          <Chip 
            label="新窗口打开" 
            size="small" 
            sx={{ ml: 2, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
        
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
          点击以下按钮可在新窗口中快速跳转到各个功能板块
        </Typography>

        {categories.map((category, categoryIndex) => (
          <Box key={category} sx={{ mb: categoryIndex < categories.length - 1 ? 3 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', flexGrow: 1 }}>
                {category}
              </Typography>
              <Divider sx={{ flexGrow: 1, ml: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </Box>
            
            <Grid container spacing={2}>
              {groupedItems[category].map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Tooltip title={`在新窗口中打开 ${item.name}`} arrow>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleNavigation(item.url)}
                      sx={{
                        backgroundColor: item.color,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: `${item.color}dd`,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                        },
                        transition: 'all 0.3s ease',
                        borderRadius: 3,
                        py: 2,
                        px: 1,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                      }}
                      startIcon={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {item.icon}
                          <LaunchIcon sx={{ ml: 0.5, fontSize: 16 }} />
                        </Box>
                      }
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                          {item.name}
                        </Typography>
                      </Box>
                    </Button>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
        
        <Divider sx={{ my: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            管理员: {currentAdmin?.username || '未知'} | 角色: {currentAdmin?.role || '未知'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label="安全连接" 
              size="small" 
              sx={{ backgroundColor: 'rgba(76,175,80,0.8)', color: 'white' }}
            />
            <Chip 
              label="新窗口" 
              size="small" 
              sx={{ backgroundColor: 'rgba(33,150,243,0.8)', color: 'white' }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminNavigation;