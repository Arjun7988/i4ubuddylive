import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (place: PlaceResult) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export function GooglePlacesAutocomplete({ value, onChange, error, label = 'Location', required = false }: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.warn('Google Maps API key not configured');
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Failed to load Google Maps API');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['formatted_address', 'geometry', 'place_id', 'address_components'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location) {
          let city = '';
          let state = '';
          let country = '';
          let postalCode = '';

          if (place.address_components) {
            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
              } else if (types.includes('country')) {
                country = component.long_name;
              } else if (types.includes('postal_code')) {
                postalCode = component.long_name;
              }
            }
          }

          const result: PlaceResult = {
            address: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id || '',
            city,
            state,
            country,
            postalCode,
          };
          setInputValue(result.address);
          onChange(result);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, [isLoaded, onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isConfigured = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isConfigured ? "Search for a location..." : "Enter location manually"}
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      {!isConfigured && (
        <p className="mt-1 text-xs text-yellow-500">
          Google Maps API key not configured. Location search is disabled.
        </p>
      )}
    </div>
  );
}
