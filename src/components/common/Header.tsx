import React from 'react';
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Compass,
  MapPin,
  RefreshCw,
  Sun,
} from 'lucide-react';
import type { LocationCoords, WeatherState } from '../../types';
import { formatWeatherConditionLabel } from '../../utils/weatherCodes';

export interface HeaderProps {
  coords: LocationCoords;
  isLocationFallback: boolean;
  weather: WeatherState;
  isRefreshing?: boolean;
  onRefresh: () => void;
  locationLabel?: string;
}

function WeatherIcon({ condition }: { condition: WeatherState['condition'] }) {
  switch (condition) {
    case 'clear':
    case 'sunny':
      return <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'rain':
    case 'heavy-rain':
    case 'heavy_rain':
    case 'drizzle':
      return <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 'thunderstorm':
      return <CloudLightning className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'snow':
    case 'sleet':
      return <CloudSnow className="w-3.5 h-3.5 text-indigo-300 shrink-0" />;
    default:
      return <Cloud className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
  }
}

export const Header: React.FC<HeaderProps> = ({
  coords,
  isLocationFallback,
  weather,
  isRefreshing = false,
  onRefresh,
  locationLabel,
}) => {
  const conditionText = formatWeatherConditionLabel(weather.condition);
  const displayLocation =
    locationLabel ||
    (isLocationFallback
      ? 'Clifton Park, NY (Default)'
      : `GPS (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-teal-400/15 text-teal-400 border border-teal-400/30 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-white truncate">
              Weekend Warrior
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              Capital Region Family Outing Triage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh GPS and weather"
          title="Refresh GPS and weather"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 text-teal-400 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 max-w-[60%] truncate"
          data-testid="location-pill"
        >
          <MapPin
            className={`w-3.5 h-3.5 shrink-0 ${
              isLocationFallback ? 'text-amber-400' : 'text-teal-400'
            }`}
          />
          <span className="truncate">{displayLocation}</span>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-100 border border-slate-700 shrink-0"
          data-testid="weather-badge"
        >
          <WeatherIcon condition={weather.condition} />
          <span>{Math.round(weather.temperatureF)}°F</span>
          <span className="text-slate-400 font-normal">({conditionText})</span>
        </div>
      </div>
    </header>
  );
};
