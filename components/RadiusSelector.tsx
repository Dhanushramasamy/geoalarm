'use client';

import React from 'react';
import { Target, Sparkles } from 'lucide-react';

interface RadiusSelectorProps {
  radiusMeters: number;
  onChangeRadius: (radius: number) => void;
}

const RADIUS_OPTIONS = [
  { label: '500 m', value: 500, description: 'Close range (City stops & bus stations)' },
  { label: '1 km', value: 1000, description: 'Standard wake-up distance' },
  { label: '2 km', value: 2000, description: 'Recommended (Express transit & highways)' },
  { label: '5 km', value: 5000, description: 'Early warning distance' },
];

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  radiusMeters,
  onChangeRadius,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-black text-slate-900 flex items-center space-x-2">
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Trigger Wake-Up Radius</span>
        </label>
        <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          {radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`}
        </span>
      </div>

      {/* Preset Radius Option Cards */}
      <div className="grid grid-cols-2 gap-3">
        {RADIUS_OPTIONS.map((opt) => {
          const isSelected = radiusMeters === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChangeRadius(opt.value)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'glass-panel-emerald border-emerald-500 text-slate-900 shadow-md scale-[1.02]'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black tracking-tight text-slate-900">{opt.label}</span>
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-emerald-600 shadow-md shadow-emerald-600 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-1">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {/* Explanation Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start space-x-3 text-slate-700 text-xs leading-relaxed shadow-sm">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>
          Your alarm triggers when your phone enters within{' '}
          <strong className="text-emerald-700 font-bold">
            {radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} meters`}
          </strong>{' '}
          of the selected target location.
        </p>
      </div>
    </div>
  );
};
