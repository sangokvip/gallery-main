import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

/**
 * AdsterraAd Component
 * 
 * @param {string} adId - The Adsterra Ad Unit ID
 * @param {string} format - The format of the ad ('728x90', '300x250', '320x50', 'social-bar')
 * @param {string} format - The format of the ad ('728x90', '300x250', '320x50', 'socialBar')
 * @param {boolean} isMobile - Whether to show the ad only on mobile
 * @param {boolean} isDesktop - Whether to show the ad only on desktop
 */
const AdsterraAd = ({ adId, format, isMobile = false, isDesktop = false }) => {
  const adContainerRef = useRef(null);

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
    },
    'socialBar': {
      scriptUrl: 'https://pl29385047.profitablecpmratenetwork.com/ff/01/6b/ff016b62b58ab0ca89795f94c29c86e8.js'
    }
  };

  useEffect(() => {
    // Determine if we should render based on viewport
    const width = window.innerWidth;
    if (isMobile && width > 768) return;
    if (isDesktop && width <= 768) return;

    if (!adContainerRef.current) return;

    // 清理之前的广告内容
    adContainerRef.current.innerHTML = '';

    if (format === 'socialBar') {
      const script = document.createElement('script');
      script.src = adConfig.socialBar.scriptUrl;
      script.async = true;
      adContainerRef.current.appendChild(script);
      return;
    }

    const config = adConfig[format];
    if (!config) return;

    const currentKey = adId && adId !== 'YOUR_AD_ID' ? adId : config.key;

    // 创建广告配置脚本
    const scriptConfig = document.createElement('script');
    scriptConfig.type = 'text/javascript';
    scriptConfig.innerHTML = `
      atOptions = {
        'key' : '${currentKey}',
        'format' : 'iframe',
        'height' : ${config.height},
        'width' : ${config.width},
        'params' : {}
      };
    `;
    adContainerRef.current.appendChild(scriptConfig);

    // 创建广告调用脚本
    const scriptInvoke = document.createElement('script');
    scriptInvoke.type = 'text/javascript';
    scriptInvoke.src = `https://www.highperformanceformat.com/${currentKey}/invoke.js`;
    adContainerRef.current.appendChild(scriptInvoke);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
    };
  }, [format, adId, isMobile, isDesktop]);

  // Handle placeholders for development
  if (adId === 'YOUR_AD_ID' && format !== 'socialBar') {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          my: 2, 
          display: 'flex', 
          justifyContent: 'center',
          border: '1px dashed #ccc',
          bgcolor: 'rgba(0,0,0,0.02)',
          p: 2,
          textAlign: 'center'
        }}
      >
        <Box>
          <div style={{ fontSize: '12px', color: '#999' }}>ADSTERRA AD PLACEHOLDER</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Format: {format}</div>
          <div style={{ fontSize: '10px' }}>ID: {adId}</div>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      ref={adRef}
      sx={{ 
        width: '100%', 
        my: 2, 
        display: 'flex', 
        justifyContent: 'center',
        minHeight: format === 'social-bar' ? 0 : '50px',
        overflow: 'hidden'
      }}
      id={`adsterra-${adId}`}
    />
  );
};

export default AdsterraAd;
