import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

export default function QrCallout({ accentColor, className }) {
  return (
    <Paper
      elevation={0}
      className={className}
      sx={{
        width: 'min(100%, 340px)',
        p: { xs: 2, sm: 2.5 },
        textAlign: 'center',
        backgroundColor: '#fff',
        border: `3px solid ${accentColor}`,
        borderRadius: 0,
        boxShadow: `6px 6px 0 ${accentColor}`
      }}
    >
      <Typography component="h2" variant="h6" sx={{ color: accentColor, fontWeight: 800, lineHeight: 1.25, mb: 0.5 }}>
        扫码获取 XP 报告
      </Typography>
      <Typography component="p" sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2 }}>
        或访问 <Box component="span" sx={{ color: accentColor, fontWeight: 800, whiteSpace: 'nowrap' }}>bdsm.casa</Box>
      </Typography>
      <Box sx={{ display: 'inline-flex', p: 1, border: `2px solid ${accentColor}`, backgroundColor: '#fff' }}>
        <Box
          component="img"
          src="/qrcode.png"
          alt="访问 bdsm.casa 的二维码"
          sx={{ width: { xs: 176, sm: 196 }, height: { xs: 176, sm: 196 }, display: 'block' }}
        />
      </Box>
    </Paper>
  )
}
