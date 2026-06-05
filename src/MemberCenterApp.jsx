import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
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
import InsightsIcon from '@mui/icons-material/Insights';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
import { createReportImageBlob, saveReportImageBlob } from './utils/reportExport';
import { REPORT_RATING_ORDER, buildReportOrderIndex } from './utils/testCatalogs';
import { getNickname, getUserId } from './utils/userManager';
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

function groupRecordDetailsByRating(record) {
  if (!record) return [];
  const orderIndex = buildReportOrderIndex(record.test_type);
  const fallbackBase = orderIndex.size + 1000;
  const details = record.details.map((detail, index) => ({ ...detail, originalIndex: index }));

  const grouped = details.reduce((groups, detail) => {
    const rating = detail.rating && REPORT_RATING_ORDER.includes(detail.rating) ? detail.rating : '未评分';
    if (!groups[rating]) groups[rating] = [];
    groups[rating].push(detail);
    return groups;
  }, {});

  return [...REPORT_RATING_ORDER, '未评分']
    .filter(rating => grouped[rating]?.length)
    .map(rating => ({
      rating,
      details: grouped[rating].sort((a, b) => {
        const aKey = `${a.category}::${a.item}`;
        const bKey = `${b.category}::${b.item}`;
        const aOrder = orderIndex.has(aKey) ? orderIndex.get(aKey) : fallbackBase + a.originalIndex;
        const bOrder = orderIndex.has(bKey) ? orderIndex.get(bKey) : fallbackBase + b.originalIndex;
        return aOrder - bOrder;
      })
    }));
}

function buildRecordTitle(record) {
  if (!record) return '测评记录';
  return `${TEST_LABEL[record.test_type] || record.test_type} · ${formatDateTime(record.created_at)}`;
}

function buildShareUrl(token) {
  if (!token || typeof window === 'undefined') return '';
  return `${window.location.origin}/share.html?token=${encodeURIComponent(token)}`;
}

function buildDetailMap(record) {
  return new Map((record?.details || []).map(detail => [`${detail.category}::${detail.item}`, detail]));
}

function getRatingWeight(rating) {
  return RATING_WEIGHT[rating] || 0;
}

function buildCompatibilityReport(baseRecord, targetRecord, mode) {
  if (!baseRecord || !targetRecord) return null;

  const baseMap = buildDetailMap(baseRecord);
  const targetMap = buildDetailMap(targetRecord);
  const paired = [];

  baseMap.forEach((baseDetail, key) => {
    const targetDetail = targetMap.get(key);
    if (!targetDetail) return;
    const baseWeight = getRatingWeight(baseDetail.rating);
    const targetWeight = getRatingWeight(targetDetail.rating);
    paired.push({
      category: baseDetail.category,
      item: baseDetail.item,
      baseRating: baseDetail.rating,
      targetRating: targetDetail.rating,
      baseWeight,
      targetWeight,
      delta: Math.abs(baseWeight - targetWeight),
      sum: baseWeight + targetWeight
    });
  });

  const comparableCount = paired.length;
  if (!comparableCount) {
    return {
      mode,
      score: 0,
      comparableCount,
      sharedStrong: [],
      differences: [],
      boundaries: [],
      suggestions: ['两条记录没有可对比的共同项目。建议选择同类型测评记录。']
    };
  }

  const compatibleItems = paired.filter(item => item.baseWeight >= 4 && item.targetWeight >= 4);
  const boundaries = paired
    .filter(item => (item.baseWeight >= 5 && item.targetWeight <= 2) || (item.targetWeight >= 5 && item.baseWeight <= 2))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 8);
  const differences = paired
    .filter(item => item.delta >= 3 && !boundaries.includes(item))
    .sort((a, b) => b.delta - a.delta || b.sum - a.sum)
    .slice(0, 10);
  const sharedStrong = compatibleItems
    .sort((a, b) => b.sum - a.sum || a.delta - b.delta)
    .slice(0, 12);

  const rawScore = paired.reduce((sum, item) => {
    const samePreference = 1 - Math.min(item.delta, 5) / 5;
    const strongBonus = item.baseWeight >= 4 && item.targetWeight >= 4 ? 0.18 : 0;
    const boundaryPenalty = ((item.baseWeight >= 5 && item.targetWeight <= 2) || (item.targetWeight >= 5 && item.baseWeight <= 2)) ? 0.32 : 0;
    return sum + Math.max(0, Math.min(1, samePreference + strongBonus - boundaryPenalty));
  }, 0) / comparableCount;

  const modeNotes = {
    masterSlave: '主奴关系：重点看一方高偏好是否落在另一方可接受范围内，边界冲突要优先沟通。',
    slaveSlave: '奴奴关系：重点看共同偏好、可一起探索的项目，以及双方都不适合承接的项目。',
    masterMaster: '主主关系：重点看控制类偏好的重叠，重叠越高越需要明确分工。',
    partner: '探索搭档：重点看共同可探索项目，低接受度项目不建议直接尝试。'
  };

  const suggestions = [
    modeNotes[mode] || modeNotes.partner,
    sharedStrong.length ? `可优先从 ${sharedStrong.slice(0, 4).map(item => item.item).join('、')} 开始沟通。` : '共同高偏好项目较少，建议先从低风险、可中止的项目开始。',
    boundaries.length ? `边界冲突集中在 ${boundaries.slice(0, 4).map(item => item.item).join('、')}，不应默认同意。` : '没有明显高低冲突项目，但仍需要逐项确认边界。'
  ];

  return {
    mode,
    score: Math.round(rawScore * 100),
    comparableCount,
    sharedStrong,
    differences,
    boundaries,
    suggestions
  };
}

function RecordImageCard({ record }, ref) {
  const groups = record ? groupRecordDetailsByRating(record) : [];
  return (
    <Box ref={ref} className="record-export-card">
      <Typography component="h2" className="record-export-title">
        {record ? TEST_LABEL[record.test_type] || record.test_type : '测评记录'}
      </Typography>
      {record && (
        <>
          <Typography className="record-export-meta">
            {formatDateTime(record.created_at)} · 完成 {record.completedItems}/{record.totalItems || record.completedItems} 项 · 综合强度 {record.averageScore.toFixed(2)}
          </Typography>
          <Box className="record-export-stats">
            {RATING_ORDER.map(rating => (
              <div key={rating}>
                <strong style={{ color: RATING_COLORS[rating] }}>{rating}</strong>
                <span>{record.counts[rating] || 0}</span>
              </div>
            ))}
          </Box>
          <Stack spacing={2}>
            {groups.map(({ rating, details }) => (
              <Box key={rating} className="record-detail-group">
                <Typography className="record-detail-category record-detail-rating-title" sx={{ color: RATING_COLORS[rating] || '#475569' }}>
                  {rating} ({details.length})
                </Typography>
                <Box className="record-detail-items">
                  {details.map(detail => (
                    <span key={`${detail.category}-${detail.item}`}>
                      <em>{detail.category}</em>{detail.item}
                    </span>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}

const ForwardedRecordImageCard = React.forwardRef(RecordImageCard);

function PairReportPanel({ report, baseRecord, targetRecord }) {
  if (!report) {
    return <Box className="empty-panel compact">请选择另一条记录生成分析。</Box>;
  }

  const renderItems = (items, emptyText) => (
    items.length ? (
      <Box className="pair-item-list">
        {items.map(item => (
          <span key={`${item.category}-${item.item}-${item.baseRating}-${item.targetRating}`}>
            {item.item}<em>{item.baseRating} / {item.targetRating}</em>
          </span>
        ))}
      </Box>
    ) : <Typography className="muted-text">{emptyText}</Typography>
  );

  return (
    <Box className="pair-report">
      <Box className="pair-score-card">
        <strong>{report.score}</strong>
        <span>契合度</span>
        <small>共同项目 {report.comparableCount} 项</small>
      </Box>
      <Box className="pair-record-names">
        <span>{buildRecordTitle(baseRecord)}</span>
        <span>{buildRecordTitle(targetRecord)}</span>
      </Box>
      <Box className="pair-report-section">
        <Typography className="card-title small">高契合项目</Typography>
        {renderItems(report.sharedStrong, '没有明显共同高偏好项目。')}
      </Box>
      <Box className="pair-report-section">
        <Typography className="card-title small">差异项目</Typography>
        {renderItems(report.differences, '没有明显评分差异。')}
      </Box>
      <Box className="pair-report-section warning">
        <Typography className="card-title small">边界冲突</Typography>
        {renderItems(report.boundaries, '没有明显高低冲突。')}
      </Box>
      <Box className="pair-report-section">
        <Typography className="card-title small">建议</Typography>
        <Stack spacing={1}>
          {report.suggestions.map(line => <Box key={line} className="analysis-line">{line}</Box>)}
        </Stack>
      </Box>
    </Box>
  );
}

function exportRecords(records) {
  const payload = {
    schemaVersion: '1.0',
    exportType: 'mprofile-member-center',
    exportedAt: new Date().toISOString(),
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
  const [authMode, setAuthMode] = useState('register');
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    qq: '',
    wechat: '',
    email: '',
    phone: ''
  });
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);
  const [shareLinks, setShareLinks] = useState([]);
  const [memberLoading, setMemberLoading] = useState(true);
  const [detailRecordId, setDetailRecordId] = useState('');
  const [deleteRecordId, setDeleteRecordId] = useState('');
  const [shareRecordId, setShareRecordId] = useState('');
  const [shareAccessCode, setShareAccessCode] = useState('');
  const [shareCreating, setShareCreating] = useState(false);
  const [imageRecordId, setImageRecordId] = useState('');
  const [imageExporting, setImageExporting] = useState(false);
  const [pairBaseRecordId, setPairBaseRecordId] = useState('');
  const [pairTargetRecordId, setPairTargetRecordId] = useState('');
  const [pairMode, setPairMode] = useState('masterSlave');
  const [showOptionalContacts, setShowOptionalContacts] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const imageCardRef = useRef(null);
  const [userInfo] = useState(() => ({
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
      setError(err.message || '加载档案数据失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberProfile = async (nextSession = session) => {
    setMemberLoading(true);
    try {
      const data = await memberCenterApi.getMemberProfile(nextSession, userInfo.userId, userInfo.nickname);
      setProfileDraft(data.profile);
      setShareLinks(data.shareLinks || []);
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
  const detailGroups = detailRecord ? groupRecordDetailsByRating(detailRecord) : [];
  const shareRecord = records.find(record => record.id === shareRecordId);
  const imageRecord = records.find(record => record.id === imageRecordId);
  const pairBaseRecord = records.find(record => record.id === pairBaseRecordId);
  const pairTargetRecord = records.find(record => record.id === pairTargetRecordId);
  const pairReport = useMemo(
    () => buildCompatibilityReport(pairBaseRecord, pairTargetRecord, pairMode),
    [pairBaseRecord, pairTargetRecord, pairMode]
  );
  const shareRecordLinks = shareRecord
    ? shareLinks.filter(link => link.record_id === shareRecord.id && link.is_active !== false)
    : [];
  const memberUsername = session?.user?.user_metadata?.username
    || profileDraft?.display_name
    || session?.user?.email?.split('@')[0]
    || '会员账号';

  const openPairDialog = (record) => {
    setPairBaseRecordId(record.id);
    const firstOther = records.find(candidate => candidate.id !== record.id);
    setPairTargetRecordId(firstOther?.id || '');
    setPairMode('masterSlave');
  };

  const createShareLinkForRecord = async () => {
    if (!shareRecord) return;
    setShareCreating(true);
    try {
      const link = await memberCenterApi.createShareLink(session, userInfo.userId, {
        record_id: shareRecord.id,
        title: buildRecordTitle(shareRecord),
        access_code: shareAccessCode.trim() || null,
        hidden_sections: [],
        expires_at: null
      });
      setShareLinks(prev => [link, ...prev.filter(item => item.id !== link.id)]);
      setShareAccessCode('');
      setSnackbar('分享链接已生成。');
    } catch (err) {
      setSnackbar(err.message || '创建分享链接失败');
    } finally {
      setShareCreating(false);
    }
  };

  const copyShareLink = async (link) => {
    const url = buildShareUrl(link.share_token);
    try {
      await navigator.clipboard.writeText(url);
      setSnackbar('分享链接已复制。');
    } catch (err) {
      setSnackbar('浏览器不允许自动复制，请手动复制链接。');
    }
  };

  const deactivateShareLink = async (link) => {
    try {
      await memberCenterApi.deactivateShareLink(session, link.id);
      setShareLinks(prev => prev.map(item => item.id === link.id ? { ...item, is_active: false } : item));
      setSnackbar('分享链接已停用。');
    } catch (err) {
      setSnackbar(err.message || '停用分享链接失败');
    }
  };

  const saveRecordImage = async () => {
    if (!imageRecord || !imageCardRef.current) return;
    setImageExporting(true);
    try {
      const blob = await createReportImageBlob(imageCardRef.current);
      const result = await saveReportImageBlob({
        blob,
        filename: `mprofile-${imageRecord.test_type}-${new Date(imageRecord.created_at).toISOString().slice(0, 10)}.png`,
        title: buildRecordTitle(imageRecord),
        text: 'M-profile Lab 测评记录'
      });
      setSnackbar(result.message || '图片已生成。');
    } catch (err) {
      setSnackbar(err.message || '保存图片失败');
    } finally {
      setImageExporting(false);
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
            display_name: authForm.username,
            qq: authForm.qq,
            wechat: authForm.wechat,
            contact_email: authForm.email,
            phone: authForm.phone,
            privacy_settings: { hideUserId: true, hideSensitiveItems: true, allowPrivateShare: true },
            notification_settings: { monthlySummary: true, trendReminder: false }
          });
          setProfileDraft(savedProfile);
        }
        setSnackbar(authMode === 'register' ? '注册成功，记录将自动同步。' : '登录成功，记录将自动同步。');
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
      setProfileDraft(null);
      setShareLinks([]);
      setSnackbar('已退出账号。你仍可继续使用游客模式测评。');
    } catch (err) {
      setSnackbar(err.message || '退出失败');
    }
  };

  const saveProfile = async () => {
    try {
      const saved = await memberCenterApi.updateMemberProfile(session, profileDraft);
      setProfileDraft(saved);
      setSnackbar('联系方式已保存。');
    } catch (err) {
      setSnackbar(err.message || '保存失败');
    }
  };

  const deleteMemberRecord = async () => {
    try {
      await memberCenterApi.deleteMemberRecord(session, deleteRecordId);
      setRecords(prev => prev.filter(record => record.id !== deleteRecordId));
      setDetailRecordId('');
      setDeleteRecordId('');
      setSnackbar('记录已删除。');
    } catch (err) {
      setSnackbar(err.message || '删除记录失败');
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
              <Typography component="h1" className="member-title compact">保存你的测评变化</Typography>
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
                      helperText="用于账号联系，不会公开"
                      fullWidth
                    />
                    <Button onClick={() => setShowOptionalContacts(value => !value)} size="small">
                      {showOptionalContacts ? '收起选填联系方式' : '填写更多联系方式（选填）'}
                    </Button>
                    <Collapse in={showOptionalContacts}>
                      <Box className="optional-contact-grid">
                        <TextField size="small" label="QQ（选填）" value={authForm.qq} onChange={event => setAuthForm(prev => ({ ...prev, qq: event.target.value }))} />
                        <TextField size="small" label="微信（选填）" value={authForm.wechat} onChange={event => setAuthForm(prev => ({ ...prev, wechat: event.target.value }))} />
                        <TextField size="small" label="电话（选填）" value={authForm.phone} onChange={event => setAuthForm(prev => ({ ...prev, phone: event.target.value }))} />
                      </Box>
                    </Collapse>
                  </>
                )}
                <Button
                  onClick={submitAuth}
                  disabled={!authForm.username.trim() || !authForm.password || (authMode === 'register' && (!authForm.passwordConfirm || !authForm.email.trim()))}
                  className="member-outline-button auth-submit"
                >
                  {authMode === 'register' ? '注册并同步记录' : '登录并查看档案'}
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography className="muted-text">不注册也能继续测评。游客记录以匿名设备身份保存；注册后可跨设备同步和管理。</Typography>
            </Paper>
          </Box>
        ) : (
          <>
        <Box className="member-hero">
          <Box>
            <Typography component="h1" className="member-title">我的档案</Typography>
            <Typography className="member-subtitle">查看每次测评明细，对比具体项目变化，并管理云端记录。</Typography>
          </Box>
          <Box className="member-identity">
            <Typography className="member-identity-label">已登录账号</Typography>
            <Typography className="member-identity-name">{memberUsername}</Typography>
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
              <Button startIcon={<SaveAltIcon />} onClick={() => exportRecords(records)} disabled={records.length === 0}>
                导出数据
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Box className="member-loading"><CircularProgress /><Typography>正在读取云端记录...</Typography></Box>
        ) : (
          <Box className="member-content-flow">
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
              </Paper>
            </Box>

            <Paper className="member-card record-library-card">
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography className="card-title">测评记录库</Typography>
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
                          <Stack direction="row" spacing={0.5} className="record-action-stack">
                            <Button size="small" onClick={() => setDetailRecordId(record.id)}>查看明细</Button>
                            <Button size="small" startIcon={<LinkIcon />} onClick={() => setShareRecordId(record.id)}>分享</Button>
                            <Button size="small" startIcon={<ImageIcon />} onClick={() => setImageRecordId(record.id)}>保存图片</Button>
                            <Button size="small" startIcon={<CompareArrowsIcon />} onClick={() => openPairDialog(record)} disabled={records.length < 2}>双人分析</Button>
                            <Button size="small" color="error" onClick={() => setDeleteRecordId(record.id)}>删除</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        <Paper className="member-card member-profile-card">
          <Stack direction={{ xs: 'column', md: 'row' }} className="member-account-summary" spacing={2}>
            <Box className="member-account-main">
              <Typography className="card-title">账号与联系方式</Typography>
              <Typography className="member-account-name">已登录：{memberUsername}</Typography>
              <Typography className="muted-text">这些联系方式不会出现在公开测评报告中。</Typography>
            </Box>
            <Button onClick={logoutMember}>退出登录</Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {profileDraft ? (
            <Stack spacing={1.5} className="member-profile-form">
              <Box className="optional-contact-grid">
                <TextField size="small" label="QQ" value={profileDraft.qq || ''} onChange={event => setProfileDraft(prev => ({ ...prev, qq: event.target.value }))} disabled={!session} />
                <TextField size="small" label="微信" value={profileDraft.wechat || ''} onChange={event => setProfileDraft(prev => ({ ...prev, wechat: event.target.value }))} disabled={!session} />
                <TextField size="small" type="email" label="邮箱" value={profileDraft.contact_email || ''} onChange={event => setProfileDraft(prev => ({ ...prev, contact_email: event.target.value }))} disabled={!session} />
                <TextField size="small" label="电话" value={profileDraft.phone || ''} onChange={event => setProfileDraft(prev => ({ ...prev, phone: event.target.value }))} disabled={!session} />
              </Box>
              <Button onClick={saveProfile} disabled={!session || memberLoading}>保存联系方式</Button>
            </Stack>
          ) : (
            <Box className="empty-panel">正在读取账号资料...</Box>
          )}
        </Paper>
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
              {detailGroups.map(({ rating, details }) => (
                <Box key={rating} className="record-detail-group">
                  <Typography className="record-detail-category record-detail-rating-title" sx={{ color: RATING_COLORS[rating] || '#475569' }}>
                    {rating} ({details.length})
                  </Typography>
                  <Box className="record-detail-items">
                    {details.map(detail => (
                      <span key={`${detail.category}-${detail.item}`}>
                        <em>{detail.category}</em>{detail.item}
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
      <Dialog open={!!shareRecord} onClose={() => setShareRecordId('')} maxWidth="md" fullWidth>
        <DialogTitle>{shareRecord ? `分享 ${TEST_LABEL[shareRecord.test_type] || shareRecord.test_type}` : '分享测评记录'}</DialogTitle>
        <DialogContent dividers>
          {shareRecord ? (
            <Stack spacing={2}>
              <Typography className="muted-text">
                分享链接打开后会记录浏览次数。图片保存不会计入浏览次数。
              </Typography>
              <Box className="share-create-panel">
                <TextField
                  size="small"
                  label="访问密码（选填）"
                  value={shareAccessCode}
                  onChange={event => setShareAccessCode(event.target.value)}
                  helperText="不填写则任何拿到链接的人都能查看。"
                  fullWidth
                />
                <Button
                  onClick={createShareLinkForRecord}
                  disabled={shareCreating}
                  startIcon={shareCreating ? <CircularProgress size={16} /> : <LinkIcon />}
                >
                  生成分享链接
                </Button>
              </Box>
              {shareRecordLinks.length ? (
                <Box className="share-list">
                  {shareRecordLinks.map(link => {
                    const url = buildShareUrl(link.share_token);
                    return (
                      <Box className="share-item detailed" key={link.id}>
                        <Box>
                          <strong>{link.title || '测评分享'}</strong>
                          <code>{url}</code>
                          <span>浏览 {link.view_count || 0} 次 · 创建于 {formatDateTime(link.created_at)}</span>
                        </Box>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyShareLink(link)}>复制</Button>
                          <Button size="small" href={url} target="_blank" rel="noopener noreferrer">打开</Button>
                          <Button size="small" color="error" onClick={() => deactivateShareLink(link)}>停用</Button>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box className="empty-panel compact">还没有为这条记录生成分享链接。</Box>
              )}
            </Stack>
          ) : (
            <Box className="empty-panel">未选择记录。</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareRecordId('')}>关闭</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!imageRecord} onClose={() => setImageRecordId('')} maxWidth="md" fullWidth>
        <DialogTitle>{imageRecord ? `保存 ${TEST_LABEL[imageRecord.test_type] || imageRecord.test_type} 图片` : '保存图片'}</DialogTitle>
        <DialogContent dividers>
          {imageRecord ? (
            <ForwardedRecordImageCard ref={imageCardRef} record={imageRecord} />
          ) : (
            <Box className="empty-panel">未选择记录。</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageRecordId('')}>关闭</Button>
          <Button onClick={saveRecordImage} disabled={!imageRecord || imageExporting} startIcon={imageExporting ? <CircularProgress size={16} /> : <ImageIcon />}>
            保存图片
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!pairBaseRecord} onClose={() => setPairBaseRecordId('')} maxWidth="lg" fullWidth>
        <DialogTitle>双人分析报告</DialogTitle>
        <DialogContent dividers>
          {pairBaseRecord ? (
            <Stack spacing={2}>
              <Typography className="muted-text">
                第一版先支持当前账号内两条记录对比。跨用户邀请选择记录会作为下一步接入。
              </Typography>
              <Box className="pair-controls">
                <TextField
                  select
                  size="small"
                  label="关系模式"
                  value={pairMode}
                  onChange={event => setPairMode(event.target.value)}
                >
                  <MenuItem value="masterSlave">主奴关系</MenuItem>
                  <MenuItem value="slaveSlave">奴奴关系</MenuItem>
                  <MenuItem value="masterMaster">主主关系</MenuItem>
                  <MenuItem value="partner">探索搭档</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="对比记录"
                  value={pairTargetRecordId}
                  onChange={event => setPairTargetRecordId(event.target.value)}
                >
                  {records.filter(record => record.id !== pairBaseRecord.id).map(record => (
                    <MenuItem key={record.id} value={record.id}>{buildRecordTitle(record)}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <PairReportPanel report={pairReport} baseRecord={pairBaseRecord} targetRecord={pairTargetRecord} />
            </Stack>
          ) : (
            <Box className="empty-panel">未选择记录。</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPairBaseRecordId('')}>关闭</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteRecordId} onClose={() => setDeleteRecordId('')} maxWidth="xs" fullWidth>
        <DialogTitle>删除这条测评记录？</DialogTitle>
        <DialogContent>
          <Typography>删除后无法恢复，该记录的具体测评明细也会一并删除。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRecordId('')}>取消</Button>
          <Button color="error" onClick={deleteMemberRecord}>确认删除</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snackbar} autoHideDuration={3600} onClose={() => setSnackbar('')} message={snackbar} />
    </Box>
  );
}

export default MemberCenterApp;
