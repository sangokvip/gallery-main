import React, { useState, useRef } from 'react'
import { Container, Typography, Paper, Grid, Box, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, AppBar, Toolbar, Drawer, List, ListItem, ListItemIcon, ListItemText, createTheme, ThemeProvider } from '@mui/material'
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
import FemaleIcon from '@mui/icons-material/Female'
import Footer from './components/Footer'
import MessageIcon from '@mui/icons-material/Message'
import CollectionsIcon from '@mui/icons-material/Collections'

// 使用黑白像素风格的Footer

const MENU_ITEMS = [
  { icon: <HomeIcon />, text: '首页', href: '/index.html' },
  { icon: <ScienceIcon />, text: '评分说明', onClick: () => setOpenHelp(true) },
  { icon: <InfoIcon />, text: '关于', onClick: () => setOpenAbout(true) },
  { icon: <HelpIcon />, text: '帮助', onClick: () => setOpenGuide(true) }
]

const RATING_OPTIONS = ['SSS', 'SS', 'S', 'Q', 'N', 'W']
const CATEGORIES = {
  '👣 恋足': ['🧎 跪拜', '🦶 足交', '👃 闻脚', '👅 舔足(无味)', '👅 舔足(原味)', '🧦 舔袜(无味)', '🧦 舔袜(原味)', '🤐 袜堵嘴', '👞 舔鞋(调教用)', '👠 舔鞋(户外穿)', '🍽️ 足喂食', '💧 喝洗脚水', '💦 喝洗袜水', '👄 足深喉', '🦵 踢打', '🦶 裸足踩踏', '👠 高跟踩踏'],
  '👑 性奴': ['👅 舔阴', '👄 舔肛', '🚫 禁止射精', '🎭 自慰表演', '🔧 器具折磨', '💦 舔食自己精液', '🍑 肛门插入', '⭕️ 扩肛', '🕳️ 马眼插入', '🎠 木马', '🍆 阳具插入'],
  '🐕 狗奴': ['🐾 狗姿', '📿 项圈', '⛓️ 镣铐', '🏠 看门', '🐾 狗爬', '🦮 室内遛狗', '💦 狗撒尿', '👅 狗舔食', '🍽️ 口吐食', '💧 口水', '🥄 痰盂', '🎭 狗装', '🐶 狗叫', '👙 内裤套头', '👃 舔内裤（原味）', '🚬 烟灰缸', '🔒 狗笼关押', '⛓️ 圈禁饲养', '🎠 骑马'],
  '🎎 性玩具': ['🎭 角色扮演', '💍 乳环', '⭕️ 龟头环', '💫 肛环', '🔒 贞操锁', '🔌 肛塞', '✍️ 身上写字（可洗）', '📝 身上写字（不洗）', '👗 CD异装', '✂️ 剃光头', '🪒 剃毛', '🔧 性工具玩弄', '🪑 固定在桌椅上', '👤 坐脸', '💧 灌肠（温和液体）', '⚡️ 灌肠（刺激液体）', '📸 拍照/录像（露脸）', '📷 拍照/录像（不露脸）', '🎯 作为玩具', '🪑 作为家具', '👔 作为男仆'],
  '🐾 兽奴': ['🐕 兽交', '🐺 群兽轮交', '🦁 兽虐', '🐜 昆虫爬身'],
  '🌲 野奴': ['🌳 野外奴役', '🏃 野外流放', '🌿 野外玩弄', '👀 公共场合暴露', '🏛️ 公共场合玩弄', '⛓️ 公共场合捆绑', '🔧 公共场合器具', '🔒 贞操锁', '👥 露阳(熟人)', '👀 露阳(生人)', '🐕 野外遛狗'],
  '⚔️ 刑奴': ['👋 耳光', '🎋 藤条抽打', '🎯 鞭打', '🪵 木板拍打', '🖌️ 毛刷', '👊 拳脚', '🤐 口塞', '⛓️ 吊缚', '🔒 拘束', '🔗 捆绑', '😮‍💨 控制呼吸', '📎 乳夹', '⚖️ 乳头承重', '🔗 阴茎夹子', '📎 阴囊夹子', '⚖️ 阴茎吊重物', '⚖️ 阴囊吊重物', '🎯 鞭打阳具', '🦶 踢裆', '🪶 瘙痒', '⚡️ 电击', '🕯️ 低温滴蜡', '🔥 高温滴蜡', '📍 针刺', '💉 穿孔', '👊 体罚', '🤐 木乃伊', '💧 水刑', '🔥 火刑', '🧊 冰块', '🔥 烙印', '✂️ 身体改造', '✂️ 阉割'],
  '💭 心奴': ['🗣️ 语言侮辱', '😈 人格侮辱', '🧠 思维控制', '🌐 网络控制', '📢 网络公调'],
  '🏠 家奴': ['⏱️ 短期圈养', '📅 长期圈养', '👥 多奴调教', '👑 多主调教', '👥 熟人旁观', '👀 生人旁观', '😈 熟人侮辱', '🗣️ 生人侮辱', '😴 剥夺睡眠', '🌀 催眠', '🧹 家务', '👔 伺候'],
  '🚽 厕奴': ['🚽 伺候小便', '🚽 伺候大便', '🚿 圣水浴', '💧 喝圣水', '🍽️ 圣水食物', '🧻 舔舐厕纸', '🛁 黄金浴', '🍽️ 吃黄金', '🧹 清洁马桶', '🩸 吃红金', '💉 尿液灌肠']
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#6200ea',
      light: '#9d46ff',
      dark: '#0a00b6',
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
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
  },
  typography: {
    h3: {
      fontWeight: 700,
      marginBottom: '2rem',
      letterSpacing: '-0.5px',
      color: '#1a237e',
    },
    subtitle1: {
      color: 'text.secondary',
      marginBottom: '2.5rem',
      fontSize: '1.1rem',
    },
    h5: {
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: '#303f9f',
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

function App() {
  const [ratings, setRatings] = useState({})
  const [openReport, setOpenReport] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedBatchRating, setSelectedBatchRating] = useState('')
  const reportRef = useRef(null)

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
      case 'SSS': return '#1E3D59' // 深海蓝
      case 'SS': return '#2C5530'  // 深森绿
      case 'S': return '#37474F'   // 深蓝灰
      case 'Q': return '#455A64'   // 蓝灰
      case 'N': return '#546E7A'   // 中蓝灰
      case 'W': return '#607D8B'   // 浅蓝灰
      default: return '#90A4AE'    // 极浅蓝灰
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

  const getBarData = (category) => {
    return CATEGORIES[category].map(item => ({
      name: item,
      value: (() => {
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
      })()
    }))
  }

  const handleExportImage = async () => {
    if (reportRef.current) {
      try {
        setSnackbarMessage('正在生成图片，请稍候...');
        setSnackbarOpen(true);
        
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
        
        // 检测设备类型
        const isAndroid = /android/i.test(navigator.userAgent);
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isMobile = isAndroid || isIOS;
        
        // 准备文件数据
        const imageQuality = 0.95; // 高质量但稍微减小文件大小
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', imageQuality));
        const url = URL.createObjectURL(blob);
        const filename = '男M自评报告.png';

        try {
          // 移动设备优先尝试使用分享API
          if (isMobile && navigator.share && navigator.canShare) {
            try {
              const file = new File([blob], filename, { type: 'image/png' });
              const shareData = { files: [file] };
              
              if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                setSnackbarMessage('分享成功！');
                setSnackbarOpen(true);
                URL.revokeObjectURL(url);
                return;
              }
            } catch (shareError) {
              console.warn('分享API失败，尝试备选方案:', shareError);
            }
          }
          
          // 针对安卓设备的优化方法
          if (isAndroid) {
            try {
              // 方法1: 使用download属性
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              link.target = '_blank';
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }, 1000);
              
              setSnackbarMessage('报告已导出！请检查您的下载文件夹');
              setSnackbarOpen(true);
              return;
            } catch (androidError) {
              console.warn('安卓下载方法1失败:', androidError);
            }
            
            try {
              // 方法2: 打开新窗口展示图片
              const newTab = window.open();
              if (newTab) {
                newTab.document.write(`
                  <html>
                    <head>
                      <title>男M自评报告</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>body{margin:0;display:flex;justify-content:center;align-items:center;flex-direction:column;padding:20px;}</style>
                    </head>
                    <body>
                      <h2>长按图片保存</h2>
                      <img src="${url}" style="max-width:100%;" alt="男M自评报告">
                    </body>
                  </html>
                `);
                newTab.document.close();
                setSnackbarMessage('请在新页面长按图片保存');
                setSnackbarOpen(true);
                return;
              }
            } catch (windowError) {
              console.warn('安卓下载方法2失败:', windowError);
            }
          }
          
          // 通用下载方法
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
          
          setSnackbarMessage('报告已保存为高清图片！');
          setSnackbarOpen(true);
        } catch (downloadError) {
          console.error('下载过程出错:', downloadError);
          
          // 最后的备选方案：直接展示图片让用户手动保存
          const imageUrl = canvas.toDataURL('image/png', imageQuality);
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>男M自评报告</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>body{margin:0;padding:20px;text-align:center;}</style>
                </head>
                <body>
                  <h2>请长按或右键保存图片</h2>
                  <img src="${imageUrl}" style="max-width:100%;" alt="男M自评报告">
                </body>
              </html>
            `);
            newWindow.document.close();
            setSnackbarMessage('请在新页面保存图片');
            setSnackbarOpen(true);
          } else {
            setSnackbarMessage('无法自动下载，请尝试使用截图功能');
            setSnackbarOpen(true);
          }
        }
      } catch (error) {
        console.error('导出图片错误:', error);
        setSnackbarMessage('导出图片失败，请尝试使用截图功能');
        setSnackbarOpen(true);
      }
    }
  }

  const handleExportPDF = async () => {
    if (reportRef.current) {
      try {
        const element = reportRef.current
        const opt = {
          margin: 1,
          filename: '男M自评报告.pdf',
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
          const file = new File([blob], '男M自评报告.png', { type: 'image/png' })
          const shareData = {
            title: '男M自评报告',
            text: '查看我的男M自评报告',
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
        title: '男M自评报告',
        text: '查看我的男M自评报告'
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
    const grouped = {}
    Object.entries(CATEGORIES).forEach(([category, items]) => {
      items.forEach(item => {
        const rating = getRating(category, item)
        if (!grouped[rating]) {
          grouped[rating] = []
        }
        grouped[rating].push({ category, item })
      })
    })
    // 按照指定顺序返回结果
    const orderedRatings = {}
    const ratingOrder = ['SSS', 'SS', 'S', 'Q', 'W', 'N']
    ratingOrder.forEach(rating => {
      if (grouped[rating] && grouped[rating].length > 0) {
        orderedRatings[rating] = grouped[rating]
      }
    })
    return orderedRatings
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh'
      }}>

      <AppBar position="sticky" sx={{
        background: '#000',
        border: '2px solid #fff',
        borderStyle: 'double',
        boxShadow: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 2px)',
          opacity: 0.1,
          pointerEvents: 'none'
        }
      }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: { xs: '8px 16px', md: '8px 24px' },
            minHeight: { xs: '56px', md: '64px' },
            '& .MuiButton-root': {
              fontFamily: 'inherit',
              fontSize: '0.8rem',
              border: '2px solid #fff',
              '&:hover': {
                background: '#fff',
                color: '#000',
                transform: 'translateY(0)',
                boxShadow: 'none'
              }
            }
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
                fontFamily: 'inherit',
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                margin: 0,
                padding: 0,
                lineHeight: 1,
                height: '100%',
                fontSize: '1rem',
                letterSpacing: '0.1em',
                textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
              }}>
                M-Profile Lab
              </Typography>
            </Box>
                
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              gap: 2,
              flex: '1 1 auto',
              justifyContent: 'flex-end',
              '& .MuiButton-root': {
                border: '2px solid #fff',
                fontFamily: 'inherit',
                '&:hover': {
                  background: '#fff',
                  color: '#000'
                }
              }
            }}>              
              <Button color="inherit" startIcon={<HomeIcon />} href="/index.html">首页</Button>
              <Button color="inherit" startIcon={<ScienceIcon />} href="/s.html">S版</Button>
              <Button color="inherit" href="/female.html" startIcon={<FemaleIcon />}>女生版</Button>
              <Button color="inherit" href="/gallery.html" startIcon={<CollectionsIcon />}>图库</Button>
              <Button color="inherit" href="/message.html" startIcon={<MessageIcon />}>留言板</Button>
            </Box>

            <IconButton
              color="inherit"
              sx={{ 
                display: { xs: 'block', md: 'none' },
                border: '2px solid #fff',
                borderRadius: '4px',
                padding: '4px',
                '&:hover': {
                  background: '#fff',
                  color: '#000'
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
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            <ListItem button component="a" href="/index.html" onClick={() => setMobileMenuOpen(false)} sx={{ fontFamily: 'inherit' }}>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="首页" primaryTypographyProps={{ fontFamily: 'inherit' }} />
            </ListItem>
            <ListItem button component="a" href="/s.html" onClick={() => setMobileMenuOpen(false)} sx={{ fontFamily: 'inherit' }}>
              <ListItemIcon><ScienceIcon /></ListItemIcon>
              <ListItemText primary="S版" primaryTypographyProps={{ fontFamily: 'inherit' }} />
            </ListItem>
            <ListItem button component="a" href="/female.html" onClick={() => setMobileMenuOpen(false)} sx={{ fontFamily: 'inherit' }}>
              <ListItemIcon><FemaleIcon /></ListItemIcon>
              <ListItemText primary="女生版" primaryTypographyProps={{ fontFamily: 'inherit' }} />
            </ListItem>
            <ListItem button component="a" href="/gallery.html" onClick={() => setMobileMenuOpen(false)} sx={{ fontFamily: 'inherit' }}>
              <ListItemIcon><CollectionsIcon /></ListItemIcon>
              <ListItemText primary="图库" primaryTypographyProps={{ fontFamily: 'inherit' }} />
            </ListItem>
            <ListItem button component="a" href="/message.html" onClick={() => setMobileMenuOpen(false)} sx={{ fontFamily: 'inherit' }}>
              <ListItemIcon><MessageIcon /></ListItemIcon>
              <ListItemText primary="留言板" primaryTypographyProps={{ fontFamily: 'inherit' }} />
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
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'black' }}>
            男M自评报告
          </Typography>
          <Paper elevation={1} sx={{ 
            mt: 2, 
            p: 2, 
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            maxWidth: { xs: '100%', md: '80%' },
            mx: 'auto'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000000', textAlign: 'center' }}>
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
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AutorenewIcon />}
              sx={{ 
                fontFamily: 'inherit',
                backgroundColor: '#000000',
                '&:hover': {
                  backgroundColor: '#333333'
                },
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                '&::before': {
                  display: 'none'
                }
              }}
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
          </Box>
        </Box>
        
        {Object.entries(CATEGORIES).map(([category, items]) => (
          <Paper key={category} elevation={2} sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            backgroundColor: 'background.paper',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" sx={{ mb: 0, color: 'black' }}>
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
                      minWidth: 0
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
                          px: 2,
                          color: getRating(category, item) ? getRatingColor(getRating(category, item)) : 'inherit'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: getRating(category, item) ? `${getRatingColor(getRating(category, item))}80` : 'rgba(0, 0, 0, 0.23)',
                          transition: 'border-color 0.3s ease'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: getRating(category, item) ? getRatingColor(getRating(category, item)) : 'rgba(0, 0, 0, 0.23)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: getRating(category, item) ? getRatingColor(getRating(category, item)) : 'primary.main'
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
            size="large"
            onClick={() => setOpenReport(true)}
            sx={{ 
              minWidth: 200,
              backgroundColor: '#000000',
              '&:hover': {
                backgroundColor: '#333333'
              },
              outline: 'none',
              border: 'none',
              boxShadow: 'none',
              '&::before': {
                display: 'none'
              }
            }}
          >
            生成报告
          </Button>
          <Paper elevation={2} sx={{
            p: 3,
            borderRadius: 2,
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
            pt: { xs: 4, md: 5 },
            mt: { xs: 2, md: 3 },
            color: 'black',
            borderBottom: '2px solid #6200ea',
            mb: 2
          }}>
            男M自评详细报告
          </DialogTitle>
          <DialogContent ref={reportRef} sx={{ 
            px: 4, 
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            '@media print': {
              overflow: 'visible',
              height: 'auto'
            }
          }}>
            <Box ref={reportRef} sx={{ p: 3 }}>
              <Typography variant="h4" gutterBottom align="center" sx={{ color: '#1E3D59', mb: 3 }}>
                男M自评报告
              </Typography>

              {/* 雷达图部分 - 修改尺寸和布局 */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 3,
                maxWidth: '100%',
                height: { xs: '300px', sm: '350px' },
                '& .recharts-wrapper': {
                  maxWidth: '100%',
                  height: '100% !important'
                }
              }}>
                <RadarChart 
                  width={400} 
                  height={300} 
                  data={getRadarData()}
                  style={{
                    margin: '0 auto'
                  }}
                >
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ 
                      fill: '#1E3D59',
                      fontSize: 12
                    }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 6]} 
                    tick={{ 
                      fill: '#666666',
                      fontSize: 11
                    }}
                  />
                  <Radar 
                    name="得分" 
                    dataKey="value" 
                    stroke="#1E3D59" 
                    fill="#1E3D59" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </Box>

              {/* 添加一个简短的说明文字 */}
              <Typography 
                variant="body2" 
                align="center" 
                sx={{ 
                  mb: 4, 
                  color: 'text.secondary',
                  fontSize: '0.9rem',
                  px: 2
                }}
              >
                ↑ 上方雷达图展示了各个类别的平均得分，下方是详细的评分分类 ↓
              </Typography>

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
                border: '2px solid #1E3D59',
              borderRadius: 2,
                backgroundColor: '#ffffff'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1E3D59' }}>
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
              sx={{
                backgroundColor: '#000000',
                '&:hover': {
                  backgroundColor: '#333333'
                },
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                '&::before': {
                  display: 'none'
                }
              }}
            >
              保存为图片
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="contained"
              sx={{
                backgroundColor: '#000000',
                '&:hover': {
                  backgroundColor: '#333333'
                },
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
                '&::before': {
                  display: 'none'
                }
              }}
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
              color: 'rgba(0, 0, 0, 0.54)'
            }}
          >
            <CloseIcon />
          </IconButton>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Container>
      
      <Footer pixelStyle={true} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
