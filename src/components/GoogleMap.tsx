import { useEffect, useRef, useState } from 'react';
import { MapPin, Share2 } from 'lucide-react';

interface GoogleMapProps {
  lat: number;
  lng: number;
  address: string;
}

export function GoogleMap({ lat, lng, address }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      const position = { lat, lng };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: address,
      });
    } catch (error) {
      console.error('Error initializing Google Map:', error);
    }
  }, [isLoaded, lat, lng, address]);

  const handleShareLocation = () => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    if (navigator.share) {
      navigator.share({
        title: 'Event Location',
        text: address,
        url: googleMapsUrl,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleOpenInMaps = () => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isConfigured = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  if (!isConfigured) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <div className="flex items-start gap-3 mb-4">
          <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Location</h3>
            <p className="text-gray-300">{address}</p>
          </div>
        </div>
        <button
          onClick={handleOpenInMaps}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Open in Google Maps
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Location</h3>
            <p className="text-gray-300 text-sm">{address}</p>
          </div>
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full h-64 bg-slate-900"
      />

      <div className="p-4 flex gap-2">
        <button
          onClick={handleOpenInMaps}
          className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700"
        >
          <MapPin className="w-4 h-4" />
          Open in Maps
        </button>
        <button
          onClick={handleShareLocation}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Location
        </button>
      </div>
    </div>
  );
}
