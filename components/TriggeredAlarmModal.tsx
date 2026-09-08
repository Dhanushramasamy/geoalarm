'use client';

import React, { useEffect } from 'react';
import { BellRing, MapPin, CheckCircle2, AlertOctagon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JourneyState } from '../lib/journey/types';

interface TriggeredAlarmModalProps {
  journey: JourneyState | null;
  onDismiss: () => void;
}

export const TriggeredAlarmModal: React.FC<TriggeredAlarmModalProps> = ({
  journey,
  onDismiss,
}) => {
  useEffect(() => {
    if (!journey) return;

    try {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignore
    }
  }, [journey]);

  if (!journey) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-rose-300 rounded-3xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300 relative overflow-hidden text-slate-900">
        {/* Glow ambient background lights */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-amber-200/50 rounded-full blur-3xl" />

        {/* Pulsing Alarm Icon */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 p-[2px] shadow-2xl shadow-rose-500/30 animate-bounce">
          <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center">
            <BellRing className="w-12 h-12 text-rose-600 animate-pulse" />
          </div>
        </div>

        {/* Alarm Title & Station */}
        <div className="space-y-2 relative">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-rose-100 text-rose-900 border border-rose-300">
            <AlertOctagon className="w-4 h-4 animate-spin text-rose-600" /> Target Station Reached
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            Wake Up! You're Near Your Station.
          </h2>
          <p className="text-sm font-black text-rose-700 flex items-center justify-center space-x-1.5 pt-1">
            <MapPin className="w-4 h-4 text-rose-600" />
            <span>{journey.targetName}</span>
          </p>
        </div>

        {/* Journey Details summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 shadow-xs">
          <div className="flex justify-between font-mono">
            <span className="text-slate-500 font-semibold">Trigger Radius:</span>
            <span className="font-extrabold text-emerald-700">
              {journey.radiusMeters >= 1000
                ? `${(journey.radiusMeters / 1000).toFixed(1)} km`
                : `${journey.radiusMeters} m`}
            </span>
          </div>
          <div className="flex justify-between font-mono">
            <span className="text-slate-500 font-semibold">Triggered At:</span>
            <span className="font-extrabold text-rose-600">
              {journey.triggeredAt
                ? new Date(journey.triggeredAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now'}
            </span>
          </div>
        </div>

        {/* DISMISS ALARM BUTTON */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-lg shadow-xl shadow-rose-600/30 transition transform active:scale-95 flex items-center justify-center space-x-2.5"
        >
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          <span>I'm Awake - Stop Alarm</span>
        </button>
      </div>
    </div>
  );
};
