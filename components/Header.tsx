'use client';

import React from 'react';
import { BellRing, Smartphone, Globe } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface HeaderProps {
  hasActiveJourney?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ hasActiveJourney }) => {
  const isNative = Capacitor.isNativePlatform();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/80 px-4 py-3.5 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
            <BellRing className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
              GeoAlarm <span className="text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">GPS</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-500">Location & Destination Alarm</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasActiveJourney && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              Active
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
              isNative
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isNative ? <Smartphone className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {isNative ? 'Native' : 'Web Dev'}
          </span>
        </div>
      </div>
    </header>
  );
};
