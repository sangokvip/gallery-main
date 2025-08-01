import React, { useState, useEffect, useRef } from 'react'
import { Container, Typography, Button, Box, ThemeProvider, createTheme, Paper, Grid, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import html2canvas from 'html2canvas'
import html2pdf from 'html2pdf.js'
import ShareIcon from '@mui/icons-material/Share'

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

// 数据库相关导入已移除 - 确认这是问题所在

const RATING_OPTIONS = ['SSS', 'SS', 'S', 'Q', 'N', 'W']

const CATEGORIES = {
  '🏳️‍🌈 身份认同': ['🏳️‍⚧️ 跨性别认同', '🌈 性别流动', '👥 非二元性别', '🎭 性别表达自由', '💫 性别探索', '🔄 性别转换', '👗 异装体验', '💄 化妆打扮', '👠 女性化装扮', '👔 男性化装扮', '🎨 中性化装扮', '🌟 个性化表达'],
  '💕 情感关系': ['👭 女同关系', '👬 男同关系', '💑 双性恋关系', '🌈 多元关系', '💝 浪漫关系', '🤝 柏拉图关系', '💞 深度情感连接', '🥰 亲密关系', '💌 情感表达', '🫂 情感支持', '💖 无条件接纳', '🌹 浪漫约会'],
  '🔥 性取向探索': ['👩‍❤️‍👩 女同性恋', '👨‍❤️‍👨 男同性恋', '💗 双性恋', '🌈 泛性恋', '🖤 无性恋', '💜 半性恋', '🌟 性取向流动', '🔍 性取向探索', '💫 性吸引力', '❤️ 情感吸引力', '🌸 审美吸引力', '💭 性幻想'],
  '🎭 角色扮演': ['👸 女王角色', '🤴 国王角色', '👗 女性角色', '👔 男性角色', '🎪 变装表演', '🎨 创意角色', '🦄 幻想角色', '👑 权力角色', '🐱 可爱角色', '🔥 性感角色', '🌙 神秘角色', '⭐ 明星角色'],
  '🌈 社群参与': ['🏳️‍🌈 Pride活动', '🎉 LGBT聚会', '📚 社群教育', '🤝 互助支持', '🗣️ 权益倡导', '📢 公开出柜', '👥 社群建设', '🌟 榜样作用', '💪 自我赋权', '🎯 目标实现', '🌱 个人成长', '🔗 网络连接'],
  '💖 亲密行为': ['💋 接吻', '🫂 拥抱', '👐 抚摸', '💆 按摩', '🛁 共浴', '🛏️ 同床', '💕 温柔爱抚', '🌹 浪漫前戏', '🔥 激情体验', '💫 高潮体验', '🌊 情感高潮', '💤 亲密后拥抱'],
  '🎨 创意表达': ['🎭 戏剧表演', '🎵 音乐创作', '🖼️ 艺术创作', '✍️ 文学写作', '📸 摄影艺术', '💃 舞蹈表演', '🎬 影像制作', '🎪 行为艺术', '🌈 彩虹艺术', '💎 时尚设计', '🎨 视觉艺术', '🎤 声音艺术'],
  '🌟 自我实现': ['💪 自信建立', '🌱 个人成长', '🎯 目标追求', '🏆 成就感', '🌈 真实自我', '💫 内在力量', '🔥 激情追求', '🌸 自我接纳', '💖 自我关爱', '🌟 潜能发挥', '🦋 蜕变成长', '✨ 生命绽放']
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b6b',
    },
    secondary: {
      main: '#4ecdc4',
    },
  },
})

function LgbtAppMinimal() {
  const [ratings, setRatings] = useState({})
  const [showTest, setShowTest] = useState(false)
  const [openReport, setOpenReport] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [loading, setLoading] = useState(false)
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

  // 初始化GSAP和页面动画
  useEffect(() => {
    try {
      setTimeout(() => {
        const tl = gsap.timeline({
          defaults: {
            clearProps: "all"
          }
        });

        tl.from('.lgbt-title, h1, h2, h3', {
          opacity: 0,
          y: -30,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
          clearProps: "all"
        })

          .from('.lgbt-card, .MuiPaper-root:not(.MuiAppBar-root):not(.MuiDrawer-paper)', {
            opacity: 0,
            y: 20,
            scale: 0.98,
            duration: 0.5,
            ease: "back.out(1.2)",
            stagger: 0.05,
            clearProps: "all"
          }, "-=0.3")

          .from('.lgbt-button, .MuiButton-root', {
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            ease: "back.out(1.5)",
            stagger: 0.03,
            clearProps: "all"
          }, "-=0.2")

        console.log('🎬 LGBT页面动画已初始化');
      }, 100);
      
      return () => {
        gsap.killTweensOf([
          '.lgbt-title, h1, h2, h3',
          '.lgbt-card, .MuiPaper-root:not(.MuiAppBar-root)',
          '.lgbt-button, .MuiButton-root'
        ]);
      };
    } catch (error) {
      console.warn('LGBT页面动画初始化失败:', error);
    }
  }, []);

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
        category: category.replace(/🏳️‍🌈|💕|🔥/g, '').trim(),
        value: avgScore,
        fullMark: 6
      }
    })
  }

  // 导出图片功能
  const handleExportImage = async () => {
    if (reportRef.current) {
      try {
        setLoading(true);
        
        // 创建一个新的容器元素，用于生成高质量图片
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '1400px';
        container.style.backgroundColor = '#ffffff';
        container.style.padding = '50px';
        container.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
        document.body.appendChild(container);

        // 克隆报告元素
        const clonedReport = reportRef.current.cloneNode(true);
        container.appendChild(clonedReport);

        // 确保所有图表都已渲染
        await new Promise(resolve => setTimeout(resolve, 800));

        // 生成高质量图片
        const canvas = await html2canvas(container, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1400,
          height: container.offsetHeight,
          logging: false,
        });

        // 清理临时元素
        document.body.removeChild(container);

        // 将Canvas转换为高质量Blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));

        // 检测设备类型
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isMobile) {
          try {
            // 优先尝试使用Web Share API
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
                setLoading(false);
                return;
              }
            }

            // 如果Web Share API不可用，创建可长按保存的图片预览
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            img.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              max-width: 95vw;
              max-height: 85vh;
              z-index: 10000;
              border: 4px solid #fff;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.6);
              object-fit: contain;
            `;

            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.85);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
              backdrop-filter: blur(5px);
            `;

            // 添加说明文字
            const instruction = document.createElement('div');
            instruction.style.cssText = `
              color: white;
              text-align: center;
              margin: 20px;
              font-size: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: rgba(0,0,0,0.7);
              padding: 15px 20px;
              border-radius: 8px;
              max-width: 90vw;
            `;
            
            instruction.innerHTML = isIOS ?
              '<div style="margin-bottom: 10px; font-size: 18px;">📱 保存图片到相册</div><div>长按图片选择"存储图像"或"保存到照片"</div><div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">点击空白处关闭</div>' :
              '<div style="margin-bottom: 10px; font-size: 18px;">📱 保存图片到相册</div><div>长按图片选择"保存图片"或"下载图像"</div><div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">点击空白处关闭</div>';

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

            setSnackbarMessage('高清图片已显示，长按图片保存到相册');
            setSnackbarOpen(true);
            setLoading(false);
            return;

          } catch (error) {
            console.error('移动端保存失败:', error);
          }
        }

        // 桌面端默认下载方法
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `LGBT自评报告_${new Date().toISOString().slice(0,10)}.png`;
        link.click();
        URL.revokeObjectURL(url);
        setSnackbarMessage('高清报告图片已保存！');
        setSnackbarOpen(true);
        setLoading(false);

      } catch (error) {
        console.error('导出图片错误:', error);
        setSnackbarMessage('导出图片失败，请重试');
        setSnackbarOpen(true);
        setLoading(false);
      }
    }
  }

  // 导出PDF功能
  const handleExportPDF = async () => {
    if (reportRef.current) {
      try {
        setLoading(true);
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `LGBT自评报告_${new Date().toISOString().slice(0,10)}.pdf`,
          image: { 
            type: 'jpeg', 
            quality: 0.95 
          },
          html2canvas: { 
            scale: isMobile ? 1.5 : 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
          },
          jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          }
        };

        await html2pdf().set(opt).from(reportRef.current).save();
        
        setSnackbarMessage('高质量PDF报告已保存成功！');
        setSnackbarOpen(true);
        setLoading(false);

      } catch (error) {
        console.error('导出PDF错误:', error);
        setSnackbarMessage('导出PDF失败，请重试');
        setSnackbarOpen(true);
        setLoading(false);
      }
    }
  }

  // 分享功能
  const handleShare = async () => {
    try {
      if (!navigator.share) {
        setSnackbarMessage('您的浏览器不支持分享功能')
        setSnackbarOpen(true)
        return
      }

      if (reportRef.current && navigator.canShare) {
        try {
          const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          });

          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
          const file = new File([blob], 'LGBT自评报告.png', { type: 'image/png' });
          
          const shareData = {
            title: 'LGBT+身份探索报告',
            text: '我的个性化LGBT+身份探索测评报告 🏳️‍🌈',
            files: [file]
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            setSnackbarMessage('分享成功！');
            setSnackbarOpen(true);
            return;
          }
        } catch (error) {
          console.error('分享文件失败:', error);
        }
      }

      // 如果无法分享文件，退回到基本分享
      await navigator.share({
        title: 'LGBT+身份探索报告',
        text: '我完成了LGBT+身份探索测评，快来看看我的结果吧！🏳️‍🌈',
        url: window.location.href
      });
      setSnackbarMessage('分享成功！');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('分享失败:', error);
      if (error.name === 'AbortError') {
        setSnackbarMessage('分享已取消');
      } else {
        setSnackbarMessage('分享失败，请重试');
      }
      setSnackbarOpen(true);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h3" align="center" sx={{
            fontWeight: 700,
            marginBottom: '2rem',
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            🏳️‍🌈 LGBT+身份探索测试
          </Typography>
          
          <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
            专为LGBT+群体设计的身份认同评估工具
          </Typography>

          {!showTest ? (
            <Box sx={{ textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                sx={{ mr: 2 }}
                onClick={() => setShowTest(true)}
              >
                开始测试
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                size="large"
              >
                查看说明
              </Button>
            </Box>
          ) : (
            <Box>
              {Object.entries(CATEGORIES).map(([category, items]) => (
                <Paper key={category} elevation={2} sx={{ p: 3, mb: 3, borderRadius: '15px' }}>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {category}
                  </Typography>
                  <Grid container spacing={2}>
                    {items.map((item, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5 }}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {item}
                          </Typography>
                          <Select
                            size="small"
                            value={getRating(category, item)}
                            onChange={(e) => handleRatingChange(category, item, e.target.value)}
                            displayEmpty
                            sx={{ minWidth: 70 }}
                          >
                            <MenuItem value="">-</MenuItem>
                            {RATING_OPTIONS.map(option => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ))}
              
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  size="large"
                  sx={{ mr: 2 }}
                  onClick={() => setOpenReport(true)}
                >
                  生成报告
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  size="large"
                  onClick={() => setShowTest(false)}
                >
                  返回首页
                </Button>
              </Box>
            </Box>
          )}

          {/* 报告对话框 */}
          <Dialog 
            open={openReport} 
            onClose={() => setOpenReport(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Typography variant="h4" align="center" sx={{
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                🏳️‍🌈 LGBT+身份探索报告
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box ref={reportRef}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <RadarChart
                    width={400}
                    height={300}
                    data={getRadarData()}
                    margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 6]} />
                    <Radar 
                      name="LGBT评分" 
                      dataKey="value" 
                      stroke="#ff6b6b" 
                      fill="#ff6b6b" 
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </Box>
                <Typography variant="body1" align="center">
                  这是您的LGBT+身份探索测评结果
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              justifyContent: 'center', 
              pb: 3, 
              pt: 2,
              gap: 2,
              borderTop: '1px solid rgba(0,0,0,0.1)',
              background: 'linear-gradient(45deg, rgba(255, 107, 107, 0.05), rgba(78, 205, 196, 0.05))'
            }}>
              <Button
                onClick={handleExportImage}
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff5252, #26c6da)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                保存为图片
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #45b7d1, #96ceb4)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #2196f3, #4caf50)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                保存为PDF
              </Button>
              <Button
                onClick={handleShare}
                variant="contained"
                startIcon={<ShareIcon />}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #feca57, #ff9ff3)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff9500, #e91e63)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                分享报告
              </Button>
              <Button onClick={() => setOpenReport(false)} variant="outlined">
                关闭
              </Button>
            </DialogActions>
          </Dialog>

          {/* 消息提示 */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default LgbtAppMinimal