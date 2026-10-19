import React from 'react';
import {
  AlertTriangle,
  Baby,
  Camera,
  Check,
  ExternalLink,
  Flame,
  Home,
  MapPin,
  Navigation,
  Smile,
  Tent,
  Trees,
} from 'lucide-react';
import type { SpotType, TriageCandidate } from '../../types';
import { openMapsLocation } from '../../services/mapsLauncherService';
import {
  formatCategoryLabel,
  formatEnergyContextLabel,
  formatInstagramLinkLabel,
  formatProximityBandLabel,
  formatSpotTypeLabel,
  resolveInstagramUrl,
} from '../../utils/triageFormatters';

export interface TriageCardProps {
  candidate: TriageCandidate;
  rank?: number;
  onOpenMaps?: (candidate: TriageCandidate) => void;
}

function SpotTypeIcon({ spotType }: { spotType: SpotType }) {
  switch (spotType) {
    case 'indoor':
      return <Home className="w-3 h-3" />;
    case 'outdoor':
      return <Trees className="w-3 h-3" />;
    default:
      return <Tent className="w-3 h-3" />;
  }
}

export const TriageCard: React.FC<TriageCardProps> = ({
  candidate,
  rank,
  onOpenMaps,
}) => {
  const { spot, distanceMiles, proximityBand, cautions } = candidate;
  const categoryLabel = formatCategoryLabel(spot.category);
  const spotTypeLabel = formatSpotTypeLabel(spot.spotType);
  const energyContext = formatEnergyContextLabel(spot.energyLevel);
  const instagramUrl = resolveInstagramUrl(spot.sourceUrl, spot.sourceHandle);
  const instagramLabel = formatInstagramLinkLabel(spot.sourceUrl, spot.sourceHandle);

  const handleOpenMaps = () => {
    if (onOpenMaps) {
      onOpenMaps(candidate);
      return;
    }
    openMapsLocation(spot.coordinates, spot.name);
  };

  const amenityItems = [
    {
      key: 'strollerFriendly',
      label: 'Stroller Friendly',
      active: spot.parentAmenities.strollerFriendly,
    },
    {
      key: 'restroomsAvailable',
      label: 'Restrooms',
      active: spot.parentAmenities.restroomsAvailable,
    },
    {
      key: 'fencedPlayArea',
      label: 'Fenced Play Area',
      active: spot.parentAmenities.fencedPlayArea,
    },
    {
      key: 'snacksAllowedOrNearby',
      label: 'Snacks Nearby',
      active: spot.parentAmenities.snacksAllowedOrNearby,
    },
  ];

  return (
    <article
      data-testid={`triage-card-${spot.id}`}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md space-y-3 transition-colors hover:border-slate-600"
    >
      {/* Top Row: Category Badge, Indoor/Outdoor Tag, and Distance Pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {typeof rank === 'number' && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-400 text-slate-900 text-xs font-extrabold">
              {rank}
            </span>
          )}
          <span
            data-testid="category-badge"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-400/15 text-teal-400 border border-teal-400/30"
          >
            {categoryLabel}
          </span>
          <span
            data-testid="spot-type-tag"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/80 text-slate-200 border border-slate-600"
          >
            <SpotTypeIcon spotType={spot.spotType} />
            <span>{spotTypeLabel}</span>
          </span>
        </div>

        {typeof distanceMiles === 'number' && !Number.isNaN(distanceMiles) && (
          <span
            data-testid="distance-pill"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-teal-400 border border-slate-700"
          >
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{distanceMiles.toFixed(1)} mi</span>
            {proximityBand && (
              <span className="text-slate-400 font-normal">
                ({formatProximityBandLabel(proximityBand)})
              </span>
            )}
          </span>
        )}
      </div>

      {/* Title & Location Subtitle */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-white leading-snug">
            {spot.name}
          </h3>
          <span
            data-testid="cost-badge"
            className={`px-2 py-0.5 rounded-md text-xs font-bold shrink-0 ${
              spot.costLevel === 'free'
                ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 uppercase'
                : 'bg-slate-700 text-slate-200 border border-slate-600'
            }`}
          >
            {spot.costLevel === 'free' ? 'Free' : spot.costLevel}
          </span>
        </div>

        {(spot.city || spot.address) && (
          <p className="text-xs text-slate-400 mt-0.5">
            {[spot.address, spot.city].filter(Boolean).join(', ')}
          </p>
        )}

        {spot.description && (
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {spot.description}
          </p>
        )}
      </div>

      {/* Kid Age Suitability & Energy Level Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {spot.isToddlerFriendly && (
          <span
            data-testid="badge-toddler-friendly"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-900 shadow-sm"
          >
            <Baby className="w-3.5 h-3.5 shrink-0" />
            <span>Toddler Friendly</span>
          </span>
        )}

        {spot.isYoungKidFriendly && (
          <span
            data-testid="badge-young-kids"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-400 text-slate-900 shadow-sm"
          >
            <Smile className="w-3.5 h-3.5 shrink-0" />
            <span>Young Kids</span>
          </span>
        )}

        <span
          data-testid="energy-indicator"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/90 text-slate-200 border border-slate-700"
        >
          <Flame
            className={`w-3.5 h-3.5 shrink-0 ${
              spot.energyLevel === 'high'
                ? 'text-rose-400'
                : spot.energyLevel === 'medium'
                  ? 'text-amber-400'
                  : 'text-teal-400'
            }`}
          />
          <span>{energyContext}</span>
        </span>
      </div>

      {/* Parenting Amenity Chips */}
      <div
        className="grid grid-cols-2 gap-1.5 pt-1"
        data-testid="parent-amenities-grid"
      >
        {amenityItems.map((item) => (
          <div
            key={item.key}
            data-testid={`amenity-chip-${item.key}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border ${
              item.active
                ? 'bg-slate-900/70 text-slate-200 border-slate-700 font-medium'
                : 'bg-slate-900/30 text-slate-500 border-slate-800/80 line-through'
            }`}
          >
            <Check
              className={`w-3.5 h-3.5 shrink-0 ${
                item.active ? 'text-teal-400' : 'text-slate-600'
              }`}
            />
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Weather Cautions if present */}
      {cautions && cautions.length > 0 && (
        <div
          data-testid="card-cautions"
          className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {cautions.map((caution, idx) => (
              <p key={idx}>{caution}</p>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons: Instagram Source Link & Open in Maps */}
      <div className="pt-2 border-t border-slate-700/80 flex items-center gap-2">
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="instagram-source-link"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors shrink-0"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>{instagramLabel}</span>
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
          </a>
        )}

        <button
          type="button"
          onClick={handleOpenMaps}
          data-testid="open-in-maps-button"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-[0.99] text-slate-900 text-xs font-bold transition-all shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5 shrink-0" />
          <span>Open in Maps</span>
        </button>
      </div>
    </article>
  );
};
