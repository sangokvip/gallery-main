import React, { useState, useRef } from 'react'
import { Container, Typography, Paper, Grid, Box, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, AppBar, Toolbar, Drawer, List, ListItem, ListItemIcon, ListItemText, createTheme, ThemeProvider } from '@mui/material'
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
import CollectionsIcon from '@mui/icons-material/Collections'
import './styles/pixel-theme.css'

const RATING_OPTIONS = ['SSS', 'SS', 'S', 'Q', 'N', 'W']
const CATEGORIES = {
  '👑 性奴': ['🔞 强奸', '👥 轮奸', '💋 口爆', '💦 颜射', '💉 内射', '🍑 肛交', '🔧 器具折磨', '⚡️ 强制高潮', '💧 潮吹失禁', '🎭 自慰展示', '🚫 禁止高潮', '🔄 扩张阴道', '⭕️ 扩张肛门', '🔄 双阳具插入', '➕ 多阳具插入', '✌️ 双插'],
  '🐕 犬奴': ['🔒 囚笼关押', '⛓️ 项圈镣铐', '🍽️ 喂食', '🐾 爬行', '👣 舔足', '👠 踩踏', '🎠 骑乘'],
  '🎎 玩偶奴': ['🎭 角色扮演', '👔 制服诱惑', '🎭 人偶装扮', '💍 乳环', '💎 阴环', '💫 脐环', '✂️ 剃毛', '🔍 内窥镜研究', '🔧 性工具研究', '🎨 作为艺术品', '🪑 作为家具', '🚬 作为烟灰缸', '👗 作为女仆', '🤐 限制说话内容'],
  '🌲 野奴': ['🌳 野外暴露', '⛓️ 野外奴役', '🏃‍♀️ 野外流放', '🌿 野外玩弄', '🏢 公共场合暴露', '🏛️ 公共场合玩弄', '🎗️ 公开场合捆绑（衣服内）', '📱 公开场合器具（衣服内）', '👀 露阴（像朋友）', '👥 露阴（向生人）', '🔐 贞操带', '📿 公开场合项圈'],
  '🐾 兽奴': ['🐕 兽交', '🐺 群兽轮交', '🐎 人兽同交', '🦁 兽虐', '🐜 昆虫爬身'],
  '⚔️ 刑奴': ['👋 耳光', '🤐 口塞', '💇‍♀️ 扯头发', '👢 皮带', '🎯 鞭子', '🎋 藤条', '🪵 木板', '🏏 棍棒', '🖌️ 毛刷', '⚡️ 虐阴', '🔗 紧缚', '⛓️ 吊缚', '🔒 拘束', '📎 乳夹', '⚡️ 电击', '🕯️ 滴蜡', '📍 针刺', '💉 穿孔', '🔥 烙印', '🎨 刺青', '✂️ 切割', '🔥 火刑', '💧 水刑', '😮‍💨 窒息', '👊 体罚', '🧊 冰块'],
  '🚽 厕奴': ['👅 舔精', '🥛 吞精', '💧 唾液', '💦 喝尿', '🚿 尿浴', '👄 舔阴', '💦 放尿', '🚰 灌肠', '👅 舔肛', '💩 排便', '🛁 粪浴', '🍽️ 吃粪', '🤧 吃痰', '🩸 吃经血'],
  '💭 心奴': ['🗣️ 言语侮辱', '😈 人格侮辱', '🧠 思维控制', '🌐 网络控制', '📢 语言管教'],
  '✨ 其他': ['👥 多奴调教', '👑 多主调教', '🌐 网络公调', '🪶 瘙痒', '📅 长期圈养', '⏱️ 短期圈养', '😴 剥夺睡眠', '🌀 催眠', '👭 同性性爱']
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
        const imageQuality = 0.92; // 稍微降低质量以减小文件大小
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', imageQuality));
        const url = URL.createObjectURL(blob);
        const filename = '自评报告.png';

        try {
          // 移动设备优先尝试使用 Web Share API
          if (isMobile && navigator.share) {
            try {
              const file = new File([blob], filename, { type: 'image/png' });
              const shareData = { 
                files: [file],
                title: '自评报告',
                text: '分享自评报告'
              };
              
              if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                setSnackbarMessage('分享成功！可以保存到相册');
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
              // 方法1: 使用MediaStore API (如果可用)
              if ('chooseFileSystemEntries' in window || 'showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                  suggestedName: filename,
                  types: [{
                    description: 'PNG图片',
                    accept: {'image/png': ['.png']},
                  }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                setSnackbarMessage('报告已保存到手机！');
                setSnackbarOpen(true);
                URL.revokeObjectURL(url);
                return;
              }
            } catch (fsError) {
              console.warn('文件系统API失败:', fsError);
            }

            // 方法2: 使用新页面展示并提供保存指导
            const newTab = window.open();
            if (newTab) {
              newTab.document.write(`
                <html>
                  <head>
                    <title>自评报告</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body {
                        margin: 0;
                        padding: 20px;
                        font-family: system-ui;
                        background: #f5f5f5;
                        color: #333;
                      }
                      .container {
                        max-width: 600px;
                        margin: 0 auto;
                        text-align: center;
                      }
                      .instructions {
                        background: #fff;
                        padding: 15px;
                        border-radius: 10px;
                        margin-bottom: 20px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      }
                      .image-container {
                        background: #fff;
                        padding: 10px;
                        border-radius: 10px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      }
                      img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 5px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="instructions">
                        <h2>保存图片到相册</h2>
                        <p>1. 长按下方图片</p>
                        <p>2. 选择"保存图片"或"下载图片"</p>
                        <p>3. 图片将保存到您的相册</p>
                      </div>
                      <div class="image-container">
                        <img src="${url}" alt="自评报告">
                      </div>
                    </div>
                  </body>
                </html>
              `);
              newTab.document.close();
              setSnackbarMessage('请按照新页面提示保存图片');
              setSnackbarOpen(true);
              return;
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
          
          setSnackbarMessage('报告已保存！');
          setSnackbarOpen(true);
        } catch (error) {
          console.error('导出图片错误:', error);
          
          // 最后的备选方案：直接在当前页面展示图片
          const imageUrl = canvas.toDataURL('image/png', imageQuality);
          const modalContent = document.createElement('div');
          modalContent.innerHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;">
              <div style="background:white;padding:20px;border-radius:10px;max-width:90%;text-align:center;">
                <h3 style="margin-top:0;">保存图片说明</h3>
                <p>1. 长按下方图片</p>
                <p>2. 选择"保存图片"选项</p>
                <img src="${imageUrl}" style="max-width:100%;margin:10px 0;border-radius:5px;" alt="自评报告">
                <button onclick="this.parentElement.parentElement.remove()" style="margin-top:15px;padding:8px 20px;border:none;background:#007AFF;color:white;border-radius:5px;cursor:pointer;">关闭</button>
              </div>
            </div>
          `;
          document.body.appendChild(modalContent.firstChild);
          setSnackbarMessage('请按照提示保存图片');
          setSnackbarOpen(true);
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
          filename: '女M自评报告.pdf',
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
          const file = new File([blob], '女M自评报告.png', { type: 'image/png' })
          const shareData = {
            title: '女M自评报告',
            text: '查看我的女M自评报告',
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
        title: '女M自评报告',
        text: '查看我的女M自评报告'
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh'
      }}>

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
              <ScienceIcon sx={{ display: 'flex', color: '#1E3D59' }} />
              <Typography variant="h5" sx={{
                fontWeight: 'bold',
                color: '#1E3D59',
                display: 'flex',
                alignItems: 'center',
                margin: 0,
                padding: 0,
                lineHeight: 1,
                height: '100%'
              }} className="pixel-title-pink">
                M-Profile Lab
              </Typography>
            </Box>
                
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              gap: 2,
              flex: '1 1 auto',
              justifyContent: 'flex-end'
            }}>              
              <Button color="inherit" startIcon={<HomeIcon />} href="/index.html" className="pixel-button-pink" sx={{ color: '#1E3D59' }}>首页</Button>
              <Button color="inherit" startIcon={<ScienceIcon />} href="/s.html" className="pixel-button-pink" sx={{ color: '#1E3D59' }}>S版</Button>
              <Button color="inherit" startIcon={<MaleIcon />} href="/male.html" className="pixel-button-pink" sx={{ color: '#1E3D59' }}>男生版</Button>
              <Button color="inherit" startIcon={<CollectionsIcon />} href="/gallery.html" className="pixel-button-pink" sx={{ color: '#1E3D59' }}>图库</Button>
              <Button color="inherit" startIcon={<MessageIcon />} href="/message.html" className="pixel-button-pink" sx={{ color: '#1E3D59' }}>留言板</Button>
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
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            <ListItem button component="a" href="/index.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><HomeIcon sx={{ color: '#1E3D59' }} /></ListItemIcon>
              <ListItemText primary="首页" sx={{ color: '#1E3D59' }} />
            </ListItem>
            <ListItem button component="a" href="/s.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><ScienceIcon sx={{ color: '#1E3D59' }} /></ListItemIcon>
              <ListItemText primary="S版" sx={{ color: '#1E3D59' }} />
            </ListItem>
            <ListItem button component="a" href="/male.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><MaleIcon sx={{ color: '#1E3D59' }} /></ListItemIcon>
              <ListItemText primary="男生版" sx={{ color: '#1E3D59' }} />
            </ListItem>
            <ListItem button component="a" href="/gallery.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><CollectionsIcon sx={{ color: '#1E3D59' }} /></ListItemIcon>
              <ListItemText primary="图库" sx={{ color: '#1E3D59' }} />
            </ListItem>
            <ListItem button component="a" href="/message.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><MessageIcon sx={{ color: '#1E3D59' }} /></ListItemIcon>
              <ListItemText primary="留言板" sx={{ color: '#1E3D59' }} />
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
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }} className="pixel-title-pink">
            女M自评报告
          </Typography>
          <Box className="pixel-divider-pink" sx={{ mb: 4, mt: 2 }}></Box>
          <Paper elevation={1} sx={{ 
            mt: 2, 
            p: 2, 
            borderRadius: 0,
            maxWidth: { xs: '100%', md: '80%' },
            mx: 'auto'
          }} className="pixel-card-pink">
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
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AutorenewIcon />}
              sx={{
                padding: '12px 32px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                backgroundColor: '#ff69b4',
                '&:hover': {
                  backgroundColor: '#ff1493'
                }
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
            size="large"
            onClick={() => setOpenReport(true)}
            sx={{ 
              minWidth: 200,
              backgroundColor: '#ff69b4',
              '&:hover': {
                backgroundColor: '#ff1493'
              }
            }}
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
            borderBottom: '2px dashed #ff69b4',
            mb: 2
          }} className="pixel-title-pink">
            女M自评详细报告
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
              <Typography variant="h4" gutterBottom align="center" sx={{ color: '#ff69b4', mb: 3 }}>
                女M自评报告
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
                      fill: '#ff69b4',
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
                    stroke="#ff69b4" 
                    fill="#ff69b4" 
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
              sx={{
                backgroundColor: '#ff69b4',
                '&:hover': {
                  backgroundColor: '#ff1493'
                }
              }}
              className="pixel-button-pink"
            >
              保存为图片
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="contained"
              sx={{
                backgroundColor: '#ff69b4',
                '&:hover': {
                  backgroundColor: '#ff1493'
                }
              }}
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

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Container>
      
      <Footer pixelStyle={true} pinkStyle={true} />
      </Box>
    </ThemeProvider>
  );
}

export default App;