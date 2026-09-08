'use client';

import React, { useState } from 'react';
import { FlaskConical, Play, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { TargetLocation } from '../lib/location/types';

interface DevTestPanelProps {
  targetLocation: TargetLocation | null;
  onSimulateCoords: (lat: number, lng: number) => void;
  onSimulateArrival: () => void;
}

export const DevTestPanel: React.FC<DevTestPanelProps> = ({
  targetLocation,
  onSimulateCoords,
  onSimulateArrival,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customLat, setCustomLat] = useState('12.9750');
  const [customLng, setCustomLng] = useState('77.5650');

  if (!targetLocation) return null;

  const handleCustomSimulate = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onSimulateCoords(lat, lng);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-amber-700" />
          </div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
            Developer GPS Simulator
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3.5 pt-3 border-t border-slate-100 text-xs text-slate-700">
          <p className="text-[11px] font-medium text-slate-500">
            Simulate GPS coordinate updates without physically traveling:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onSimulateArrival}
              className="py-3 px-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-black flex items-center justify-center space-x-2 transition shadow-xs"
            >
              <Play className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>Simulate Arrival</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSimulateCoords(
                  targetLocation.latitude + 0.04,
                  targetLocation.longitude + 0.04
                );
              }}
              className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold flex items-center justify-center space-x-2 transition"
            >
              <Radio className="w-4 h-4 text-slate-500" />
              <span>Simulate 5 km Away</span>
            </button>
          </div>

          <div className="pt-2 space-y-2 border-t border-slate-100">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Custom GPS Fix Injection:
            </label>
            <div className="flex items-center space-x-2 font-mono">
              <input
                type="text"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                placeholder="Latitude"
                className="w-1/2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
              />
              <input
                type="text"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                placeholder="Longitude"
                className="w-1/2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
              />
            </div>
            <button
              type="button"
              onClick={handleCustomSimulate}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs"
            >
              Inject Coordinate Fix
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
