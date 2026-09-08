'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { GeocodingService } from '../lib/location/geocoding';
import { GeocodingResult, GPSCoordinates } from '../lib/location/types';
import { LocationService } from '../lib/location/location-service';

interface LocationPickerProps {
  selectedLocation: GeocodingResult | null;
  onSelectLocation: (loc: GeocodingResult) => void;
  radiusMeters: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocation,
  onSelectLocation,
  radiusMeters,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrentLoc, setIsGettingCurrentLoc] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const defaultCenter = selectedLocation
    ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
    : { lat: 12.9784, lng: 77.5684 };

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await GeocodingService.searchPlaces(query);
        setSearchResults(results);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([defaultCenter.lat, defaultCenter.lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        map.on('click', async (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          const shortName = await GeocodingService.reverseGeocode(lat, lng);
          onSelectLocation({
            placeId: `custom-${Date.now()}`,
            displayName: shortName,
            shortName: shortName,
            latitude: lat,
            longitude: lng,
          });
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      const center: [number, number] = [selectedLocation.latitude, selectedLocation.longitude];

      map.setView(center, 13);

      if (markerRef.current) {
        markerRef.current.setLatLng(center);
      } else {
        markerRef.current = L.marker(center).addTo(map);
      }

      if (circleRef.current) {
        circleRef.current.setLatLng(center);
        circleRef.current.setRadius(radiusMeters);
      } else {
        circleRef.current = L.circle(center, {
          radius: radiusMeters,
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.25,
          weight: 2.5,
        }).addTo(map);
      }
    });
  }, [selectedLocation, radiusMeters, mapLoaded]);

  const handleUseCurrentLocation = async () => {
    setIsGettingCurrentLoc(true);
    try {
      const pos: GPSCoordinates = await LocationService.getCurrentLocation();
      const name = await GeocodingService.reverseGeocode(pos.latitude, pos.longitude);

      const loc: GeocodingResult = {
        placeId: `current-${Date.now()}`,
        displayName: name,
        shortName: name,
        latitude: pos.latitude,
        longitude: pos.longitude,
      };

      onSelectLocation(loc);
      setQuery('');
      setSearchResults([]);
    } catch (err: any) {
      alert(`Could not fetch current location: ${err.message || err}`);
    } finally {
      setIsGettingCurrentLoc(false);
    }
  };

  const handleSelectSearchResult = (res: GeocodingResult) => {
    onSelectLocation(res);
    setQuery(res.shortName);
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative space-y-2.5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destination, station, city, or address..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base shadow-sm transition"
          />
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isGettingCurrentLoc}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center space-x-2 text-sm font-bold transition shadow-sm group"
        >
          {isGettingCurrentLoc ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 text-emerald-600 group-hover:rotate-45 transition transform" />
          )}
          <span>{isGettingCurrentLoc ? 'Obtaining GPS location...' : 'Use Current GPS Location'}</span>
        </button>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-16 left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 backdrop-blur-xl">
            {searchResults.map((res) => (
              <button
                key={res.placeId}
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left px-4 py-3.5 hover:bg-emerald-50 transition flex items-start space-x-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">{res.shortName}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{res.displayName}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Light Leaflet Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md">
        <div ref={mapContainerRef} className="w-full h-60 z-10" />

        {!selectedLocation && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-20 flex items-center justify-center p-4 text-center pointer-events-none">
            <p className="text-xs font-bold text-slate-800 bg-white/95 px-4 py-2.5 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Tap map or search location to set wake-up point
            </p>
          </div>
        )}
      </div>

      {/* Target Selected Pill */}
      {selectedLocation && (
        <div className="p-4 rounded-2xl glass-panel-emerald flex items-start space-x-3.5 animate-in fade-in duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Target Location Confirmed</span>
            <p className="text-base font-extrabold text-slate-900 truncate">{selectedLocation.shortName}</p>
            <p className="text-xs text-slate-500 truncate font-mono mt-0.5">
              LAT: {selectedLocation.latitude.toFixed(4)}° | LNG: {selectedLocation.longitude.toFixed(4)}°
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
