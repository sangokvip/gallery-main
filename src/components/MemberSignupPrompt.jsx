import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Snackbar } from '@mui/material'
import { memberCenterApi } from '../utils/supabase'

const SESSION_KEY = 'mprofile_member_signup_prompt_seen'

export function useMemberSignupPrompt() {
  const [open, setOpen] = useState(false)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    let cancelled = false
    memberCenterApi.getAuthSession()
      .then(session => {
        if (!cancelled) setIsMember(Boolean(session?.user?.id))
      })
      .catch(() => {
        if (!cancelled) setIsMember(false)
      })
    return () => { cancelled = true }
  }, [])

  const showMemberSignupPrompt = useCallback(() => {
    if (isMember) return
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_KEY) === '1') {
      return
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_KEY, '1')
    }
    setOpen(true)
  }, [isMember])

  const closePrompt = useCallback(() => {
    setOpen(false)
  }, [])

  const MemberSignupPromptSnackbar = (
    <Snackbar
      open={open}
      autoHideDuration={9000}
      onClose={closePrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 84, sm: 32 } }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={closePrompt}
        sx={{
          width: '100%',
          maxWidth: { xs: 'calc(100vw - 24px)', sm: 620 },
          alignItems: 'center',
          '& .MuiAlert-message': {
            fontWeight: 700,
            lineHeight: 1.45
          }
        }}
        action={
          <>
            <Button color="inherit" size="small" href="/member.html" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
              注册并同步
            </Button>
            <Button color="inherit" size="small" onClick={closePrompt} sx={{ whiteSpace: 'nowrap' }}>
              稍后
            </Button>
          </>
        }
      >
        这份报告已保存到当前设备。注册后可跨设备查看，并自动对比以后每次变化。
      </Alert>
    </Snackbar>
  )

  return {
    isMember,
    memberStatusLabel: isMember ? '已登录 · 记录自动同步' : '游客模式 · 记录仅此设备可访问',
    showMemberSignupPrompt,
    MemberSignupPromptSnackbar
  }
}
