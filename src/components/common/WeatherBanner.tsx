import React from 'react';
import { CloudRainWind, Umbrella } from 'lucide-react';
import type { WeatherState } from '../../types';
import { getWeatherBannerMessage, isPrecipitationWeather } from '../../utils/weatherCodes';

export interface WeatherBannerProps {
  weather?: WeatherState;
  includeOutdoorAnyway: boolean;
  onToggleIncludeOutdoor: (include: boolean) => void;
}

export const WeatherBanner: React.FC<WeatherBannerProps> = ({
  weather,
  includeOutdoorAnyway,
  onToggleIncludeOutdoor,
}) => {
  if (!weather || !isPrecipitationWeather(weather)) {
    return null;
  }

  const alertMessage =
    getWeatherBannerMessage(weather) ??
    'Active precipitation detected. Uncovered outdoor spots are hidden by default.';

  return (
    <div
      role="region"
      aria-label="Weather alert banner"
      data-testid="weather-banner"
      className="mx-4 mt-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-100"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400 shrink-0 mt-0.5">
          {includeOutdoorAnyway ? (
            <Umbrella className="w-4 h-4" />
          ) : (
            <CloudRainWind className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-300">
            Weather Alert ({Math.round(weather.temperatureF)}°F)
          </p>
          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
            {alertMessage}
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-amber-400/20">
            <span className="text-xs font-medium text-amber-200">
              Include outdoor spots anyway
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={includeOutdoorAnyway}
              aria-label="Include outdoor spots anyway"
              data-testid="toggle-outdoor-override"
              onClick={() => onToggleIncludeOutdoor(!includeOutdoorAnyway)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                includeOutdoorAnyway ? 'bg-teal-400' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-900 shadow ring-0 transition duration-200 ease-in-out ${
                  includeOutdoorAnyway ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
