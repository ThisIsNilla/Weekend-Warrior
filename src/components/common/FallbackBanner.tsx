import React from 'react';
import { Info, RefreshCw } from 'lucide-react';

export interface FallbackBannerProps {
  isLocationFallback: boolean;
  isWeatherFallback: boolean;
  locationErrorMessage?: string;
  onRetry?: () => void;
}

export const FallbackBanner: React.FC<FallbackBannerProps> = ({
  isLocationFallback,
  isWeatherFallback,
  onRetry,
}) => {
  if (!isLocationFallback && !isWeatherFallback) {
    return null;
  }

  let message = '';
  if (isLocationFallback && isWeatherFallback) {
    message =
      'Using default Clifton Park / Halfmoon coordinates (42.85, -73.82) and offline fair weather.';
  } else if (isLocationFallback) {
    message =
      'GPS unavailable. Using Clifton Park / Halfmoon default center (42.85, -73.82).';
  } else {
    message = 'Live weather feed unreachable. Using default fair weather (68°F).';
  }

  return (
    <div
      role="status"
      data-testid="fallback-banner"
      className="mx-4 mt-2.5 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-between gap-2 text-xs"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="leading-snug">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-teal-400 font-medium shrink-0 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
