import React, { useCallback, useState } from 'react'
import { Alert, Button, Snackbar } from '@mui/material'

const SESSION_KEY = 'mprofile_member_signup_prompt_seen'

export function useMemberSignupPrompt() {
  const [open, setOpen] = useState(false)

  const showMemberSignupPrompt = useCallback(() => {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_KEY) === '1') {
      return
    }
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_KEY, '1')
    }
    setOpen(true)
  }, [])

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
              去注册
            </Button>
            <Button color="inherit" size="small" onClick={closePrompt} sx={{ whiteSpace: 'nowrap' }}>
              稍后
            </Button>
          </>
        }
      >
        注册后可云同步保存记录，查看每次变化趋势，并生成私密分享链接。
      </Alert>
    </Snackbar>
  )

  return { showMemberSignupPrompt, MemberSignupPromptSnackbar }
}
