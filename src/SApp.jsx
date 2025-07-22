import React, { useState, useRef, useEffect } from 'react'
import { Container, Typography, Paper, Grid, Box, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, AppBar, Toolbar, Drawer, List, ListItem, ListItemIcon, ListItemText, createTheme, ThemeProvider, TextField, Chip } from '@mui/material'
import './styles/pixel-theme.css'
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
import FemaleIcon from '@mui/icons-material/Female'
import SaveIcon from '@mui/icons-material/Save'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import TelegramIcon from '@mui/icons-material/Telegram'
import Footer from './components/Footer'
import MessageIcon from '@mui/icons-material/Message'
import { testRecordsApi } from './utils/supabase'
import { userManager, getUserId, getNickname, setNickname, getDisplayName } from './utils/userManager'
import { runDatabaseDiagnostic } from './utils/databaseDiagnostic'

// MENU_ITEMS定义移到函数组件内部

const RATING_OPTIONS = ['SSS', 'SS', 'S', 'Q', 'N', 'W']
const CATEGORIES = {
  '👑 性主': ['🔞 强制性交', '👥 多人支配', '💋 命令口交', '💦 命令颜射', '💉 命令内射', '🍑 命令肛交', '🔧 使用器具调教', '⚡️ 引发强制高潮', '💧 引发潮吹失禁', '🎭 命令自慰展示', '🚫 禁止对方高潮', '🔄 扩张对方阴道', '⭕️ 扩张对方肛门', '🔄 双阳具调教', '➕ 多阳具调教', '✌️ 双插掌控'],
  '🐕 犬主': ['🔒 囚笼管理', '⛓️ 使用项圈镣铐', '🍽️ 喂食控制', '🐾 命令爬行', '👣 要求舔足', '👠 踩踏调教', '🎠 骑乘支配'],
  '🎎 玩偶主': ['🎭 安排角色扮演', '👔 命令制服诱惑', '🎭 要求人偶装扮', '💍 安装乳环', '💎 安装阴环', '💫 安装脐环', '✂️ 命令剃毛', '🔍 使用内窥镜研究', '🔧 实验性工具', '🎨 将对方作为艺术品', '🪑 将对方作为家具', '🚬 将对方作为烟灰缸', '👗 将对方作为女仆', '🤐 限制对方说话内容'],
  '🌲 野主': ['🌳 野外暴露调教', '⛓️ 野外奴役', '🏃‍♀️ 野外流放支配', '🌿 野外玩弄', '🏢 公共场合暴露命令', '🏛️ 公共场合调戏', '🎗️ 公开场合捆绑（衣服内）', '📱 公开场合使用器具（衣服内）', '👀 命令露阴（向朋友）', '👥 命令露阴（向生人）', '🔐 使用贞操带', '📿 公开场合佩戴项圈'],
  '🐾 兽主': ['🐕 安排兽交', '🐺 安排群兽轮交', '🐎 安排人兽同交', '🦁 支配兽虐', '🐜 命令昆虫爬身'],
  '⚔️ 刑主': ['👋 施加耳光', '🤐 使用口塞', '💇‍♀️ 扯头发', '👢 使用皮带', '🎯 使用鞭子', '🎋 使用藤条', '🪵 使用木板', '🏏 使用棍棒', '🖌️ 使用毛刷', '⚡️ 虐阴调教', '🔗 紧缚控制', '⛓️ 吊缚调教', '🔒 拘束管理', '📎 使用乳夹', '⚡️ 使用电击', '🕯️ 滴蜡调教', '📍 使用针刺', '💉 穿孔设计', '🔥 烙印标记', '🎨 刺青设计', '✂️ 切割掌控', '🔥 施行火刑', '💧 施行水刑', '😮‍💨 窒息控制', '👊 施行体罚', '🧊 使用冰块'],
  '🚽 厕主': ['👅 命令舔精', '🥛 命令吞精', '💧 吐唾液', '💦 命令喝尿', '🚿 施行尿浴', '👄 命令舔阴', '💦 放尿支配', '🚰 施行灌肠', '👅 命令舔肛', '💩 命令排便', '🛁 施行粪浴', '🍽️ 命令吃粪', '🤧 命令吃痰', '🩸 命令吃经血'],
  '💭 心主': ['🗣️ 言语羞辱', '😈 人格贬低', '🧠 思维操控', '🌐 网络支配', '📢 语言管教'],
  '✨ 其他': ['👥 调教多奴', '👑 接受多主协助', '🌐 网络公开调教', '🪶 瘙痒惩罚', '📅 长期圈养', '⏱️ 短期圈养', '😴 剥夺睡眠', '🌀 施行催眠', '👭 安排同性性爱']
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff0000',
      light: '#ff5252',
      dark: '#c50000',
    },
    secondary: {
      main: '#ff4081',
      light: '#ff79b0',
      dark: '#c60055',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#ff0000',
      secondary: '#ff5252',
    },
  },
  typography: {
    h3: {
      fontWeight: 700,
      marginBottom: '2rem',
      letterSpacing: '-0.5px',
      color: '#ff0000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    subtitle1: {
      color: 'text.secondary',
      marginBottom: '2.5rem',
      fontSize: '1.1rem',
    },
    h5: {
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: '#ff0000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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

function SApp() {
  const [ratings, setRatings] = useState({})
  const [openReport, setOpenReport] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedBatchRating, setSelectedBatchRating] = useState('')
  const [openHelp, setOpenHelp] = useState(false)
  const [openAbout, setOpenAbout] = useState(false)
  const [openGuide, setOpenGuide] = useState(false)
  const [openHistory, setOpenHistory] = useState(false)
  const [openUserSettings, setOpenUserSettings] = useState(false)
  const [userNickname, setUserNickname] = useState(getNickname())
  const [testRecords, setTestRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [openDiagnostic, setOpenDiagnostic] = useState(false)
  const [diagnosticReport, setDiagnosticReport] = useState(null)
  const [showDiagnosticButton, setShowDiagnosticButton] = useState(false)
  const reportRef = useRef(null)

  // 页面加载时初始化数据
  useEffect(() => {
    loadLatestTestRecord();
    loadTestRecords();
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
      const latestRecord = await testRecordsApi.getLatestTestRecord(userId, 's');

      if (latestRecord && latestRecord.ratings) {
        setRatings(latestRecord.ratings);
        setSnackbarMessage('已加载您的最新测试记录');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('加载最新测试记录失败:', error);
    }
  };

  // 加载用户的所有测试记录
  const loadTestRecords = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const records = await testRecordsApi.getUserTestRecords(userId);
      setTestRecords(records.filter(record => record.test_type === 's'));
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
        testType: 's',
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
  };

  // 将MENU_ITEMS移到函数组件内部，这样它可以访问组件的状态设置函数
  const MENU_ITEMS = [
    { icon: <HomeIcon />, text: '首页', href: '/index.html' },
    { icon: <ScienceIcon />, text: '评分说明', onClick: () => setOpenHelp(true) },
    { icon: <InfoIcon />, text: '关于', onClick: () => setOpenAbout(true) },
    { icon: <HelpIcon />, text: '帮助', onClick: () => setOpenGuide(true) }
  ]

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
    switch(rating) {
      case 'SSS': return '#FFD700' // 金色
      case 'SS': return '#FFA500'  // 橙金色
      case 'S': return '#32CD32'   // 青翠绿
      case 'Q': return '#228B22'   // 森林绿
      case 'N': return '#4169E1'   // 皇家蓝
      case 'W': return '#1E90FF'   // 道奇蓝
      default: return '#333333'    // 灰色
    }
  }

  const getRadarData = () => {
    return Object.entries(CATEGORIES).map(([category]) => {
      const items = CATEGORIES[category]
      const categoryScores = items.map(item => {
        const rating = getRating(category, item)
        switch(rating) {
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
              const file = new File([blob], 'S自评报告.png', { type: 'image/png' });
              const shareData = {
                title: 'S自评报告',
                text: '我的个性化测评报告',
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

        // 默认下载方法
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'S自评报告.png';
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
          filename: 'S自评报告.pdf',
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
    if (!reportRef.current) {
      setSnackbarMessage('无法生成报告，请重试')
      setSnackbarOpen(true)
      return
    }

    try {
      const reportElement = reportRef.current
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0))
      const file = new File([blob], 'S自评报告.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: 'S自评报告',
          text: '查看我的S自评报告',
          files: [file]
        }

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          setSnackbarMessage('分享成功！')
          setSnackbarOpen(true)
          return
        }
      }

      // 如果Web Share API不支持或分享失败，尝试保存文件
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'S自评报告.png'
      link.click()
      URL.revokeObjectURL(url)
      setSnackbarMessage('已保存为图片，请手动分享到微信')
      setSnackbarOpen(true)
    } catch (error) {
      console.error('分享错误:', error)
      setSnackbarMessage('分享失败，请尝试保存图片后手动分享')
      setSnackbarOpen(true)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh'
      }}>

      <AppBar position="sticky" sx={{
        background: 'linear-gradient(135deg, #ff0000 0%, #ff5252 100%)',
        boxShadow: '0 4px 0 #000000',
        borderBottom: '4px solid #000000'
      }}>

        <Container maxWidth="lg">
          <Toolbar sx={{ 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: { xs: '8px 16px', md: '8px 24px' },
            minHeight: { xs: '56px', md: '64px' }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              flex: '1 1 auto',
              justifyContent: 'flex-start',
              height: '100%'
            }}>
              <ScienceIcon sx={{ display: 'flex' }} />
              <Typography variant="h5" sx={{
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                margin: 0,
                padding: 0,
                lineHeight: 1,
                height: '100%'
              }}>
                M-Profile Lab
              </Typography>
            </Box>
                
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              flex: '1 1 auto',
              justifyContent: 'flex-end',
              '& .MuiButton-root': {
                fontSize: '0.7rem',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }
            }}>
              <Button color="inherit" startIcon={<HomeIcon />} href="/index.html">首页</Button>
              <Button color="inherit" startIcon={<MaleIcon />} href="/male.html">男版</Button>
              <Button color="inherit" startIcon={<FemaleIcon />} href="/female.html">女版</Button>
              <Button color="inherit" startIcon={<MessageIcon />} href="/message.html">留言</Button>
              <Button
                color="inherit"
                startIcon={<PersonIcon />}
                onClick={() => setOpenUserSettings(true)}
                sx={{
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getNickname().length > 6 ? getNickname().substring(0, 6) + '...' : getNickname()}
              </Button>
            </Box>

            <IconButton
              color="inherit"
              sx={{ display: { xs: 'block', md: 'none' } }}
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
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            <ListItem button component="a" href="/index.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><HomeIcon sx={{ color: '#ff0000' }} /></ListItemIcon>
              <ListItemText primary="首页" sx={{ color: '#ff0000' }} />
            </ListItem>
            <ListItem button component="a" href="/male.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><MaleIcon sx={{ color: '#ff0000' }} /></ListItemIcon>
              <ListItemText primary="男生版" sx={{ color: '#ff0000' }} />
            </ListItem>
            <ListItem button component="a" href="/female.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><FemaleIcon sx={{ color: '#ff0000' }} /></ListItemIcon>
              <ListItemText primary="女生版" sx={{ color: '#ff0000' }} />
            </ListItem>
            <ListItem button component="a" href="/message.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><MessageIcon sx={{ color: '#ff0000' }} /></ListItemIcon>
              <ListItemText primary="留言板" sx={{ color: '#ff0000' }} />
            </ListItem>
            <ListItem button onClick={() => { setOpenUserSettings(true); setMobileMenuOpen(false); }}>
              <ListItemIcon><PersonIcon sx={{ color: '#ff0000' }} /></ListItemIcon>
              <ListItemText primary="用户设置" sx={{ color: '#ff0000' }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Container maxWidth="lg" className="pixel-theme-red" sx={{
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
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onDoubleClick={handleTitleDoubleClick}
            title="m-profile.top"
          >
            How 'S' I Could Be?
          </Typography>

        </Box>

        <Paper elevation={3} className="pixel-card-red rating-guide-sticky" sx={{ p: { xs: 2, md: 3 }, borderRadius: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main', textAlign: 'center' }}>
            评分等级说明
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1, md: 2 } }}>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: getRatingColor('SSS') }}>SSS</Box> = 极度喜欢
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: getRatingColor('SS') }}>SS</Box> = 喜欢
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: getRatingColor('S') }}>S</Box> = 接受
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: getRatingColor('Q') }}>Q</Box> = 好奇可以尝试
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: getRatingColor('N') }}>N</Box> = 拒绝
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: getRatingColor('W') }}>W</Box> = 未知
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ mt: 2, mb: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
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
              className="pixel-button-red"
              onClick={saveTestRecord}
              sx={{ minWidth: 150 }}
            >
              {loading ? '保存中...' : '保存测试'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<HistoryIcon />}
              onClick={() => setOpenHistory(true)}
              className="pixel-button-red"
              sx={{ minWidth: 150 }}
            >
              查看记录
            </Button>

            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => {
                const newRatings = { ...ratings }
                Object.entries(CATEGORIES).forEach(([category, items]) => {
                  items.forEach(item => {
                    const randomIndex = Math.floor(Math.random() * RATING_OPTIONS.length)
                    newRatings[`${category}-${item}`] = RATING_OPTIONS[randomIndex]
                  })
                })
                setRatings(newRatings)
                setSnackbarMessage('已完成随机选择！')
                setSnackbarOpen(true)
              }}
              className="pixel-button-red"
              startIcon={<AutorenewIcon />}
              sx={{ minWidth: 150 }}
            >
              随机选择
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<CloseIcon />}
              color="error"
              className="pixel-button-red"
              onClick={clearCurrentTest}
              sx={{ minWidth: 150 }}
            >
              清空测试
            </Button>

            {showDiagnosticButton && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<InfoIcon />}
                color="info"
                className="pixel-button-red"
                onClick={runDiagnostic}
                disabled={loading}
                sx={{ minWidth: 150 }}
              >
                数据库诊断
              </Button>
            )}
          </Box>
        </Box>
        
        {Object.entries(CATEGORIES).map(([category, items]) => (
          <Paper key={category} elevation={2} className="pixel-card-red" sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 0,
            backgroundColor: 'background.paper',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 0 rgba(255, 0, 0, 0.5)'
            }
          }}>
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
                className="pixel-select-red"
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
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: getRating(category, item) ?
                          `${getRatingColor(getRating(category, item))}` :
                          'text.primary',
                        fontSize: { xs: '0.85rem', md: '1rem' },
                        transition: 'color 0.3s ease',
                        width: '100%',
                        // 移动端跑马灯效果
                        '@media (max-width: 768px)': {
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          animation: item.length > 8 ? 'marquee-mobile 6s linear infinite' : 'none',
                          '&:hover': {
                            animationPlayState: 'paused'
                          }
                        },
                        // 桌面端省略号
                        '@media (min-width: 769px)': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }
                      }}
                    >
                      {item}
                    </Typography>
                    </Box>
                    <Select
                      size="small"
                      value={getRating(category, item)}
                      onChange={(e) => handleRatingChange(category, item, e.target.value)}
                      className="pixel-select-red"
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
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%', mb: 2 }}>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleGenerateReport}
              className="pixel-button-red"
              sx={{ minWidth: 150 }}
            >
              生成报告
            </Button>
          </Box>
          <Paper elevation={2} className="pixel-card-red" sx={{
            p: 3,
            borderRadius: 0,
            textAlign: 'center',
            maxWidth: 300,
            mx: 'auto',
            backgroundColor: 'white'
          }}>
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

      <Footer pixelStyle={true} redStyle={true} />
      </Box>

      {/* 报告对话框 */}
      <Dialog
        open={openReport}
        onClose={() => setOpenReport(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: { xs: '95vh', md: 'auto' },
            maxHeight: { xs: '95vh', md: '90vh' },
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
          color: 'primary.main',
          borderBottom: '2px solid #ff0000',
          mb: 1
        }}>
          S自评详细报告
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
            <Typography variant="h4" gutterBottom align="center" sx={{ color: 'red', mb: { xs: 2, md: 3 } }}>
              S型人格测试报告
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
                <Radar name="得分" dataKey="value" stroke="#ff0000" fill="#ff0000" fillOpacity={0.6} />
              </RadarChart>
            </Box>

            {/* 用户提示信息 - 紧跟雷达图 */}
            <Box sx={{
              mb: { xs: 2, md: 3 },
              textAlign: 'center',
              p: { xs: 1.5, md: 2 },
              backgroundColor: 'rgba(255, 0, 0, 0.15)',
              borderRadius: 2,
              border: '2px solid rgba(255, 0, 0, 0.4)',
              mx: { xs: 1, md: 0 },
              boxShadow: '0 2px 8px rgba(255, 0, 0, 0.2)'
            }}>
              <Typography variant="body1" sx={{
                color: '#ff0000',
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
                  borderTop: '12px solid #ff0000'
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
                background: 'linear-gradient(90deg, transparent, #ff0000, transparent)',
                mb: 2
              }} />
              <Typography variant="h6" sx={{
                color: '#ff0000',
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
                    {items.map(({category, item}, index) => (
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
              border: '2px solid #ff0000',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#ff0000' }}>
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
          p: 3,
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Button 
            onClick={handleExportImage} 
            variant="contained" 
            color="primary"
            className="pixel-button-red"
          >
            保存为图片
          </Button>
          <Button 
            onClick={handleExportPDF} 
            variant="contained" 
            color="secondary"
            className="pixel-button-red"
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
            color: '#ff0000'
          }}
          className="pixel-button-red"
        >
          <CloseIcon />
        </IconButton>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* 帮助对话框 */}
      <Dialog open={openHelp} onClose={() => setOpenHelp(false)} maxWidth="sm" fullWidth>
        <DialogTitle>评分说明</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            本测试旨在帮助您了解自己的S型人格特质。请根据您对各项活动的接受程度进行评分：
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>评分</TableCell>
                  <TableCell>含义</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ bgcolor: getRatingColor('SSS'), color: '#fff', fontWeight: 'bold' }}>SSS</TableCell>
                  <TableCell>极度喜欢，主动寻求</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ bgcolor: getRatingColor('SS'), color: '#fff', fontWeight: 'bold' }}>SS</TableCell>
                  <TableCell>非常喜欢，乐于尝试</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ bgcolor: getRatingColor('S'), color: '#fff', fontWeight: 'bold' }}>S</TableCell>
                  <TableCell>喜欢，愿意尝试</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ bgcolor: getRatingColor('Q'), color: '#000', fontWeight: 'bold' }}>Q</TableCell>
                  <TableCell>好奇，可以接受</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ bgcolor: getRatingColor('N'), color: '#000', fontWeight: 'bold' }}>N</TableCell>
                  <TableCell>不喜欢，但可以接受</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ bgcolor: getRatingColor('W'), color: '#000', fontWeight: 'bold' }}>W</TableCell>
                  <TableCell>抵触，坚决拒绝</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHelp(false)} color="primary">关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 关于对话框 */}
      <Dialog open={openAbout} onClose={() => setOpenAbout(false)} maxWidth="sm" fullWidth>
        <DialogTitle>关于</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            M-Profile Lab是一个专注于人格特质研究的实验室，我们致力于帮助人们更好地了解自己的性格特点和偏好。
          </Typography>
          <Typography variant="body1" paragraph>
            本测试工具仅供娱乐和自我探索使用，不构成任何专业的心理评估或医学建议。
          </Typography>
          <Typography variant="body1" paragraph>
            版本：1.0.0
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAbout(false)} color="primary">关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 使用指南对话框 */}
      <Dialog open={openGuide} onClose={() => setOpenGuide(false)} maxWidth="sm" fullWidth>
        <DialogTitle>使用指南</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            1. 浏览各个类别下的选项，根据您的真实感受为每个选项选择一个评分。
          </Typography>
          <Typography variant="body1" paragraph>
            2. 您可以使用每个类别旁边的"一键选择"功能，快速为整个类别设置相同的评分。
          </Typography>
          <Typography variant="body1" paragraph>
            3. 完成评分后，点击"生成报告"按钮查看您的S型人格分析报告。
          </Typography>
          <Typography variant="body1" paragraph>
            4. 在报告页面，您可以将报告保存为图片或PDF格式，也可以直接分享给朋友。
          </Typography>
          <Typography variant="body1" paragraph>
            5. 所有数据仅保存在您的浏览器中，刷新页面后数据将被清除。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGuide(false)} color="primary">关闭</Button>
        </DialogActions>
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
          borderBottom: '2px dashed #ff0000',
          mb: 2
        }}>
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
                    <Typography variant="h6" sx={{ mb: 1, color: '#ff0000' }}>
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
          <Button onClick={() => setOpenHistory(false)}>
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
          borderBottom: '2px dashed #ff0000',
          mb: 2
        }}>
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
          >
            保存昵称
          </Button>
          <Button
            onClick={() => setOpenUserSettings(false)}
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
          borderBottom: '2px dashed #ff0000',
          mb: 2
        }}>
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
                <Typography variant="h6" sx={{ mb: 2, color: '#ff0000' }}>
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
            >
              {loading ? '诊断中...' : '开始诊断'}
            </Button>
          )}
          <Button
            onClick={() => {
              setOpenDiagnostic(false);
              setDiagnosticReport(null);
            }}
          >
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default SApp;