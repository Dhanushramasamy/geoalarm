'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { LocationPicker } from '../components/LocationPicker';
import { RadiusSelector } from '../components/RadiusSelector';
import { JourneyCard } from '../components/JourneyCard';
import { PermissionGuide } from '../components/PermissionGuide';
import { AlarmTestButton } from '../components/AlarmTestButton';
import { AudioSelector } from '../components/AudioSelector';
import { DevTestPanel } from '../components/DevTestPanel';
import { TriggeredAlarmModal } from '../components/TriggeredAlarmModal';

import { GeocodingResult, GPSCoordinates, TargetLocation } from '../lib/location/types';
import { JourneyState } from '../lib/journey/types';
import { JourneyStore } from '../lib/journey/journey-store';
import { LocationService } from '../lib/location/location-service';
import { AlarmService } from '../lib/notifications/alarm-service';

import { Navigation, Plus, ArrowRight, ShieldCheck, CheckCircle2, ChevronLeft } from 'lucide-react';

type Step = 'home' | 'select' | 'configure' | 'confirm' | 'active';

export default function HomePage() {
  const [step, setStep] = useState<Step>('home');
  const [activeJourney, setActiveJourney] = useState<JourneyState | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<number>(1000); // 1 km default
  const [currentDistanceMeters, setCurrentDistanceMeters] = useState<number | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [isAlarmTriggeredModalOpen, setIsAlarmTriggeredModalOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Restore existing active journey on app launch or reload
  useEffect(() => {
    async function restoreJourney() {
      const stored = await JourneyStore.getActiveJourney();
      if (stored) {
        setActiveJourney(stored);
        if (stored.status === 'active' || stored.status === 'triggered') {
          setStep('active');
          if (stored.status === 'triggered') {
            setIsAlarmTriggeredModalOpen(true);
            AlarmService.triggerWakeUp(stored.targetName);
          } else {
            startLocationWatcher(stored);
          }
        }
      }
    }
    restoreJourney();
  }, []);

  // Location watcher callback handler
  const startLocationWatcher = useCallback((journey: JourneyState) => {
    const target: TargetLocation = {
      name: journey.targetName,
      latitude: journey.targetLatitude,
      longitude: journey.targetLongitude,
      radiusMeters: journey.radiusMeters,
    };

    LocationService.startMonitoring(target, {
      onLocationUpdate: (_coords, distanceMeters) => {
        setLocationError(null);
        setCurrentDistanceMeters(distanceMeters);
      },
      onTargetReached: async (_coords, distanceMeters) => {
        setLocationError(null);
        setCurrentDistanceMeters(distanceMeters);
        const updated = await JourneyStore.updateJourneyStatus('triggered');
        if (updated) setActiveJourney(updated);
        setIsAlarmTriggeredModalOpen(true);
        AlarmService.triggerWakeUp(journey.targetName);
      },
      onError: (errMsg) => {
        console.warn('Location monitoring error:', errMsg);
        setLocationError(errMsg);
      },
    });
  }, []);

  // Request permissions and start journey
  const handleStartJourney = async () => {
    if (!selectedLocation) return;

    const hasPermissions = await LocationService.requestPermissions();
    await AlarmService.requestPermissions();

    if (!hasPermissions) {
      setShowPermissionGuide(true);
      return;
    }

    const newJourney: JourneyState = {
      id: `journey-${Date.now()}`,
      targetName: selectedLocation.shortName,
      targetLatitude: selectedLocation.latitude,
      targetLongitude: selectedLocation.longitude,
      radiusMeters: radiusMeters,
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    await JourneyStore.saveActiveJourney(newJourney);
    setActiveJourney(newJourney);
    setStep('active');
    startLocationWatcher(newJourney);
  };

  // Cancel journey
  const handleCancelJourney = async () => {
    await LocationService.stopMonitoring();
    await AlarmService.stopWakeUp();
    await JourneyStore.clearActiveJourney();
    setActiveJourney(null);
    setSelectedLocation(null);
    setIsAlarmTriggeredModalOpen(false);
    setStep('home');
  };

  // Dismiss triggered alarm
  const handleDismissAlarm = async () => {
    await AlarmService.stopWakeUp();
    await LocationService.stopMonitoring();
    await JourneyStore.clearActiveJourney();
    setIsAlarmTriggeredModalOpen(false);
    setActiveJourney(null);
    setStep('home');
  };

  // Developer Simulation Helpers
  const handleSimulateCoords = (lat: number, lng: number) => {
    if (!activeJourney) return;
    const target: TargetLocation = {
      name: activeJourney.targetName,
      latitude: activeJourney.targetLatitude,
      longitude: activeJourney.targetLongitude,
      radiusMeters: activeJourney.radiusMeters,
    };
    LocationService.simulateLocationUpdate(
      { latitude: lat, longitude: lng, accuracy: 10 },
      target,
      {
        onLocationUpdate: (_c, dist) => setCurrentDistanceMeters(dist),
        onTargetReached: async (_c, dist) => {
          setCurrentDistanceMeters(dist);
          const updated = await JourneyStore.updateJourneyStatus('triggered');
          if (updated) setActiveJourney(updated);
          setIsAlarmTriggeredModalOpen(true);
          AlarmService.triggerWakeUp(activeJourney.targetName);
        },
        onError: (err) => console.warn('Simulation error:', err),
      }
    );
  };

  const handleSimulateArrival = () => {
    if (!activeJourney) return;
    handleSimulateCoords(activeJourney.targetLatitude, activeJourney.targetLongitude);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-12 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      <Header hasActiveJourney={activeJourney?.status === 'active'} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-5 space-y-6 relative z-10">
        {/* VIEW 1: HOME */}
        {step === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Active Journey Widget if exists */}
            {activeJourney && activeJourney.status === 'active' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Active Journey Monitoring
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live
                  </span>
                </div>
                <JourneyCard
                  journey={activeJourney}
                  currentDistanceMeters={currentDistanceMeters}
                  onCancelJourney={handleCancelJourney}
                  onTestAlarm={AlarmService.testWakeUp}
                />
              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center space-y-5 shadow-xl relative overflow-hidden">
                {/* Hero Generic Travel Banner Image */}
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-md">
                  <img
                    src="/images/hero.jpg"
                    alt="GPS Location & Destination Alarm"
                    className="w-full h-44 object-cover transform hover:scale-105 transition duration-500"
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    Sleep Peacefully While Traveling
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Set a GPS alarm for any location or stop. Your phone alerts you in the background before arrival — for buses, trains, cars & commutes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-xl shadow-emerald-600/25 transition transform active:scale-95 flex items-center justify-center space-x-2.5"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  <span>Create Wake-Up Point</span>
                </button>
              </div>
            )}

            {/* Alarm Sound & Custom Mobile Audio Selector Card */}
            <AudioSelector />
          </div>
        )}

        {/* VIEW 2: SELECT LOCATION */}
        {step === 'select' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep('home')}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">1. Target Destination</h2>
                <p className="text-xs text-slate-500 font-medium">Search place or tap point on map</p>
              </div>
            </div>

            <LocationPicker
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
              radiusMeters={radiusMeters}
            />

            <button
              type="button"
              disabled={!selectedLocation}
              onClick={() => setStep('configure')}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
                selectedLocation
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/25'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <span>Configure Wake-Up Radius</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* VIEW 3: CONFIGURE RADIUS */}
        {step === 'configure' && selectedLocation && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep('select')}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">2. Wake-Up Distance</h2>
                <p className="text-xs text-slate-500 font-medium">Target: {selectedLocation.shortName}</p>
              </div>
            </div>

            <RadiusSelector radiusMeters={radiusMeters} onChangeRadius={setRadiusMeters} />

            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center space-x-2 transition"
            >
              <span>Review Journey Details</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* VIEW 4: CONFIRM JOURNEY */}
        {step === 'confirm' && selectedLocation && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStep('configure')}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">3. Confirm Wake-Up Point</h2>
                <p className="text-xs text-slate-500 font-medium">Ready to start journey monitoring</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                  Target Destination
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedLocation.shortName}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{selectedLocation.displayName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-500 font-semibold">Trigger Radius:</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Offline Native Background Protection
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Your phone tracks GPS location locally in the background. You can lock your screen and put it in your pocket.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartJourney}
              className="w-full py-4.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-2xl shadow-emerald-600/30 transition transform active:scale-95 flex items-center justify-center space-x-2.5"
            >
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              <span>Start Wake-Up Alarm</span>
            </button>
          </div>
        )}

        {/* VIEW 5: ACTIVE JOURNEY */}
        {step === 'active' && activeJourney && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {locationError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5 shadow-sm">
                <div className="flex items-center space-x-2 font-black text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Browser Location Access Needed</span>
                </div>
                <p className="leading-relaxed font-semibold">
                  {locationError}. Please enable site location access, or use the <strong className="text-slate-900">Developer GPS Simulator</strong> below to test.
                </p>
              </div>
            )}

            <JourneyCard
              journey={activeJourney}
              currentDistanceMeters={currentDistanceMeters}
              onCancelJourney={handleCancelJourney}
              onTestAlarm={AlarmService.testWakeUp}
            />

            {/* Developer GPS Simulation Panel */}
            <DevTestPanel
              targetLocation={{
                name: activeJourney.targetName,
                latitude: activeJourney.targetLatitude,
                longitude: activeJourney.targetLongitude,
                radiusMeters: activeJourney.radiusMeters,
              }}
              onSimulateCoords={handleSimulateCoords}
              onSimulateArrival={handleSimulateArrival}
            />
          </div>
        )}
      </main>

      {/* Permission Guide Modal */}
      <PermissionGuide
        isOpen={showPermissionGuide}
        onClose={() => setShowPermissionGuide(false)}
        onRequestPermissions={handleStartJourney}
      />

      {/* Triggered Alarm Full-Screen Modal */}
      <TriggeredAlarmModal
        journey={isAlarmTriggeredModalOpen || activeJourney?.status === 'triggered' ? activeJourney : null}
        onDismiss={handleDismissAlarm}
      />
    </div>
  );
}
