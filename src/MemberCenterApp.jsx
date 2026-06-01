import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
    return ['还没有云端测评记录。完成一次测评并保存后，这里会显示具体项目的变化。'];
  }

  const latest = records[records.length - 1];
  const previous = records
    .slice(0, -1)
    .reverse()
    .find(record => record.test_type === latest.test_type);

  const lines = [
    `最近一次是 ${TEST_LABEL[latest.test_type] || latest.test_type}，完成 ${latest.completedItems}/${latest.totalItems || latest.completedItems} 项。`
  ];

  if (!previous) {
    lines.push('当前筛选范围内还没有可对比的同类型上一次记录。再完成一次同类型测评后，这里会列出具体项目变化。');
    const strongestItems = latest.details
      .filter(detail => ['SSS', 'SS'].includes(detail.rating))
      .slice(0, 5)
      .map(detail => `${detail.item}（${detail.rating}）`);
    if (strongestItems.length) {
      lines.push(`本次高偏好项目：${strongestItems.join('、')}。`);
    }
    return lines;
  }

  const previousMap = new Map(previous.details.map(detail => [`${detail.category}::${detail.item}`, detail]));
  const latestMap = new Map(latest.details.map(detail => [`${detail.category}::${detail.item}`, detail]));
  const changedItems = [];

  latestMap.forEach((detail, key) => {
    const oldDetail = previousMap.get(key);
    if (!oldDetail || oldDetail.rating === detail.rating) return;
    changedItems.push({
      category: detail.category,
      item: detail.item,
      from: oldDetail.rating,
      to: detail.rating,
      delta: (RATING_WEIGHT[detail.rating] || 0) - (RATING_WEIGHT[oldDetail.rating] || 0)
    });
  });

  const newStrongItems = [];
  latestMap.forEach((detail, key) => {
    if (!previousMap.has(key) && ['SSS', 'SS'].includes(detail.rating)) {
      newStrongItems.push(detail);
    }
  });

  const raised = changedItems.filter(item => item.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
  const lowered = changedItems.filter(item => item.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5);

  if (raised.length) {
    lines.push(`上升项目：${raised.map(item => `${item.item}（${item.from} → ${item.to}）`).join('、')}。`);
  }

  if (lowered.length) {
    lines.push(`下降项目：${lowered.map(item => `${item.item}（${item.from} → ${item.to}）`).join('、')}。`);
  }

  if (newStrongItems.length) {
    lines.push(`新增高偏好：${newStrongItems.slice(0, 5).map(item => `${item.item}（${item.rating}）`).join('、')}。`);
  }

  if (!changedItems.length && !newStrongItems.length) {
    lines.push('和上一次同类型测评相比，具体项目评分没有明显变化。');
  }

  const boundaryChanges = changedItems.filter(item => item.to === 'N' || item.from === 'N').slice(0, 4);
  if (boundaryChanges.length) {
    lines.push(`边界相关变化：${boundaryChanges.map(item => `${item.item}（${item.from} → ${item.to}）`).join('、')}，建议实际沟通时重点确认。`);
  }

  return lines;
}

function groupRecordDetails(details) {
  return details.reduce((groups, detail) => {
    const category = detail.category || '未分类';
    if (!groups[category]) groups[category] = [];
    groups[category].push(detail);
    return groups;
  }, {});
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
    passwordConfirm: '',
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
  const [detailRecordId, setDetailRecordId] = useState('');
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

  const totalCompleted = records.reduce((sum, record) => sum + record.completedItems, 0);
  const typeCount = new Set(records.map(record => record.test_type)).size;
  const activeDays = first && latest
    ? Math.max(1, Math.ceil((new Date(latest.created_at) - new Date(first.created_at)) / 86400000) + 1)
    : records.length ? 1 : 0;

  const detailRecord = records.find(record => record.id === detailRecordId);
  const detailGroups = detailRecord ? groupRecordDetails(detailRecord.details) : {};
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
      if (authMode === 'register') {
        if (!authForm.email.trim()) throw new Error('请输入邮箱');
        if (authForm.password !== authForm.passwordConfirm) throw new Error('两次输入的密码不一致');
      }
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
                <div><strong>看明细</strong><span>每次结果可快速回看</span></div>
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
                    <TextField
                      size="small"
                      type="password"
                      label="确认密码"
                      value={authForm.passwordConfirm}
                      onChange={event => setAuthForm(prev => ({ ...prev, passwordConfirm: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      type="email"
                      label="邮箱"
                      value={authForm.email}
                      onChange={event => setAuthForm(prev => ({ ...prev, email: event.target.value }))}
                      required
                      fullWidth
                    />
                    <TextField size="small" label="昵称（选填）" value={authForm.displayName} onChange={event => setAuthForm(prev => ({ ...prev, displayName: event.target.value }))} fullWidth />
                    <Box className="optional-contact-grid">
                      <TextField size="small" label="QQ（选填）" value={authForm.qq} onChange={event => setAuthForm(prev => ({ ...prev, qq: event.target.value }))} />
                      <TextField size="small" label="微信（选填）" value={authForm.wechat} onChange={event => setAuthForm(prev => ({ ...prev, wechat: event.target.value }))} />
                      <TextField size="small" label="电话（选填）" value={authForm.phone} onChange={event => setAuthForm(prev => ({ ...prev, phone: event.target.value }))} />
                    </Box>
                  </>
                )}
                <Button
                  onClick={submitAuth}
                  disabled={!authForm.username.trim() || !authForm.password || (authMode === 'register' && (!authForm.passwordConfirm || !authForm.email.trim()))}
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
          <Paper className="member-card stat-card"><span>{activeDays}</span><p>观察天数</p></Paper>
        </Box>

        <Paper className="member-card member-toolbar">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="长期云同步" color="primary" variant="outlined" />
              <Chip label="具体项目变化" color="secondary" variant="outlined" />
              <Chip label="记录可导出" variant="outlined" />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Select size="small" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
                <MenuItem value="all">全部类型</MenuItem>
                {Object.entries(TEST_LABEL).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </Select>
              <Button startIcon={<SaveAltIcon />} onClick={() => exportRecords(records, userInfo.userId, userInfo.nickname)} disabled={records.length === 0}>
                导出数据
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
                  <Chip label={tablesReady ? '会员表已连接' : '会员表未创建'} color={tablesReady ? 'success' : 'warning'} variant="outlined" />
                </Stack>
                <Button onClick={logoutMember}>退出登录</Button>
              </Stack>
            ) : (
              <Alert severity="warning">请先注册/登录。</Alert>
            )}
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

        </Box>

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

            <Box className="member-grid detail-grid single-detail-grid">
              <Paper className="member-card analysis-card">
                <Typography className="card-title"><InsightsIcon fontSize="small" /> 变化分析</Typography>
                <Typography className="muted-text item-analysis-note">
                  这里对比最近一次和上一次同类型测评，只列出具体项目的评分变化。
                </Typography>
                <Stack spacing={1.5}>
                  {analysis.map((line, index) => (
                    <Box key={index} className="analysis-line">{line}</Box>
                  ))}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography className="card-title small">换设备读取记录</Typography>
                <Typography className="muted-text">同一个会员账号会读取已保存到云端的测评记录。旧设备上的匿名记录需要先复制备份，再到新设备导入。</Typography>
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
                      <TableCell>操作</TableCell>
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
                        <TableCell>
                          <Button size="small" onClick={() => setDetailRecordId(record.id)}>查看明细</Button>
                        </TableCell>
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
      <Dialog open={!!detailRecord} onClose={() => setDetailRecordId('')} maxWidth="md" fullWidth>
        <DialogTitle>
          {detailRecord ? `${TEST_LABEL[detailRecord.test_type] || detailRecord.test_type}明细` : '测评明细'}
        </DialogTitle>
        <DialogContent dividers>
          {detailRecord ? (
            <Stack spacing={2}>
              <Typography className="muted-text">
                {formatDateTime(detailRecord.created_at)} · 完成 {detailRecord.completedItems}/{detailRecord.totalItems || detailRecord.completedItems} 项 · 综合强度 {detailRecord.averageScore.toFixed(2)}
              </Typography>
              {Object.entries(detailGroups).map(([category, details]) => (
                <Box key={category} className="record-detail-group">
                  <Typography className="record-detail-category">{category}</Typography>
                  <Box className="record-detail-items">
                    {details.map(detail => (
                      <span key={`${detail.category}-${detail.item}`}>
                        <strong>{detail.rating || '-'}</strong>{detail.item}
                      </span>
                    ))}
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box className="empty-panel">未选择记录。</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailRecordId('')}>关闭</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3600} onClose={() => setSnackbar('')} message={snackbar} />
    </Box>
  );
}

export default MemberCenterApp;
