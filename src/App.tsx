import React from 'react';
import { Compass, MapPin, Sparkles, ShieldCheck, SunMedium } from 'lucide-react';
import type { TriageCountOption, Spot, WeatherState } from './types';

const App: React.FC = () => {
  const defaultCount: TriageCountOption = 5;

  const mockWeather: WeatherState = {
    temperatureF: 72,
    condition: 'clear',
    isRaining: false,
    isSnowing: false,
    isExtremeCold: false,
    isExtremeHeat: false,
  };

  const sampleSpot: Partial<Spot> = {
    id: 'spot-sample-1',
    name: 'Pine Hill Adventure Park',
    category: 'playground',
    spotType: 'outdoor',
    energyLevel: 'high',
    costLevel: 'free',
    isToddlerFriendly: true,
    isYoungKidFriendly: true,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pt-safe pb-safe px-safe flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
        <header className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-400/10 text-teal-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Weekend Outing Triage
              </h1>
              <p className="text-xs text-slate-400">Mobile-First Parent Engine</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
            Phase 1
          </span>
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-teal-400" />
              Weather Sync
            </span>
            <span className="text-slate-400 font-medium">
              {mockWeather.temperatureF}°F ({mockWeather.condition})
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              Triage Slots
            </span>
            <span className="text-slate-400 font-medium">
              Top {defaultCount} Outings
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Spot Preview
            </span>
            <span className="text-slate-400 font-medium">
              {sampleSpot.name}
            </span>
          </div>
        </section>

        <footer className="pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-teal-400">
            <ShieldCheck className="w-4 h-4" />
            Capacitor & Tailwind Ready
          </span>
          <span>v0.1.0</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
