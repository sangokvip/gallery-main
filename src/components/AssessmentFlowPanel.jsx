import React, { useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  Typography
} from '@mui/material'

export function useAssessmentFlow({ categories, ratings, setRatings, notify }) {
  const categoryNames = useMemo(() => Object.keys(categories), [categories])
  const [activeCategory, setActiveCategory] = useState(categoryNames[0])
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false)
  const previousRatings = useRef(null)

  const allItems = useMemo(
    () => Object.entries(categories).flatMap(([category, items]) =>
      items.map(item => `${category}-${item}`)
    ),
    [categories]
  )
  const answeredCount = allItems.filter(key => Boolean(ratings[key])).length
  const activeIndex = Math.max(0, categoryNames.indexOf(activeCategory))
  const activeItems = categories[activeCategory] || []
  const activeAnsweredCount = activeItems.filter(item => Boolean(ratings[`${activeCategory}-${item}`])).length

  const visibleCategoryEntries = Object.entries(categories).map(([category, items]) => [
    category,
    showIncompleteOnly
      ? items.filter(item => !ratings[`${category}-${item}`])
      : items
  ])

  const setCategoryRating = (rating) => {
    if (!rating) return
    previousRatings.current = ratings
    setRatings(prev => {
      const next = { ...prev }
      activeItems.forEach(item => {
        next[`${activeCategory}-${item}`] = rating
      })
      return next
    })
    notify?.(`已将“${activeCategory}”全部设为 ${rating}，可撤销`)
  }

  const undoCategoryRating = () => {
    if (!previousRatings.current) return
    setRatings(previousRatings.current)
    previousRatings.current = null
    notify?.('已撤销上一次批量设置')
  }

  return {
    activeCategory,
    setActiveCategory,
    showIncompleteOnly,
    setShowIncompleteOnly,
    categoryNames,
    activeIndex,
    activeItems,
    activeAnsweredCount,
    answeredCount,
    totalCount: allItems.length,
    visibleCategoryEntries,
    setCategoryRating,
    undoCategoryRating,
    canUndo: Boolean(previousRatings.current),
    isLastCategory: activeIndex === categoryNames.length - 1
  }
}

export default function AssessmentFlowPanel({ flow, ratingOptions, accentColor = '#111' }) {
  const overallPercent = flow.totalCount
    ? Math.round((flow.answeredCount / flow.totalCount) * 100)
    : 0

  return (
    <Box
      component="section"
      aria-label="答题进度与分类导航"
      sx={{
        position: 'sticky',
        top: { xs: 64, md: 72 },
        zIndex: 5,
        mb: 3,
        p: { xs: 2, md: 2.5 },
        bgcolor: 'background.paper',
        border: `2px solid ${accentColor}`,
        boxShadow: `4px 4px 0 ${accentColor}`
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Box>
          <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>
            全部分类一览
          </Typography>
          <Typography variant="body2" color="text.secondary">
            当前批量操作目标：{flow.activeCategory}（{flow.activeAnsweredCount}/{flow.activeItems.length} 已完成）
          </Typography>
        </Box>
        <Chip label={`${overallPercent}% 已完成`} sx={{ fontWeight: 700 }} />
      </Box>
      <LinearProgress
        variant="determinate"
        value={overallPercent}
        aria-label={`全部题目已完成 ${overallPercent}%`}
        sx={{ height: 8, mb: 2, '& .MuiLinearProgress-bar': { bgcolor: accentColor } }}
      />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select
          size="small"
          value={flow.activeCategory}
          onChange={event => flow.setActiveCategory(event.target.value)}
          aria-label="选择批量操作的题目分类"
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
        >
          {flow.categoryNames.map((category, index) => (
            <MenuItem key={category} value={category}>{index + 1}. {category}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value=""
          displayEmpty
          onChange={event => flow.setCategoryRating(event.target.value)}
          renderValue={() => '本类统一设置'}
          aria-label="将当前分类统一设为同一等级"
          sx={{ minWidth: 150 }}
        >
          {ratingOptions.map(rating => <MenuItem key={rating} value={rating}>{rating}</MenuItem>)}
        </Select>
        <Button variant="outlined" onClick={flow.undoCategoryRating} disabled={!flow.canUndo}>撤销批量设置</Button>
        <FormControlLabel
          control={<Switch checked={flow.showIncompleteOnly} onChange={event => flow.setShowIncompleteOnly(event.target.checked)} />}
          label="只看未完成"
        />
      </Box>
      {flow.showIncompleteOnly && flow.visibleCategoryEntries.every(([, items]) => items.length === 0) && (
        <Typography role="status" sx={{ mt: 2, fontWeight: 700 }}>全部分类已完成。</Typography>
      )}
    </Box>
  )
}
