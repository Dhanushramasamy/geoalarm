'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AlarmService } from '../lib/notifications/alarm-service';

export const AlarmTestButton: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    if (isTesting) {
      await AlarmService.stopWakeUp();
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    await AlarmService.triggerWakeUp('Test Destination (Bengaluru)');

    setTimeout(() => {
      AlarmService.stopWakeUp();
      setIsTesting(false);
    }, 4000);
  };

  return (
    <div className="p-4.5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black text-slate-800">Alarm Sound & Vibration Test</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audio Check</span>
      </div>

      <button
        type="button"
        onClick={handleTest}
        className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center space-x-2.5 transition-all duration-200 ${
          isTesting
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 animate-pulse'
            : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 shadow-sm'
        }`}
      >
        {isTesting ? (
          <>
            <VolumeX className="w-4.5 h-4.5" />
            <span>Ringing Siren Alarm Tone (Tap to Stop)...</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4.5 h-4.5 text-emerald-600" />
            <span>Test Wake-Up Alarm Sound & Vibration</span>
          </>
        )}
      </button>
    </div>
  );
};
