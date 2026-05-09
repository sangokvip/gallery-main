import html2canvas from 'html2canvas'

const EXPORT_WIDTH = 1080
const EXPORT_PADDING = 32

const REPORT_EXPORT_CSS = `
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
    font-size: 30px !important;
    margin-bottom: 28px !important;
  }
  .MuiTypography-h5 {
    font-size: 22px !important;
    margin-bottom: 14px !important;
  }
  .recharts-wrapper {
    width: 560px !important;
    height: 360px !important;
    margin: 0 auto 28px !important;
  }
`

const waitForRender = async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => {})
  }

  await new Promise(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(resolve)
  }))
}

const isMobileBrowser = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const isIOSBrowser = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

const getExportScale = () => {
  const pixelRatio = window.devicePixelRatio || 1
  const mobile = isMobileBrowser()
  return mobile ? Math.min(1.5, Math.max(1.15, pixelRatio)) : Math.min(1.8, Math.max(1.25, pixelRatio))
}

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob)
    } else {
      reject(new Error('无法生成图片文件'))
    }
  }, 'image/png')
})

export const createReportImageBlob = async (reportElement) => {
  if (!reportElement) {
    throw new Error('报告内容不存在')
  }

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-12000px'
  container.style.top = '0'
  container.style.width = `${EXPORT_WIDTH}px`
  container.style.backgroundColor = '#ffffff'
  container.style.padding = `${EXPORT_PADDING}px`
  container.style.boxSizing = 'border-box'
  container.style.pointerEvents = 'none'

  const clonedReport = reportElement.cloneNode(true)
  const styleSheet = document.createElement('style')
  styleSheet.textContent = REPORT_EXPORT_CSS

  container.appendChild(styleSheet)
  container.appendChild(clonedReport)
  document.body.appendChild(container)

  try {
    await waitForRender()

    const canvas = await html2canvas(container, {
      scale: getExportScale(),
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: EXPORT_WIDTH,
      height: container.scrollHeight,
      windowWidth: EXPORT_WIDTH,
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('.recharts-wrapper').forEach(chart => {
          chart.style.margin = '0 auto'
        })
      }
    })

    return await canvasToBlob(canvas)
  } finally {
    document.body.removeChild(container)
  }
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

const showImagePreview = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.86);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    box-sizing: border-box;
  `

  const instruction = document.createElement('p')
  instruction.textContent = isIOSBrowser()
    ? '长按图片选择“存储图像”或从分享面板保存到照片。'
    : '长按图片选择“保存图片”；如浏览器不支持，可点击下载。'
  instruction.style.cssText = 'color:#fff;text-align:center;margin:0;font-size:15px;line-height:1.6;'

  const img = document.createElement('img')
  img.src = url
  img.alt = filename
  img.style.cssText = `
    max-width: 92vw;
    max-height: 76vh;
    border: 3px solid #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    background: #fff;
  `

  const actions = document.createElement('div')
  actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center;'

  const downloadButton = document.createElement('button')
  downloadButton.type = 'button'
  downloadButton.textContent = '下载图片'
  downloadButton.style.cssText = 'min-height:44px;padding:0 16px;border-radius:6px;border:0;background:#fff;color:#111;font-weight:700;'
  downloadButton.addEventListener('click', (event) => {
    event.stopPropagation()
    downloadBlob(blob, filename)
  })

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.textContent = '关闭'
  closeButton.style.cssText = 'min-height:44px;padding:0 16px;border-radius:6px;border:1px solid #fff;background:transparent;color:#fff;font-weight:700;'

  const close = () => {
    overlay.remove()
    URL.revokeObjectURL(url)
  }

  closeButton.addEventListener('click', (event) => {
    event.stopPropagation()
    close()
  })
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close()
    }
  })

  actions.append(downloadButton, closeButton)
  overlay.append(instruction, img, actions)
  document.body.appendChild(overlay)
}

export const saveReportImageBlob = async ({ blob, filename, title, text }) => {
  const mobile = isMobileBrowser()

  if (mobile && navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/png' })
    const shareData = { title, text, files: [file] }

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return {
          mode: 'share',
          message: isIOSBrowser()
            ? '已打开系统分享面板，可选择“保存到照片”。'
            : '已打开系统分享面板，可选择保存到相册或图片应用。'
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('系统分享失败，改用图片预览:', error)
        }
      }
    }
  }

  if (mobile) {
    showImagePreview(blob, filename)
    return {
      mode: 'preview',
      message: isIOSBrowser()
        ? '图片已显示，长按选择“存储图像”。'
        : '图片已显示，长按保存；不支持时可点“下载图片”。'
    }
  }

  downloadBlob(blob, filename)
  return {
    mode: 'download',
    message: '报告图片已生成并开始下载。'
  }
}
