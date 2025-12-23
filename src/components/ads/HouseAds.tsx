import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ExternalLink } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  action_type: 'redirect' | 'popup';
  popup_image_url: string | null;
  popup_description: string | null;
  placement: string;
  position: number;
}

interface HouseAdsProps {
  page: string;
  placement: 'top' | 'bottom' | 'right' | 'sidebar' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  limit?: number;
}

export function HouseAds({ page, placement, className = '', limit = 1 }: HouseAdsProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [page, placement]);

  const fetchAds = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const placementMap: Record<string, string[]> = {
        'top': ['TOP_LEFT', 'TOP_RIGHT'],
        'top-left': ['TOP_LEFT'],
        'top-right': ['TOP_RIGHT'],
        'bottom': ['FOOTER_LEFT', 'FOOTER_RIGHT'],
        'bottom-left': ['FOOTER_LEFT'],
        'bottom-right': ['FOOTER_RIGHT'],
        'right': ['RIGHT'],
        'sidebar': ['RIGHT']
      };

      const dbPlacements = placementMap[placement] || [placement];

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .contains('pages', [page])
        .in('placement', dbPlacements)
        .eq('status', 'ACTIVE')
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('position', { ascending: true })
        .limit(limit);

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = (ad: Ad) => {
    if (ad.action_type === 'redirect' && ad.redirect_url) {
      window.open(ad.redirect_url, '_blank');
    } else if (ad.action_type === 'popup') {
      alert(`${ad.title}\n\n${ad.popup_description || ''}`);
    }
  };

  if (loading || ads.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ads.map((ad) => (
        ad.image_url && (
          <button
            key={ad.id}
            type="button"
            onClick={() => handleAdClick(ad)}
            className="block w-full"
          >
            <img
              src={ad.image_url}
              alt={ad.title}
              className={
                placement === 'right' || placement === 'sidebar'
                  ? 'w-full max-h-[420px] object-cover rounded-2xl border border-slate-800 shadow-md'
                  : 'w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md'
              }
            />
          </button>
        )
      ))}
    </div>
  );
}
