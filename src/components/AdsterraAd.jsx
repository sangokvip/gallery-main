import React from 'react';
import { Box } from '@mui/material';

/**
 * AdsterraAd Component
 * 
 * @param {string} adId - The Adsterra Ad Unit ID
 * @param {string} format - The format of the ad ('728x90', '300x250', '320x50')
 * @param {boolean} isMobile - Whether to show the ad only on mobile
 * @param {boolean} isDesktop - Whether to show the ad only on desktop
 */
const AdsterraAd = ({ adId, format, isMobile = false, isDesktop = false }) => {
  const adConfig = {
    '728x90': {
      key: '8f5012ad7813895d96ee3b7f87f46699',
      width: 728,
      height: 90
    },
    '300x250': {
      key: '6c350fa04d15cd17c8ca02c122f58c70',
      width: 300,
      height: 250
    },
    '320x50': {
      key: '61f179118b998d9972810584f42f3688',
      width: 320,
      height: 50
    }
  };

  const config = adConfig[format];
  if (!config) return null;

  const currentKey = adId && adId !== 'YOUR_AD_ID' ? adId : config.key;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; background: transparent; }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${currentKey}',
            'format' : 'iframe',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/${currentKey}/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <Box 
      sx={{ 
        width: '100%', 
        my: 2, 
        display: {
          xs: isDesktop ? 'none' : 'flex',
          md: isMobile ? 'none' : 'flex'
        }, 
        justifyContent: 'center',
        minHeight: '50px',
        overflow: 'hidden'
      }}
      id={`adsterra-${adId || format}`}
    >
      <iframe
        srcDoc={htmlContent}
        width={config.width}
        height={config.height}
        frameBorder="0"
        scrolling="no"
        // 核心安全策略：不允许 allow-top-navigation，彻底阻断广告脚本导致的原网页跳转
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
        style={{ border: 'none', overflow: 'hidden', display: 'block' }}
        title="Advertisement"
      />
    </Box>
  );
};

export default AdsterraAd;
