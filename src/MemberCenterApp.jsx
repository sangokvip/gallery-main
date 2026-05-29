import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import SyncIcon from '@mui/icons-material/Sync';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InsightsIcon from '@mui/icons-material/Insights';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LinkIcon from '@mui/icons-material/Link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { memberCenterApi } from './utils/supabase';
import userManager, { getIdentitySecret, getNickname, getUserId } from './utils/userManager';
import './styles/member-center.css';

const TEST_LABEL = {
  female: '女M测试',
  male: '男M测试',
  s: 'S型测试',
  lgbt: 'LGBT+探索'
};

const RATING_ORDER = ['SSS', 'SS', 'S', 'Q', 'N', 'W'];
const RATING_WEIGHT = { SSS: 6, SS: 5, S: 4, Q: 3, N: 2, W: 1 };
const RATING_COLORS = {
  SSS: '#dc2626',
  SS: '#ea580c',
  S: '#2563eb',
  Q: '#7c3aed',
  N: '#475569',
  W: '#94a3b8'
};

const PLAN_OPTIONS = [
  { code: 'free', title: '免费', desc: '基础云记录、最近趋势', price: '¥0' },
  { code: 'basic_monthly', title: '基础会员', desc: '无限记录、高清导出、月度总结', price: '¥19/月' },
  { code: 'premium_monthly', title: '高级会员', desc: '高级报告、私密分享、双人对比', price: '¥39/月' },
  { code: 'lifetime', title: '永久会员', desc: '长期档案、年度报告、全部模板', price: '¥299' }
];

const PLAN_TIER = {
  free: 'free',
  basic_monthly: 'basic',
  premium_monthly: 'premium',
  lifetime: 'lifetime'
};

const TIER_RANK = { free: 0, basic: 1, premium: 2, lifetime: 3 };
const ORDER_STATUS_LABEL = {
  pending: '待审核',
  paid: '已付款',
  approved: '已开通',
  rejected: '已拒绝',
  canceled: '已取消',
  refunded: '已退款'
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

function getRecordDetails(record) {
  if (record.details?.length) return record.details;
  const ratings = record.report_data?.ratings;
  if (!ratings || typeof ratings !== 'object') return [];
  return Object.entries(ratings).map(([key, rating]) => {
    const [category, ...itemParts] = key.split('-');
    return { category, item: itemParts.join('-'), rating };
  });
}

function summarizeRecord(record) {
  const details = getRecordDetails(record);
  const counts = RATING_ORDER.reduce((acc, rating) => ({ ...acc, [rating]: 0 }), {});
  const categoryScores = {};
  let weightedTotal = 0;
  let ratedCount = 0;

  details.forEach(detail => {
    if (!detail.rating || !RATING_ORDER.includes(detail.rating)) return;
    counts[detail.rating] += 1;
    weightedTotal += RATING_WEIGHT[detail.rating];
    ratedCount += 1;

    if (!categoryScores[detail.category]) {
      categoryScores[detail.category] = { total: 0, count: 0 };
    }
    categoryScores[detail.category].total += RATING_WEIGHT[detail.rating];
    categoryScores[detail.category].count += 1;
  });

  const totalItems = details.length || record.report_data?.totalItems || 0;
  const completedItems = ratedCount || record.report_data?.completedItems || 0;
  const averageScore = ratedCount ? weightedTotal / ratedCount : 0;
  const topCategories = Object.entries(categoryScores)
    .map(([category, value]) => ({
      category,
      score: value.count ? Number((value.total / value.count).toFixed(2)) : 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    ...record,
    details,
    counts,
    totalItems,
    completedItems,
    averageScore,
    topCategories
  };
}

function buildAnalysis(records) {
  if (records.length === 0) {
    return ['还没有云端测评记录。完成一次测评并保存后，这里会自动生成趋势分析。'];
  }

  const latest = records[records.length - 1];
  const previous = records.length > 1 ? records[records.length - 2] : null;
  const stableType = Object.entries(records.reduce((acc, record) => {
    acc[record.test_type] = (acc[record.test_type] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0];

  const lines = [
    `当前档案共有 ${records.length} 次云端测评，最近一次是 ${TEST_LABEL[latest.test_type] || latest.test_type}。`
  ];

  if (previous) {
    const avgDelta = latest.averageScore - previous.averageScore;
    const sssDelta = latest.counts.SSS - previous.counts.SSS;
    const ssDelta = latest.counts.SS - previous.counts.SS;
    const direction = avgDelta > 0.15 ? '上升' : avgDelta < -0.15 ? '下降' : '基本稳定';
    lines.push(`与上次相比，综合偏好强度${direction}，SSS 项变化 ${sssDelta >= 0 ? '+' : ''}${sssDelta}，SS 项变化 ${ssDelta >= 0 ? '+' : ''}${ssDelta}。`);
  } else {
    lines.push('目前只有一次记录，建议后续每隔一段时间重新测一次，趋势图会更有参考价值。');
  }

  if (latest.topCategories.length > 0) {
    lines.push(`最近一次最突出的维度是：${latest.topCategories.slice(0, 3).map(item => item.category).join('、')}。`);
  }

  if (stableType) {
    lines.push(`你目前记录最多的是 ${TEST_LABEL[stableType[0]] || stableType[0]}，适合先围绕这个方向做长期观察。`);
  }

  lines.push('测评结果只适合做自我观察，不建议用单次结果直接替代真实沟通和边界确认。');
  return lines;
}

function exportRecords(records, userId, nickname) {
  const payload = {
    schemaVersion: '1.0',
    exportType: 'mprofile-member-center',
    exportedAt: new Date().toISOString(),
    user: { userId, nickname },
    records
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mprofile-records-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function createShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes).map(byte => byte.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

function MemberCenterApp() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [identityInput, setIdentityInput] = useState('');
  const [authMode, setAuthMode] = useState('register');
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    displayName: '',
    qq: '',
    wechat: '',
    email: '',
    phone: ''
  });
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [profileDraft, setProfileDraft] = useState(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [shareTitle, setShareTitle] = useState('我的测评报告');
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiresDays, setShareExpiresDays] = useState('30');
  const [selectedPlan, setSelectedPlan] = useState('premium_monthly');
  const [orderNote, setOrderNote] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [userInfo, setUserInfo] = useState(() => ({
    userId: getUserId(),
    nickname: getNickname()
  }));

  const loadRecords = async () => {
    if (!session?.user?.id) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await memberCenterApi.getMemberRecords(userInfo.userId);
      setRecords(data.map(summarizeRecord));
    } catch (err) {
      setError(err.message || '加载会员中心数据失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberProfile = async (nextSession = session) => {
    setMemberLoading(true);
    try {
      const data = await memberCenterApi.getMemberProfile(nextSession, userInfo.userId, userInfo.nickname);
      setMemberData(data);
      setProfileDraft(data.profile);
      if (data.tablesReady) {
        memberCenterApi.registerDevice(nextSession, userInfo.userId).catch(() => {});
      }
    } catch (err) {
      setSnackbar(err.message || '会员资料读取失败');
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) loadRecords();
  }, [userInfo.userId, session?.user?.id]);

  useEffect(() => {
    (async () => {
      const nextSession = await memberCenterApi.getAuthSession();
      setSession(nextSession);
      if (nextSession?.user?.id) {
        await loadMemberProfile(nextSession);
      } else {
        setMemberLoading(false);
      }
      setAuthChecked(true);
    })();
  }, [userInfo.userId]);

  const filteredRecords = useMemo(() => {
    if (typeFilter === 'all') return records;
    return records.filter(record => record.test_type === typeFilter);
  }, [records, typeFilter]);

  const latest = records[records.length - 1];
  const first = records[0];
  const analysis = useMemo(() => buildAnalysis(filteredRecords), [filteredRecords]);

  const trendData = filteredRecords.map((record, index) => ({
    name: `${index + 1}`,
    date: formatDate(record.created_at),
    type: TEST_LABEL[record.test_type] || record.test_type,
    average: Number(record.averageScore.toFixed(2)),
    ...record.counts
  }));

  const ratingTotalData = RATING_ORDER.map(rating => ({
    rating,
    count: filteredRecords.reduce((sum, record) => sum + record.counts[rating], 0)
  }));

  const radarData = latest?.topCategories?.map(item => ({
    category: item.category.replace(/^[^\s]+\s*/, ''),
    score: item.score
  })) || [];

  const totalCompleted = records.reduce((sum, record) => sum + record.completedItems, 0);
  const typeCount = new Set(records.map(record => record.test_type)).size;
  const identityCount = memberData?.identities?.length || 0;
  const activeDays = first && latest
    ? Math.max(1, Math.ceil((new Date(latest.created_at) - new Date(first.created_at)) / 86400000) + 1)
    : records.length ? 1 : 0;

  useEffect(() => {
    if (!selectedRecordId && latest?.id) setSelectedRecordId(latest.id);
  }, [latest?.id, selectedRecordId]);

  const selectedRecord = records.find(record => record.id === selectedRecordId) || latest;
  const unlockedRecordIds = new Set((memberData?.unlocks || []).filter(item => item.unlock_type === 'advanced_report').map(item => item.record_id));
  const selectedRecordUnlocked = selectedRecord?.id ? unlockedRecordIds.has(selectedRecord.id) : false;
  const membershipTier = memberData?.profile?.membership_tier || 'free';
  const subscriptionStatus = memberData?.subscription?.status || (membershipTier === 'free' ? 'free' : 'active');
  const subscriptionEndsAt = memberData?.subscription?.ends_at || null;
  const canUseBasic = TIER_RANK[membershipTier] >= TIER_RANK.basic;
  const canUsePremium = TIER_RANK[membershipTier] >= TIER_RANK.premium;
  const tablesReady = memberData?.tablesReady ?? false;

  const copyIdentity = async () => {
    const payload = JSON.stringify({ userId: userInfo.userId, nickname: userInfo.nickname, identitySecret: getIdentitySecret() });
    await navigator.clipboard.writeText(payload);
    setSnackbar('身份备份已复制。换设备时导入这段内容即可读取同一批云记录。');
  };

  const importIdentity = () => {
    try {
      const payload = JSON.parse(identityInput);
      if (!payload.userId || !payload.nickname || !payload.identitySecret) throw new Error('格式不正确');
      const ok = userManager.importUserData(payload);
      if (!ok) throw new Error('导入失败');
      setUserInfo({ userId: payload.userId, nickname: payload.nickname });
      setIdentityInput('');
      setSnackbar('身份已导入，正在读取云端记录。');
    } catch (err) {
      setSnackbar('导入失败，请粘贴完整的身份备份 JSON。');
    }
  };

  const submitAuth = async () => {
    try {
      const payload = {
        username: authForm.username,
        password: authForm.password,
        profile: {
          displayName: authForm.displayName,
          qq: authForm.qq,
          wechat: authForm.wechat,
          email: authForm.email,
          phone: authForm.phone
        }
      };
      const data = authMode === 'register'
        ? await memberCenterApi.registerWithPassword(payload)
        : await memberCenterApi.loginWithPassword(payload);
      const nextSession = data?.session || await memberCenterApi.getAuthSession();
      setSession(nextSession);
      if (nextSession?.user?.id) {
        await loadMemberProfile(nextSession);
        if (authMode === 'register') {
          const savedProfile = await memberCenterApi.updateMemberProfile(nextSession, {
            display_name: authForm.displayName || authForm.username,
            qq: authForm.qq,
            wechat: authForm.wechat,
            contact_email: authForm.email,
            phone: authForm.phone,
            privacy_settings: { hideUserId: true, hideSensitiveItems: true, allowPrivateShare: true },
            notification_settings: { monthlySummary: true, trendReminder: false }
          });
          setMemberData(prev => ({ ...prev, profile: savedProfile }));
          setProfileDraft(savedProfile);
        }
        setSnackbar(authMode === 'register' ? '注册成功，已进入会员中心。' : '登录成功。');
      }
    } catch (err) {
      setSnackbar(err.message || '注册/登录失败');
    }
  };

  const logoutMember = async () => {
    try {
      await memberCenterApi.signOut();
      setSession(null);
      setRecords([]);
      setMemberData(null);
      setProfileDraft(null);
      setSnackbar('已退出会员账号。重新注册/登录后才能进入会员中心。');
    } catch (err) {
      setSnackbar(err.message || '退出失败');
    }
  };

  const saveProfile = async () => {
    try {
      const saved = await memberCenterApi.updateMemberProfile(session, profileDraft);
      setMemberData(prev => ({ ...prev, profile: saved }));
      setProfileDraft(saved);
      setSnackbar('会员资料已保存。');
    } catch (err) {
      setSnackbar(err.message || '保存失败');
    }
  };

  const unlockSelectedReport = async () => {
    if (!canUsePremium) {
      setSnackbar('高级报告需要高级会员或永久会员。');
      return;
    }
    try {
      const unlocked = await memberCenterApi.unlockReport(session, userInfo.userId, selectedRecord?.id);
      setMemberData(prev => ({ ...prev, unlocks: [unlocked, ...(prev?.unlocks || [])] }));
      setSnackbar('高级报告已解锁。');
    } catch (err) {
      setSnackbar(err.message || '解锁失败');
    }
  };

  const createPrivateShare = async () => {
    if (!canUsePremium) {
      setSnackbar('私密分享需要高级会员或永久会员。');
      return;
    }
    try {
      const token = createShareToken();
      const expiresAt = shareExpiresDays === 'never'
        ? null
        : new Date(Date.now() + Number(shareExpiresDays) * 86400000).toISOString();
      const link = await memberCenterApi.createShareLink(session, userInfo.userId, {
        share_token: token,
        record_id: selectedRecord?.id,
        title: shareTitle,
        access_code: sharePassword.trim(),
        hidden_sections: profileDraft?.privacy_settings?.hideSensitiveItems ? ['items'] : [],
        expires_at: expiresAt
      });
      setMemberData(prev => ({ ...prev, shareLinks: [link, ...(prev?.shareLinks || [])] }));
      setSnackbar('私密分享链接已创建。');
    } catch (err) {
      setSnackbar(err.message || '创建分享失败');
    }
  };

  const deactivateShare = async (shareId) => {
    try {
      const updated = await memberCenterApi.deactivateShareLink(session, shareId);
      setMemberData(prev => ({
        ...prev,
        shareLinks: (prev?.shareLinks || []).map(link => (
          link.id === shareId ? { ...link, ...updated } : link
        ))
      }));
      setSnackbar('分享链接已停用。');
    } catch (err) {
      setSnackbar(err.message || '停用分享失败');
    }
  };

  const unlinkDevice = async (deviceId) => {
    try {
      await memberCenterApi.unlinkDevice(session, deviceId);
      setMemberData(prev => ({
        ...prev,
        devices: (prev?.devices || []).filter(device => device.id !== deviceId)
      }));
      setSnackbar('设备已解绑。当前设备下次登录会重新登记。');
    } catch (err) {
      setSnackbar(err.message || '解绑设备失败');
    }
  };

  const createMembershipOrder = async () => {
    try {
      const order = await memberCenterApi.createOrder(session, userInfo.userId, {
        plan_code: selectedPlan,
        contact_note: orderNote.trim()
      });
      setMemberData(prev => ({ ...prev, orders: [order, ...(prev?.orders || [])] }));
      setOrderNote('');
      setSnackbar('会员开通申请已提交，后台审核后会自动更新权益。');
    } catch (err) {
      setSnackbar(err.message || '提交会员申请失败');
    }
  };

  const advancedReportLines = selectedRecord ? [
    `本次 ${TEST_LABEL[selectedRecord.test_type] || selectedRecord.test_type} 完成 ${selectedRecord.completedItems}/${selectedRecord.totalItems || selectedRecord.completedItems} 项，综合强度 ${selectedRecord.averageScore.toFixed(2)}。`,
    `高强度偏好集中在 ${selectedRecord.topCategories.slice(0, 3).map(item => item.category).join('、') || '暂无明显维度'}。`,
    `SSS 与 SS 合计 ${selectedRecord.counts.SSS + selectedRecord.counts.SS} 项，适合优先作为自我认知和沟通清单。`,
    `N 项 ${selectedRecord.counts.N} 个，建议在任何关系沟通中作为明确边界处理。`
  ] : [];

  return (
    <Box className="member-shell">
      <Box component="header" className="member-nav">
        <a className="member-logo" href="/index.html">M-profile Lab</a>
        <Box className="member-nav-actions">
          <Button href="/index.html" startIcon={<HomeIcon />} className="member-outline-button">首页</Button>
          <Button onClick={loadRecords} startIcon={<SyncIcon />} className="member-outline-button">刷新</Button>
        </Box>
      </Box>

      <Container maxWidth="xl" className="member-container">
        {!authChecked ? (
          <Box className="member-loading"><CircularProgress /><Typography>正在检查会员登录状态...</Typography></Box>
        ) : !session?.user?.id ? (
          <Box className="auth-gate">
            <Paper className="member-card auth-card">
              <Typography component="h1" className="member-title compact">注册会员</Typography>
              <Box className="benefit-grid">
                <div><strong>云同步</strong><span>换设备也能看记录</span></div>
                <div><strong>看变化</strong><span>每次测评自动对比</span></div>
                <div><strong>高级报告</strong><span>长期趋势更直观</span></div>
              </Box>
              <Stack direction="row" spacing={1} className="auth-tabs">
                <Button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>注册</Button>
                <Button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>登录</Button>
              </Stack>
              <Stack spacing={1.25}>
                <TextField
                  size="small"
                  label="用户名"
                  value={authForm.username}
                  onChange={event => setAuthForm(prev => ({ ...prev, username: event.target.value }))}
                  helperText="3-24 位小写字母、数字或下划线"
                  fullWidth
                />
                <TextField
                  size="small"
                  type="password"
                  label="密码"
                  value={authForm.password}
                  onChange={event => setAuthForm(prev => ({ ...prev, password: event.target.value }))}
                  helperText="至少 6 位"
                  fullWidth
                />
                {authMode === 'register' && (
                  <>
                    <TextField size="small" label="昵称（选填）" value={authForm.displayName} onChange={event => setAuthForm(prev => ({ ...prev, displayName: event.target.value }))} fullWidth />
                    <Box className="optional-contact-grid">
                      <TextField size="small" label="QQ（选填）" value={authForm.qq} onChange={event => setAuthForm(prev => ({ ...prev, qq: event.target.value }))} />
                      <TextField size="small" label="微信（选填）" value={authForm.wechat} onChange={event => setAuthForm(prev => ({ ...prev, wechat: event.target.value }))} />
                      <TextField size="small" type="email" label="邮箱（选填）" value={authForm.email} onChange={event => setAuthForm(prev => ({ ...prev, email: event.target.value }))} />
                      <TextField size="small" label="电话（选填）" value={authForm.phone} onChange={event => setAuthForm(prev => ({ ...prev, phone: event.target.value }))} />
                    </Box>
                  </>
                )}
                <Button
                  onClick={submitAuth}
                  disabled={!authForm.username.trim() || !authForm.password}
                  className="member-outline-button auth-submit"
                >
                  {authMode === 'register' ? '立即注册' : '登录会员中心'}
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography className="muted-text">不注册也能继续使用原有测评、保存、导出、留言板和图库。</Typography>
            </Paper>
          </Box>
        ) : (
          <>
        <Box className="member-hero">
          <Box>
            <Typography component="h1" className="member-title">会员中心</Typography>
            <Typography className="member-subtitle">云同步测评档案、长期趋势和变化分析。会员功能仅限注册/登录用户使用。</Typography>
          </Box>
          <Box className="member-identity">
            <Typography className="member-identity-label">当前身份</Typography>
            <Typography className="member-identity-name">{userInfo.nickname}</Typography>
            <Typography className="member-identity-id">{userInfo.userId}</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" className="member-alert">{error}</Alert>}

        <Box className="member-grid stats-grid">
          <Paper className="member-card stat-card"><span>{records.length}</span><p>云端记录</p></Paper>
          <Paper className="member-card stat-card"><span>{totalCompleted}</span><p>累计评测项</p></Paper>
          <Paper className="member-card stat-card"><span>{typeCount}</span><p>已覆盖类型</p></Paper>
          <Paper className="member-card stat-card"><span>{identityCount || activeDays}</span><p>{identityCount ? '绑定身份' : '观察天数'}</p></Paper>
        </Box>

        <Paper className="member-card member-toolbar">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="长期云同步" color="primary" variant="outlined" />
              <Chip label="趋势分析" color="secondary" variant="outlined" />
              <Chip label="身份可迁移" variant="outlined" />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
                <MenuItem value="all">全部类型</MenuItem>
                {Object.entries(TEST_LABEL).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </Select>
              <Button startIcon={<SaveAltIcon />} onClick={() => exportRecords(records, userInfo.userId, userInfo.nickname)} disabled={records.length === 0}>
                {canUseBasic ? '导出数据' : '导出基础数据'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box className="member-grid account-grid">
          <Paper className="member-card">
            <Typography className="card-title">会员账号</Typography>
            {session ? (
              <Stack spacing={1.5}>
                <Typography className="muted-text">已登录：{session.user.user_metadata?.username || '会员账号'}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`会员等级：${membershipTier}`} color={membershipTier === 'free' ? 'default' : 'primary'} />
                  <Chip label={`订阅状态：${subscriptionStatus}`} variant="outlined" />
                  <Chip label={subscriptionEndsAt ? `有效期至：${formatDateTime(subscriptionEndsAt)}` : membershipTier === 'lifetime' ? '永久有效' : '暂无有效期'} variant="outlined" />
                  <Chip label={tablesReady ? '会员表已连接' : '会员表未创建'} color={tablesReady ? 'success' : 'warning'} variant="outlined" />
                  <Chip label={`已绑定 ${identityCount} 个测评身份`} variant="outlined" />
                </Stack>
                <Button onClick={logoutMember}>退出登录</Button>
              </Stack>
            ) : (
              <Alert severity="warning">请先注册/登录。</Alert>
            )}
          </Paper>

          <Paper className="member-card">
            <Typography className="card-title">会员权益</Typography>
            <Box className="plan-grid">
              {PLAN_OPTIONS.map(plan => (
                <Box key={plan.code} className={`plan-card ${membershipTier === PLAN_TIER[plan.code] ? 'active' : ''}`}>
                  <strong>{plan.title}<small>{plan.price}</small></strong>
                  <span>{plan.desc}</span>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box className="member-grid account-grid">
          <Paper className="member-card">
            <Typography className="card-title">开通 / 升级会员</Typography>
            <Stack spacing={1.5}>
              <Typography className="muted-text">当前版本支持先提交开通申请，后台审核后自动更新会员等级；后续接支付网关时沿用同一套订单数据。</Typography>
              <Alert severity={canUseBasic ? 'success' : 'info'} className="member-alert">
                {canUseBasic ? '当前账号已有会员权益。续费或升级后，后台审核通过会覆盖为新的权益等级。' : '免费账号可以查看基础云记录和趋势；高级报告、私密分享需要高级会员或永久会员。'}
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Select size="small" value={selectedPlan} onChange={event => setSelectedPlan(event.target.value)} fullWidth>
                  {PLAN_OPTIONS.filter(plan => plan.code !== 'free').map(plan => (
                    <MenuItem key={plan.code} value={plan.code}>{plan.title} · {plan.price}</MenuItem>
                  ))}
                </Select>
                <Button onClick={createMembershipOrder} disabled={!session || memberLoading}>提交申请</Button>
              </Stack>
              <TextField
                size="small"
                label="备注（可选）"
                value={orderNote}
                onChange={event => setOrderNote(event.target.value)}
                placeholder="例如付款截图编号、联系邮箱、开通说明"
                fullWidth
              />
            </Stack>
          </Paper>

          <Paper className="member-card">
            <Typography className="card-title">订单与设备</Typography>
            <Box className="mini-list">
              {(memberData?.orders || []).slice(0, 4).map(order => (
                <div key={order.id}>
                  <strong>{PLAN_OPTIONS.find(plan => plan.code === order.plan_code)?.title || order.plan_code}</strong>
                  <span>{ORDER_STATUS_LABEL[order.status] || order.status} · {formatDateTime(order.created_at)}</span>
                </div>
              ))}
              {(memberData?.orders || []).length === 0 && <Typography className="muted-text">暂无会员订单。</Typography>}
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box className="mini-list">
              {(memberData?.identities || []).slice(0, 3).map(identity => (
                <div key={identity.legacy_user_id_text}>
                  <strong>{identity.display_label || '测评身份'}</strong>
                  <span>{identity.legacy_user_id_text} · 最近同步：{formatDateTime(identity.last_seen_at)}</span>
                </div>
              ))}
              {(memberData?.identities || []).length === 0 && <Typography className="muted-text">登录会员中心后，当前设备的匿名测评身份会自动绑定到会员账号。</Typography>}
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box className="mini-list">
              {(memberData?.devices || []).slice(0, 3).map(device => (
                <div key={device.id}>
                  <strong>{device.device_label}</strong>
                  <span>最近同步：{formatDateTime(device.last_seen_at)}</span>
                  <Button size="small" color="error" onClick={() => unlinkDevice(device.id)}>解绑</Button>
                </div>
              ))}
              {(memberData?.devices || []).length === 0 && <Typography className="muted-text">当前设备会在会员表创建后自动登记。</Typography>}
            </Box>
          </Paper>
        </Box>

        <Box className="member-grid account-grid">
          <Paper className="member-card">
            <Typography className="card-title">会员资料与隐私</Typography>
            {profileDraft ? (
              <Stack spacing={1.5}>
                <TextField
                  size="small"
                  label="显示昵称"
                  value={profileDraft.display_name || ''}
                  onChange={event => setProfileDraft(prev => ({ ...prev, display_name: event.target.value }))}
                  disabled={!session}
                />
                <Box className="optional-contact-grid">
                  <TextField
                    size="small"
                    label="QQ"
                    value={profileDraft.qq || ''}
                    onChange={event => setProfileDraft(prev => ({ ...prev, qq: event.target.value }))}
                    disabled={!session}
                  />
                  <TextField
                    size="small"
                    label="微信"
                    value={profileDraft.wechat || ''}
                    onChange={event => setProfileDraft(prev => ({ ...prev, wechat: event.target.value }))}
                    disabled={!session}
                  />
                  <TextField
                    size="small"
                    type="email"
                    label="邮箱"
                    value={profileDraft.contact_email || ''}
                    onChange={event => setProfileDraft(prev => ({ ...prev, contact_email: event.target.value }))}
                    disabled={!session}
                  />
                  <TextField
                    size="small"
                    label="电话"
                    value={profileDraft.phone || ''}
                    onChange={event => setProfileDraft(prev => ({ ...prev, phone: event.target.value }))}
                    disabled={!session}
                  />
                </Box>
                <FormControlLabel
                  control={<Switch checked={!!profileDraft.privacy_settings?.hideUserId} onChange={event => setProfileDraft(prev => ({ ...prev, privacy_settings: { ...prev.privacy_settings, hideUserId: event.target.checked } }))} />}
                  label="分享时隐藏用户ID"
                />
                <FormControlLabel
                  control={<Switch checked={!!profileDraft.privacy_settings?.hideSensitiveItems} onChange={event => setProfileDraft(prev => ({ ...prev, privacy_settings: { ...prev.privacy_settings, hideSensitiveItems: event.target.checked } }))} />}
                  label="分享时隐藏敏感明细项"
                />
                <FormControlLabel
                  control={<Switch checked={!!profileDraft.notification_settings?.monthlySummary} onChange={event => setProfileDraft(prev => ({ ...prev, notification_settings: { ...prev.notification_settings, monthlySummary: event.target.checked } }))} />}
                  label="生成月度总结"
                />
                <Button onClick={saveProfile} disabled={!session || memberLoading}>保存资料</Button>
              </Stack>
            ) : (
              <Box className="empty-panel">正在读取会员资料...</Box>
            )}
          </Paper>

          <Paper className="member-card">
            <Typography className="card-title"><LockOpenIcon fontSize="small" /> 高级报告与私密分享</Typography>
            <Stack spacing={1.5}>
              {!canUsePremium && <Alert severity="warning">高级报告和私密分享需要高级会员或永久会员。你可以先提交开通申请，后台审核通过后再使用。</Alert>}
              <Select size="small" value={selectedRecord?.id || ''} onChange={event => setSelectedRecordId(event.target.value)} displayEmpty>
                <MenuItem value="">选择测评记录</MenuItem>
                {records.slice().reverse().map(record => (
                  <MenuItem key={record.id} value={record.id}>{formatDateTime(record.created_at)} - {TEST_LABEL[record.test_type] || record.test_type}</MenuItem>
                ))}
              </Select>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button startIcon={<LockOpenIcon />} onClick={unlockSelectedReport} disabled={!session || !selectedRecord || selectedRecordUnlocked || !canUsePremium}>
                  {selectedRecordUnlocked ? '已解锁' : '解锁高级报告'}
                </Button>
                <TextField size="small" label="分享标题" value={shareTitle} onChange={event => setShareTitle(event.target.value)} fullWidth />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField size="small" label="访问密码（可选）" value={sharePassword} onChange={event => setSharePassword(event.target.value)} fullWidth />
                <Select size="small" value={shareExpiresDays} onChange={event => setShareExpiresDays(event.target.value)}>
                  <MenuItem value="7">7 天</MenuItem>
                  <MenuItem value="30">30 天</MenuItem>
                  <MenuItem value="90">90 天</MenuItem>
                  <MenuItem value="never">不过期</MenuItem>
                </Select>
                <Button startIcon={<LinkIcon />} onClick={createPrivateShare} disabled={!session || !selectedRecord || !canUsePremium}>创建链接</Button>
              </Stack>
              <Box className="share-list">
                {(memberData?.shareLinks || []).length === 0 ? (
                  <Typography className="muted-text">暂无分享链接。</Typography>
                ) : memberData.shareLinks.slice(0, 4).map(link => (
                  <Box key={link.id} className="share-item">
                    <span>{link.title} {!link.is_active && '（已停用）'}</span>
                    <code>/share.html?token={link.share_token}</code>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      disabled={!link.is_active}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/share.html?token=${link.share_token}`);
                        setSnackbar('分享链接已复制。');
                      }}
                    >
                      复制
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      disabled={!link.is_active}
                      onClick={() => deactivateShare(link.id)}
                    >
                      停用
                    </Button>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Paper className="member-card advanced-report-card">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
            <Box>
              <Typography className="card-title">高级报告</Typography>
              <Typography className="muted-text">解锁后展示更完整的结果解释、边界摘要和沟通建议。</Typography>
            </Box>
            <Chip label={selectedRecordUnlocked ? '已解锁' : '未解锁'} color={selectedRecordUnlocked ? 'success' : 'default'} />
          </Stack>
          {!selectedRecord ? (
            <Box className="empty-panel">暂无可分析记录。</Box>
          ) : !canUsePremium ? (
            <Alert severity="warning">高级报告需要高级会员或永久会员。免费账号仍可使用基础趋势、记录库和数据导出。</Alert>
          ) : selectedRecordUnlocked ? (
            <Box className="advanced-report-grid">
              {advancedReportLines.map((line, index) => (
                <Box key={index} className="analysis-line">{line}</Box>
              ))}
              <Box className="boundary-panel">
                <strong>边界摘要</strong>
                <span>拒绝项和未知项不会被推荐尝试；分享报告时可隐藏敏感明细，只保留汇总图表。</span>
              </Box>
            </Box>
          ) : (
            <Alert severity="info">选择一条测评记录并点击“解锁高级报告”后，这里会展示完整解析。</Alert>
          )}
        </Paper>

        {loading ? (
          <Box className="member-loading"><CircularProgress /><Typography>正在读取云端记录...</Typography></Box>
        ) : (
          <>
            <Box className="member-grid charts-grid">
              <Paper className="member-card chart-card">
                <Typography className="card-title">评分数量趋势</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {RATING_ORDER.slice(0, 4).map(rating => (
                      <Line key={rating} type="monotone" dataKey={rating} stroke={RATING_COLORS[rating]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>

              <Paper className="member-card chart-card">
                <Typography className="card-title">累计评级分布</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={ratingTotalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#111827" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Box>

            <Box className="member-grid detail-grid">
              <Paper className="member-card chart-card">
                <Typography className="card-title">最近一次突出维度</Typography>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 6]} />
                      <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box className="empty-panel">保存一次完整测评后会显示维度雷达图。</Box>
                )}
              </Paper>

              <Paper className="member-card analysis-card">
                <Typography className="card-title"><InsightsIcon fontSize="small" /> 变化分析</Typography>
                <Stack spacing={1.5}>
                  {analysis.map((line, index) => (
                    <Box key={index} className="analysis-line">{line}</Box>
                  ))}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography className="card-title small">跨设备云同步</Typography>
                <Typography className="muted-text">登录会员账号后，当前设备的匿名测评身份会用本地密钥绑定到账号；换设备登录同一账号后，会读取账号已绑定的所有云端记录。手动迁移需要复制包含身份密钥的备份 JSON。</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                  <Button startIcon={<ContentCopyIcon />} onClick={copyIdentity}>复制身份备份</Button>
                  <TextField size="small" value={identityInput} onChange={event => setIdentityInput(event.target.value)} placeholder="粘贴身份备份 JSON" fullWidth />
                  <Button onClick={importIdentity} disabled={!identityInput.trim()}>导入</Button>
                </Stack>
              </Paper>
            </Box>

            <Paper className="member-card">
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography className="card-title">测评记录库</Typography>
                  <Typography className="muted-text">按时间保存，每条记录都来自云端 `test_records` 和 `test_results`。</Typography>
                </Box>
                <Typography className="muted-text">当前筛选：{filteredRecords.length} 条</Typography>
              </Stack>
              <TableContainer>
                <Table className="member-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>时间</TableCell>
                      <TableCell>类型</TableCell>
                      <TableCell>完成项</TableCell>
                      <TableCell>SSS</TableCell>
                      <TableCell>SS</TableCell>
                      <TableCell>综合强度</TableCell>
                      <TableCell>突出维度</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Box className="empty-panel">暂无记录。完成测评并点击“保存测试”后，这里会自动出现云端档案。</Box>
                        </TableCell>
                      </TableRow>
                    ) : filteredRecords.slice().reverse().map(record => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDateTime(record.created_at)}</TableCell>
                        <TableCell>{TEST_LABEL[record.test_type] || record.test_type}</TableCell>
                        <TableCell>{record.completedItems}/{record.totalItems || record.completedItems}</TableCell>
                        <TableCell>{record.counts.SSS}</TableCell>
                        <TableCell>{record.counts.SS}</TableCell>
                        <TableCell>{record.averageScore.toFixed(2)}</TableCell>
                        <TableCell>{record.topCategories.slice(0, 2).map(item => item.category).join('、') || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
          </>
        )}
      </Container>
      <Snackbar open={!!snackbar} autoHideDuration={3600} onClose={() => setSnackbar('')} message={snackbar} />
    </Box>
  );
}

export default MemberCenterApp;
