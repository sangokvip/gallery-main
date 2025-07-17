import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Container, Typography, Paper, Box, TextField, Button, AppBar, Toolbar, 
  IconButton, Snackbar, ThemeProvider, createTheme, Dialog, DialogTitle, 
  DialogContent, DialogActions, Divider, CircularProgress, Grid, Card, 
  CardContent, CardMedia, CardActions, Modal, FormControl, InputLabel, 
  MenuItem, Select, LinearProgress, Checkbox, Alert, CssBaseline,
  useMediaQuery, Drawer, List, ListItem, ListItemIcon, ListItemText,
  alpha
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import InfoIcon from '@mui/icons-material/Info';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorIcon from '@mui/icons-material/Error';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Masonry from '@mui/lab/Masonry';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import ScienceIcon from '@mui/icons-material/Science';
import MessageIcon from '@mui/icons-material/Message';
import PushPinIcon from '@mui/icons-material/PushPin';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CropFreeIcon from '@mui/icons-material/CropFree';
import './styles/pixel-theme.css';
import { v4 as uuidv4 } from 'uuid';
import { galleryApi } from './utils/supabase';
import CollectionsIcon from '@mui/icons-material/Collections';

// 创建现代风格主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#f97316', // 橙色
      light: '#fb923c',
      dark: '#ea580c',
    },
    secondary: {
      main: '#f59e0b', // 黄色
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#fffbf5',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
    },
    accent: {
      pink: '#ec4899',
      green: '#10b981',
      yellow: '#f59e0b',
      red: '#ef4444',
    },
    error: {
      main: '#ef4444',
      light: '#f87171', 
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#f97316', // 改为橙色
      light: '#fb923c',
      dark: '#ea580c',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    }
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transform: 'translateY(1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha('#2563eb', 0.08),
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#60a5fa',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          transition: 'color 0.2s ease',
          fontWeight: 500,
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
  },
});

// 添加自定义样式到主题
const styles = `
  @keyframes titleGlow {
    0% {
      text-shadow: 0 0 5px rgba(37, 99, 235, 0.5),
                   0 0 10px rgba(37, 99, 235, 0.3),
                   0 0 15px rgba(37, 99, 235, 0.2);
    }
    50% {
      text-shadow: 0 0 10px rgba(37, 99, 235, 0.8),
                   0 0 20px rgba(37, 99, 235, 0.5),
                   0 0 30px rgba(37, 99, 235, 0.3);
    }
    100% {
      text-shadow: 0 0 5px rgba(37, 99, 235, 0.5),
                   0 0 10px rgba(37, 99, 235, 0.3),
                   0 0 15px rgba(37, 99, 235, 0.2);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .main-title {
    position: relative;
    display: inline-block;
    background: linear-gradient(45deg, #2563eb, #8b5cf6);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: titleGlow 3s ease-in-out infinite;
    letter-spacing: -0.025em;
  }

  .fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .image-loading {
    opacity: 0;
    transform: scale(0.98);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  
  .image-loaded {
    opacity: 1;
    transform: scale(1);
  }
  
  .hover-scale {
    transition: transform 0.3s ease;
  }
  
  .hover-scale:hover {
    transform: scale(1.03);
  }
  
  .pulse-animation {
    animation: pulse 2s infinite;
  }
`;

// 将样式添加到文档头部
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// 图片卡片组件
const ImageCard = ({ image, onView, onDelete, onEdit, isAdmin, isSelected, isSelectionMode, onSelect, userId }) => {
  const [voteStatus, setVoteStatus] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [newLikesCount, setNewLikesCount] = useState(image.likes_count || 0);
  const [newDislikesCount, setNewDislikesCount] = useState(image.dislikes_count || 0);
  const [isLongImage, setIsLongImage] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingVotes, setIsEditingVotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hovered, setHovered] = useState(false);

  const imageUrl = image.image_url || (image.image_path ? galleryApi.storage.from('gallery').getPublicUrl(image.image_path).data.publicUrl : '');

  // 判断是否是当前用户上传的图片
  const isCurrentUserImage = image.user_id === userId;

  // 获取初始投票状态
  useEffect(() => {
    const fetchVoteStatus = async () => {
      try {
        const voteStatus = await galleryApi.getImageVoteStatus(image.id, userId);
        if (voteStatus !== null) {
          setVoteStatus(voteStatus);
        }
      } catch (error) {
        console.error('获取投票状态失败:', error);
      }
    };

    if (userId) {
      fetchVoteStatus();
    }
  }, [image.id, userId]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      const result = await galleryApi.updateImageLikes(image.id, userId, true);
      
      if (result.action === 'added') {
        setNewLikesCount(prev => prev + 1);
        setVoteStatus(true);
      } else if (result.action === 'removed') {
        setNewLikesCount(prev => prev - 1);
        setVoteStatus(null);
      } else if (result.action === 'changed') {
        setNewLikesCount(prev => prev + 1);
        setNewDislikesCount(prev => prev - 1);
        setVoteStatus(true);
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDislike = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      const result = await galleryApi.updateImageLikes(image.id, userId, false);
      
      if (result.action === 'added') {
        setNewDislikesCount(prev => prev + 1);
        setVoteStatus(false);
      } else if (result.action === 'removed') {
        setNewDislikesCount(prev => prev - 1);
        setVoteStatus(null);
      } else if (result.action === 'changed') {
        setNewDislikesCount(prev => prev + 1);
        setNewLikesCount(prev => prev - 1);
        setVoteStatus(false);
      }
    } catch (error) {
      console.error('点踩失败:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 管理员更新点赞数量
  const handleAdminUpdateVotes = async () => {
    try {
      setIsUpdating(true);
      await galleryApi.adminUpdateVotes(image.id, newLikesCount, newDislikesCount);
      setNewLikesCount(newLikesCount);
      setNewDislikesCount(newDislikesCount);
      setIsEditingVotes(false);
      setSnackbarMessage('点赞数量已更新');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('更新点赞数量失败:', error);
      setSnackbarMessage(error.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsUpdating(false);
    }
  };

  // 判断当前用户是否有编辑权限
  const hasEditPermission = isAdmin || image.user_id === userId;

  const handleImageLoad = (e) => {
    const img = e.target;
    const { naturalWidth, naturalHeight } = img;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
    setIsLongImage(naturalHeight > naturalWidth * 1.5);
    setImageLoaded(true);
    setImageError(false);
  };

  // 置顶功能
  const handlePinImage = async (e) => {
    e.stopPropagation();
    try {
      setIsUpdating(true);
      const result = await galleryApi.pinImage(image.id);
      
      // 触发父组件的刷新
      if (result.success) {
        onEdit({ ...image, is_pinned: result.is_pinned });
      }
    } catch (error) {
      console.error('置顶操作失败:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}天前`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}个月前`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}年前`;
  };

  return (
    <Card 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isSelected 
          ? '0 0 0 3px #2563eb, 0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        opacity: isSelectionMode && !isSelected ? 0.7 : 1,
        backgroundColor: 'background.paper',
        transition: 'all 0.3s ease',
        position: 'relative',
        transform: hovered && !isSelectionMode ? 'translateY(-8px)' : 'translateY(0)',
        '&:hover': {
          boxShadow: isSelected 
            ? '0 0 0 3px #2563eb, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' 
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 添加用户标识徽章 */}
      {isCurrentUserImage && (
        <Box
          sx={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'primary.main',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1.5px solid rgba(255,255,255,0.8)',
            animation: 'pulse 2s infinite',
          }}
        >
          我的图片
        </Box>
      )}

      {/* 添加日期标签 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '8px',
          fontSize: '0.7rem',
          fontWeight: '500',
          zIndex: 2,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.3s ease',
        }}
      >
        {formatTimeAgo(image.created_at)}
      </Box>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: isLongImage ? '140%' : '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
          cursor: !isSelectionMode ? 'pointer' : 'default',
        }}
        onClick={() => !isSelectionMode && onView(image)}
      >
        {!imageLoaded && !imageError && (
          <Box
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
            }}
          >
            <CircularProgress 
              size={30} 
              sx={{ color: 'primary.main' }}
            /> 
          </Box>
        )}
        
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: isEditingVotes ? 'none' : 'auto'
          }}
        >
          <img 
            src={imageUrl} 
            alt={image.title || '图片'} 
            onLoad={handleImageLoad}
            onError={() => setImageError(true)}
            className={imageLoaded ? 'image-loaded' : 'image-loading'}
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease-out',
              transform: hovered && !isSelectionMode ? 'scale(1.05)' : 'scale(1)'
            }} 
          />
      </Box>
      
        {/* 交互图标栏 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: hovered ? 
              'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0) 60%)' : 
              'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%)',
            opacity: 1,
            transition: 'all 0.3s ease',
          }}
        />

        {/* 票数和操作区 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2,
          }}
        >
          {isAdmin && isEditingVotes ? (
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <TextField
                size="small"
                type="number"
                value={newLikesCount}
                onChange={(e) => setNewLikesCount(Math.max(0, parseInt(e.target.value) || 0))}
                sx={{
                  width: '70px',
                  '& .MuiInputBase-input': {
                    color: 'white',
                    fontSize: '0.875rem',
                    padding: '8px 12px',
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <TextField
                size="small"
                type="number"
                value={newDislikesCount}
                onChange={(e) => setNewDislikesCount(Math.max(0, parseInt(e.target.value) || 0))}
                sx={{
                  width: '70px',
                  '& .MuiInputBase-input': {
                    color: 'white',
                    fontSize: '0.875rem',
                    padding: '8px 12px',
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdminUpdateVotes();
                }}
                disabled={isUpdating}
                sx={{
                  color: 'success.main',
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }
                }}
              >
                <CheckCircleIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingVotes(false);
                  setNewLikesCount(image.likes_count || 0);
                  setNewDislikesCount(image.dislikes_count || 0);
                }}
                sx={{
                  color: 'error.main',
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' }
                }}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={handleLike}
                    disabled={isUpdating}
                    sx={{
                      color: voteStatus === true ? 'primary.light' : 'white',
                      backgroundColor: voteStatus === true ? 'rgba(37, 99, 235, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      '&:hover': {
                        backgroundColor: voteStatus === true ? 'rgba(37, 99, 235, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                      },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <ThumbUpIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                    }}
                  >
                    {newLikesCount}
        </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton 
                    size="small" 
                    onClick={handleDislike}
                    disabled={isUpdating}
                    sx={{
                      color: voteStatus === false ? 'error.light' : 'white',
                      backgroundColor: voteStatus === false ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      '&:hover': {
                        backgroundColor: voteStatus === false ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                      },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <ThumbDownIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                    }}
                  >
                    {newDislikesCount}
        </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {isAdmin && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingVotes(true);
                    }}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      },
                      width: 36,
                      height: 36,
                      display: { xs: 'flex', sm: 'flex' }
                    }}
                  >
                    <EditIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                )}
                
                {isAdmin && (
                  <IconButton
                    size="small"
                    onClick={handlePinImage}
                    disabled={isUpdating}
                    sx={{ 
                      color: image.is_pinned ? 'warning.light' : 'white',
                      backgroundColor: image.is_pinned ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      '&:hover': {
                        backgroundColor: image.is_pinned ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 0, 0, 0.6)',
                      },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <PushPinIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                )}
              </Box>
            </>
          )}
        </Box>

        {isAdmin && !image.is_approved && (
          <Box
            sx={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'error.main',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              zIndex: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            待审核
          </Box>
        )}

        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelect(image.id)}
            sx={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              padding: '4px',
              zIndex: 3,
              '&.Mui-checked': {
                color: 'primary.main'
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          />
        )}

        {/* 移动端控制按钮 */}
        {hovered && !isSelectionMode && (isCurrentUserImage || isAdmin) && (
          <Box
            sx={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: 1,
              zIndex: 3,
            }}
          >
          <IconButton 
            size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(image);
              }}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'white',
                },
                width: 36,
                height: 36,
                boxShadow: 2,
                display: { xs: 'flex', sm: 'none' }  // 只在移动端显示
              }}
            >
              <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'white',
                  color: 'error.dark',
                },
                width: 36,
                height: 36,
                boxShadow: 2,
              }}
            >
              <DeleteIcon fontSize="small" />
          </IconButton>
          </Box>
        )}

        {/* 删除确认对话框 */}
        <Dialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
              boxShadow: 3,
              maxWidth: '400px',
              width: '90%',
            }
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>确认删除</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              确定要删除这张图片吗？此操作无法撤销。
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button 
              onClick={() => setShowDeleteConfirm(false)}
              variant="outlined"
              size="medium"
            >
              取消
            </Button>
            <Button
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete(image.id);
              }}
              variant="contained"
              color="error" 
              size="medium"
              sx={{ ml: 1 }}
            >
              删除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Card>
  );
};

// 图片详情模态框
const ImageDetailModal = ({ open, image, onClose, images, currentIndex, onPrevious, onNext }) => {
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isMobile] = useState(window.innerWidth <= 768);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const imageRef = useRef(null);

  // 使用 useMemo 计算导航状态
  const { canShowPrevious, canShowNext } = useMemo(() => ({
    canShowPrevious: currentIndex > 0,
    canShowNext: Array.isArray(images) && currentIndex < images.length - 1
  }), [currentIndex, images]);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX) return;
    
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // 设置滑动方向
    if (diff > 50) {
      setSwipeDirection('left');
    } else if (diff < -50) {
      setSwipeDirection('right');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (swipeDirection === 'left' && canShowNext) {
      onNext?.();
    } else if (swipeDirection === 'right' && canShowPrevious) {
      onPrevious?.();
    }
    
    setTouchStartX(0);
    setSwipeDirection(null);
  };

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'ArrowLeft') {
      onPrevious?.();
    } else if (event.key === 'ArrowRight') {
      onNext?.();
    } else if (event.key === 'Escape') {
      onClose?.();
    } else if (event.key === '+' || event.key === '=') {
      handleZoomIn();
    } else if (event.key === '-') {
      handleZoomOut();
    } else if (event.key === '0') {
      handleResetZoom();
    } else if (event.key === 'f') {
      toggleFullScreen();
    }
  }, [onPrevious, onNext, onClose]);

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  // 重置缩放比例
  useEffect(() => {
    if (open) {
      setScale(1);
      setLoading(true);
      setIsFullScreen(false);
    }
  }, [open, image]);

  // 处理全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 如果没有图片，不显示模态框
  if (!open || !image) return null;

  // 获取图片URL
  const imageUrl = image?.image_url || (image?.image_path ? galleryApi.storage.from('gallery').getPublicUrl(image.image_path).data.publicUrl : null);

  // 如果没有有效的图片URL，不显示模态框
  if (!imageUrl) return null;

  // 格式化创建时间
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(5px)',
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'black',
          zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
          overflow: 'hidden',
        }}
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => setTimeout(() => setShowControls(false), 2000)}
        onClick={() => setShowControls(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部控制栏 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            zIndex: 5,
            transform: showControls ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s ease',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              opacity: 0.9,
            }}
          >
            {currentIndex + 1} / {images?.length || 1}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={toggleFullScreen}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              {isFullScreen ? <CropFreeIcon /> : <ZoomInIcon />}
            </IconButton>
            <IconButton
              onClick={onClose}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* 主内容区 */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 左右导航按钮 */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: showControls && canShowPrevious ? 1 : 0,
              transition: 'opacity 0.3s ease',
              zIndex: 4,
              cursor: canShowPrevious ? 'pointer' : 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (canShowPrevious) onPrevious?.();
            }}
          >
            {canShowPrevious && (
              <IconButton
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    transform: 'scale(1.1)',
                  },
                  width: 48,
                  height: 48,
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowBackIcon fontSize="large" />
              </IconButton>
            )}
          </Box>

          <Box
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: showControls && canShowNext ? 1 : 0,
              transition: 'opacity 0.3s ease',
              zIndex: 4,
              cursor: canShowNext ? 'pointer' : 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (canShowNext) onNext?.();
            }}
          >
            {canShowNext && (
              <IconButton
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    transform: 'scale(1.1)',
                  },
                  width: 48,
                  height: 48,
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowForwardIcon fontSize="large" />
              </IconButton>
            )}
          </Box>

          {/* 图片加载指示器 */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
              }}
            >
              <CircularProgress 
                sx={{ color: 'primary.main' }} 
                size={40} 
              />
            </Box>
          )}

          {/* 图片容器 */}
          <Box
            ref={imageRef}
          sx={{ 
            width: '100%', 
              height: '100%',
              overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
              alignItems: 'center',
              padding: 2,
          }}
        >
          <img 
              src={imageUrl}
              alt={image.description || ''}
            onLoad={handleImageLoad}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
                width: 'auto',
                height: 'auto',
              objectFit: 'contain',
              transform: `scale(${scale})`,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: loading ? 'none' : 'block',
            }} 
          />
        </Box>
        
          {/* 滑动指示器 */}
          {swipeDirection && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: swipeDirection === 'right' ? '10%' : 'auto',
                right: swipeDirection === 'left' ? '10%' : 'auto',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(4px)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
              }}
            >
              {swipeDirection === 'left' ? (
                <ArrowForwardIcon sx={{ color: 'white', fontSize: 30 }} />
              ) : (
                <ArrowBackIcon sx={{ color: 'white', fontSize: 30 }} />
              )}
            </Box>
          )}
        </Box>

        {/* 底部控制栏 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            transform: showControls ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease',
            zIndex: 5,
          }}
        >
          {/* 上传时间 */}
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.8rem',
            }}
          >
            上传于 {formatDate(image.created_at)}
        </Typography>
        
          {/* 图片描述 */}
          {image.description && (
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                opacity: 0.9,
                fontSize: '0.9rem',
                maxHeight: '60px',
                overflow: 'auto',
              }}
            >
              {image.description}
        </Typography>
          )}

          {/* 缩放控制 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              mt: 1,
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <RemoveIcon />
            </IconButton>
            
            <Typography
              variant="caption"
              sx={{ color: 'white', fontSize: '0.85rem', minWidth: '60px', textAlign: 'center' }}
            >
              {Math.round(scale * 100)}%
            </Typography>
            
            <IconButton
              onClick={handleZoomIn}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <AddIcon />
            </IconButton>
            
            <IconButton
              onClick={handleResetZoom}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <RestartAltIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

// 编辑图片信息对话框
const EditImageDialog = ({ open, image, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (image) {
      setTitle(image.title || '');
      setDescription(image.description || '');
    }
  }, [image]);

  const handleSave = () => {
    onSave({
      id: image?.id,
      title,
      description
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>编辑图片信息</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="标题"
          type="text"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <TextField
          label="描述"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          取消
        </Button>
        <Button onClick={handleSave} color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 上传图片对话框
const UploadDialog = ({ open, onClose, onUpload, isAdmin }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [completedUploads, setCompletedUploads] = useState(0);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFiles([]);
    setUploadProgress({});
    setUploading(false);
    setCompletedUploads(0);
  };

  const handleClose = () => {
    if (!uploading) {
      resetState();
      onClose();
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map(file => ({
      file,
      id: uuidv4(),
      title: file.name,
      description: '',
      preview: null
    }));

    // 为每个文件创建预览
    newFiles.forEach(fileObj => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, preview: reader.result } : f
        ));
      };
      reader.readAsDataURL(fileObj.file);
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
          });
        };

  const handleTitleChange = (fileId, newTitle) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, title: newTitle } : f
    ));
  };

  const handleDescriptionChange = (fileId, newDescription) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, description: newDescription } : f
    ));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setCompletedUploads(0);
    const totalFiles = files.length;

    try {
      if (isAdmin && files.length > 1) {
        // 管理员批量上传
        const fileArray = files.map(f => f.file);
        const metadataArray = files.map(f => ({
          title: f.title,
          description: f.description
        }));

        const results = await onUpload(fileArray, metadataArray, (progress, index) => {
          if (index !== undefined) {
            // 更新单个文件的进度
            const fileId = files[index].id;
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { status: 'uploading', progress }
            }));
            
            // 如果这个文件完成了，更新完成数量
            if (progress === 100) {
              setCompletedUploads(prev => prev + 1);
            }
          }
        });

        // 处理上传结果
        results.forEach((result, index) => {
          const fileId = files[index].id;
          if (result.success) {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { status: 'success', progress: 100 }
            }));
          } else {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { status: 'error', error: result.error }
            }));
          }
        });

        // 如果所有文件都上传成功，延迟1秒后关闭对话框
        const successCount = results.filter(r => r.success).length;
        if (successCount === files.length) {
          setTimeout(() => {
            handleClose();
          }, 1000);
        }
      } else {
        // 单文件上传
        for (const fileObj of files) {
          try {
            setUploadProgress(prev => ({
              ...prev,
              [fileObj.id]: { status: 'uploading', progress: 0 }
            }));

            await onUpload(fileObj.file, {
              title: fileObj.title,
              description: fileObj.description
            }, (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [fileObj.id]: { status: 'uploading', progress }
              }));
            });

            setUploadProgress(prev => ({
              ...prev,
              [fileObj.id]: { status: 'success', progress: 100 }
            }));
            setCompletedUploads(prev => prev + 1);
            
            // 单文件上传成功后，延迟1秒关闭对话框
            setTimeout(() => {
              handleClose();
            }, 1000);
          } catch (error) {
            console.error('上传失败:', error);
            setUploadProgress(prev => ({
              ...prev,
              [fileObj.id]: { status: 'error', error: error.message }
            }));
          }
        }
      }
    } catch (error) {
      console.error('批量上传失败:', error);
      files.forEach(file => {
        setUploadProgress(prev => ({
          ...prev,
          [file.id]: { status: 'error', error: error.message }
        }));
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth={isAdmin ? "md" : "sm"}
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          border: '4px solid #2196f3',
          boxShadow: '8px 8px 0 rgba(33, 150, 243, 0.3)',
          borderRadius: 0,
        }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: '1rem',
        color: '#2196f3',
      }}>
        {isAdmin ? "批量上传测评报告图片" : "上传测评报告图片"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<AddPhotoAlternateIcon className="pixel-icon" />}
            disabled={uploading}
            fullWidth
            className="pixel-button"
          >
            {isAdmin ? "选择多张图片" : "选择图片"}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              multiple={isAdmin}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Button>
        </Box>
        
        {files.length > 0 && (
            <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: isAdmin ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
            gap: 2,
            mb: 2 
          }}>
            {files.map((fileObj) => (
              <Paper
                key={fileObj.id}
                sx={{
                  p: 2,
                  position: 'relative',
                  bgcolor: 'background.paper',
                  backgroundImage: 'none',
                  border: '2px solid #2196f3',
                  borderRadius: 0,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#64b5f6',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                {fileObj.preview && (
              <Box sx={{
                width: '100%',
                    height: 150,
                mb: 1,
                    position: 'relative',
                    borderRadius: 1,
                    overflow: 'hidden'
              }}>
                <img 
                      src={fileObj.preview}
                  alt="Preview" 
                  style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {uploadProgress[fileObj.id] && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {uploadProgress[fileObj.id].status === 'uploading' && (
                          <CircularProgress
                            variant="determinate"
                            value={uploadProgress[fileObj.id].progress}
                            size={40}
                          />
                        )}
                        {uploadProgress[fileObj.id].status === 'success' && (
                          <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                        )}
                        {uploadProgress[fileObj.id].status === 'error' && (
                          <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                        )}
              </Box>
                    )}
          </Box>
        )}
        <TextField
                  size="small"
          label="标题"
                  value={fileObj.title}
                  onChange={(e) => handleTitleChange(fileObj.id, e.target.value)}
          fullWidth
                  sx={{ 
                    mb: 1,
                    '& .MuiInputLabel-root': {
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: '0.7rem',
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: '0.8rem',
                    }
                  }}
                  disabled={uploading || uploadProgress[fileObj.id]?.status === 'success'}
                />
        <TextField
                  size="small"
          label="描述"
                  value={fileObj.description}
                  onChange={(e) => handleDescriptionChange(fileObj.id, e.target.value)}
          fullWidth
                  multiline
                  rows={2}
                  sx={{ 
                    '& .MuiInputLabel-root': {
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: '0.7rem',
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: '0.8rem',
                    }
                  }}
                  disabled={uploading || uploadProgress[fileObj.id]?.status === 'success'}
                />
                {!uploading && uploadProgress[fileObj.id]?.status !== 'success' && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(fileObj.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)',
                        animation: 'pixelHover 0.5s infinite',
                      }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: '1rem', color: 'white' }} className="pixel-icon" />
                  </IconButton>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={uploading}
          className="pixel-button"
        >
          取消
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={files.length === 0 || uploading || files.every(file => uploadProgress[file.id]?.status === 'success')}
          variant="contained"
          startIcon={uploading ? <CircularProgress size={20} /> : <FileUploadIcon className="pixel-icon" />}
          className="pixel-button"
        >
          {uploading ? `上传中 (${completedUploads}/${files.length})` : '上传'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GalleryApp错误:', error);
    console.error('错误详情:', errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#1a1a1a',
            padding: 3,
            color: '#fff'
          }}
        >
          <Typography variant="h6" sx={{ color: '#ff69b4', marginBottom: 2 }}>
            页面加载出错了
          </Typography>
          <Typography variant="body1" sx={{ marginBottom: 2, maxWidth: 600, textAlign: 'center' }}>
            错误信息: {this.state.error?.message || '未知错误'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              backgroundColor: '#ff69b4',
              '&:hover': {
                backgroundColor: '#ff8dc3',
              },
            }}
          >
            刷新页面
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box sx={{ mt: 4, maxWidth: '100%', overflow: 'auto' }}>
              <pre style={{ color: '#ff69b4' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

// 主页面组件
function GalleryApp() {
  const [images, setImages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [imageDetailOpen, setImageDetailOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    // 从 localStorage 读取管理员状态
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [filter, setFilter] = useState('all');
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [viewingImage, setViewingImage] = useState(null);

  // 创建一个观察器引用
  const observer = useRef();
  // 创建一个最后一个元素的引用
  const lastImageElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // 使用ref存储最新的fetchImages函数
  const fetchImagesRef = useRef(null);

  // 添加响应式列数控制
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));

  // 根据屏幕尺寸确定列数
  const getColumnCount = () => {
    if (isXs) return 1;
    if (isSm) return 2;
    if (isMd) return 3;
    if (isLg) return 4;
    if (isLg && window.innerWidth >= 1440) return 5;
    return 6; // xl
  };

  // 获取图片列表
  const fetchImages = useCallback(async (isLoadingMore = false) => {
    if (!userId) {
      console.log('等待用户ID初始化...');
      return;
    }
    
    if (!isLoadingMore) {
      setLoading(true);
      // 重置图片列表
      setImages([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = page * limit;
      console.log('开始获取图片列表:', { page, limit, offset, filter, userId });
      const { data, count, hasMore: moreAvailable } = await galleryApi.getImages(limit, offset);
      
      if (!data) {
        console.log('没有获取到图片数据');
        if (!isLoadingMore) {
          setImages([]);
          setTotalCount(0);
        }
        setHasMore(false);
        return;
      }
      
      console.log('获取到原始图片数据:', { count, dataLength: data?.length });
      
      // 根据筛选条件过滤图片
      let filteredData = data || [];
      if (filter === 'approved') {
        filteredData = filteredData.filter(img => img.is_approved);
      } else if (filter === 'pending') {
        filteredData = filteredData.filter(img => !img.is_approved);
      }
      
      // 为每个图片添加当前用户ID
      filteredData = filteredData.map(img => ({
        ...img,
        current_user_id: userId
      }));
      
      // 对图片进行排序
      filteredData.sort((a, b) => {
        // 首先按照置顶状态排序
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        
        // 其次按照是否是当前用户的图片排序
        if (a.user_id === userId && b.user_id !== userId) return -1;
        if (a.user_id !== userId && b.user_id === userId) return 1;
        
        // 最后按照创建时间降序排序（新的在前）
        return new Date(b.created_at) - new Date(a.created_at);
      });

      console.log('过滤并排序后的图片数据:', { 
        filteredCount: filteredData.length, 
        filter,
        firstImage: filteredData[0] 
      });
      
      // 更新图片列表
      setImages(prev => isLoadingMore ? [...prev, ...filteredData] : filteredData);
      setTotalCount(count);
      setHasMore(moreAvailable);
    } catch (error) {
      console.error('获取图片失败:', error);
      setSnackbarMessage(`获取图片失败: ${error.message || '未知错误'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      if (!isLoadingMore) {
        setImages([]);
        setTotalCount(0);
      }
    } finally {
      if (!isLoadingMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [userId, page, limit, filter]);

  // 更新ref
  useEffect(() => {
    fetchImagesRef.current = fetchImages;
  }, [fetchImages]);

  // 监听依赖变化重新获取图片
  useEffect(() => {
    if (userId) {
      setPage(0); // 重置页码
      setHasMore(true); // 重置hasMore
      fetchImages(false);
    }
  }, [userId, filter]);

  // 监听页码变化加载更多图片
  useEffect(() => {
    if (page > 0) {
      fetchImages(true);
    }
  }, [page]);

  // 处理双击标题进入管理员模式
  const handleTitleDoubleClick = () => {
    const password = prompt('请输入管理员密码：');
    if (password === 'Sangok#3') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true'); // 保存管理员状态
      setSnackbarMessage('管理员登录成功！');
      setSnackbarOpen(true);
    } else if (password !== null) {
      setSnackbarMessage('密码错误！');
      setSnackbarOpen(true);
    }
  };

  // 退出管理员模式
  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin'); // 移除管理员状态
    setSnackbarMessage('已退出管理员模式！');
    setSnackbarOpen(true);
  };

  // 初始化用户ID
  useEffect(() => {
    try {
      console.log('开始初始化用户ID...');
      let idFromCookie = document.cookie.match(/userId=([^;]+)/)?.[1];
      let finalUserId;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

      if (idFromCookie) {
        let potentialUserId = idFromCookie;
        if (potentialUserId.startsWith('user_')) {
          console.log("移除 'user_' 前缀:", potentialUserId);
          potentialUserId = potentialUserId.substring(5);
        }

        if (uuidRegex.test(potentialUserId)) {
          finalUserId = potentialUserId;
          console.log("使用cookie中的有效UUID:", finalUserId);
        } else {
          console.log('Cookie中的UUID格式无效，生成新的UUID');
          finalUserId = uuidv4();
        }
      } else {
        console.log('Cookie中未找到UUID，生成新的UUID');
        finalUserId = uuidv4();
      }

      // 保存到cookie，使用更长的过期时间
      document.cookie = `userId=${finalUserId};path=/;max-age=31536000;SameSite=Lax`;
      console.log("设置用户ID:", finalUserId);
      setUserId(finalUserId);
    } catch (error) {
      console.error('初始化用户ID失败:', error);
      setSnackbarMessage('初始化用户ID失败，请刷新页面重试');
      setSnackbarOpen(true);
    }
  }, []);

  // 处理图片审核
  const handleApproveImage = useCallback(async (imageId, isApproved) => {
    try {
      await galleryApi.approveImage(imageId, isApproved);
      setSnackbarMessage(`图片已${isApproved ? '通过审核' : '取消审核'}`);
      setSnackbarOpen(true);
      // 使用ref中的最新fetchImages函数
      if (fetchImagesRef.current) {
        fetchImagesRef.current();
      }
    } catch (error) {
      console.error('审核图片失败:', error);
      setSnackbarMessage(`审核失败: ${error.message}`);
      setSnackbarOpen(true);
    }
  }, []);

  // 修改上传处理函数
  const handleUpload = useCallback(async (file, metadata, onProgress) => {
    try {
      if (isAdmin && Array.isArray(file)) {
        // 管理员批量上传
        console.log('开始批量上传:', { fileCount: file.length, metadata });
        const results = await galleryApi.uploadImages(file, userId, metadata, onProgress);
        console.log('批量上传结果:', results);
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        
        let message;
        if (failCount > 0) {
          message = `上传完成：${successCount}张成功，${failCount}张失败`;
          console.error('部分图片上传失败:', results.filter(r => !r.success));
        } else {
          message = '所有图片上传成功！';
        }
        setSnackbarMessage(message);
        setSnackbarOpen(true);
        // 使用ref中的最新fetchImages函数
        if (fetchImagesRef.current) {
          fetchImagesRef.current();
        }
        return results;
      } else {
        // 单张图片上传
        const result = await galleryApi.uploadImage(file, userId, metadata, onProgress);
      setSnackbarMessage('图片上传成功！');
      setSnackbarOpen(true);
        // 使用ref中的最新fetchImages函数
        if (fetchImagesRef.current) {
          fetchImagesRef.current();
        }
        return result;
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      setSnackbarMessage(`上传失败: ${error.message}`);
      setSnackbarOpen(true);
      throw error;
    }
  }, [isAdmin, userId]);

  // 处理图片删除
  const handleDeleteImage = useCallback(async (imageId) => {
    if (window.confirm('确定要删除这张图片吗？此操作无法撤销。')) {
      try {
        await galleryApi.deleteImage(imageId, userId, isAdmin);
        setSnackbarMessage('图片已删除');
        setSnackbarOpen(true);
        // 强制刷新页面
        window.location.reload();
      } catch (error) {
        console.error('删除图片失败:', error);
        setSnackbarMessage(`删除失败: ${error.message}`);
        setSnackbarOpen(true);
      }
    }
  }, [userId, isAdmin]);

  // 查看图片详情
  const handleViewImage = (image) => {
    if (!image?.id || !images?.length) return;
    
    const index = images.findIndex(img => img.id === image.id);
    console.log('Opening image:', {
      imageId: image.id,
      index,
      totalImages: images.length,
      imagesArray: images.map(img => img.id)
    });
    
    if (index !== -1) {
      setCurrentImageIndex(index);
      setViewingImage(image);
    }
  };

  // 编辑图片信息
  const handleEditImage = (image) => {
    // 处理置顶状态更新
    if ('is_pinned' in image) {
      // 更新本地状态
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === image.id 
            ? { ...img, is_pinned: image.is_pinned }
            : img
        )
      );
      
      setSnackbarMessage(image.is_pinned ? '已置顶' : '已取消置顶');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // 重新获取图片列表以更新排序
      fetchImages();
      return;
    }

    // 处理普通编辑
    setEditImage(image);
    setEditDialogOpen(true);
  };

  // 保存图片信息
  const handleSaveImageInfo = useCallback(async (imageData) => {
    try {
      const { id, title, description } = imageData;
      await galleryApi.updateImageInfo(id, userId, { title, description }, isAdmin);
      setSnackbarMessage('图片信息已更新');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      // 使用ref中的最新fetchImages函数
      if (fetchImagesRef.current) {
        fetchImagesRef.current();
      }
    } catch (error) {
      console.error('更新图片信息失败:', error);
      setSnackbarMessage(`更新失败: ${error.message}`);
      setSnackbarOpen(true);
    }
  }, [userId, isAdmin]);

  // 处理图片选择
  const handleImageSelect = useCallback((imageId) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      return newSelection;
    });
  }, []);

  // 处理全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  }, [images, selectedImages.size]);

  // 处理批量删除
  const handleBatchDelete = async () => {
    const selectedImageIds = Array.from(selectedImages);
    if (selectedImageIds.length === 0) {
      setSnackbarMessage('请先选择要删除的图片');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const { successful, failed } = await galleryApi.deleteImages(selectedImageIds, userId);
      
      let message = '';
      if (successful > 0 && failed === 0) {
        message = `成功删除 ${successful} 张图片`;
        setSnackbarSeverity('success');
      } else if (successful > 0 && failed > 0) {
        message = `${successful} 张图片删除成功，${failed} 张删除失败`;
        setSnackbarSeverity('warning');
      } else {
        message = '删除失败';
        setSnackbarSeverity('error');
      }
      
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      setSelectedImages(new Set());
      // 强制刷新页面
      window.location.reload();
    } catch (error) {
      console.error('批量删除失败:', error);
      setSnackbarMessage('批量删除失败: ' + (error.message || '未知错误'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 处理清空所有图片
  const handleClearAll = useCallback(async () => {
    if (window.confirm('确定要清空所有图片吗？此操作无法撤销。')) {
      try {
        setLoading(true);
        const results = await Promise.allSettled(
          images.map(image =>
            galleryApi.deleteImage(image.id, userId, isAdmin)
          )
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        setSnackbarMessage(`清空完成：${successCount}张成功，${failCount}张失败`);
        setSnackbarOpen(true);

        // 强制刷新页面
        window.location.reload();
      } catch (error) {
        console.error('清空图片失败:', error);
        setSnackbarMessage(`清空图片失败: ${error.message}`);
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
  }, [images, userId, isAdmin]);

  // 处理上一张图片
  const handlePreviousImage = useCallback(() => {
    if (!images?.length) return;
    
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      console.log('Moving to previous image:', {
        newIndex,
        currentIndex: currentImageIndex,
        totalImages: images.length
      });
      setCurrentImageIndex(newIndex);
      setViewingImage(images[newIndex]);
    }
  }, [currentImageIndex, images]);

  // 处理下一张图片
  const handleNextImage = useCallback(() => {
    if (!images?.length) return;
    
    if (currentImageIndex < images.length - 1) {
      const newIndex = currentImageIndex + 1;
      console.log('Moving to next image:', {
        newIndex,
        currentIndex: currentImageIndex,
        totalImages: images.length
      });
      setCurrentImageIndex(newIndex);
      setViewingImage(images[newIndex]);
    }
  }, [currentImageIndex, images]);

  // 关闭图片预览
  const handleCloseImagePreview = useCallback(() => {
    setViewingImage(null);
    setCurrentImageIndex(-1);
  }, []);

  // 修改上传对话框的关闭处理
  const handleCloseUploadDialog = useCallback(() => {
    setUploadDialogOpen(false);
    // 重置页码并重新获取图片列表
    setPage(0);
    fetchImages(false);
  }, [fetchImages]);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
          <AppBar
            position="sticky"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              marginBottom: '2rem',
            }}
            elevation={0}
          >
            <Container maxWidth="lg">
              <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScienceIcon sx={{ 
                    color: 'primary.main', 
                    mr: 1.5, 
                    fontSize: { xs: 24, sm: 28 } 
                  }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.primary', 
                      fontWeight: 700,
                      fontSize: { xs: '1.1rem', sm: '1.3rem' },
                      backgroundImage: 'linear-gradient(45deg, #f97316, #f59e0b)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent'
                    }}
                  >
                    M-Profile Lab
                </Typography>
                </Box>
                
                <Box sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  gap: 1.5,
                  '& .MuiButton-root': {
                    borderRadius: '8px',
                    minWidth: 'auto',
                    px: 2,
                    py: 0.75,
                    transition: 'all 0.2s ease',
                  }
                }}>
                  {isAdmin && (
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    >
                      退出管理
                    </Button>
                  )}
                  <Button
                    color="primary"
                    variant="text"
                    startIcon={<FemaleIcon />}
                    href="/female.html"
                    size="small"
                  >
                    女M版
                  </Button>
                  <Button
                    color="primary"
                    variant="text"
                    startIcon={<MaleIcon />}
                    href="/male.html"
                    size="small"
                  >
                    男M版
                  </Button>
                  <Button
                    color="primary"
                    variant="text"
                    startIcon={<ScienceIcon />}
                    href="/s.html"
                    size="small"
                  >
                    S版
                  </Button>
                  <Button
                    color="primary"
                    variant="text"
                    startIcon={<MessageIcon />}
                    href="/message.html"
                    size="small"
                  >
                    留言板
                  </Button>
                  <Button
                    color="primary"
                    variant="contained"
                    startIcon={<HomeIcon />}
                    href="/index.html"
                    size="small"
                    sx={{ 
                      boxShadow: 1,
                      '&:hover': {
                        boxShadow: 2,
                      }
                    }}
                  >
                    返回首页
                  </Button>
                </Box>
                
                <IconButton
                  sx={{ 
                    display: { xs: 'flex', md: 'none' },
                    color: 'primary.main',
                    backgroundColor: 'rgba(249, 115, 22, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(249, 115, 22, 0.1)'
                    },
                    width: 40,
                    height: 40
                  }}
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
              </Toolbar>
            </Container>
          </AppBar>

          <Drawer
            anchor="right"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            PaperProps={{
              sx: {
                backgroundColor: '#ffffff',
                width: 280,
                boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.05)',
                pt: 2,
                '& .MuiListItem-root': {
                  borderRadius: 1.5,
                  mx: 2,
                  mb: 1
                }
              }
            }}
          >
            <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center' }}>
              <ScienceIcon sx={{ color: 'primary.main', mr: 1.5 }} />
            <Typography 
                variant="h6" 
              sx={{ 
                  fontWeight: 700,
                  backgroundImage: 'linear-gradient(45deg, #f97316, #f59e0b)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                M-Profile Lab
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {isAdmin && (
                <ListItem 
                  button 
                  onClick={handleLogout}
                  sx={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                  }}
                >
                  <ListItemIcon><LogoutIcon sx={{ color: 'error.main' }} /></ListItemIcon>
                  <ListItemText primary="退出管理" primaryTypographyProps={{ fontWeight: 500, color: 'error.main' }} />
                </ListItem>
              )}
              <ListItem 
                button 
                component="a" 
                href="/female.html"
                sx={{ '&:hover': { backgroundColor: 'rgba(249, 115, 22, 0.08)' } }}
              >
                <ListItemIcon><FemaleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="女M版" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
              <ListItem 
                button 
                component="a" 
                href="/male.html"
                sx={{ '&:hover': { backgroundColor: 'rgba(249, 115, 22, 0.08)' } }}
              >
                <ListItemIcon><MaleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="男M版" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
              <ListItem 
                button 
                component="a" 
                href="/s.html"
                sx={{ '&:hover': { backgroundColor: 'rgba(249, 115, 22, 0.08)' } }}
              >
                <ListItemIcon><ScienceIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="S版" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
              <ListItem 
                button 
                component="a" 
                href="/message.html"
                sx={{ '&:hover': { backgroundColor: 'rgba(249, 115, 22, 0.08)' } }}
              >
                <ListItemIcon><MessageIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="留言板" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
              <ListItem 
                button 
                component="a" 
                href="/index.html"
                sx={{ 
                  backgroundColor: 'rgba(249, 115, 22, 0.08)',
                  '&:hover': { backgroundColor: 'rgba(249, 115, 22, 0.15)' },
                  mt: 2
                }}
              >
                <ListItemIcon><HomeIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="返回首页" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItem>
            </List>
          </Drawer>

          <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 4 }}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 6,
              }}
              className="fade-in"
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  .force-orange-title {
                    color: #f97316 !important;
                    text-shadow: 0 0 15px rgba(249, 115, 22, 0.5), 2px 2px 0 rgba(249, 115, 22, 0.3) !important;
                    font-weight: 800 !important;
                    animation: float-title 3s ease-in-out infinite !important;
                  }
                  
                  @keyframes float-title {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0); }
                  }
                `
              }} />
            
              <Typography 
                variant="h2" 
                component="h1"
                className="pixel-title-orange force-orange-title"
                sx={{ 
                  fontSize: { 
                    xs: '2rem', 
                    sm: '2.5rem', 
                    md: '3rem' 
                  },
                  textAlign: 'center',
                  mb: 2,
                  color: '#f97316 !important',
                  textShadow: '0 0 15px rgba(249, 115, 22, 0.5), 2px 2px 0 rgba(249, 115, 22, 0.3)',
                  background: 'transparent',
                  WebkitTextFillColor: '#f97316', // 确保文本颜色在所有浏览器中一致
                  filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))', // 额外的阴影效果
                  position: 'relative',
                  // 添加更明显的悬浮效果
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                    '100%': { transform: 'translateY(0)' },
                  },
              }}
              onDoubleClick={handleTitleDoubleClick}
            >
              Report Gallery
            </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: '600px',
                  textAlign: 'center',
                  mb: 4,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                浏览、分享和点评各种测评报告，记录你的测评经历
              </Typography>
              
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 2,
                mb: 4,
                width: '100%',
                maxWidth: '800px',
              }}>
              <Button
                variant="contained"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => setUploadDialogOpen(true)}
                  size="large"
                sx={{
                    px: 3,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 3,
                  '&:hover': {
                      boxShadow: 4,
                  },
                    backgroundImage: 'linear-gradient(45deg, #f97316, #f59e0b)',
                }}
              >
                上传图片
              </Button>

              {isAdmin && (
                  <Button
                    variant={isSelectionMode ? "contained" : "outlined"}
                    color={isSelectionMode ? "secondary" : "primary"}
                    startIcon={isSelectionMode ? <CloseIcon /> : <CheckBoxOutlineBlankIcon />}
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedImages(new Set());
                    }}
                    size="large"
                    sx={{
                      px: 3,
                      py: 1.5,
                      fontSize: '1rem',
                      backgroundColor: isSelectionMode ? 'rgba(245, 158, 11, 0.9)' : 'transparent',
                    }}
                  >
                    {isSelectionMode ? '退出选择' : '选择图片'}
                  </Button>
                )}
              </Box>
              
              {isAdmin && isSelectionMode && (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  justifyContent: 'center', 
                  gap: 2, 
                  mb: 4,
                  className: "fade-in"
                }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleSelectAll}
                    size="medium"
                  >
                    {selectedImages.size === images.length ? '取消全选' : '全选'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleBatchDelete}
                    disabled={selectedImages.size === 0}
                    size="medium"
                  >
                    删除选中 ({selectedImages.size})
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleClearAll}
                    size="medium"
                  >
                    清空图片
                  </Button>
                </Box>
              )}
              
              {isAdmin && (
                <FormControl 
                  size="small" 
                  sx={{ 
                    width: { xs: '100%', sm: 'auto' },
                    minWidth: 150,
                    mt: isSelectionMode ? 0 : 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      boxShadow: 1,
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <InputLabel>筛选图片</InputLabel>
                  <Select
                    value={filter}
                    label="筛选图片"
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <MenuItem value="all">全部图片</MenuItem>
                    <MenuItem value="approved">已审核</MenuItem>
                    <MenuItem value="pending">待审核</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : images && images.length > 0 ? (
              <Box sx={{ width: '100%', minHeight: 400 }}>
                <Masonry
                  columns={getColumnCount()}
                  spacing={3}
                  sx={{ width: 'auto' }}
                >
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      ref={index === images.length - 1 ? lastImageElementRef : null}
                    >
                    <ImageCard 
                      image={image}
                      onView={handleViewImage}
                      onDelete={handleDeleteImage}
                      onEdit={handleEditImage}
                      isAdmin={isAdmin}
                      isSelected={selectedImages.has(image.id)}
                      isSelectionMode={isSelectionMode}
                      onSelect={() => handleImageSelect(image.id)}
                      userId={userId}
                    />
                    </div>
                  ))}
                </Masonry>
              </Box>
            ) : (
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                }}
              >
                <InfoIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>暂无图片</Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  {filter !== 'all' 
                    ? '当前筛选条件下没有找到图片'
                    : '目前还没有上传的测评报告图片，快来分享你的测评结果吧！'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddPhotoAlternateIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                  color="primary"
                >
                  上传图片
                </Button>
              </Paper>
            )}

            {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress color="primary" />
              </Box>
            )}

            <UploadDialog 
              open={uploadDialogOpen}
              onClose={handleCloseUploadDialog}
              onUpload={handleUpload}
              isAdmin={isAdmin}
            />

            <ImageDetailModal
              open={!!viewingImage}
              image={viewingImage}
              onClose={handleCloseImagePreview}
              images={images}
              currentIndex={currentImageIndex}
              onPrevious={handlePreviousImage}
              onNext={handleNextImage}
            />

            <EditImageDialog
              open={editDialogOpen}
              image={editImage}
              onClose={() => setEditDialogOpen(false)}
              onSave={handleSaveImageInfo}
            />

            <Snackbar
              open={snackbarOpen}
              autoHideDuration={5000}
              onClose={() => setSnackbarOpen(false)}
            >
              <Alert 
                onClose={() => setSnackbarOpen(false)} 
                severity={snackbarSeverity}
                variant="filled"
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>
          </Container>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// 辅助函数：判断是否有编辑权限
const hasEditPermission = (image) => {
  return image.isAdmin || image.user_id === image.current_user_id;
};

export default GalleryApp; 