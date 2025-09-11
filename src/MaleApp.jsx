import React, { useState, useRef, useEffect } from 'react'
import { Container, Typography, Paper, Grid, Box, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, AppBar, Toolbar, Drawer, List, ListItem, ListItemIcon, ListItemText, createTheme, ThemeProvider, TextField, Chip, Popper, Fade, LinearProgress, CircularProgress } from '@mui/material'
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
import FavoriteIcon from '@mui/icons-material/Favorite'
import SaveIcon from '@mui/icons-material/Save'
import HistoryIcon from '@mui/icons-material/History'
import PersonIcon from '@mui/icons-material/Person'
import TelegramIcon from '@mui/icons-material/Telegram'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Footer from './components/Footer'
import MessageIcon from '@mui/icons-material/Message'
import { testRecordsApi, testNumberingApi } from './utils/supabase'
import { userManager, getUserId, getNickname, setNickname, getDisplayName } from './utils/userManager'
import { runDatabaseDiagnostic } from './utils/databaseDiagnostic'

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
  '💭 心奴': ['🗣️ 语言侮辱', '🗣️ 语言侮辱', '😈 人格侮辱', '🧠 思维控制', '🌐 网络控制', '📢 网络公调'],
  '🏠 家奴': ['⏱️ 短期圈养', '📅 长期圈养', '👥 多奴调教', '👑 多主调教', '👥 熟人旁观', '👀 生人旁观', '😈 熟人侮辱', '🗣️ 生人侮辱', '😴 剥夺睡眠', '🌀 催眠', '🧹 家务', '👔 伺候'],
  '🚽 厕奴': ['🚽 伺候小便', '🚽 伺候大便', '🚿 圣水浴', '💧 喝圣水', '🍽️ 圣水食物', '🧻 舔舐厕纸', '🛁 黄金浴', '🍽️ 吃黄金', '🧹 清洁马桶', '🩸 吃红金', '💉 尿液灌肠']
}

// 测试项目解释映射
const ITEM_EXPLANATIONS = {
  '👣 恋足': '与脚部相关的性偏好或行为，强调对脚的喜爱或崇拜。',
  '🧎 跪拜': '跪在对方脚前，表达顺从或崇拜。',
  '🦶 足交': '使用脚部刺激伴侣的性器官。',
  '👃 闻脚': '嗅闻脚部的气味，通常与感官刺激相关。',
  '👅 舔足(无味)': '舔舐清洁的脚部，注重触觉体验。',
  '👅 舔足(原味)': '舔舐未清洗的脚部，强调自然气味。',
  '🧦 舔袜(无味)': '舔舐清洁的袜子，注重袜子的质感。',
  '🧦 舔袜(原味)': '舔舐未清洗的袜子，强调气味和顺从。',
  '🤐 袜堵嘴': '将袜子放入嘴中，通常作为顺从或控制的一部分。',
  '👞 舔鞋(调教用)': '舔舐专门用于调教的鞋子，象征服从。',
  '👠 舔鞋(户外穿)': '舔舐户外穿过的鞋子，可能涉及气味或污垢。',
  '🍽️ 足喂食': '用脚将食物喂给对方，强调支配与顺从。',
  '💧 喝洗脚水': '饮用清洗脚部后的水，象征极端的顺从。',
  '💦 喝洗袜水': '饮用清洗袜子后的水，类似洗脚水。',
  '👄 足深喉': '将脚趾深入嘴部，可能涉及控制或挑战。',
  '🦵 踢打': '用脚轻踢或击打身体，作为支配行为。',
  '🦶 裸足踩踏': '用裸足踩踏身体，可能涉及轻微疼痛或压力。',
  '👠 高跟踩踏': '用高跟鞋踩踏，强调疼痛或支配感。',
  '👑 性奴': '以性为主导的支配与顺从关系，强调性行为的控制与服务。',
  '👅 舔阴': '口交女性生殖器，通常作为顺从行为。',
  '👄 舔肛': '口交肛门区域，强调顺从和亲密。',
  '🚫 禁止射精': '限制或延迟射精，增强控制感。',
  '🎭 自慰表演': '在支配者面前自慰，强调暴露和服从。',
  '🔧 器具折磨': '使用性工具（如振动器）进行刺激或控制。',
  '💦 舔食自己精液': '在射精后舔食自己的精液，象征顺从。',
  '🍑 肛门插入': '使用手指、玩具等插入肛门。',
  '⭕️ 扩肛': '使用工具逐渐扩大肛门，需谨慎操作。',
  '🕳️ 马眼插入': '插入尿道（马眼），需专业知识和卫生保障。',
  '🎠 木马': '骑在类似木马的装置上，可能涉及束缚或刺激。',
  '🍆 阳具插入': '使用仿真阳具或其他物体插入，强调支配。',
  '🐕 狗奴': '模仿狗的行为或角色，强调动物化的顺从和控制。',
  '🐾 狗姿': '模仿狗的姿势，如四肢着地。',
  '📿 项圈': '佩戴项圈，象征被支配或"被拥有"。',
  '⛓️ 镣铐': '使用手铐或脚镣限制行动。',
  '🏠 看门': '扮演看门犬的角色，象征忠诚。',
  '🐾 狗爬': '以狗的姿势爬行，强调顺从。',
  '🦮 室内遛狗': '在室内被牵着"遛"，通常用项圈和绳子。',
  '💦 狗撒尿': '模仿狗的排尿姿势，可能涉及羞辱。',
  '👅 狗舔食': '用嘴直接从地面或碗中吃食物。',
  '🍽️ 口吐食': '支配者将食物吐出，顺从者食用。',
  '💧 口水': '接受或舔舐支配者的口水。',
  '🥄 痰盂': '作为"痰盂"接受唾液，强调极端的顺从。',
  '🎭 狗装': '穿上狗的服装或道具，扮演狗的角色。',
  '🐶 狗叫': '模仿狗的叫声，增强角色扮演。',
  '👙 内裤套头': '将内裤套在头上，强调羞辱。',
  '👃 舔内裤（原味）': '舔舐未清洗的内裤，注重气味。',
  '🚬 烟灰缸': '作为"烟灰缸"接受烟灰，象征顺从。',
  '🔒 狗笼关押': '被关在笼子里，模仿狗的圈养。',
  '⛓️ 圈禁饲养': '长期被限制在特定区域，扮演宠物。',
  '🎠 骑马': '支配者骑在顺从者身上，模仿马或狗。',
  '🎎 性玩具': '将被支配者视为性工具或玩物，强调物化和控制。',
  '🎭 角色扮演': '扮演特定角色（如护士、学生）以增加情趣。',
  '💍 乳环': '在乳头上佩戴装饰性或功能性环。',
  '⭕️ 龟头环': '在阴茎头部佩戴环，限制或增强刺激。',
  '💫 肛环': '在肛门处佩戴环，可能用于装饰或控制。',
  '🔒 贞操锁': '佩戴装置限制性行为，强调控制。',
  '🔌 肛塞': '插入肛门的小型装置，可能长期佩戴。',
  '✍️ 身上写字（可洗）': '在身体上写字，可洗掉，象征标记。',
  '📝 身上写字（不洗）': '使用持久性颜料写字，强调永久感。',
  '👗 CD异装': '跨性别装扮，通常为男性穿女性服装。',
  '✂️ 剃光头': '剃掉头部头发，象征顺从或改造。',
  '🪒 剃毛': '剃除身体其他部位的毛发，如阴毛。',
  '🔧 性工具玩弄': '使用性玩具进行刺激或控制。',
  '🪑 固定在桌椅上': '将身体固定在家具上，限制行动。',
  '👤 坐脸': '支配者坐在顺从者脸上，可能涉及口交或窒息感。',
  '💧 灌肠（温和液体）': '使用温和液体（如温水）进行肛门灌洗。',
  '⚡️ 灌肠（刺激液体）': '使用刺激性液体灌洗，需谨慎。',
  '📸 拍照/录像（露脸）': '记录场景，包含面部，需明确同意。',
  '📷 拍照/录像（不露脸）': '记录场景但不显示面部。',
  '🎯 作为玩具': '被用作性玩具，强调物化。',
  '🪑 作为家具': '被用作椅子或桌子等，象征物化。',
  '👔 作为男仆': '扮演仆人角色，服务支配者。',
  '🐾 兽奴': '模仿动物或与动物相关的极端角色扮演，可能涉及高风险行为。',
  '🐕 兽交': '模拟与动物的性行为，需注意法律和伦理。',
  '🐺 群兽轮交': '模拟多个动物的性行为，需谨慎。',
  '🦁 兽虐': '模拟动物化的虐待场景，需明确界限。',
  '🐜 昆虫爬身': '让昆虫在身上爬行，强调感官刺激。',
  '🌲 野奴': '在户外或公共场合进行的支配与顺从行为，强调暴露或冒险。',
  '🌳 野外奴役': '在户外环境中进行束缚或控制。',
  '🏃 野外流放': '在野外暂时"放逐"，可能涉及孤独感。',
  '🌿 野外玩弄': '在户外使用工具或行为进行调教。',
  '👀 公共场合暴露': '在公共场所暴露身体，需注意法律。',
  '🏛️ 公共场合玩弄': '在公共场所进行性行为或调教。',
  '⛓️ 公共场合捆绑': '在公共场所使用绳索等捆绑。',
  '🔧 公共场合器具': '在公共场所使用性工具。',
  '🔒 贞操锁': '在户外佩戴贞操装置，强调控制。',
  '👥 露阳(熟人)': '在熟人面前暴露阴茎，需谨慎。',
  '👀 露阳(生人)': '在陌生人面前暴露阴茎，需注意法律。',
  '🐕 野外遛狗': '在户外以狗奴形式被牵引。',
  '⚔️ 刑奴': '涉及身体惩罚或疼痛的支配行为，需高度注意安全和同意。',
  '👋 耳光': '轻拍或重击面部，需控制力度。',
  '🎋 藤条抽打': '使用藤条鞭打身体，需注意安全。',
  '🎯 鞭打': '使用鞭子抽打，可能造成疼痛。',
  '🪵 木板拍打': '用木板击打身体，需谨慎。',
  '🖌️ 毛刷': '用毛刷刺激皮肤，可能涉及瘙痒或轻微疼痛。',
  '👊 拳脚': '使用拳头或脚击打，需严格控制。',
  '🤐 口塞': '将物体塞入嘴中，限制言语。',
  '⛓️ 吊缚': '将身体悬吊，需专业绳艺知识。',
  '🔒 拘束': '使用器具限制身体移动。',
  '🔗 捆绑': '使用绳索或其他工具捆绑身体。',
  '😮‍💨 控制呼吸': '限制呼吸，需极度小心避免危险。',
  '📎 乳夹': '在乳头上使用夹子，造成轻微疼痛。',
  '⚖️ 乳头承重': '在乳夹上附加重物，增加刺激。',
  '🔗 阴茎夹子': '在阴茎上使用夹子，需谨慎。',
  '📎 阴囊夹子': '在阴囊上使用夹子，需注意安全。',
  '⚖️ 阴茎吊重物': '在阴茎上悬挂重物，需专业操作。',
  '⚖️ 阴囊吊重物': '在阴囊上悬挂重物，高风险。',
  '🎯 鞭打阳具': '鞭打阴茎，需严格控制力度。',
  '🦶 踢裆': '踢击阴部，需极度小心。',
  '🪶 瘙痒': '用羽毛等引起瘙痒感，强调感官刺激。',
  '⚡️ 电击': '使用低压电击设备，需专业设备和知识。',
  '🕯️ 低温滴蜡': '使用低温蜡烛滴蜡，需确保安全。',
  '🔥 高温滴蜡': '使用高温蜡烛，需极度小心。',
  '📍 针刺': '使用针刺皮肤，高风险，需专业操作。',
  '💉 穿孔': '在身体上进行穿孔，需专业环境。',
  '👊 体罚': '其他形式的身体惩罚，需明确界限。',
  '🤐 木乃伊': '用绷带或胶带包裹全身，限制行动。',
  '💧 水刑': '使用水制造窒息感，极高风险。',
  '🔥 火刑': '模拟火刑，需确保安全。',
  '🧊 冰块': '用冰块刺激皮肤，造成冷感。',
  '🔥 烙印': '在皮肤上烙印，需专业操作。',
  '✂️ 身体改造': '永久性改变身体外观，需谨慎。',
  '✂️ 阉割': '移除生殖器官，极高风险，需法律和伦理考虑。',
  '💭 心奴': '通过心理控制或羞辱实现支配，强调精神层面的顺从。',
  '🗣️ 语言侮辱': '使用羞辱性语言贬低对方。',
  '😈 人格侮辱': '攻击对方的人格，需明确同意。',
  '🧠 思维控制': '通过心理手段控制对方思想或行为。',
  '🌐 网络控制': '通过网络监控或指令控制对方。',
  '📢 网络公调': '在网络上公开调教，需注意隐私。',
  '🏠 家奴': '在家庭或私人环境中进行的长期支配与服务。',
  '⏱️ 短期圈养': '短时间限制在特定空间，扮演奴役角色。',
  '📅 长期圈养': '长时间被支配者控制生活。',
  '👥 多奴调教': '同时调教多个顺从者。',
  '👑 多主调教': '多个支配者共同调教一人。',
  '👥 熟人旁观': '熟人观看调教过程，需同意。',
  '👀 生人旁观': '陌生人观看调教，需注意隐私。',
  '😈 熟人侮辱': '熟人参与羞辱，需明确界限。',
  '🗣️ 生人侮辱': '陌生人参与羞辱，需谨慎。',
  '😴 剥夺睡眠': '限制睡眠时间，需注意健康。',
  '🌀 催眠': '使用催眠技术影响心理，需专业操作。',
  '🧹 家务': '承担家务劳动，扮演仆人角色。',
  '👔 伺候': '为支配者提供日常生活服务。',
  '🚽 厕奴': '涉及排泄物或卫生相关的极端顺从行为，需高度注意卫生和同意。',
  '🚽 伺候小便': '协助或接受对方的小便，需卫生保障。',
  '🚽 伺候大便': '协助或接受对方的大便，高风险。',
  '🚿 圣水浴': '被小便淋身，需明确同意。',
  '💧 喝圣水': '饮用小便，需严格卫生控制。',
  '🍽️ 圣水食物': '将小便混入食物，需注意健康。',
  '🧻 舔舐厕纸': '舔舐使用过的厕纸，需卫生保障。',
  '🛁 黄金浴': '被大便接触，需极高卫生标准。',
  '🍽️ 吃黄金': '食用大便，极高风险，需法律和健康考虑。',
  '🧹 清洁马桶': '用嘴或手清洁马桶，需注意卫生。',
  '🩸 吃红金': '涉及经血的食用，高风险。',
  '💉 尿液灌肠': '用尿液进行灌肠，需专业操作。'
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
  const [openHistory, setOpenHistory] = useState(false)
  const [openUserSettings, setOpenUserSettings] = useState(false)
  const [userNickname, setUserNickname] = useState(getNickname())
  const [testRecords, setTestRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [openDiagnostic, setOpenDiagnostic] = useState(false)
  const [diagnosticReport, setDiagnosticReport] = useState(null)
  const [showDiagnosticButton, setShowDiagnosticButton] = useState(false)
  const [showStickyGuide, setShowStickyGuide] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState({})
  const [tooltipTimeouts, setTooltipTimeouts] = useState({})
  const [userCount, setUserCount] = useState(0)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportProgress, setReportProgress] = useState(0)
  const reportRef = useRef(null)
  const originalGuideRef = useRef(null)

  // 页面加载时初始化数据
  useEffect(() => {
    loadLatestTestRecord();
    loadTestRecords();
    loadUserCount();
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

  // 获取用户总数（新的编号系统）
  const loadUserCount = async () => {
    try {
      const counterData = await testNumberingApi.getCurrentNumber('male');
      setUserCount(counterData.current);
    } catch (error) {
      console.error('获取用户计数失败:', error);
      // 使用起始编号作为备选
      setUserCount(1560);
    }
  };

  // 加载最新的测试记录
  const loadLatestTestRecord = async () => {
    try {
      const userId = getUserId();
      const latestRecord = await testRecordsApi.getLatestTestRecord(userId, 'male');

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
      setTestRecords(records.filter(record => record.test_type === 'male'));
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
        testType: 'male',
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

  // 处理提示显示
  const handleTooltipClick = (itemKey) => {
    // 清除之前的定时器
    if (tooltipTimeouts[itemKey]) {
      clearTimeout(tooltipTimeouts[itemKey]);
    }

    // 显示提示
    setTooltipOpen(prev => ({ ...prev, [itemKey]: true }));

    // 设置3秒后自动关闭
    const timeoutId = setTimeout(() => {
      setTooltipOpen(prev => ({ ...prev, [itemKey]: false }));
    }, 3000);

    setTooltipTimeouts(prev => ({ ...prev, [itemKey]: timeoutId }));
  };

  // 手动关闭提示
  const handleTooltipClose = (itemKey) => {
    if (tooltipTimeouts[itemKey]) {
      clearTimeout(tooltipTimeouts[itemKey]);
    }
    setTooltipOpen(prev => ({ ...prev, [itemKey]: false }));
  };

  // 鼠标悬停显示提示（桌面端）
  const handleTooltipMouseEnter = (itemKey) => {
    if (window.innerWidth >= 768) { // 只在桌面端启用
      setTooltipOpen(prev => ({ ...prev, [itemKey]: true }));
    }
  };

  // 鼠标离开隐藏提示（桌面端）
  const handleTooltipMouseLeave = (itemKey) => {
    if (window.innerWidth >= 768) { // 只在桌面端启用
      setTooltipOpen(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  // 模拟报告生成进度
  const simulateReportProgress = () => {
    return new Promise((resolve) => {
      setReportProgress(0);
      const interval = setInterval(() => {
        setReportProgress(prev => {
          const newProgress = prev + Math.random() * 15 + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => resolve(), 300);
            return 100;
          }
          return newProgress;
        });
      }, 200);
    });
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
    
    // 获取新的编号
    try {
      const newNumber = await testNumberingApi.getNextNumber('male');
      setUserCount(newNumber);
    } catch (error) {
      console.error('获取新编号失败:', error);
      // 使用当前编号+1作为备选
      setUserCount(prev => prev + 1);
    }
    
    // 显示进度条和等待信息
    setGeneratingReport(true);
    setReportProgress(0);
    
    // 模拟报告生成过程
    await simulateReportProgress();
    
    setGeneratingReport(false);
    setOpenReport(true);
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
    // 亮蓝色到灰色渐变方案 - 男性风格
    switch(rating) {
      case 'SSS': return '#2196F3' // 亮蓝色 - 最高级别
      case 'SS': return '#42A5F5'  // 中亮蓝色 - 高级别
      case 'S': return '#64B5F6'   // 浅蓝色 - 中高级别
      case 'Q': return '#90A4AE'   // 蓝灰色 - 中等级别
      case 'N': return '#78909C'   // 深蓝灰色 - 低级别
      case 'W': return '#607D8B'   // 灰色 - 最低级别
      default: return '#BDBDBD'    // 浅灰色 - 未选择
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
              const file = new File([blob], 'M自评报告.png', { type: 'image/png' });
              const shareData = {
                title: '男M自评报告',
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

        // 桌面端默认下载方法
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'M自评报告.png';
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

      {/* 动态置顶评分说明 */}
      {showStickyGuide && (
        <Paper elevation={2} sx={{
          position: 'fixed',
          top: { xs: '56px', md: '64px' },
          left: 0,
          right: 0,
          zIndex: 1000,
          p: 1.5,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 0,
          borderBottom: '2px solid #2196F3',
          animation: 'slideDown 0.3s ease-out',
          '@keyframes slideDown': {
            from: { transform: 'translateY(-100%)', opacity: 0 },
            to: { transform: 'translateY(0)', opacity: 1 }
          }
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000000', textAlign: 'center', fontSize: '0.8rem' }}>
            评分等级说明
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 0.5, md: 1 } }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: '#2196F3' }}>SSS</Box>=非常喜欢
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: '#42A5F5' }}>SS</Box>=喜欢
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: '#64B5F6' }}>S</Box>=接受
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: '#90A4AE' }}>Q</Box>=不喜欢但会做
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: '#78909C' }}>N</Box>=拒绝
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              <Box component="span" sx={{ fontWeight: 'bold', color: '#607D8B' }}>W</Box>=未知
            </Typography>
          </Box>
        </Paper>
      )}

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
                fontFamily: '"Press Start 2P", cursive',
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
              gap: 1,
              flex: '1 1 auto',
              justifyContent: 'flex-end',
              '& .MuiButton-root': {
                border: '2px solid #fff',
                fontSize: '0.7rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 600,
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                '&:hover': {
                  background: '#fff',
                  color: '#000'
                }
              }
            }}>
              <Button color="inherit" startIcon={<HomeIcon />} href="/index.html">首页</Button>
              <Button color="inherit" startIcon={<ScienceIcon />} href="/s.html">S版</Button>
              <Button color="inherit" href="/female.html" startIcon={<FemaleIcon />}>女版</Button>
              <Button color="inherit" href="/lgbt.html" startIcon={<FavoriteIcon />}>🏳️‍🌈 LGBT+</Button>
              <Button color="inherit" href="/message.html" startIcon={<MessageIcon />}>留言</Button>
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
            <ListItem button component="a" href="/index.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><HomeIcon sx={{ color: '#6200ea' }} /></ListItemIcon>
              <ListItemText primary="首页" sx={{ color: '#6200ea' }} />
            </ListItem>
            <ListItem button component="a" href="/s.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><ScienceIcon sx={{ color: '#6200ea' }} /></ListItemIcon>
              <ListItemText primary="S版" sx={{ color: '#6200ea' }} />
            </ListItem>
            <ListItem button component="a" href="/female.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><FemaleIcon sx={{ color: '#6200ea' }} /></ListItemIcon>
              <ListItemText primary="女生版" sx={{ color: '#6200ea' }} />
            </ListItem>
            <ListItem button component="a" href="/lgbt.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><FavoriteIcon sx={{ color: '#6200ea' }} /></ListItemIcon>
              <ListItemText primary="🏳️‍🌈 LGBT+" sx={{ color: '#6200ea' }} />
            </ListItem>
            <ListItem button component="a" href="/message.html" onClick={() => setMobileMenuOpen(false)}>
              <ListItemIcon><MessageIcon sx={{ color: '#6200ea' }} /></ListItemIcon>
              <ListItemText primary="留言板" sx={{ color: '#6200ea' }} />
            </ListItem>
            <ListItem button onClick={() => { setOpenUserSettings(true); setMobileMenuOpen(false); }}>
              <ListItemIcon><PersonIcon sx={{ color: '#6200ea' }} /></ListItemIcon>
              <ListItemText primary="用户设置" sx={{ color: '#6200ea' }} />
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
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'black',
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onDoubleClick={handleTitleDoubleClick}
            title="m-profile.top"
          >
            男M自评报告
          </Typography>
          <Paper elevation={1} sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            maxWidth: { xs: '100%', md: '80%' },
            mx: 'auto'
          }} ref={originalGuideRef}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000000', textAlign: 'center' }}>
              评分等级说明
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1, md: 2 } }}>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#2196F3' }}>SSS</Box> = 非常喜欢
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#42A5F5' }}>SS</Box> = 喜欢
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#64B5F6' }}>S</Box> = 接受
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#90A4AE' }}>Q</Box> = 不喜欢但会做
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#78909C' }}>N</Box> = 拒绝
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color: '#607D8B' }}>W</Box> = 未知
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
                className="pixel-button"
                sx={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600
                }}
                onClick={saveTestRecord}
              >
                {loading ? '保存中...' : '保存测试'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<HistoryIcon />}
                onClick={() => setOpenHistory(true)}
                className="pixel-button"
                sx={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600
                }}
              >
                查看记录
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<AutorenewIcon />}
                className="pixel-button"
                sx={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600
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

              <Button
                variant="outlined"
                size="large"
                startIcon={<CloseIcon />}
                color="error"
                className="pixel-button"
                sx={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 600
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
                  className="pixel-button"
                  sx={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 600
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
                      minWidth: 0,
                      overflow: 'hidden',
                      gap: 0.5
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
                    
                    {/* 问号提示按钮 */}
                    <Box sx={{ position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleTooltipClick(`${category}-${item}`)}
                        onMouseEnter={() => handleTooltipMouseEnter(`${category}-${item}`)}
                        onMouseLeave={() => handleTooltipMouseLeave(`${category}-${item}`)}
                        sx={{
                          width: 20,
                          height: 20,
                          minWidth: 20,
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                            backgroundColor: 'rgba(98, 0, 234, 0.04)'
                          }
                        }}
                      >
                        <HelpOutlineIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      
                      {/* 提示框 */}
                      <Popper
                        open={tooltipOpen[`${category}-${item}`] || false}
                        anchorEl={document.querySelector(`[data-tooltip-anchor="${category}-${item}"]`)}
                        placement="top"
                        transition
                        sx={{ zIndex: 1300 }}
                      >
                        {({ TransitionProps }) => (
                          <Fade {...TransitionProps} timeout={200}>
                            <Paper
                              elevation={8}
                              sx={{
                                p: 2,
                                maxWidth: 300,
                                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                color: 'white',
                                borderRadius: 2,
                                fontSize: '0.875rem',
                                lineHeight: 1.4,
                                position: 'relative',
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: -8,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderLeft: '8px solid transparent',
                                  borderRight: '8px solid transparent',
                                  borderTop: '8px solid rgba(0, 0, 0, 0.9)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
                                  {ITEM_EXPLANATIONS[item] || '暂无解释'}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleTooltipClose(`${category}-${item}`)}
                                  sx={{
                                    color: 'white',
                                    width: 20,
                                    height: 20,
                                    minWidth: 20,
                                    ml: 1,
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                              </Box>
                            </Paper>
                          </Fade>
                        )}
                      </Popper>
                      
                      {/* 隐藏的锚点元素 */}
                      <Box
                        data-tooltip-anchor={`${category}-${item}`}
                        sx={{
                          position: 'absolute',
                          top: -10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 1,
                          height: 1,
                          pointerEvents: 'none'
                        }}
                      />
                    </Box>
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
            color="primary"
            size="large"
            onClick={handleGenerateReport}
            className="pixel-button"
            sx={{ minWidth: 200 }}
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
            pt: { xs: 1, md: 2 },
            pb: { xs: 1, md: 2 },
            color: 'black',
            borderBottom: '2px solid #6200ea',
            mb: 1
          }}>
            男M自评详细报告
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
              <Typography variant="h4" gutterBottom align="center" sx={{ color: '#1E3D59', mb: { xs: 2, md: 3 } }}>
                男M自评报告
              </Typography>
              <Typography variant="subtitle1" align="center" sx={{ color: '#1E3D59', mb: { xs: 2, md: 3 }, fontWeight: 'bold' }}>
                No.{userCount.toLocaleString().padStart(4, '0')}
              </Typography>

              {/* 雷达图部分 */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                mb: { xs: 1, md: 2 },
                position: 'relative'
              }}>
                <RadarChart
                  width={window.innerWidth < 768 ? Math.min(320, window.innerWidth - 60) : 500}
                  height={window.innerWidth < 768 ? Math.min(250, window.innerWidth - 60) : 350}
                  data={getRadarData()}
                  style={{ margin: '0 auto' }}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 6]} />
                  <Radar name="得分" dataKey="value" stroke="#1E3D59" fill="#1E3D59" fillOpacity={0.6} />
                </RadarChart>
              </Box>

              {/* 用户提示信息 - 紧跟雷达图 */}
              <Box sx={{
                mb: { xs: 2, md: 3 },
                textAlign: 'center',
                p: { xs: 1.5, md: 2 },
                backgroundColor: 'rgba(30, 61, 89, 0.15)',
                borderRadius: 2,
                border: '2px solid rgba(30, 61, 89, 0.4)',
                mx: { xs: 1, md: 0 },
                boxShadow: '0 2px 8px rgba(30, 61, 89, 0.2)'
              }}>
                <Typography variant="body1" sx={{
                  color: '#1E3D59',
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
                    borderTop: '12px solid #1E3D59'
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
                  background: 'linear-gradient(90deg, transparent, #1E3D59, transparent)',
                  mb: 2
                }} />
                <Typography variant="h6" sx={{
                  color: '#1E3D59',
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
                <Typography variant="subtitle2" sx={{ mt: 2, color: '#1E3D59', fontWeight: 'bold' }}>
                  报告编号：No.{userCount.toLocaleString().padStart(4, '0')}
                </Typography>
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
            >
              保存为图片
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="contained"
              color="secondary"
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
            borderBottom: '2px dashed #6200ea',
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
                      <Typography variant="h6" sx={{ mb: 1, color: '#6200ea' }}>
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
            borderBottom: '2px dashed #6200ea',
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
            borderBottom: '2px dashed #6200ea',
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
                  <Typography variant="h6" sx={{ mb: 2, color: '#6200ea' }}>
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

      {/* 报告生成进度对话框 */}
        <Dialog
          open={generatingReport}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              backgroundColor: '#f0f8ff',
              border: '3px solid #2196F3',
              boxShadow: '0 8px 32px rgba(33, 150, 243, 0.3)'
            }
          }}
        >
          <DialogTitle sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#2196F3',
            pb: 2
          }}>
            正在生成您的专属报告...
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#2196F3', mb: 2, fontWeight: 'bold' }}>
                您是第 {userCount.toLocaleString()} 个参与测试的小可爱 🎉
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                正在为您生成个性化分析报告...
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={reportProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(33, 150, 243, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#2196F3',
                    borderRadius: 4,
                    transition: 'transform 0.2s ease-in-out'
                  }
                }}
              />
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                {Math.round(reportProgress)}% 完成
              </Typography>
            </Box>
            
            {/* 可爱的加载动画 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress
                size={40}
                sx={{
                  color: '#2196F3',
                  animationDuration: '1.5s'
                }}
              />
            </Box>
          </DialogContent>
        </Dialog>

      <Footer pixelStyle={true} />
      </Box>
    </ThemeProvider>
  );
}

export default App;