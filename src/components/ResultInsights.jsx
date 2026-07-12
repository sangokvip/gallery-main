import React, { useMemo } from 'react'
import { Box, Chip, Typography } from '@mui/material'

export default function ResultInsights({ data, ratings, accentColor = '#111' }) {
  const insights = useMemo(() => {
    const ranked = [...data].filter(item => item.value > 0).sort((a, b) => b.value - a.value)
    const top = ranked.slice(0, 3)
    const values = Object.values(ratings)
    return {
      top,
      strong: values.filter(value => ['SSS', 'SS', 'S'].includes(value)).length,
      discuss: values.filter(value => value === 'Q').length,
      boundary: values.filter(value => value === 'N').length,
      unknown: values.filter(value => value === 'W').length
    }
  }, [data, ratings])

  return (
    <Box sx={{ mb: 3, p: { xs: 2, md: 2.5 }, border: `2px solid ${accentColor}`, bgcolor: '#fff' }}>
      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>结果怎么理解</Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.8, mb: 2 }}>
        {insights.top.length
          ? `目前较突出的分类是 ${insights.top.map(item => item.category).join('、')}。分数表示你在本次自评中的选择强度，不代表人格诊断，也不代表任何行为已经获得同意。`
          : '你还没有完成足够题目。建议先完成各分类，再查看完整解释。'}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Chip label={`偏好较明确 ${insights.strong}`} />
        <Chip label={`需要沟通 ${insights.discuss}`} />
        <Chip label={`明确边界 ${insights.boundary}`} />
        <Chip label={`尚未探索 ${insights.unknown}`} />
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>沟通建议</Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
        先分享“明确边界”和“需要沟通”的项目，再讨论偏好。任何一方的拒绝都应直接停止讨论或行为；尚未探索不等于默认接受，所有同意都应具体、持续且可随时撤回。
      </Typography>
    </Box>
  )
}
