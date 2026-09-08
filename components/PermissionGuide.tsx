'use client';

import React from 'react';
import { ShieldCheck, Check, Settings, MapPin, Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface PermissionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermissions: () => void;
}

export const PermissionGuide: React.FC<PermissionGuideProps> = ({
  isOpen,
  onClose,
  onRequestPermissions,
}) => {
  if (!isOpen) return null;

  const isAndroid = Capacitor.getPlatform() === 'android';
  const isIOS = Capacitor.getPlatform() === 'ios';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Permissions Required</h3>
            <p className="text-xs text-slate-500 font-medium">Allow GeoAlarm to wake you up on time</p>
          </div>
        </div>

        {/* Visual Guide Images Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 p-2 space-y-1.5 shadow-sm text-center">
            <img
              src="/images/permission_location.jpg"
              alt="Location Permission Guide"
              className="w-full h-24 object-cover rounded-xl shadow-xs"
            />
            <p className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" /> GPS Location
            </p>
            <p className="text-[10px] text-slate-500 line-clamp-2">Tracks travel progress while screen is locked</p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 p-2 space-y-1.5 shadow-sm text-center">
            <img
              src="/images/permission_notification.jpg"
              alt="Notification Alarm Guide"
              className="w-full h-24 object-cover rounded-xl shadow-xs"
            />
            <p className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
              <Bell className="w-3 h-3 text-emerald-600" /> Loud Notifications
            </p>
            <p className="text-[10px] text-slate-500 line-clamp-2">Triggers loud sound tone & haptic vibration</p>
          </div>
        </div>

        {(isAndroid || isIOS) && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-emerald-700">
              <Settings className="w-4 h-4 text-emerald-600" /> Native OS Settings Tip:
            </p>
            <p className="leading-relaxed">
              When prompted, choose <strong className="text-emerald-950 font-bold">"Allow all the time"</strong> (Android) or <strong className="text-emerald-950 font-bold">"Always Allow"</strong> (iOS) for background tracking.
            </p>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onRequestPermissions}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Grant Permissions & Start</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
