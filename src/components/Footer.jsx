import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

// 像素风格页脚组件
const Footer = ({ pixelStyle = false, pinkStyle = false, redStyle = false }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 2,
        ...(pixelStyle && pinkStyle ? {
          background: '#fff0f5',
          border: '4px solid #ff69b4',
          borderStyle: 'double',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(45deg, #ff69b4 0px, #ff69b4 2px, transparent 2px, transparent 4px)',
            opacity: 0.15,
            pointerEvents: 'none'
          }
        } : pixelStyle && redStyle ? {
          background: '#ff0000',
          border: '4px solid #ffffff',
          borderStyle: 'double',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 4px)',
            opacity: 0.15,
            pointerEvents: 'none'
          }
        } : pixelStyle ? {
          background: '#000000',
          border: '4px solid #ffffff',
          borderStyle: 'double',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 4px)',
            opacity: 0.15,
            pointerEvents: 'none'
          }
        } : {
          background: '#ff0000',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        })
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: { xs: 'center', sm: 'left' },
            gap: 2
          }}
        >
          <Typography 
            variant="body2" 
            color="white"
            sx={{
              ...(pixelStyle && {
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                textShadow: '2px 2px 0px #000000',
              })
            }}
          >
            © {currentYear} M-Profile Lab. All rights reserved.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 2, sm: 3 },
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <Link
              href="https://t.me/+ZEKnJ11Xu8U1ZTll"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              underline="hover"
              sx={{
                color: 'white',
                ...(pixelStyle && {
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  textShadow: '2px 2px 0px #000000',
                  '&:hover': {
                    color: '#ffffff',
                    textShadow: '2px 2px 0px #000000, 0 0 8px #ffffff'
                  }
                })
              }}
            >
              联系我们
            </Link>
            <Link 
              href="#" 
              color="inherit"
              underline="hover"
              sx={{
                color: 'white',
                ...(pixelStyle && {
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  textShadow: '2px 2px 0px #000000',
                  '&:hover': {
                    color: '#ffffff',
                    textShadow: '2px 2px 0px #000000, 0 0 8px #ffffff'
                  }
                })
              }}
            >
              隐私政策
            </Link>
            <Link 
              href="#" 
              color="inherit"
              underline="hover"
              sx={{
                color: 'white',
                ...(pixelStyle && {
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  textShadow: '2px 2px 0px #000000',
                  '&:hover': {
                    color: '#ffffff',
                    textShadow: '2px 2px 0px #000000, 0 0 8px #ffffff'
                  }
                })
              }}
            >
              使用条款
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;