import React, { useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
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
        mb: 2,
        p: { xs: 1, sm: 1.25 },
        bgcolor: 'background.paper',
        border: `1px solid ${accentColor}`
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 800 }}>
          已完成 {flow.answeredCount}/{flow.totalCount}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={overallPercent}
          aria-label={`全部题目已完成 ${overallPercent}%`}
          sx={{ flex: 1, height: 5, minWidth: 48, '& .MuiLinearProgress-bar': { bgcolor: accentColor } }}
        />
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{overallPercent}%</Typography>
        <Box
          component="details"
          sx={{
            position: 'relative',
            '& summary': { cursor: 'pointer', color: accentColor, fontWeight: 800, whiteSpace: 'nowrap' }
          }}
        >
          <Box component="summary" aria-label="展开批量工具">工具</Box>
          <Box sx={{
            position: 'absolute',
            zIndex: 10,
            top: 'calc(100% + 8px)',
            right: 0,
            width: { xs: 'calc(100vw - 32px)', sm: 340 },
            maxWidth: 340,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
            p: 1.25,
            bgcolor: 'background.paper',
            border: `1px solid ${accentColor}`,
            boxShadow: `4px 4px 0 ${accentColor}`
          }}>
            <Select
              size="small"
              value={flow.activeCategory}
              onChange={event => flow.setActiveCategory(event.target.value)}
              aria-label="选择批量操作的题目分类"
              sx={{ minWidth: { xs: '100%', sm: 200 } }}
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
            <Button size="small" variant="outlined" onClick={flow.undoCategoryRating} disabled={!flow.canUndo}>撤销</Button>
            <FormControlLabel
              control={<Switch size="small" checked={flow.showIncompleteOnly} onChange={event => flow.setShowIncompleteOnly(event.target.checked)} />}
              label="只看未完成"
            />
          </Box>
        </Box>
      </Box>
      {flow.showIncompleteOnly && flow.visibleCategoryEntries.every(([, items]) => items.length === 0) && (
        <Typography role="status" sx={{ mt: 2, fontWeight: 700 }}>全部分类已完成。</Typography>
      )}
    </Box>
  )
}
