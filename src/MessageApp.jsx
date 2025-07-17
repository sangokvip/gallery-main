import React, { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Paper, Box, TextField, Button, AppBar, Toolbar, IconButton, Snackbar, ThemeProvider, createTheme, Dialog, DialogTitle, DialogContent, DialogActions, Divider, CircularProgress, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import MenuIcon from '@mui/icons-material/Menu'
import SendIcon from '@mui/icons-material/Send'
import DeleteIcon from '@mui/icons-material/Delete'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined'
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import PushPinIcon from '@mui/icons-material/PushPin'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditIcon from '@mui/icons-material/Edit'
import CollectionsIcon from '@mui/icons-material/Collections'
import FemaleIcon from '@mui/icons-material/Female'
import MaleIcon from '@mui/icons-material/Male'
import ScienceIcon from '@mui/icons-material/Science'
import TelegramIcon from '@mui/icons-material/Telegram'
import './styles/pixel-theme.css'
import { messagesApi } from './utils/supabase'
import { v4 as uuidv4 } from 'uuid'; // 导入 uuid

// GSAP动画系统导入
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initializeGSAP } from './animations/config/gsapConfig'
import gsapManager from './animations/core/GSAPManager'
import { pageAnimations } from './animations/presets/pageAnimations'

// 注册GSAP插件
gsap.registerPlugin(ScrollTrigger)

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff69b4',
      light: '#ff8dc3',
      dark: '#c13b86',
    },
    secondary: {
      main: '#4a148c',
      light: '#7c43bd',
      dark: '#12005e',
    },
    background: {
      default: '#fce4ec',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'inherit',
    h3: {
      fontFamily: '"Press Start 2P", cursive',
      fontWeight: 700,
      color: '#ff69b4',
      textShadow: '2px 2px 0 #4a148c',
      textAlign: 'center',
      marginBottom: '2rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '4px solid #ff69b4',
          boxShadow: '4px 4px 0 rgba(74, 20, 140, 0.5)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'inherit',
          border: '3px solid #ff69b4',
          boxShadow: '3px 3px 0 rgba(74, 20, 140, 0.5)',
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '5px 5px 0 rgba(74, 20, 140, 0.5)',
          },
          '&:active': {
            transform: 'translate(2px, 2px)',
            boxShadow: '1px 1px 0 rgba(74, 20, 140, 0.5)',
          },
        },
      },
    },
  },
})

// 添加联系方式过滤函数
const filterContactInfo = (text) => {
  // 手机号码
  const phoneRegex = /1[3-9]\d{9}/g;
  // 微信号（字母、数字、下划线和减号，6-20位）
  const wechatRegex = /(?<![a-zA-Z0-9])[a-zA-Z][a-zA-Z0-9_-]{5,19}/g;
  // QQ号（5-11位数字）
  const qqRegex = /(?<!\d)[1-9][0-9]{4,10}(?!\d)/g;
  // 邮箱
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // 敏感词及其变体
  const sensitiveWords = [
    '王晓然', 'wangxiaoran', 'wang xiaoran', 
    '王晓玥', 'wangxiaoyue', 'wang xiaoyue',
    'SOAP', 'soap', 'Soap',
    '女装', 'nvzhuang', 'nu zhuang',
    '塔罗牌', 'taluopai', 'taluo pai', 'tarot',
    '宏程', 'hongcheng', 'hong cheng',
    '王老师', 'wanglaoshi', 'wang laoshi'
  ];

  let filteredText = text;
  
  // 替换所有匹配的联系方式为星号
  filteredText = filteredText.replace(phoneRegex, match => '*'.repeat(match.length));
  filteredText = filteredText.replace(wechatRegex, match => '*'.repeat(match.length));
  filteredText = filteredText.replace(qqRegex, match => '*'.repeat(match.length));
  filteredText = filteredText.replace(emailRegex, match => '*'.repeat(match.length));

  // 替换所有敏感词为星号
  sensitiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, match => '*'.repeat(match.length));
  });

  return filteredText;
};

// 添加回复组件
const MessageReply = ({ reply, onDelete, isOwner, isAdminMessage }) => (
  <Paper
    sx={{
      p: { xs: 1, sm: 1.5 },
      ml: { xs: 2, sm: 3 },
      mb: 1,
      backgroundColor: isAdminMessage ? '#4a148c' : '#fff0f5',
      border: `2px solid ${isAdminMessage ? '#7c43bd' : '#ff69b4'}`,
      boxShadow: '2px 2px 0 rgba(255, 105, 180, 0.3)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: '-10px',
        top: '10px',
        width: '0',
        height: '0',
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent',
        borderRight: `10px solid ${isAdminMessage ? '#4a148c' : '#ff69b4'}`,
      }
    }}
  >
    <Typography 
      variant="body2" 
      sx={{ 
        wordBreak: 'break-word',
        color: isAdminMessage ? '#ffffff' : 'inherit',
        fontSize: { xs: '0.75rem', sm: '0.875rem' }
      }}
    >
      {reply.text}
    </Typography>
    {isOwner && (
      <IconButton
        onClick={onDelete}
        size="small"
        sx={{
          position: 'absolute',
          right: 4,
          top: 4,
          padding: 0.5,
          color: isAdminMessage ? '#ffffff' : '#ff69b4',
          '&:hover': {
            color: '#ff8dc3',
          }
        }}
      >
        <DeleteIcon sx={{ fontSize: '0.875rem' }} />
      </IconButton>
    )}
  </Paper>
);

const MessageBubble = ({ 
  message, 
  originalText, 
  onDelete, 
  isOwner, 
  isAdminMessage, 
  onReact, 
  reactions, 
  isPinned, 
  onTogglePin, 
  isAdmin,
  onReply,
  replies = [],
  onDeleteReply,
  currentUserId,
  onEditReactions,
  messageUserId
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(replyText.trim());
      setReplyText('');
      setIsReplying(false);
    }
  };

  return (
    <Paper
      sx={{ 
        p: 2, 
        width: '100%',
        boxSizing: 'border-box',
        margin: 0,
        position: 'relative',
        animation: isPinned ? 'float 3s ease-in-out infinite' : 'none',
        ...(messageUserId === currentUserId && !isAdminMessage && {
          border: '4px solid #ff69b4',
          boxShadow: '0 4px 12px rgba(255, 105, 180, 0.3)',
          backgroundColor: 'rgba(255, 192, 203, 0.1)',
          '&:before': {
            content: '"我的留言"',
            position: 'absolute',
            top: -10,
            left: 10,
            backgroundColor: '#ff69b4',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            zIndex: 1
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(255, 105, 180, 0.4)',
            transition: 'all 0.3s ease'
          }
        }),
        ...(isAdminMessage && {
          backgroundColor: '#4a148c !important',
          border: '4px solid #7c43bd',
          boxShadow: '4px 4px 0 rgba(255, 105, 180, 0.5)',
          '& .MuiTypography-root:not(.reaction-count)': {
            color: '#ff8dc3',
            fontWeight: 'bold',
            position: 'relative'
          }
        }),
        ...(isPinned && {
          border: '2px solid #ff69b4',
          '&::before': {
            content: '"📌"',
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            fontSize: '20px',
            transform: 'rotate(45deg)'
          }
        })
      }} 
      className="pixel-theme-pink"
    >
      <Box sx={{ flex: 1 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            wordBreak: 'break-word',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {message}
        </Typography>
        {isAdminMessage && originalText !== message && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 1, 
              color: '#ff69b4',
              fontStyle: 'italic',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            原文: {originalText}
          </Typography>
        )}
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: { xs: 1.5, sm: 2 },
        pt: { xs: 1, sm: 1 },
        borderTop: '1px solid rgba(0,0,0,0.1)',
      }}>
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => onReact(true)}
              sx={{
                color: '#ff69b4',
                padding: { xs: 0.5, sm: 1 },
                '&:hover': { 
                  color: '#ff8dc3',
                  transform: 'scale(1.1)'
                },
                transition: 'transform 0.2s ease, color 0.2s ease',
                ...(isAdminMessage && {
                  color: '#ffffff',
                  '&:hover': {
                    color: '#ff8dc3',
                    transform: 'scale(1.1)'
                  }
                })
              }}
              title="点赞"
            >
              <ThumbUpOutlinedIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            </IconButton>
            <Typography 
              variant="caption"
              className="reaction-count"
              sx={{ 
                ml: 0.5,
                color: isAdminMessage ? '#ffffff' : '#ff69b4',
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {reactions?.likes || 0}
            </Typography>
            {isAdmin && (
              <IconButton
                size="small"
                onClick={() => onEditReactions(messageId, 'likes', reactions?.likes || 0)}
                sx={{
                  color: isAdminMessage ? '#ffffff' : '#ff69b4',
                  padding: { xs: 0.2, sm: 0.5 },
                  ml: 0.5,
                  '&:hover': { 
                    color: '#ff8dc3',
                    transform: 'scale(1.1)'
                  }
                }}
                title="修改点赞数"
              >
                <EditIcon sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }} />
              </IconButton>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => onReact(false)}
              sx={{
                color: '#ff69b4',
                padding: { xs: 0.5, sm: 1 },
                '&:hover': { 
                  color: '#ff8dc3',
                  transform: 'scale(1.1)'
                },
                transition: 'transform 0.2s ease, color 0.2s ease',
                ...(isAdminMessage && {
                  color: '#ffffff',
                  '&:hover': {
                    color: '#ff8dc3',
                    transform: 'scale(1.1)'
                  }
                })
              }}
              title="点踩"
            >
              <ThumbDownOutlinedIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            </IconButton>
            <Typography 
              variant="caption"
              className="reaction-count"
              sx={{ 
                ml: 0.5,
                color: isAdminMessage ? '#ffffff' : '#ff69b4',
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {reactions?.dislikes || 0}
            </Typography>
            {isAdmin && (
              <IconButton
                size="small"
                onClick={() => onEditReactions(messageId, 'dislikes', reactions?.dislikes || 0)}
                sx={{
                  color: isAdminMessage ? '#ffffff' : '#ff69b4',
                  padding: { xs: 0.2, sm: 0.5 },
                  ml: 0.5,
                  '&:hover': { 
                    color: '#ff8dc3',
                    transform: 'scale(1.1)'
                  }
                }}
                title="修改点踩数"
              >
                <EditIcon sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }} />
              </IconButton>
            )}
          </Box>
          
          <IconButton
            size="small"
            onClick={() => setIsReplying(!isReplying)}
            sx={{
              color: '#ff69b4',
              padding: { xs: 0.5, sm: 1 },
              '&:hover': { 
                color: '#ff8dc3',
                transform: 'scale(1.1)'
              },
              transition: 'transform 0.2s ease, color 0.2s ease',
              ...(isAdminMessage && {
                color: '#ffffff',
                '&:hover': {
                  color: '#ff8dc3',
                  transform: 'scale(1.1)'
                }
              })
            }}
            title="回复"
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            <Typography 
              variant="caption"
              className="reaction-count"
              sx={{ 
                ml: 0.5,
                color: isAdminMessage ? '#ffffff' : '#ff69b4',
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {replies.length}
            </Typography>
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
          {replies.length > 0 && (
            <IconButton
              size="small"
              onClick={() => setShowReplies(!showReplies)}
              sx={{
                padding: { xs: 0.5, sm: 1 },
                color: isAdminMessage ? '#ffffff' : '#ff69b4',
                '&:hover': { color: '#ff8dc3' }
              }}
            >
              {showReplies ? (
                <ExpandLessIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
              )}
            </IconButton>
          )}
          {isAdmin && !isAdminMessage && (
            <IconButton
              size="small"
              onClick={() => onTogglePin(!isPinned)}
              sx={{
                padding: { xs: 0.5, sm: 1 },
                color: isPinned ? '#ff69b4' : 'inherit',
                '&:hover': { color: '#ff69b4' }
              }}
            >
              <PushPinIcon 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  transform: isPinned ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.3s ease'
                }} 
              />
            </IconButton>
          )}
          {isOwner && (
            <IconButton
              onClick={onDelete}
              size="small"
              sx={{
                padding: { xs: 0.5, sm: 1 },
                color: isAdminMessage ? '#ffffff' : '#ff69b4',
                '&:hover': {
                  color: isAdminMessage ? '#ff69b4' : '#ff8dc3',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <DeleteIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* 回复输入框 */}
      {isReplying && (
        <Box
          component="form"
          onSubmit={handleReplySubmit}
          sx={{
            mt: 2,
            display: 'flex',
            gap: 1,
            borderTop: '1px solid rgba(0,0,0,0.1)',
            pt: 2
          }}
        >
          <TextField
            size="small"
            fullWidth
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="回复..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#ff69b4',
                  borderWidth: '2px',
                },
                '&:hover fieldset': {
                  borderColor: '#ff69b4',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff69b4',
                },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              minWidth: 'unset',
              backgroundColor: '#ff69b4',
              color: 'white',
              '&:hover': {
                backgroundColor: '#ff8dc3',
              },
            }}
          >
            发送
          </Button>
        </Box>
      )}

      {/* 回复列表 */}
      {showReplies && replies.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {replies.map((reply) => (
            <MessageReply
              key={reply.id}
              reply={reply}
              onDelete={() => onDeleteReply(reply.id)}
              isOwner={isAdmin || reply.user_id === currentUserId}
              isAdminMessage={reply.is_admin}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
};

const TopMessages = ({ messages }) => (
  <Paper 
    sx={{ 
      p: 2, 
      width: '100%',
      boxSizing: 'border-box',
      margin: 0,
      '& > *:last-child': {
        marginBottom: 0
      }
    }} 
    className="pixel-theme-pink"
    elevation={0}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <EmojiEventsIcon sx={{ color: '#ff69b4', mr: 1 }} />
      <Typography variant="h6" sx={{ color: '#ff69b4' }}>
        热门留言榜
      </Typography>
    </Box>
    <Divider sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {messages.map((message, index) => (
        <Box 
          key={message.id} 
          sx={{ 
            p: 1.5,
            borderRadius: 1,
            backgroundColor: 'rgba(255, 105, 180, 0.1)',
            border: '2px solid rgba(255, 105, 180, 0.2)',
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(255, 105, 180, 0.15)',
            }
          }}
        >
          <Box sx={{ 
            position: 'absolute',
            top: -10,
            left: -10,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: '#ff69b4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {index + 1}
          </Box>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: '#ff69b4', 
              mb: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />
              {message.likes || 0}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />
              {message.dislikes || 0}
            </Box>
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              ...(message.user_id === 'admin' && {
                color: '#4a148c',
                fontWeight: 'bold'
              })
            }}
          >
            {message.text}
          </Typography>
        </Box>
      ))}
      {messages.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
          暂无热门留言
        </Typography>
      )}
    </Box>
  </Paper>
)

// 添加错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MessageApp错误:', error, errorInfo);
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
            backgroundColor: '#fce4ec',
            padding: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: '#ff69b4', marginBottom: 2 }}>
            页面加载出错了
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
        </Box>
      );
    }

    return this.props.children;
  }
}

function MessageApp() {
  const [messages, setMessages] = useState([]);
  const [topMessages, setTopMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [messageReplies, setMessageReplies] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [editReactionDialog, setEditReactionDialog] = useState({
    open: false,
    messageId: null,
    type: 'likes', // 'likes' 或 'dislikes'
    count: 0
  });
  const [newReactionCount, setNewReactionCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 初始化GSAP和页面动画 - 留言板社交主题
  useEffect(() => {
    // 初始化GSAP配置
    initializeGSAP()
    
    // 留言板页面入场动画 - 社交互动风格
    const tl = gsap.timeline()
    
    // 标题和导航动画
    tl.from('h1, h2, h3, .MuiAppBar-root', {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.1
    })
    
    // 消息气泡动画 - 错落入场
    .from('.message-bubble, .MuiPaper-root:not(.MuiAppBar-root)', {
      opacity: 0,
      scale: 0.9,
      y: 20,
      duration: 0.5,
      ease: "back.out(1.3)",
      stagger: 0.08
    }, "-=0.3")
    
    // 输入框和按钮动画
    .from('.MuiTextField-root, .MuiButton-root', {
      opacity: 0,
      y: 30,
      duration: 0.4,
      ease: "power2.out",
      stagger: 0.05
    }, "-=0.2")
    
    // 注册到GSAP管理器
    gsapManager.timelines.set('message-page-entrance', tl)
    
    console.log('🎬 留言板页面动画已初始化')
  }, [])

  // 在组件挂载时设置状态
  useEffect(() => {
    console.log('组件挂载');
    setIsMounted(true);
    return () => {
      console.log('组件卸载');
      setIsMounted(false);
    };
  }, []);

  // 获取消息的回复
  const fetchMessageReplies = useCallback(async (messageId) => {
    if (!userId || !isMounted) {
      console.log('跳过获取回复：', { messageId, userId: !!userId, isMounted });
      return;
    }

    try {
      console.log('开始获取消息回复:', messageId);
      const replies = await messagesApi.getMessageReplies(messageId);
      if (!isMounted) {
        console.log('组件已卸载，取消更新回复状态');
        return;
      }
      
      console.log('成功获取回复:', messageId, replies?.length || 0, '条');
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: replies || []
      }));
    } catch (error) {
      if (!isMounted) return;
      console.error('获取回复失败:', messageId, error);
      // 设置空数组而不是抛出错误，这样即使回复加载失败也不会影响整个消息的显示
      setMessageReplies(prev => ({
        ...prev,
        [messageId]: []
      }));
    }
  }, [userId, isMounted]);

  // 从Supabase获取消息
  const fetchMessages = useCallback(async () => {
    if (!userId || !isMounted) {
      console.log('跳过获取消息：', { userId: !!userId, isMounted });
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      console.log('开始获取消息列表...');
      const data = await messagesApi.getMessages();
      
      if (!isMounted) {
        console.log('组件已卸载，取消更新消息状态');
        return;
      }

      console.log('获取到消息数据:', data?.length || 0, '条');
      if (Array.isArray(data)) {
        // 修改排序逻辑：置顶消息 > 管理员消息 > 当前用户消息 > 其他消息
        const sortedMessages = data.sort((a, b) => {
          // 首先按置顶状态排序
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          
          // 如果置顶状态相同，则按照以下优先级排序：
          // 1. 管理员消息
          // 2. 当前用户消息
          // 3. 其他消息
          if (a.is_pinned === b.is_pinned) {
            // 管理员消息优先
            if (a.user_id === 'admin' && b.user_id !== 'admin') return -1;
            if (a.user_id !== 'admin' && b.user_id === 'admin') return 1;
            
            // 管理员消息之后是当前用户消息
            if (a.user_id === userId && b.user_id !== userId && b.user_id !== 'admin') return -1;
            if (a.user_id !== userId && b.user_id === userId && a.user_id !== 'admin') return 1;
          }
          
          // 最后按时间倒序排列
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        setMessages(sortedMessages);
        // 获取每条消息的回复
        sortedMessages.forEach(message => {
          console.log('准备获取消息回复:', message.id);
          fetchMessageReplies(message.id);
        });
      } else {
        console.warn('获取到的消息数据格式不正确:', data);
        setMessages([]);
      }
    } catch (error) {
      if (!isMounted) return;
      console.error("获取消息失败:", error);
      setError(error.message || '加载留言失败，请检查网络连接');
      setSnackbarMessage(`加载留言失败：${error.message || '请检查网络连接'}`);
      setSnackbarOpen(true);
      setMessages([]);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [userId, isMounted, fetchMessageReplies]);

  // 获取热门消息
  const fetchTopMessages = useCallback(async () => {
    if (!userId || !isMounted) {
      console.log('跳过获取热门消息：', { userId: !!userId, isMounted });
      return;
    }

    try {
      console.log('开始获取热门消息...');
      const topMessages = await messagesApi.getTopMessages();
      if (!isMounted) {
        console.log('组件已卸载，取消更新热门消息状态');
        return;
      }
      
      console.log('获取到热门消息:', topMessages?.length || 0, '条');
      setTopMessages(topMessages || []);
    } catch (error) {
      if (!isMounted) {
        console.log('组件已卸载，取消更新热门消息错误状态');
        return;
      }
      console.error('获取热门消息失败:', error);
      setTopMessages([]);
    }
  }, [userId, isMounted]);

  // 获取消息反应
  const fetchMessageReactions = useCallback(async (messageId) => {
    try {
      const reactions = await messagesApi.getMessageReactions(messageId);
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: reactions
      }));
    } catch (error) {
      console.error('获取消息反应失败:', error);
    }
  }, []);

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
      setIsInitialized(true);
    } catch (error) {
      console.error('初始化用户ID失败:', error);
      setError('初始化用户ID失败，请刷新页面重试');
    }
  }, []);

  // 监听用户ID变化，加载消息
  useEffect(() => {
    if (userId && isMounted && isInitialized) {
      console.log('用户ID已设置，开始加载消息');
      fetchMessages();
      fetchTopMessages();
    }
  }, [userId, isMounted, isInitialized, fetchMessages, fetchTopMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      // 添加字数限制检查
      if (newMessage.trim().length > 200) {
        setSnackbarMessage('留言不能超过200字');
        setSnackbarOpen(true);
        return;
      }

      // 检查留言频率限制（仅对非管理员用户）
      if (!isAdmin) {
        try {
          const messageCount = await messagesApi.countUserMessagesInLast24Hours(userId);
          if (messageCount >= 6) {
            setSnackbarMessage('您今天留言已达上限（6条）');
            setSnackbarOpen(true);
            return;
          }
        } catch (error) {
          console.error("Error checking message limit:", error);
          setSnackbarMessage('检查留言频率时出错，请稍后再试');
          setSnackbarOpen(true);
          return;
        }
      }

      // 过滤联系方式（管理员消息不过滤）
      const filteredMessage = isAdmin ? newMessage.trim() : filterContactInfo(newMessage.trim());
      
      // 准备消息数据
      const messageData = {
        text: filteredMessage,
        userId: isAdmin ? 'admin' : userId,
        originalText: newMessage.trim()
      };

      try {
        const savedMessage = await messagesApi.createMessage(messageData);
        if (!savedMessage) {
          setSnackbarMessage('留言似乎成功，但服务器未返回确认信息');
          setSnackbarOpen(true);
        } else {
          await fetchMessages();
          setNewMessage('');
          setSnackbarMessage('留言成功！');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error("详细错误信息:", error);
        if (error.message.includes('相同的留言')) {
          setSnackbarMessage('您已经发送过相同的留言了');
        } else {
          const specificError = error?.details || error?.message || error?.error_description || '未知错误';
          setSnackbarMessage(`留言失败：${specificError}`);
        }
        setSnackbarOpen(true);
      }
    }
  };

  // 添加双击标题处理函数
  const handleTitleDoubleClick = () => {
    const password = prompt('请输入管理员密码：');
    if (password === 'Sangok#3') {
      setIsAdmin(true);
      setSnackbarMessage('管理员登录成功！');
      setSnackbarOpen(true);
    } else if (password !== null) {
      setSnackbarMessage('密码错误！');
      setSnackbarOpen(true);
    }
  };

  // 处理反应（点赞/踩）
  const handleReaction = async (messageId, isLike) => {
    try {
      await messagesApi.addReaction(messageId, userId, isLike);
      
      // 不再调用fetchMessages()和fetchTopMessages()进行整页刷新
      // 而是只更新当前消息的反应数据
      
      // 本地更新当前消息的反应计数
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === messageId) {
            // 更新当前消息的反应计数
            const updatedReactions = { ...msg.reactions };
            if (isLike) {
              updatedReactions.likes = (updatedReactions.likes || 0) + 1;
            } else {
              updatedReactions.dislikes = (updatedReactions.dislikes || 0) + 1;
            }
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        });
      });
      
      // 本地更新热门消息的反应计数（如果消息在热门列表中）
      setTopMessages(prevTopMessages => {
        return prevTopMessages.map(msg => {
          if (msg.id === messageId) {
            if (isLike) {
              return { ...msg, likes: (msg.likes || 0) + 1 };
            } else {
              return { ...msg, dislikes: (msg.dislikes || 0) + 1 };
            }
          }
          return msg;
        });
      });
      
    } catch (error) {
      console.error('反应操作失败:', error);
      setSnackbarMessage(error.message || '操作失败，请稍后重试');
      setSnackbarOpen(true);
    }
  };

  // 处理置顶切换
  const handleTogglePin = async (messageId, isPinned) => {
    try {
      await messagesApi.toggleMessagePin(messageId, isPinned);
      await fetchMessages(); // 只在置顶操作成功后刷新
      setSnackbarMessage(isPinned ? '消息已置顶' : '消息已取消置顶');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(error.message || '操作失败');
      setSnackbarOpen(true);
    }
  };

  // 创建回复
  const handleCreateReply = async (messageId, text) => {
    try {
      const filteredText = isAdmin ? text : filterContactInfo(text);
      await messagesApi.createReply({
        messageId,
        userId: isAdmin ? 'admin' : userId,
        text: filteredText,
        originalText: text
      });
      await fetchMessageReplies(messageId); // 只刷新当前消息的回复
      setSnackbarMessage('回复成功！');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(error.message || '回复失败');
      setSnackbarOpen(true);
    }
  };

  // 删除回复
  const handleDeleteReply = async (replyId) => {
    try {
      await messagesApi.deleteReply(replyId, userId, isAdmin);
      // 重新获取所有消息的回复
      messages.forEach(message => fetchMessageReplies(message.id));
      setSnackbarMessage('回复删除成功！');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(error.message || '删除回复失败');
      setSnackbarOpen(true);
    }
  };

  // 删除消息
  const handleDelete = async (messageId, messageUserId) => {
    console.log('Handling delete:', { messageId, messageUserId, userId, isAdmin });
    try {
      setSnackbarMessage('正在删除...');
      setSnackbarOpen(true);

      const success = await messagesApi.deleteMessage(messageId, userId, isAdmin);
      console.log('Message deleted, success:', success);
      
      if (success) {
        await fetchMessages(); // 只在删除成功后刷新
        setSnackbarMessage('删除成功！');
      }
    } catch (error) {
      console.error("删除消息时出错:", error);
      setSnackbarMessage(`删除失败：${error.message}`);
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setSnackbarMessage('已退出管理员模式！');
    setSnackbarOpen(true);
  };

  // 处理修改反应数量
  const handleEditReactions = (messageId, type, currentCount) => {
    setEditReactionDialog({
      open: true,
      messageId,
      type,
      count: currentCount
    });
    setNewReactionCount(currentCount);
  };

  // 提交修改反应数量
  const handleSubmitReactionEdit = async () => {
    try {
      // 调用API更新反应数量
      const success = await messagesApi.updateReactionCount(
        editReactionDialog.messageId,
        editReactionDialog.type,
        newReactionCount
      );
      
      if (success) {
        await fetchMessages(); // 刷新消息列表
        await fetchTopMessages(); // 更新热门消息
        setSnackbarMessage(`成功修改${editReactionDialog.type === 'likes' ? '点赞' : '点踩'}数量`);
      } else {
        setSnackbarMessage('修改反应数量失败');
      }
    } catch (error) {
      console.error('修改反应数量失败:', error);
      setSnackbarMessage(error.message || '修改反应数量失败');
    } finally {
      setSnackbarOpen(true);
      setEditReactionDialog({...editReactionDialog, open: false});
    }
  };

  // 渲染主要内容
  const renderContent = () => {
    if (!isInitialized) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          gap: 2
        }}>
          <CircularProgress sx={{ color: '#ff69b4' }} />
          <Typography variant="h6" sx={{ color: '#ff69b4' }}>
            正在初始化...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          gap: 2
        }}>
          <Typography variant="h6" sx={{ color: '#ff69b4' }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setError(null);
              fetchMessages();
            }}
            sx={{
              backgroundColor: '#ff69b4',
              '&:hover': {
                backgroundColor: '#ff8dc3',
              },
            }}
          >
            重试
          </Button>
        </Box>
      );
    }

    if (isLoading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          gap: 2
        }}>
          <CircularProgress sx={{ color: '#ff69b4' }} />
          <Typography variant="h6" sx={{ color: '#ff69b4' }}>
            加载中...
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
        gap: { xs: 2, sm: 2, md: 3 },
        width: '100%'
      }}>
        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              messageId={message.id}
              message={isAdmin ? message.original_text : message.text}
              originalText={message.original_text}
              onDelete={() => handleDelete(message.id, message.user_id)}
              isOwner={isAdmin || message.user_id === userId}
              isAdminMessage={message.user_id === 'admin'}
              onReact={(isLike) => handleReaction(message.id, isLike)}
              reactions={message.reactions || { likes: 0, dislikes: 0 }}
              isPinned={message.is_pinned}
              onTogglePin={(isPinned) => handleTogglePin(message.id, isPinned)}
              isAdmin={isAdmin}
              onReply={(text) => handleCreateReply(message.id, text)}
              replies={messageReplies[message.id] || []}
              onDeleteReply={handleDeleteReply}
              currentUserId={userId}
              onEditReactions={handleEditReactions}
              messageUserId={message.user_id}
            />
          ))
        ) : (
          <Box sx={{ 
            gridColumn: '1 / -1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <Typography variant="h6" sx={{ color: '#ff69b4' }}>
              暂无留言
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <Box sx={{ 
          minHeight: '100vh', 
          backgroundColor: 'background.default',
          pb: '120px' // 添加底部填充，为固定定位的输入框留出空间
        }}>
          <AppBar
            position="sticky"
            sx={{
              backgroundColor: '#fff0f5',
              border: '4px solid #ff69b4',
              borderBottom: '4px solid #ff69b4',
              boxShadow: '4px 4px 0 rgba(255, 105, 180, 0.5)',
              mb: 3,
              zIndex: 1100, // 确保导航栏在最上层
            }}
            className="pixel-theme-pink"
          >
            <Container maxWidth="lg">
              <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScienceIcon sx={{ display: 'flex', color: '#ff69b4', mr: 1 }} />
                  <Typography variant="h6" className="pixel-title-pink" sx={{ color: '#ff69b4' }}>
                    M-Profile Lab
                  </Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                  {isAdmin && (
                    <Button
                      color="inherit"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      className="pixel-button-pink"
                      sx={{ color: '#ff69b4' }}
                    >
                      退出管理
                    </Button>
                  )}
                  <Button
                    color="inherit"
                    href="./female.html"
                    className="pixel-button-pink"
                    sx={{ color: '#ff69b4' }}
                  >
                    女M版
                  </Button>
                  <Button
                    color="inherit"
                    href="./male.html"
                    className="pixel-button-pink"
                    sx={{ color: '#ff69b4' }}
                  >
                    男M版
                  </Button>
                  <Button
                    color="inherit"
                    href="./s.html"
                    className="pixel-button-pink"
                    sx={{ color: '#ff69b4' }}
                  >
                    S版
                  </Button>
                  <Button
                    color="inherit"
                    startIcon={<CollectionsIcon />}
                    href="./gallery.html"
                    className="pixel-button-pink"
                    sx={{ color: '#ff69b4' }}
                  >
                    图库
                  </Button>
                  <Button
                    color="inherit"
                    startIcon={<HomeIcon />}
                    href="./index.html"
                    className="pixel-button-pink"
                    sx={{ color: '#ff69b4' }}
                  >
                    返回首页
                  </Button>
                </Box>
                <IconButton
                  sx={{ 
                    display: { xs: 'block', md: 'none' },
                    color: '#ff69b4',
                    border: '2px solid #ff69b4',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 105, 180, 0.1)'
                    }
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
                backgroundColor: '#fff0f5',
                width: 250,
                border: '4px solid #ff69b4',
                '& .MuiListItem-root': {
                  borderBottom: '1px solid rgba(255, 105, 180, 0.2)'
                }
              }
            }}
          >
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', borderBottom: '2px solid rgba(255, 105, 180, 0.2)' }}>
              <ScienceIcon sx={{ color: '#ff69b4', mr: 1 }} />
              <Typography variant="h6" sx={{ color: '#ff69b4', fontWeight: 'bold' }}>
                M-Profile Lab
              </Typography>
            </Box>
            <List>
              {isAdmin && (
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon sx={{ color: '#ff69b4' }} /></ListItemIcon>
                  <ListItemText primary="退出管理" sx={{ color: '#ff69b4' }} />
                </ListItem>
              )}
              <ListItem button component="a" href="./female.html">
                <ListItemIcon><FemaleIcon sx={{ color: '#ff69b4' }} /></ListItemIcon>
                <ListItemText primary="女M版" sx={{ color: '#ff69b4' }} />
              </ListItem>
              <ListItem button component="a" href="./male.html">
                <ListItemIcon><MaleIcon sx={{ color: '#ff69b4' }} /></ListItemIcon>
                <ListItemText primary="男M版" sx={{ color: '#ff69b4' }} />
              </ListItem>
              <ListItem button component="a" href="./s.html">
                <ListItemIcon><ScienceIcon sx={{ color: '#ff69b4' }} /></ListItemIcon>
                <ListItemText primary="S版" sx={{ color: '#ff69b4' }} />
              </ListItem>
              <ListItem button component="a" href="./gallery.html">
                <ListItemIcon><CollectionsIcon sx={{ color: '#ff69b4' }} /></ListItemIcon>
                <ListItemText primary="图库" sx={{ color: '#ff69b4' }} />
              </ListItem>
              <ListItem button component="a" href="./index.html">
                <ListItemIcon><HomeIcon sx={{ color: '#ff69b4' }} /></ListItemIcon>
                <ListItemText primary="返回首页" sx={{ color: '#ff69b4' }} />
              </ListItem>
            </List>
          </Drawer>

          <Container 
            maxWidth="lg" 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              position: 'relative', // 添加相对定位
              minHeight: 'calc(100vh - 200px)', // 减去顶部导航栏和底部输入框的高度
            }}
          >
            <Typography
              variant="h3"
              className="pixel-title-pink"
              sx={{
                mb: 3,
                cursor: 'default',
                userSelect: 'none'
              }}
              onDoubleClick={handleTitleDoubleClick}
            >
              I Love Dirty Talk
            </Typography>

            {/* Telegram群组提示 */}
            <Paper
              onClick={() => window.open('https://t.me/+ZEKnJ11Xu8U1ZTll', '_blank')}
              sx={{
                p: 2,
                mb: 4,
                backgroundColor: 'rgba(0, 136, 204, 0.1)',
                border: '3px solid #0088cc',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                maxWidth: '600px',
                mx: 'auto',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 136, 204, 0.3)',
                  backgroundColor: 'rgba(0, 136, 204, 0.15)',
                  borderColor: '#0077b3'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  transition: 'transform 0.1s'
                }
              }}
            >
              <TelegramIcon
                sx={{
                  color: '#0088cc',
                  fontSize: { xs: 28, md: 32 },
                  flexShrink: 0
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#0088cc',
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    mb: 0.5
                  }}
                >
                  加入Telegram交流群
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#0077b3',
                    fontSize: { xs: '0.875rem', md: '1rem' }
                  }}
                >
                  寻找同好，分享心得，深度交流
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#0088cc',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1
                    },
                    '50%': {
                      transform: 'scale(1.2)',
                      opacity: 0.7
                    },
                    '100%': {
                      transform: 'scale(1)',
                      opacity: 1
                    }
                  }
                }}
              />
            </Paper>

            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              width: '100%',
              flexGrow: 1, // 允许内容区域伸展
              '& > *': {
                width: '100%',
                maxWidth: '100%'
              }
            }}>
              {/* 热门留言榜 */}
              <Box sx={{
                maxWidth: { md: '800px' },
                mx: 'auto',
                width: '100%'
              }}>
                <TopMessages messages={topMessages} />
              </Box>
              
              {/* 主要内容区域 */}
              {renderContent()}
            </Box>
          </Container>
          
          {/* 底部输入框 */}
          <Paper
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 1.5, sm: 2 },
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              gap: { xs: 1, sm: 2 },
              alignItems: 'center',
              backgroundColor: '#fff0f5',
              zIndex: 1000,
              borderTop: '4px solid #ff69b4',
              boxShadow: '0 -4px 0 rgba(255, 105, 180, 0.5)',
              maxHeight: '120px', // 限制最大高度
              overflowY: 'auto' // 如果内容过多允许滚动
            }}
            className="pixel-theme-pink"
          >
            <TextField
              fullWidth
              multiline
              rows={2}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="说点什么...(最多200字)"
              variant="outlined"
              inputProps={{ maxLength: 200 }}
              helperText={`${newMessage.length}/200`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#ff69b4',
                    borderWidth: '3px',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff69b4',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ff69b4',
                  },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              sx={{
                height: '100%',
                minWidth: { xs: '80px', sm: '100px' },
                backgroundColor: '#ff69b4',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#ff8dc3',
                },
              }}
              className="pixel-button-pink"
            >
              发送
            </Button>
          </Paper>

          {/* 添加编辑反应计数对话框 */}
          <Dialog 
            open={editReactionDialog.open} 
            onClose={() => setEditReactionDialog({...editReactionDialog, open: false})}
          >
            <DialogTitle sx={{ color: '#ff69b4' }}>
              修改{editReactionDialog.type === 'likes' ? '点赞' : '点踩'}数量
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label={`${editReactionDialog.type === 'likes' ? '点赞' : '点踩'}数量`}
                type="number"
                fullWidth
                value={newReactionCount}
                onChange={(e) => setNewReactionCount(parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#ff69b4',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ff69b4',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff69b4',
                    },
                  },
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setEditReactionDialog({...editReactionDialog, open: false})}
                sx={{ color: '#ff69b4' }}
              >
                取消
              </Button>
              <Button 
                onClick={handleSubmitReactionEdit} 
                sx={{ 
                  backgroundColor: '#ff69b4', 
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#ff8dc3',
                  },
                }}
              >
                确认
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
          />
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MessageApp