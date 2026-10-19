import React from 'react';
import {
  Baby,
  Camera,
  Check,
  Edit3,
  ExternalLink,
  Flame,
  Home,
  MapPin,
  Smile,
  Sparkles,
  Tent,
  Trash2,
  Trees,
} from 'lucide-react';
import type { LocationCoords, Spot, SpotType } from '../../types';
import { isLocationCoords } from '../../types';
import { calculateDistance } from '../../services/distanceService';
import {
  formatCategoryLabel,
  formatEnergyContextLabel,
  formatInstagramLinkLabel,
  formatSpotTypeLabel,
  resolveInstagramUrl,
} from '../../utils/triageFormatters';

export interface SpotCardProps {
  spot: Spot;
  userLocation?: LocationCoords;
  isCustom?: boolean;
  onEdit: (spot: Spot) => void;
  onDelete: (id: string) => void;
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

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  userLocation,
  isCustom = false,
  onEdit,
  onDelete,
}) => {
  const categoryLabel = formatCategoryLabel(spot.category);
  const spotTypeLabel = formatSpotTypeLabel(spot.spotType);
  const energyLabel = formatEnergyContextLabel(spot.energyLevel);
  const instagramUrl = resolveInstagramUrl(spot.sourceUrl, spot.sourceHandle);
  const instagramLabel = formatInstagramLinkLabel(
    spot.sourceUrl,
    spot.sourceHandle,
  );

  let distanceMiles: number | undefined;
  if (userLocation && isLocationCoords(userLocation)) {
    const result = calculateDistance(userLocation, spot.coordinates);
    if (!Number.isNaN(result.miles)) {
      distanceMiles = result.miles;
    }
  }

  const activeAmenityLabels: string[] = [];
  if (spot.parentAmenities.strollerFriendly) {
    activeAmenityLabels.push('Stroller Friendly');
  }
  if (spot.parentAmenities.restroomsAvailable) {
    activeAmenityLabels.push('Restrooms');
  }
  if (spot.parentAmenities.fencedPlayArea) {
    activeAmenityLabels.push('Fenced Play Area');
  }
  if (spot.parentAmenities.snacksAllowedOrNearby) {
    activeAmenityLabels.push('Snacks Nearby');
  }
  if (spot.parentAmenities.changingTablesAvailable) {
    activeAmenityLabels.push('Changing Tables');
  }
  if (spot.parentAmenities.parkingAvailable) {
    activeAmenityLabels.push('Parking');
  }

  return (
    <article
      data-testid={`spot-card-${spot.id}`}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3 transition-colors hover:border-slate-600"
    >
      {/* Top Row: Category, Indoor/Outdoor Tag, Custom Tag, Distance */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            data-testid={`spot-category-${spot.id}`}
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-400/15 text-teal-400 border border-teal-400/30"
          >
            {categoryLabel}
          </span>

          <span
            data-testid={`spot-type-${spot.id}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/80 text-slate-200 border border-slate-600"
          >
            <SpotTypeIcon spotType={spot.spotType} />
            <span>{spotTypeLabel}</span>
          </span>

          {isCustom && (
            <span
              data-testid={`spot-custom-badge-${spot.id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30"
            >
              <Sparkles className="w-3 h-3" />
              <span>Custom</span>
            </span>
          )}
        </div>

        {typeof distanceMiles === 'number' && (
          <span
            data-testid={`spot-distance-${spot.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-teal-400 border border-slate-700"
          >
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{distanceMiles.toFixed(1)} mi</span>
          </span>
        )}
      </div>

      {/* Title, Cost, Location & Description */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white leading-snug">
            {spot.name}
          </h3>
          <span
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

      {/* Kid Age Suitability & Energy Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {spot.isToddlerFriendly && (
          <span
            data-testid={`spot-toddler-badge-${spot.id}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-400 text-slate-900"
          >
            <Baby className="w-3 h-3 shrink-0" />
            <span>Toddler Friendly</span>
          </span>
        )}

        {spot.isYoungKidFriendly && (
          <span
            data-testid={`spot-young-kid-badge-${spot.id}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-teal-400 text-slate-900"
          >
            <Smile className="w-3 h-3 shrink-0" />
            <span>Young Kids</span>
          </span>
        )}

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-900/90 text-slate-300 border border-slate-700">
          <Flame className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{energyLabel}</span>
        </span>
      </div>

      {/* Amenity Tags */}
      {activeAmenityLabels.length > 0 && (
        <div
          data-testid={`spot-amenities-${spot.id}`}
          className="flex items-center gap-1.5 flex-wrap"
        >
          {activeAmenityLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-900/70 text-slate-300 border border-slate-700/80"
            >
              <Check className="w-3 h-3 text-teal-400 shrink-0" />
              <span>{label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Bottom Action Bar: Instagram Link + Edit / Delete Buttons */}
      <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2 flex-wrap">
        <div>
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`spot-instagram-${spot.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-pink-300 text-xs font-semibold border border-pink-500/30 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span>{instagramLabel}</span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-500">
              No social link attached
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => onEdit(spot)}
            aria-label={`Edit ${spot.name}`}
            data-testid={`edit-spot-${spot.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-400" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(spot.id)}
            aria-label={`Delete ${spot.name}`}
            data-testid={`delete-spot-${spot.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-700/70 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
};
