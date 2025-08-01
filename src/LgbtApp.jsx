import React, { useState, useRef, useEffect } from 'react'
import { Container, Typography, Paper, Grid, Box, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, AppBar, Toolbar, Drawer, List, ListItem, ListItemIcon, ListItemText, createTheme, ThemeProvider, TextField, Chip } from '@mui/material'
import Footer from './components/Footer'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import html2canvas from 'html2canvas'
import html2pdf from 'html2pdf.js'
import ScienceIcon from '@mui/icons-material/Science'
import HomeIcon from '@mui/icons-material/Home'
import InfoIcon from '@mui/icons-material/Info'
import HelpIcon from '@mui/icons-material/Help'
import MenuIcon from '@mui/icons-material/Menu'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import CloseIcon from '@mui/icons-material/Close'
import MaleIcon from '@mui/icons-material/Male'
import MessageIcon from '@mui/icons-material/Message'
import SaveIcon from '@mui/icons-material/Save'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import TelegramIcon from '@mui/icons-material/Telegram'
import './styles/lgbt-theme.css'
import { testRecordsApi } from './utils/supabase'
import { userManager, getUserId, getNickname, setNickname, getDisplayName } from './utils/userManager'
import { runDatabaseDiagnostic } from './utils/databaseDiagnostic'

// GSAP动画系统导入
import { gsap } from 'gsap'
// 仅在浏览器环境中导入ScrollTrigger
let ScrollTrigger;
if (typeof window !== 'undefined') {
  import('gsap/ScrollTrigger').then(module => {
    ScrollTrigger = module.ScrollTrigger;
    // 注册GSAP插件
    gsap.registerPlugin(ScrollTrigger);
  }).catch(err => {
    console.warn('ScrollTrigger加载失败:', err);
  });
}

const RATING_OPTIONS = ['SSS', 'SS', 'S', 'Q', 'N', 'W']
const CATEGORIES = {
  '🌈 性别认同': ['🏳️‍⚧️ 跨性别认同', '🚻 非二元性别', '⚧ 性别流动', '🧑 性别酷儿', '🚫 无性别认同', '👩 女性认同', '👨 男性认同', '🔄 性别表达流动', '👗 跨性别装扮', '🧠 性别认知探索', '💉 荷尔蒙治疗', '🩺 性别确认手术'],
  '💖 性取向': ['👨‍❤️‍👨 同性恋（男）', '👩‍❤️‍👩 同性恋（女）', '👥 双性恋', '🌍 全性恋', '🚫 无性恋', '❓ 性取向流动', '👤 单性恋', '🔍 探索性取向', '👨‍👩‍👧 异性恋倾向', '👨‍👨‍👧 同性恋倾向', '👩‍👩‍👧 女同倾向', '🌈 多重性取向'],
  '🔥 性偏好': ['👄 口交（给予）', '👅 口交（接受）', '🍑 肛交（插入）', '🍑 肛交（接受）', '✌️ 双向性交', '🤲 手淫（给予）', '🤚 手淫（接受）', '💦 体液偏好', '🎭 角色扮演性爱', '🔗 轻度捆绑', '🖐️ 轻度支配', '🙇 轻度臣服', '👥 群交', '👀 暴露性爱'],
  '💑 关系动态': ['💞 开放关系', '👨‍👩‍👧 传统单偶制', '👥 多重伴侣', '💍 伴侣交换', '👨‍❤️‍👨 同性伴侣', '👩‍❤️‍👩 女同伴侣', '👤 单身倾向', '🔄 流动关系', '🌐 网络恋爱', '🕒 短期恋爱', '📅 长期关系', '👨‍👨‍👧 家庭式关系', '🤝 朋友式关系'],
  '🎭 性别表达': ['👗 女性化表达', '👔 男性化表达', '🧥 中性表达', '🎨 性别混合表达', '👠 高跟鞋与裙装', '🧢 运动风表达', '💄 化妆与美甲', '💇‍♂️ 短发或剃头', '👑 性别夸张表达', '🔄 日常性别切换', '🎤 变装表演', '🕶️ 匿名性别表达'],
  '🌍 社区参与': ['🏳️‍🌈 骄傲游行', '👥 LGBT社群活动', '📢 性少数权益倡导', '🌐 在线LGBT社区', '🎤 公开出柜', '🔒 部分出柜', '🚫 未出柜', '📚 LGBT文化研究', '🎭 性别酷儿艺术', '👨‍🏫 性少数教育', '💬 分享个人经历', '🤝 帮助LGBT新人'],
  '🔞 性探索': ['🛌 尝试新体位', '🔧 性玩具使用', '🎥 观看成人内容', '📸 拍摄私密内容', '👥 多人性探索', '🌳 户外性行为', '🏢 公共场所性行为', '🎭 性幻想扮演', '🔗 BDSM元素', '🖼️ 性艺术创作', '💭 性幻想分享', '📝 性日记记录'],
  '💭 心理认同': ['🧠 自我性别认知', '🌈 性取向自信', '🙅‍♂️ 拒绝性别标签', '🙅‍♀️ 拒绝性取向标签', '💬 性别讨论开放', '🔍 持续自我探索', '😌 性别认同平静', '🌪️ 性别认同挣扎', '🤝 接受他人认同', '📖 性别理论阅读', '🗣️ 公开讨论认同', '🧘 性别冥想']
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b6b',
      light: '#ff9999',
      dark: '#cc5555',
    },
    secondary: {
      main: '#4ecdc4',
      light: '#7dd3db',
      dark: '#3ea39c',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
  },
  typography: {
    h3: {
      fontWeight: 700,
      marginBottom: '2rem',
      letterSpacing: '-0.5px',
      background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle1: {
      color: 'text.secondary',
      marginBottom: '2.5rem',
      fontSize: '1.1rem',
    },
    h5: {
      fontWeight: 600,
      marginBottom: '1.5rem',
      background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '12px',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
})

function LgbtApp() {
  const [ratings, setRatings] = useState({})
  const [openReport, setOpenReport] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedBatchRating, setSelectedBatchRating] = useState('')
  const [openHistory, setOpenHistory] = useState(false)
  const [openUserSettings, setOpenUserSettings] = useState(false)
  const [userNickname, setUserNickname] = useState(getNickname())
  const [testRecords, setTestRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [openDiagnostic, setOpenDiagnostic] = useState(false)
  const [diagnosticReport, setDiagnosticReport] = useState(null)
  const [showDiagnosticButton, setShowDiagnosticButton] = useState(false)
  const [showStickyGuide, setShowStickyGuide] = useState(false)
  const reportRef = useRef(null)
  const originalGuideRef = useRef(null)

  // 初始化GSAP和页面动画
  useEffect(() => {
    try {
      // 确保DOM元素已经加载完成
      setTimeout(() => {
        // 页面入场动画
        const tl = gsap.timeline({
          defaults: {
            clearProps: "all" // 动画完成后清除所有应用的属性，防止干扰布局
          }
        });

        // 标题动画 - 从上方淡入
        tl.from('.lgbt-title, h1, h2, h3', {
          opacity: 0,
          y: -30,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
          clearProps: "all"
        })

          // 卡片动画 - 从下方滑入并缩放
          .from('.lgbt-card, .MuiPaper-root:not(.MuiAppBar-root):not(.MuiDrawer-paper)', {
            opacity: 0,
            y: 20,
            scale: 0.98,
            duration: 0.5,
            ease: "back.out(1.2)",
            stagger: 0.05,
            clearProps: "all"
          }, "-=0.3")

          // 按钮动画 - 弹跳效果
          .from('.lgbt-button, .MuiButton-root', {
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            ease: "back.out(1.5)",
            stagger: 0.03,
            clearProps: "all"
          }, "-=0.2")

          // 表单元素动画
          .from('.MuiTextField-root, .MuiSelect-root, .MuiChip-root', {
            opacity: 0,
            x: -10,
            duration: 0.3,
            ease: "power2.out",
            stagger: 0.03,
            clearProps: "all"
          }, "-=0.1");

        console.log('🎬 页面动画已初始化');
      }, 100); // 短暂延迟确保DOM已加载

      return () => {
        // 清理动画
        gsap.killTweensOf([
          '.pixel-title-pink, h1, h2, h3',
          '.pixel-card-pink, .MuiPaper-root:not(.MuiAppBar-root)',
          '.pixel-button-pink, .MuiButton-root',
          '.MuiTextField-root, .MuiSelect-root, .MuiChip-root'
        ]);
      };
    } catch (error) {
      console.warn('页面动画初始化失败:', error);
      // 即使动画失败，也不影响页面正常显示
    }
  }, []);

  // 页面加载时初始化数据
  useEffect(() => {
    loadLatestTestRecord();
    loadTestRecords();
  }, []);

  // 监听滚动，控制动态评分说明的显示
  useEffect(() => {
    const handleScroll = () => {
      if (originalGuideRef.current) {
        const rect = originalGuideRef.current.getBoundingClientRect();
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        setShowStickyGuide(!isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始检查

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 监听评分变化，标记为有未保存的更改
  useEffect(() => {
    const hasRatings = Object.keys(ratings).length > 0;
    setHasUnsavedChanges(hasRatings);
  }, [ratings]);

  // 加载最新的测试记录
  const loadLatestTestRecord = async () => {
    try {
      const userId = getUserId();
      const latestRecord = await testRecordsApi.getLatestTestRecord(userId, 'lgbt');

      if (latestRecord && latestRecord.ratings) {
        setRatings(latestRecord.ratings);
        setSnackbarMessage('已加载您的最新测试记录');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('加载最新测试记录失败:', error);
      // 不显示错误消息，因为可能是首次使用
    }
  };

  // 加载用户的所有测试记录
  const loadTestRecords = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const records = await testRecordsApi.getUserTestRecords(userId);
      setTestRecords(records.filter(record => record.test_type === 'lgbt'));
    } catch (error) {
      console.error('加载测试记录失败:', error);
      setSnackbarMessage('加载历史记录失败');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 保存测试记录
  const saveTestRecord = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const nickname = getNickname();

      // 生成报告数据
      const reportData = {
        radarData: getRadarData(),
        groupedRatings: getGroupedRatings(),
        totalItems: Object.keys(ratings).length,
        completedItems: Object.values(ratings).filter(r => r !== '').length
      };

      await testRecordsApi.saveTestRecord({
        userId,
        nickname,
        testType: 'lgbt',
        ratings,
        reportData
      });

      setHasUnsavedChanges(false);
      setSnackbarMessage('测试记录保存成功！');
      setSnackbarOpen(true);

      // 重新加载记录列表
      await loadTestRecords();
    } catch (error) {
      console.error('保存测试记录失败:', error);

      // 如果是数据库相关错误，建议运行诊断
      if (error.message.includes('Could not find') || error.message.includes('column') || error.message.includes('table')) {
        setSnackbarMessage('数据库配置有问题，请点击"数据库诊断"检查');
      } else {
        setSnackbarMessage('保存失败: ' + error.message);
      }
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 运行数据库诊断
  const runDiagnostic = async () => {
    try {
      setLoading(true);
      setOpenDiagnostic(true);
      const report = await runDatabaseDiagnostic();
      setDiagnosticReport(report);
    } catch (error) {
      console.error('诊断失败:', error);
      setSnackbarMessage('诊断失败: ' + error.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 处理标题双击事件
  const handleTitleDoubleClick = () => {
    setShowDiagnosticButton(true);
    setSnackbarMessage('数据库诊断功能已激活！');
    setSnackbarOpen(true);
  };

  const handleRatingChange = (category, item, value) => {
    setRatings(prev => ({
      ...prev,
      [`${category}-${item}`]: value
    }))
  }

  const getRating = (category, item) => {
    return ratings[`${category}-${item}`] || ''
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'SSS': return '#FF1493'
      case 'SS': return '#FF69B4'
      case 'S': return '#87CEEB'
      case 'Q': return '#FFD700'
      case 'N': return '#FF4500'
      case 'W': return '#808080'
      default: return '#CCCCCC'
    }
  }

  const getRadarData = () => {
    return Object.entries(CATEGORIES).map(([category]) => {
      const items = CATEGORIES[category]
      const categoryScores = items.map(item => {
        const rating = getRating(category, item)
        switch (rating) {
          case 'SSS': return 6
          case 'SS': return 5
          case 'S': return 4
          case 'Q': return 3
          case 'N': return 2
          case 'W': return 1
          default: return 0
        }
      })
      const avgScore = categoryScores.reduce((a, b) => a + b, 0) / items.length
      return {
        category,
        value: avgScore,
        fullMark: 6
      }
    })
  }

  const getBarData = (category) => {
    return CATEGORIES[category].map(item => ({
      name: item,
      value: (() => {
        const rating = getRating(category, item)
        switch (rating) {
          case 'SSS': return 6
          case 'SS': return 5
          case 'S': return 4
          case 'Q': return 3
          case 'N': return 2
          case 'W': return 1
          default: return 0
        }
      })()
    }))
  }

  const handleExportImage = async () => {
    // 在导出图片前自动保存测试
    if (Object.keys(ratings).length > 0 && hasUnsavedChanges) {
      try {
        await saveTestRecord();
        setSnackbarMessage('测试已自动保存并开始导出图片...');
        setSnackbarOpen(true);
        // 短暂延迟让用户看到保存消息
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('自动保存失败:', error);
        setSnackbarMessage('自动保存失败，但继续导出图片...');
        setSnackbarOpen(true);
      }
    }

    if (reportRef.current) {
      try {
        // 创建一个新的容器元素，用于生成图片
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '1200px'; // 固定宽度
        container.style.backgroundColor = '#ffffff';
        container.style.padding = '40px';
        document.body.appendChild(container);

        // 克隆报告元素
        const clonedReport = reportRef.current.cloneNode(true);
        container.appendChild(clonedReport);

        // 设置固定布局样式
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          .MuiGrid-container {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
            width: 100% !important;
          }
          .MuiGrid-item {
            width: 100% !important;
            max-width: 100% !important;
            flex: none !important;
            padding: 0 !important;
          }
          .MuiPaper-root {
            height: 100% !important;
          }
          .MuiTypography-root {
            font-size: 16px !important;
          }
          .MuiTypography-h4 {
            font-size: 32px !important;
            margin-bottom: 32px !important;
          }
          .MuiTypography-h5 {
            font-size: 24px !important;
            margin-bottom: 16px !important;
          }
          .recharts-wrapper {
            width: 600px !important;
            height: 400px !important;
            margin: 0 auto 32px !important;
          }
        `;
        container.appendChild(styleSheet);

        // 确保所有图表都已渲染
        await new Promise(resolve => setTimeout(resolve, 500));

        // 生成图片
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1200,
          height: container.offsetHeight,
          onclone: (clonedDoc) => {
            const charts = clonedDoc.querySelectorAll('.recharts-wrapper');
            charts.forEach(chart => {
              chart.style.margin = '0 auto';
            });
          }
        });

        // 清理临时元素
        document.body.removeChild(container);

        // 将Canvas转换为Blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));

        // 保存图片
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isMobile) {
          try {
            // 尝试使用Web Share API (支持直接分享到相册应用)
            if (navigator.share && navigator.canShare) {
              const file = new File([blob], 'LGBT自评报告.png', { type: 'image/png' });
              const shareData = {
                title: 'LGBT+身份探索报告',
                text: '我的个性化LGBT+身份探索测评报告 🏳️‍🌈',
                files: [file]
              };

              if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                setSnackbarMessage(isIOS ?
                  '图片已准备好！可选择"存储到文件"或"保存到照片"' :
                  '图片已准备好！可选择保存到相册或其他应用'
                );
                setSnackbarOpen(true);
                return;
              }
            }

            // 如果Web Share API不可用，尝试创建可长按保存的图片
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            img.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              max-width: 90vw;
              max-height: 90vh;
              z-index: 10000;
              border: 3px solid #fff;
              border-radius: 8px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            `;

            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.8);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
            `;

            // 添加说明文字
            const instruction = document.createElement('div');
            instruction.innerHTML = isIOS ?
              '<p style="color: white; text-align: center; margin: 20px; font-size: 16px;">长按图片选择"存储图像"保存到相册<br/>点击空白处关闭</p>' :
              '<p style="color: white; text-align: center; margin: 20px; font-size: 16px;">长按图片选择"保存图片"到相册<br/>点击空白处关闭</p>';

            overlay.appendChild(instruction);
            overlay.appendChild(img);
            document.body.appendChild(overlay);

            // 点击遮罩关闭
            overlay.addEventListener('click', (e) => {
              if (e.target === overlay || e.target === instruction) {
                document.body.removeChild(overlay);
                URL.revokeObjectURL(img.src);
              }
            });

            setSnackbarMessage(isIOS ?
              '图片已显示，长按选择"存储图像"保存到相册' :
              '图片已显示，长按选择"保存图片"到相册'
            );
            setSnackbarOpen(true);
            return;

          } catch (error) {
            console.error('移动端保存失败:', error);
          }
        }

        // 桌面端默认下载方法
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'LGBT自评报告.png';
        link.click();
        URL.revokeObjectURL(url);
        setSnackbarMessage('报告已保存为高清图片！');
        setSnackbarOpen(true);

      } catch (error) {
        console.error('导出图片错误:', error);
        setSnackbarMessage('导出图片失败，请重试');
        setSnackbarOpen(true);
      }
    }
  }

  const handleExportPDF = async () => {
    // 在导出PDF前自动保存测试
    if (Object.keys(ratings).length > 0 && hasUnsavedChanges) {
      try {
        await saveTestRecord();
        setSnackbarMessage('测试已自动保存并开始导出PDF...');
        setSnackbarOpen(true);
        // 短暂延迟让用户看到保存消息
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('自动保存失败:', error);
        setSnackbarMessage('自动保存失败，但继续导出PDF...');
        setSnackbarOpen(true);
      }
    }

    if (reportRef.current) {
      try {
        const element = reportRef.current
        const opt = {
          margin: 1,
          filename: 'LGBT自评报告.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        }
        await html2pdf().set(opt).from(element).save()
        setSnackbarMessage('报告已成功保存为PDF！')
        setSnackbarOpen(true)
      } catch (error) {
        setSnackbarMessage('导出PDF失败，请重试')
        setSnackbarOpen(true)
      }
    }
  }

  const handleSetAllRating = (category, rating) => {
    const items = CATEGORIES[category]
    const newRatings = { ...ratings }
    items.forEach(item => {
      newRatings[`${category}-${item}`] = rating
    })
    setRatings(newRatings)
    setSnackbarMessage(`已将${category}类别下所有选项设置为${rating}`)
    setSnackbarOpen(true)
  }

  const handleShareToWeChat = async () => {
    try {
      // 检查是否支持Web Share API
      if (!navigator.share) {
        setSnackbarMessage('您的浏览器不支持分享功能')
        setSnackbarOpen(true)
        return
      }

      // 检查是否支持分享文件
      const canShareFiles = navigator.canShare && await reportRef.current

      if (canShareFiles) {
        // 尝试分享带有文件的内容
        try {
          const canvas = await html2canvas(reportRef.current)
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0))
          const file = new File([blob], 'LGBT自评报告.png', { type: 'image/png' })
          const shareData = {
            title: 'LGBT+身份探索报告',
            text: '我的个性化LGBT+身份探索测评报告 🏳️‍🌈',
            files: [file]
          }

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData)
            setSnackbarMessage('分享成功！')
            setSnackbarOpen(true)
            return
          }
        } catch (error) {
          console.error('分享文件失败:', error)
        }
      }

      // 如果无法分享文件，退回到基本分享
      await navigator.share({
        title: 'LGBT+身份探索报告',
        text: '我的个性化LGBT+身份探索测评报告 🏳️‍🌈'
      })
      setSnackbarMessage('分享成功！')
      setSnackbarOpen(true)
    } catch (error) {
      console.error('分享失败:', error)
      if (error.name === 'AbortError') {
        setSnackbarMessage('分享已取消')
      } else {
        setSnackbarMessage('分享失败，请重试')
      }
      setSnackbarOpen(true)
    }
  }

  const getGroupedRatings = () => {
    const groupedRatings = {}
    Object.entries(CATEGORIES).forEach(([category, items]) => {
      items.forEach(item => {
        const rating = getRating(category, item)
        if (!groupedRatings[rating]) {
          groupedRatings[rating] = []
        }
        groupedRatings[rating].push({ category, item })
      })
    })
    // 按照指定顺序返回结果
    const orderedRatings = {}
    const ratingOrder = ['SSS', 'SS', 'S', 'Q', 'W', 'N']
    ratingOrder.forEach(rating => {
      if (groupedRatings[rating] && groupedRatings[rating].length > 0) {
        orderedRatings[rating] = groupedRatings[rating]
      }
    })
    return orderedRatings
  }

  // 加载特定的测试记录
  const loadTestRecord = async (recordId) => {
    try {
      setLoading(true);
      const recordDetails = await testRecordsApi.getTestRecordDetails(recordId);

      if (recordDetails && recordDetails.ratings) {
        setRatings(recordDetails.ratings);
        setOpenHistory(false);
        setSnackbarMessage('测试记录加载成功');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('加载测试记录失败:', error);
      setSnackbarMessage('加载记录失败: ' + error.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 删除测试记录
  const deleteTestRecord = async (recordId) => {
    try {
      setLoading(true);
      const userId = getUserId();
      await testRecordsApi.deleteTestRecord(recordId, userId);

      setSnackbarMessage('记录删除成功');
      setSnackbarOpen(true);

      // 重新加载记录列表
      await loadTestRecords();
    } catch (error) {
      console.error('删除测试记录失败:', error);
      setSnackbarMessage('删除失败: ' + error.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 更新用户昵称
  const updateUserNickname = () => {
    const newNickname = setNickname(userNickname);
    setSnackbarMessage('昵称更新成功: ' + newNickname);
    setSnackbarOpen(true);
    setOpenUserSettings(false);
  };

  // 清空当前测试
  const clearCurrentTest = () => {
    setRatings({});
    setHasUnsavedChanges(false);
    setSnackbarMessage('当前测试已清空');
    setSnackbarOpen(true);
  };

  // 添加按钮交互动画
  const handleButtonHover = (e, isEnter) => {
    const button = e.currentTarget

    if (isEnter) {
      gsap.to(button, {
        scale: 1.02,
        y: -2,
        boxShadow: "0 8px 25px rgba(255, 105, 180, 0.3)",
        duration: 0.3,
        ease: "power2.out"
      })
    } else {
      gsap.to(button, {
        scale: 1,
        y: 0,
        boxShadow: "0 4px 12px rgba(255, 105, 180, 0.1)",
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  // 添加按钮点击动画
  const handleButtonClick = (e) => {
    const button = e.currentTarget

    gsap.timeline()
      .to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.inOut"
      })
      .to(button, {
        scale: 1.02,
        duration: 0.2,
        ease: "elastic.out(1, 0.3)"
      })
  }

  const handleGenerateReport = async () => {
    // 在生成报告前自动保存测试
    if (Object.keys(ratings).length > 0 && hasUnsavedChanges) {
      try {
        await saveTestRecord();
        setSnackbarMessage('测试已自动保存！');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('自动保存失败:', error);
        setSnackbarMessage('自动保存失败，请稍后手动保存');
        setSnackbarOpen(true);
      }
    }

    setOpenReport(true);
  }

  // 添加卡片悬停动画
  const handleCardHover = (e, isEnter) => {
    const card = e.currentTarget

    if (isEnter) {
      gsap.to(card, {
        scale: 1.02,
        y: -5,
        boxShadow: "0 12px 30px rgba(255, 105, 180, 0.2)",
        duration: 0.3,
        ease: "power2.out"
      })
    } else {
      gsap.to(card, {
        scale: 1,
        y: 0,
        boxShadow: "0 4px 12px rgba(255, 105, 180, 0.1)",
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>

        {/* 动态置顶评分说明 */}
        {showStickyGuide && (
          <Paper elevation={2} sx={{
            position: 'fixed',
            top: { xs: '56px', md: '64px' },
            left: 0,
            right: 0,
            zIndex: 1000,
            p: 1.5,
            backgroundColor: 'rgba(255, 240, 245, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 0,
            borderBottom: '2px solid #ff69b4',
            animation: 'slideDown 0.3s ease-out',
            '@keyframes slideDown': {
              from: { transform: 'translateY(-100%)', opacity: 0 },
              to: { transform: 'translateY(0)', opacity: 1 }
            }
          }} className="pixel-card-pink">
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main', textAlign: 'center', fontSize: '0.8rem' }}>
              评分等级说明
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 0.5, md: 1 } }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#FF1493' }}>SSS</Box>=非常喜欢
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#FF69B4' }}>SS</Box>=喜欢
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#87CEEB' }}>S</Box>=接受
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#FFD700' }}>Q</Box>=不喜欢但会做
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#FF4500' }}>N</Box>=拒绝
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#808080' }}>W</Box>=未知
              </Typography>
            </Box>
          </Paper>
        )}

        <AppBar position="sticky" sx={{
          background: 'transparent',
          backgroundColor: '#fff0f5',
          border: '4px solid #ff69b4',
          borderBottom: '4px solid #ff69b4',
          boxShadow: '4px 4px 0 rgba(255, 105, 180, 0.5)',
          borderRadius: '0',
          marginBottom: '1rem'
        }} className="pixel-theme-pink">

          <Container maxWidth="lg">
            <Toolbar sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: { xs: '8px 12px', md: '8px 24px' },
              minHeight: { xs: '56px', md: '64px' },
              gap: { xs: 1, md: 2 },
              overflow: 'hidden'
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flex: '0 0 auto',
                justifyContent: 'flex-start',
                height: '100%',
                minWidth: 0
              }}>
                <ScienceIcon sx={{ display: 'flex', color: '#1E3D59', flexShrink: 0 }} />
                <Typography variant="h5" sx={{
                  fontWeight: 'bold',
                  color: '#1E3D59',
                  display: 'flex',
                  alignItems: 'center',
                  margin: 0,
                  padding: 0,
                  lineHeight: 1,
                  height: '100%',
                  fontSize: { xs: '1.1rem', md: '1.5rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 0
                }} className="pixel-title-pink">
                  M-Profile Lab
                </Typography>
              </Box>

              <Box sx={{
                display: { xs: 'none', md: 'flex' },
                gap: { md: 1, lg: 2 },
                flex: '1 1 auto',
                justifyContent: 'flex-end',
                alignItems: 'center',
                minWidth: 0
              }}>
                <Button
                  color="inherit"
                  startIcon={<HomeIcon />}
                  href="/index.html"
                  className="pixel-button-pink"
                  sx={{ 
                    color: '#1E3D59',
                    fontSize: { md: '0.8rem', lg: '0.875rem' },
                    padding: { md: '6px 12px', lg: '8px 16px' },
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                  onClick={handleButtonClick}
                >
                  首页
                </Button>
                <Button
                  color="inherit"
                  startIcon={<ScienceIcon />}
                  href="/s.html"
                  className="pixel-button-pink"
                  sx={{ 
                    color: '#1E3D59',
                    fontSize: { md: '0.8rem', lg: '0.875rem' },
                    padding: { md: '6px 12px', lg: '8px 16px' },
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                  onClick={handleButtonClick}
                >
                  S版
                </Button>
                <Button
                  color="inherit"
                  startIcon={<MaleIcon />}
                  href="/male.html"
                  className="pixel-button-pink"
                  sx={{ 
                    color: '#1E3D59',
                    fontSize: { md: '0.8rem', lg: '0.875rem' },
                    padding: { md: '6px 12px', lg: '8px 16px' },
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                  onClick={handleButtonClick}
                >
                  男生版
                </Button>
                <Button
                  color="inherit"
                  startIcon={<MessageIcon />}
                  href="/message.html"
                  className="pixel-button-pink"
                  sx={{ 
                    color: '#1E3D59',
                    fontSize: { md: '0.8rem', lg: '0.875rem' },
                    padding: { md: '6px 12px', lg: '8px 16px' },
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                  onClick={handleButtonClick}
                >
                  留言板
                </Button>
                <Button
                  color="inherit"
                  startIcon={<PersonIcon />}
                  onClick={() => setOpenUserSettings(true)}
                  className="pixel-button-pink"
                  sx={{
                    color: '#1E3D59',
                    fontSize: { md: '0.8rem', lg: '0.875rem' },
                    padding: { md: '6px 8px', lg: '8px 12px' },
                    minWidth: 'auto',
                    maxWidth: { md: '100px', lg: '120px' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                  onClick={handleButtonClick}
                >
                  {getNickname()}
                </Button>
              </Box>

              <IconButton
                color="inherit"
                sx={{ display: { xs: 'block', md: 'none' } }}
                onClick={() => setMobileMenuOpen(true)}
                className="pixel-button-pink"
              >
                <MenuIcon sx={{ color: '#1E3D59' }} />
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>

        <Drawer
          anchor="right"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          className="pixel-theme-pink"
        >
          <Box sx={{ 
            width: 280, 
            pt: 2,
            backgroundColor: '#fff0f5',
            height: '100%'
          }}>
            <List sx={{ padding: 0 }}>
              <ListItem 
                button 
                component="a" 
                href="/index.html" 
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 105, 180, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 105, 180, 0.1)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <HomeIcon sx={{ color: '#1E3D59' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="首页" 
                  sx={{ 
                    color: '#1E3D59',
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }
                  }} 
                />
              </ListItem>
              <ListItem 
                button 
                component="a" 
                href="/s.html" 
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 105, 180, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 105, 180, 0.1)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <ScienceIcon sx={{ color: '#1E3D59' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="S版" 
                  sx={{ 
                    color: '#1E3D59',
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }
                  }} 
                />
              </ListItem>
              <ListItem 
                button 
                component="a" 
                href="/male.html" 
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 105, 180, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 105, 180, 0.1)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <MaleIcon sx={{ color: '#1E3D59' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="男生版" 
                  sx={{ 
                    color: '#1E3D59',
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }
                  }} 
                />
              </ListItem>
              <ListItem 
                button 
                component="a" 
                href="/message.html" 
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 105, 180, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 105, 180, 0.1)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <MessageIcon sx={{ color: '#1E3D59' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="留言板" 
                  sx={{ 
                    color: '#1E3D59',
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }
                  }} 
                />
              </ListItem>
              <ListItem 
                button 
                onClick={() => { setOpenUserSettings(true); setMobileMenuOpen(false); }}
                sx={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 105, 180, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 105, 180, 0.1)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <PersonIcon sx={{ color: '#1E3D59' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={`用户: ${getNickname()}`}
                  sx={{ 
                    color: '#1E3D59',
                    '& .MuiTypography-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }} 
                />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        <Container maxWidth="lg" sx={{
          py: 8,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          animation: 'fadeIn 0.6s ease-in-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          }
        }} className="pixel-theme-pink">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 'bold',
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              className="lgbt-title"
              onDoubleClick={handleTitleDoubleClick}
              title="lgbt-profile.top"
            >
              🏳️‍🌈 LGBT+身份探索测试
            </Typography>
            <Box className="pixel-divider-pink" sx={{ mb: 4, mt: 2 }}></Box>
            <Paper elevation={1} sx={{
              mt: 2,
              p: 2,
              borderRadius: 0,
              maxWidth: { xs: '100%', md: '80%' },
              mx: 'auto'
            }} className="pixel-card-pink" id="rating-guide-original" ref={originalGuideRef}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main', textAlign: 'center' }}>
                评分等级说明
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1, md: 2 } }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', color: '#FF1493' }}>SSS</Box> = 非常喜欢
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', color: '#FF69B4' }}>SS</Box> = 喜欢
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', color: '#87CEEB' }}>S</Box> = 接受
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', color: '#FFD700' }}>Q</Box> = 不喜欢但会做
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', color: '#FF4500' }}>N</Box> = 拒绝
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', color: '#808080' }}>W</Box> = 未知
                </Typography>
              </Box>
            </Paper>
            <Box sx={{ mt: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              {/* 状态指示器 */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                <Chip
                  label={`已完成: ${Object.values(ratings).filter(r => r !== '').length}/${Object.keys(CATEGORIES).reduce((sum, cat) => sum + CATEGORIES[cat].length, 0)}`}
                  color="primary"
                  variant="outlined"
                />
                {hasUnsavedChanges && (
                  <Chip
                    label="有未保存的更改"
                    color="warning"
                    variant="filled"
                    icon={<SaveIcon />}
                  />
                )}
                <Chip
                  label={`用户: ${getDisplayName()}`}
                  color="secondary"
                  variant="outlined"
                  icon={<PersonIcon />}
                />
              </Box>

              {/* 操作按钮 */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  disabled={loading || Object.keys(ratings).length === 0}
                  sx={{
                    padding: '12px 32px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                  className="pixel-button-pink"
                  onClick={saveTestRecord}
                >
                  {loading ? '保存中...' : '保存测试'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<HistoryIcon />}
                  onClick={() => setOpenHistory(true)}
                  sx={{
                    padding: '12px 32px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                  className="pixel-button-pink"
                >
                  查看记录
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AutorenewIcon />}
                  sx={{
                    padding: '12px 32px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                  className="pixel-button-pink"
                  onClick={() => {
                    const newRatings = {};
                    Object.entries(CATEGORIES).forEach(([category, items]) => {
                      items.forEach(item => {
                        const randomIndex = Math.floor(Math.random() * RATING_OPTIONS.length);
                        newRatings[`${category}-${item}`] = RATING_OPTIONS[randomIndex];
                      });
                    });
                    setRatings(newRatings);
                    setSnackbarMessage('已完成随机选择！');
                    setSnackbarOpen(true);
                  }}
                >
                  随机选择
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CloseIcon />}
                  color="error"
                  sx={{
                    padding: '12px 32px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                  onClick={clearCurrentTest}
                >
                  清空测试
                </Button>

                {showDiagnosticButton && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<InfoIcon />}
                    color="info"
                    sx={{
                      padding: '12px 32px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                    onClick={runDiagnostic}
                    disabled={loading}
                  >
                    数据库诊断
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {Object.entries(CATEGORIES).map(([category, items]) => (
            <Paper key={category} elevation={2} sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 0,
              backgroundColor: 'background.paper',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
              }
            }} className="pixel-card-pink">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h5" sx={{ mb: 0 }}>
                  {category}
                </Typography>
                <Select
                  size="small"
                  value={selectedBatchRating}
                  onChange={(e) => {
                    handleSetAllRating(category, e.target.value)
                    setSelectedBatchRating('')
                  }}
                  displayEmpty
                  placeholder="一键选择"
                  renderValue={(value) => value || "一键选择"}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value=""><em>一键选择</em></MenuItem>
                  {RATING_OPTIONS.map(rating => (
                    <MenuItem key={rating} value={rating}>{rating}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Grid container spacing={2} sx={{ mt: 0, width: '100%', margin: 0 }}>
                {items.map(item => (
                  <Grid item xs={12} sm={6} md={4} key={item}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: { xs: 1, md: 1.5 },
                      borderRadius: 2,
                      height: '100%',
                      backgroundColor: getRating(category, item) ?
                        `${getRatingColor(getRating(category, item))}20` : // 添加20表示12.5%透明度
                        'background.paper',
                      boxShadow: getRating(category, item) ?
                        `0 1px 4px ${getRatingColor(getRating(category, item))}60` :
                        '0 1px 3px rgba(0,0,0,0.1)',
                      borderLeft: getRating(category, item) ?
                        `3px solid ${getRatingColor(getRating(category, item))}` :
                        'none',
                      transition: 'all 0.3s ease',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: getRating(category, item) ?
                          `${getRatingColor(getRating(category, item))}30` : // 悬停时增加透明度到约18.75%
                          'rgba(98, 0, 234, 0.04)',
                        transform: 'translateX(4px)',
                        boxShadow: getRating(category, item) ?
                          `0 2px 8px ${getRatingColor(getRating(category, item))}80` :
                          '0 2px 6px rgba(0,0,0,0.15)',
                      },
                    }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        minWidth: 0,
                        overflow: 'hidden'
                      }}>
                        <Typography sx={{
                          fontWeight: 500,
                          color: getRating(category, item) ?
                            `${getRatingColor(getRating(category, item))}` :
                            'text.primary',
                          fontSize: { xs: '0.85rem', md: '1rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.3s ease'
                        }}>{item}</Typography>
                      </Box>
                      <Select
                        size="small"
                        value={getRating(category, item)}
                        onChange={(e) => handleRatingChange(category, item, e.target.value)}
                        sx={{
                          minWidth: { xs: 100, md: 120 },
                          '.MuiSelect-select': {
                            py: 1.5,
                            px: 2
                          }
                        }}
                      >
                        <MenuItem value=""><em>请选择</em></MenuItem>
                        {RATING_OPTIONS.map(rating => (
                          <MenuItem key={rating} value={rating}>{rating}</MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, gap: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleGenerateReport}
              sx={{ minWidth: 200 }}
              className="pixel-button-pink"
            >
              生成报告
            </Button>
            <Paper elevation={2} sx={{
              p: 3,
              borderRadius: 0,
              textAlign: 'center',
              maxWidth: 300,
              mx: 'auto',
              backgroundColor: 'white'
            }} className="pixel-card-pink">
              <Typography variant="subtitle1" sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 2
              }}>
                扫码领取您的XP报告
              </Typography>
              <Box component="img" src="/qrcode.png" alt="QR Code" sx={{
                width: '200px',
                height: '200px',
                display: 'block',
                margin: '0 auto'
              }} />
            </Paper>
          </Box>

          <Dialog
            open={openReport}
            onClose={() => setOpenReport(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                minHeight: { xs: '80vh', md: 'auto' },
                maxHeight: { xs: '90vh', md: '90vh' },
                overflowY: 'auto',
                m: { xs: 1, sm: 2 },
                width: '100%',
                maxWidth: { sm: '800px' },
                mx: 'auto',
                backgroundColor: '#fafafa',
                '@media print': {
                  height: 'auto',
                  maxHeight: 'none',
                  overflow: 'visible'
                }
              }
            }}
          >
            <DialogTitle sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              pt: { xs: 1, md: 2 },
              pb: { xs: 1, md: 2 },
              borderBottom: '2px dashed #ff69b4',
              mb: 1
            }} className="lgbt-title">
              🏳️‍🌈 LGBT+身份探索详细报告
            </DialogTitle>
            <DialogContent ref={reportRef} sx={{
              px: { xs: 2, md: 4 },
              py: { xs: 1, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '@media print': {
                overflow: 'visible',
                height: 'auto'
              }
            }}>
              <Box ref={reportRef} sx={{ p: { xs: 1, md: 2 } }}>
                <Typography variant="h4" gutterBottom align="center" sx={{ 
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: { xs: 2, md: 3 } 
                }}>
                  🏳️‍🌈 LGBT+身份探索报告
                </Typography>

                {/* 雷达图部分 */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: { xs: 1, md: 2 },
                  position: 'relative'
                }}>
                  <RadarChart
                    width={window.innerWidth < 768 ? Math.min(320, window.innerWidth - 60) : 500}
                    height={window.innerWidth < 768 ? Math.min(250, window.innerWidth - 60) : 350}
                    data={getRadarData()}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 6]} />
                    <Radar name="得分" dataKey="value" stroke="#ff69b4" fill="#ff69b4" fillOpacity={0.6} />
                  </RadarChart>
                </Box>

                {/* 用户提示信息 - 紧跟雷达图 */}
                <Box sx={{
                  mb: { xs: 2, md: 3 },
                  textAlign: 'center',
                  p: { xs: 1.5, md: 2 },
                  backgroundColor: 'rgba(255, 105, 180, 0.15)',
                  borderRadius: 2,
                  border: '2px solid rgba(255, 105, 180, 0.4)',
                  mx: { xs: 1, md: 0 },
                  boxShadow: '0 2px 8px rgba(255, 105, 180, 0.2)'
                }}>
                  <Typography variant="body1" sx={{
                    color: '#ff69b4',
                    fontWeight: 'bold',
                    mb: 1,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}>
                    💡 温馨提示
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: 'text.primary',
                    lineHeight: 1.6,
                    fontSize: { xs: '0.85rem', md: '0.9rem' }
                  }}>
                    向下滑动查看详细分析结果，或点击下方按钮直接保存报告为图片
                  </Typography>

                  {/* 移动端向下滚动提示箭头 */}
                  <Box sx={{
                    display: { xs: 'flex', md: 'none' },
                    justifyContent: 'center',
                    mt: 1,
                    animation: 'bounce 2s infinite',
                    '@keyframes bounce': {
                      '0%, 20%, 50%, 80%, 100%': {
                        transform: 'translateY(0)'
                      },
                      '40%': {
                        transform: 'translateY(-5px)'
                      },
                      '60%': {
                        transform: 'translateY(-2px)'
                      }
                    }
                  }}>
                    <Box sx={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '12px solid #ff69b4'
                    }} />
                  </Box>
                </Box>

                {/* 移动端分隔线和提示 */}
                <Box sx={{
                  display: { xs: 'block', md: 'none' },
                  mb: 4,
                  textAlign: 'center'
                }}>
                  <Box sx={{
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #ff69b4, transparent)',
                    mb: 2
                  }} />
                  <Typography variant="h6" sx={{
                    color: '#ff69b4',
                    fontWeight: 'bold',
                    mb: 1
                  }}>
                    📊 详细分析报告
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: 'text.secondary',
                    mb: 2
                  }}>
                    以下是您的个性化测评详细结果
                  </Typography>
                </Box>

                {/* 按评分分组展示所有项目 */}
                {Object.entries(getGroupedRatings()).map(([rating, items]) => {
                  if (items.length === 0) return null
                  return (
                    <Box key={rating} sx={{ mb: 4 }}>
                      <Typography variant="h5" sx={{
                        color: getRatingColor(rating),
                        borderBottom: `2px solid ${getRatingColor(rating)}`,
                        pb: 1,
                        mb: 2
                      }}>
                        {rating}级 ({items.length}项)
                      </Typography>
                      <Grid container spacing={2}>
                        {items.map(({ category, item }, index) => (
                          <Grid item xs={12} sm={6} md={4} key={`${category}-${item}-${index}`}>
                            <Paper elevation={3} sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: `${getRatingColor(rating)}22`
                            }}>
                              <Typography>
                                <strong>{category}:</strong> {item}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )
                })}

                {/* 添加二维码部分 */}
                <Box sx={{
                  mt: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                  border: '2px solid #ff69b4',
                  borderRadius: 2
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#ff69b4' }}>
                    原生相机扫码领取您的XP报告
                  </Typography>
                  <Box
                    component="img"
                    src="/qrcode.png"
                    alt="QR Code"
                    sx={{
                      width: 200,
                      height: 200,
                      display: 'block'
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{
              justifyContent: 'center',
              pb: 3,
              pt: 2,
              gap: 2,
              borderTop: '1px solid rgba(0,0,0,0.1)',
              backgroundColor: 'white'
            }}>
              <Button
                onClick={handleExportImage}
                variant="contained"
                color="primary"
                className="pixel-button-pink"
              >
                保存为图片
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="contained"
                color="secondary"
                className="pixel-button-pink"
              >
                保存为PDF
              </Button>
            </DialogActions>
            <IconButton
              onClick={() => setOpenReport(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: '#ff69b4'
              }}
              className="pixel-button-pink"
            >
              <CloseIcon />
            </IconButton>
          </Dialog>

          {/* 历史记录对话框 */}
          <Dialog
            open={openHistory}
            onClose={() => setOpenHistory(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                minHeight: { xs: '80vh', md: '60vh' },
                maxHeight: { xs: '90vh', md: '80vh' }
              }
            }}
          >
            <DialogTitle sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              borderBottom: '2px dashed #ff69b4',
              mb: 2
            }} className="pixel-title-pink">
              测试历史记录
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography>加载中...</Typography>
                </Box>
              ) : testRecords.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    暂无测试记录
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    完成测试并保存后，记录将显示在这里
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {testRecords.map((record, index) => (
                    <Grid item xs={12} sm={6} md={4} key={record.id}>
                      <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ mb: 1, color: '#ff69b4' }}>
                          测试 #{testRecords.length - index}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          时间: {new Date(record.created_at).toLocaleString('zh-CN')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          完成度: {record.report_data?.completedItems || 0}/{record.report_data?.totalItems || 0}
                        </Typography>
                        <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => loadTestRecord(record.id)}
                            disabled={loading}
                            sx={{ flex: 1 }}
                          >
                            加载
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => deleteTestRecord(record.id)}
                            disabled={loading}
                          >
                            删除
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button onClick={() => setOpenHistory(false)} className="pixel-button-pink">
                关闭
              </Button>
            </DialogActions>
          </Dialog>

          {/* 用户设置对话框 */}
          <Dialog
            open={openUserSettings}
            onClose={() => setOpenUserSettings(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              borderBottom: '2px dashed #ff69b4',
              mb: 2
            }} className="pixel-title-pink">
              用户设置
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="用户昵称"
                  value={userNickname}
                  onChange={(e) => setUserNickname(e.target.value)}
                  fullWidth
                  helperText="设置一个好记的昵称，方便识别您的测试记录"
                  variant="outlined"
                />

                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    用户信息
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    用户ID: {getUserId()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    当前昵称: {getNickname()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    测试记录数: {testRecords.length}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
              <Button
                onClick={updateUserNickname}
                variant="contained"
                className="pixel-button-pink"
              >
                保存昵称
              </Button>
              <Button
                onClick={() => setOpenUserSettings(false)}
                className="pixel-button-pink"
              >
                取消
              </Button>
            </DialogActions>
          </Dialog>

          {/* 数据库诊断对话框 */}
          <Dialog
            open={openDiagnostic}
            onClose={() => setOpenDiagnostic(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              borderBottom: '2px dashed #ff69b4',
              mb: 2
            }} className="pixel-title-pink">
              数据库诊断报告
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography>正在诊断数据库...</Typography>
                </Box>
              ) : diagnosticReport ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* 诊断摘要 */}
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#ff69b4' }}>
                      诊断摘要
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">数据库连接</Typography>
                        <Typography variant="body1">{diagnosticReport.summary.connection}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">数据表</Typography>
                        <Typography variant="body1">{diagnosticReport.summary.tablesCount}/{diagnosticReport.summary.totalTables}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">错误数量</Typography>
                        <Typography variant="body1" color={diagnosticReport.summary.errorsCount > 0 ? 'error' : 'success.main'}>
                          {diagnosticReport.summary.errorsCount}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 错误详情 */}
                  {diagnosticReport.details.errors.length > 0 && (
                    <Paper elevation={1} sx={{ p: 2, bgcolor: '#ffebee' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                        发现的问题
                      </Typography>
                      {diagnosticReport.details.errors.map((error, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1, color: 'error.dark' }}>
                          • {error}
                        </Typography>
                      ))}
                    </Paper>
                  )}

                  {/* 修复建议 */}
                  <Paper elevation={1} sx={{ p: 2, bgcolor: '#e8f5e8' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                      修复建议
                    </Typography>
                    {diagnosticReport.recommendations.map((recommendation, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                        {index + 1}. {recommendation}
                      </Typography>
                    ))}
                  </Paper>

                  {/* 表状态详情 */}
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#ff69b4' }}>
                      数据表状态
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(diagnosticReport.details.tables).map(([tableName, exists]) => (
                        <Grid item xs={12} sm={4} key={tableName}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {tableName}:
                            </Typography>
                            <Chip
                              label={exists ? '存在' : '缺失'}
                              color={exists ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    点击"开始诊断"检查数据库状态
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
              {!diagnosticReport && (
                <Button
                  onClick={runDiagnostic}
                  variant="contained"
                  disabled={loading}
                  className="pixel-button-pink"
                >
                  {loading ? '诊断中...' : '开始诊断'}
                </Button>
              )}
              <Button
                onClick={() => {
                  setOpenDiagnostic(false);
                  setDiagnosticReport(null);
                }}
                className="pixel-button-pink"
              >
                关闭
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </Container>

        {/* Telegram浮动按钮 */}
        <Box
          onClick={() => window.open('https://t.me/+ZEKnJ11Xu8U1ZTll', '_blank')}
          title="点击加入M Lab交流群，寻找同好"
          sx={{
            position: 'fixed',
            bottom: { xs: 20, md: 30 },
            right: { xs: 20, md: 30 },
            width: { xs: 56, md: 64 },
            height: { xs: 56, md: 64 },
            backgroundColor: '#0088cc',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 136, 204, 0.3)',
            zIndex: 1000,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 6px 25px rgba(0, 136, 204, 0.5)',
              backgroundColor: '#0077b3'
            },
            '&:active': {
              transform: 'scale(0.95)',
              transition: 'transform 0.1s'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.2), transparent)',
              pointerEvents: 'none'
            }
          }}
        >
          <TelegramIcon
            sx={{
              color: 'white',
              fontSize: { xs: 28, md: 32 },
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}
          />

          {/* 脉冲动画环 */}
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: '50%',
              border: '2px solid #0088cc',
              opacity: 0,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                  opacity: 1
                },
                '100%': {
                  transform: 'scale(1.3)',
                  opacity: 0
                }
              }
            }}
          />
        </Box>

        <Footer pixelStyle={true} pinkStyle={true} />
      </Box>
    </ThemeProvider>
  );
}

export default LgbtApp;
