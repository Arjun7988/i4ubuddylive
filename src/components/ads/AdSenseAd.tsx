import { useEffect } from 'react';
import { ADSENSE_CLIENT } from '../../config/adsense';

interface AdSenseAdProps {
  slotId: string;
  style?: React.CSSProperties;
  className?: string;
  format?: string;
}

export function AdSenseAd({ slotId, style, className = '', format = 'auto' }: AdSenseAdProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
