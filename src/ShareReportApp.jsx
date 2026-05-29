import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import './styles/member-center.css';

const TEST_LABEL = { female: '女M测试', male: '男M测试', s: 'S型测试', lgbt: 'LGBT+探索' };
const RATING_ORDER = ['SSS', 'SS', 'S', 'Q', 'N', 'W'];
const RATING_WEIGHT = { SSS: 6, SS: 5, S: 4, Q: 3, N: 2, W: 1 };

function summarize(record) {
  const counts = RATING_ORDER.reduce((acc, rating) => ({ ...acc, [rating]: 0 }), {});
  const categoryScores = {};
  let weightedTotal = 0;
  let ratedCount = 0;

  (record.details || []).forEach(detail => {
    if (!RATING_ORDER.includes(detail.rating)) return;
    counts[detail.rating] += 1;
    weightedTotal += RATING_WEIGHT[detail.rating];
    ratedCount += 1;
    if (!categoryScores[detail.category]) categoryScores[detail.category] = { total: 0, count: 0 };
    categoryScores[detail.category].total += RATING_WEIGHT[detail.rating];
    categoryScores[detail.category].count += 1;
  });

  const topCategories = Object.entries(categoryScores)
    .map(([category, value]) => ({
      category: category.replace(/^[^\s]+\s*/, ''),
      score: Number((value.total / value.count).toFixed(2))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    counts,
    ratedCount: ratedCount || record.report_data?.completedItems || 0,
    totalItems: record.details?.length || record.report_data?.totalItems || ratedCount,
    averageScore: ratedCount ? weightedTotal / ratedCount : 0,
    topCategories
  };
}

function ShareReportApp() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    (async () => {
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) {
        setError('缺少分享 token');
        setLoading(false);
        return;
      }
      setToken(token);
      try {
        const data = await memberCenterApi.getPublicShare(token);
        setPayload(data);
        setAccessGranted(!data?.requiresAccessCode);
      } catch (err) {
        setError(err.message || '分享链接读取失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => payload?.record ? summarize(payload.record) : null, [payload]);
  const hideItems = (payload?.link?.hidden_sections || []).includes('items');
  const ratingData = summary ? RATING_ORDER.map(rating => ({ rating, count: summary.counts[rating] })) : [];
  const requiresAccessCode = !!payload?.requiresAccessCode;

  const verifyAccessCode = async () => {
    try {
      const data = await memberCenterApi.getPublicShare(token, accessCode.trim());
      if (data?.requiresAccessCode) {
        setAccessError('访问密码不正确');
        return;
      }
      setPayload(data);
      setAccessGranted(true);
      setAccessError('');
      return;
    } catch (err) {
      setAccessError(err.message || '访问密码验证失败');
    }
  };

  return (
    <Box className="member-shell">
      <Box component="header" className="member-nav">
        <a className="member-logo" href="/index.html">M-profile Lab</a>
        <Box className="member-nav-actions">
          <Button href="/index.html" startIcon={<HomeIcon />} className="member-outline-button">首页</Button>
          <Button href="/member.html" className="member-outline-button">会员中心</Button>
        </Box>
      </Box>

      <Container maxWidth="lg" className="member-container">
        {loading ? (
          <Box className="member-loading"><CircularProgress /><Typography>正在读取分享报告...</Typography></Box>
        ) : error ? (
          <Paper className="member-card auth-card">
            <Typography component="h1" className="member-title">分享不可用</Typography>
            <Alert severity="error" className="member-alert">{error}</Alert>
          </Paper>
        ) : requiresAccessCode && !accessGranted ? (
          <Paper className="member-card auth-card">
            <Typography component="h1" className="member-title">输入访问密码</Typography>
            <Typography className="member-subtitle">分享者为这份报告设置了访问密码。验证后才能查看报告内容。</Typography>
            {accessError && <Alert severity="error" className="member-alert">{accessError}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                type="password"
                label="访问密码"
                value={accessCode}
                onChange={event => setAccessCode(event.target.value)}
                fullWidth
              />
              <Button onClick={verifyAccessCode} disabled={!accessCode.trim()} className="member-outline-button">查看报告</Button>
            </Stack>
          </Paper>
        ) : (
          <>
            <Box className="member-hero">
              <Box>
                <Typography component="h1" className="member-title">{payload.link.title}</Typography>
                <Typography className="member-subtitle">这是会员生成的私密测评报告分享页，只展示经过隐私设置处理后的内容。</Typography>
              </Box>
              <Box className="member-identity">
                <Typography className="member-identity-label">报告类型</Typography>
                <Typography className="member-identity-name">{TEST_LABEL[payload.record.test_type] || payload.record.test_type}</Typography>
                <Typography className="member-identity-id">{new Date(payload.record.created_at).toLocaleString('zh-CN')}</Typography>
              </Box>
            </Box>

            <Box className="member-grid stats-grid">
              <Paper className="member-card stat-card"><span>{summary.ratedCount}</span><p>已评测项</p></Paper>
              <Paper className="member-card stat-card"><span>{summary.totalItems}</span><p>总项目</p></Paper>
              <Paper className="member-card stat-card"><span>{summary.counts.SSS}</span><p>SSS 项</p></Paper>
              <Paper className="member-card stat-card"><span>{summary.averageScore.toFixed(2)}</span><p>综合强度</p></Paper>
            </Box>

            <Box className="member-grid charts-grid">
              <Paper className="member-card chart-card">
                <Typography className="card-title">评级分布</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#111827" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              <Paper className="member-card chart-card">
                <Typography className="card-title">突出维度</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={summary.topCategories}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 6]} />
                    <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>
            </Box>

            <Paper className="member-card">
              <Typography className="card-title">报告摘要</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {summary.topCategories.slice(0, 5).map(item => <Chip key={item.category} label={`${item.category} ${item.score}`} />)}
              </Stack>
              {hideItems ? (
                <Alert severity="info" sx={{ mt: 2 }}>分享者已隐藏敏感明细项，仅展示汇总图表。</Alert>
              ) : (
                <Box className="shared-item-list">
                  {(payload.record.details || []).slice(0, 80).map((item, index) => (
                    <span key={`${item.category}-${item.item}-${index}`}>{item.rating} · {item.item || item.category}</span>
                  ))}
                </Box>
              )}
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}

export default ShareReportApp;
