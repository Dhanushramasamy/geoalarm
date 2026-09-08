'use client';

import React from 'react';
import { JourneyState } from '../lib/journey/types';
import { MapPin, Radio, Clock, ShieldCheck, XCircle, Volume2 } from 'lucide-react';

interface JourneyCardProps {
  journey: JourneyState;
  currentDistanceMeters?: number | null;
  onCancelJourney: () => void;
  onTestAlarm: () => void;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({
  journey,
  currentDistanceMeters,
  onCancelJourney,
  onTestAlarm,
}) => {
  const isTriggered = journey.status === 'triggered';
  const startedDate = new Date(journey.startedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayDistance =
    currentDistanceMeters !== undefined && currentDistanceMeters !== null
      ? currentDistanceMeters >= 1000
        ? `${(currentDistanceMeters / 1000).toFixed(1)} km`
        : `${Math.round(currentDistanceMeters)} m`
      : 'Locating...';

  return (
    <div
      className={`rounded-3xl p-6 transition-all duration-300 relative overflow-hidden ${
        isTriggered ? 'glass-panel-rose glow-rose animate-pulse' : 'glass-panel-emerald glow-emerald'
      }`}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isTriggered
                ? 'bg-rose-600 shadow-lg shadow-rose-500 animate-ping'
                : 'bg-emerald-600 shadow-lg shadow-emerald-500 animate-pulse'
            }`}
          />
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            {isTriggered ? 'Wake-Up Triggered!' : 'Journey Active'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Started {startedDate}</span>
        </div>
      </div>

      {/* Target Details */}
      <div className="py-5 space-y-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 shadow-sm">
            <MapPin className="w-6 h-6 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Destination</span>
            <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{journey.targetName}</h3>
          </div>
        </div>

        {/* Distance Remaining Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Trigger Radius</p>
            <p className="text-lg font-black text-emerald-800 font-mono mt-0.5">
              {journey.radiusMeters >= 1000
                ? `${(journey.radiusMeters / 1000).toFixed(1)} km`
                : `${journey.radiusMeters} m`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Distance Away</p>
            <p className="text-lg font-black text-emerald-600 font-mono flex items-center gap-1.5 mt-0.5">
              <Radio className="w-4 h-4 text-emerald-600 animate-spin" />
              {displayDistance}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onTestAlarm}
          className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black flex items-center justify-center space-x-2 transition shadow-xs"
        >
          <Volume2 className="w-4 h-4 text-emerald-600" />
          <span>Test Sound</span>
        </button>

        <button
          type="button"
          onClick={onCancelJourney}
          className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center justify-center space-x-2 transition shadow-xs"
        >
          <XCircle className="w-4 h-4" />
          <span>Cancel Journey</span>
        </button>
      </div>

      {/* Background Status Assurance */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-center space-x-2 text-[11px] text-slate-500 font-semibold">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Monitoring offline in background. You can lock your phone.</span>
      </div>
    </div>
  );
};
