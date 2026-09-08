'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Music, Upload, Trash2, Volume2, VolumeX, CheckCircle2, Music2 } from 'lucide-react';
import { AlarmService } from '../lib/notifications/alarm-service';

export const AudioSelector: React.FC = () => {
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadAudioSetting() {
      const custom = await AlarmService.getCustomAudio();
      if (custom.name) {
        setCustomAudioName(custom.name);
      }
    }
    loadAudioSetting();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file (e.g. MP3, WAV, M4A, OGG).');
      return;
    }

    // Limit file size to 8MB for smooth local storage
    if (file.size > 8 * 1024 * 1024) {
      alert('Audio file size should be less than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await AlarmService.saveCustomAudio(dataUrl, file.name);
        setCustomAudioName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearCustomAudio = async () => {
    await AlarmService.clearCustomAudio();
    setCustomAudioName(null);
  };

  const handleTestSound = async () => {
    if (isTesting) {
      await AlarmService.stopWakeUp();
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    await AlarmService.triggerWakeUp('Test Destination');

    setTimeout(() => {
      AlarmService.stopWakeUp();
      setIsTesting(false);
    }, 4000);
  };

  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 text-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center">
            <Music className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Alarm Ringtone</h3>
            <p className="text-[11px] text-slate-500 font-medium">Use default siren or upload mobile sound</p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Audio Choice
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*"
        className="hidden"
      />

      {/* Audio Options Card */}
      <div className="space-y-2.5">
        {/* Custom Uploaded Sound Card if exists */}
        {customAudioName ? (
          <div className="p-3.5 rounded-2xl glass-panel-emerald flex items-center justify-between border border-emerald-300">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-200/60 border border-emerald-400 flex items-center justify-center shrink-0">
                <Music2 className="w-4 h-4 text-emerald-800" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Custom Audio Active</p>
                <p className="text-xs font-bold text-slate-900 truncate">{customAudioName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearCustomAudio}
              className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
              title="Remove custom audio and revert to default siren"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Default Alarm Siren</p>
                <p className="text-[10px] text-slate-500 font-medium">Loud dual-tone offline siren chime</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-3 px-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black flex items-center justify-center space-x-2 transition shadow-xs"
        >
          <Upload className="w-4 h-4 text-emerald-600" />
          <span>Upload Mobile Audio</span>
        </button>

        <button
          type="button"
          onClick={handleTestSound}
          className={`py-3 px-3.5 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 transition shadow-xs ${
            isTesting
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isTesting ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{isTesting ? 'Stop Test' : 'Test Alarm Sound'}</span>
        </button>
      </div>
    </div>
  );
};
