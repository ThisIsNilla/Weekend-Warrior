import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Globe,
  MapPin,
  MessageSquarePlus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import type { CommunityCoverageRequest } from '../../services/communityQueueService';
import {
  getCoverageRequests,
  submitCoverageRequest,
} from '../../services/communityQueueService';

export interface RequestCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (request: CommunityCoverageRequest) => void;
  initialCityName?: string;
  initialStateOrZip?: string;
  initialHandlesInput?: string;
  initialParentNotes?: string;
  initialSubmittedRequest?: CommunityCoverageRequest | null;
  initialError?: string | null;
}

export const RequestCoverageModal: React.FC<RequestCoverageModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  initialCityName = '',
  initialStateOrZip = '',
  initialHandlesInput = '',
  initialParentNotes = '',
  initialSubmittedRequest = null,
  initialError = null,
}) => {
  const modalSessionKey = isOpen ? 'open' : 'closed';
  const [trackedKey, setTrackedKey] = useState<string>(modalSessionKey);
  const [cityName, setCityName] = useState<string>(initialCityName);
  const [stateOrZip, setStateOrZip] = useState<string>(initialStateOrZip);
  const [handlesInput, setHandlesInput] = useState<string>(initialHandlesInput);
  const [parentNotes, setParentNotes] = useState<string>(initialParentNotes);
  const [error, setError] = useState<string | null>(initialError);
  const [submittedRequest, setSubmittedRequest] =
    useState<CommunityCoverageRequest | null>(initialSubmittedRequest);

  if (trackedKey !== modalSessionKey) {
    setTrackedKey(modalSessionKey);
    setCityName(initialCityName);
    setStateOrZip(initialStateOrZip);
    setHandlesInput(initialHandlesInput);
    setParentNotes(initialParentNotes);
    setError(initialError);
    setSubmittedRequest(initialSubmittedRequest);
  }

  if (!isOpen) {
    return null;
  }

  const existingRequests = getCoverageRequests();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    try {
      const created = submitCoverageRequest({
        cityName,
        stateOrZip,
        suggestedInstagramHandles: handlesInput,
        parentNotes,
      });
      setError(null);
      setSubmittedRequest(created);
      if (onSubmitted) {
        onSubmitted(created);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Please enter a valid city and state or ZIP code.';
      setError(message);
    }
  };

  const handleResetForm = () => {
    setCityName('');
    setStateOrZip('');
    setHandlesInput('');
    setParentNotes('');
    setError(null);
    setSubmittedRequest(null);
  };

  const handleCloseModal = () => {
    handleResetForm();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Request Coverage for My City"
      data-testid="request-coverage-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-slate-800 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-400" />
            <h2 className="text-base font-bold text-white">
              Request Coverage for My City
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Close coverage request modal"
            data-testid="close-coverage-modal-button"
            className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedRequest ? (
          <div
            data-testid="coverage-confirmation"
            className="space-y-4 py-2 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-400/15 border border-teal-400/30 text-teal-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                City Coverage Queued!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We added{' '}
                <span className="font-bold text-teal-400">
                  {submittedRequest.cityName}, {submittedRequest.stateOrZip}
                </span>{' '}
                to our community discovery queue.
              </p>
            </div>

            {submittedRequest.suggestedInstagramHandles.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-left space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Suggested Creator Handles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {submittedRequest.suggestedInstagramHandles.map((handle) => (
                    <span
                      key={handle}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/30"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{handle}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {submittedRequest.parentNotes && (
              <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-3 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Parent Notes
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {submittedRequest.parentNotes}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetForm}
                data-testid="coverage-request-another-button"
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
              >
                Request Another City
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                data-testid="coverage-done-button"
                className="flex-1 py-2.5 px-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            data-testid="coverage-request-form"
            className="space-y-3.5"
          >
            <p className="text-xs text-slate-300 leading-relaxed">
              Traveling or living outside the Capital Region? Tell us your city
              and your favorite local family Instagram accounts so we can index
              kid-friendly spots in your area.
            </p>

            {error && (
              <div
                role="alert"
                data-testid="coverage-error-message"
                className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-medium"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="coverage-city-input"
                  className="text-xs font-semibold text-slate-300 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>City or Town *</span>
                </label>
                <input
                  id="coverage-city-input"
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Burlington, Austin, Raleigh"
                  data-testid="coverage-city-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="coverage-state-zip-input"
                  className="text-xs font-semibold text-slate-300 block"
                >
                  State or ZIP *
                </label>
                <input
                  id="coverage-state-zip-input"
                  type="text"
                  value={stateOrZip}
                  onChange={(e) => setStateOrZip(e.target.value)}
                  placeholder="e.g. VT or 05401"
                  data-testid="coverage-state-zip-input"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="coverage-handles-input"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5 text-pink-400" />
                <span>Local Family Instagram Creators (@handles)</span>
              </label>
              <input
                id="coverage-handles-input"
                type="text"
                value={handlesInput}
                onChange={(e) => setHandlesInput(e.target.value)}
                placeholder="e.g. @capitaldistrictmoms, @518kids"
                data-testid="coverage-handles-input"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
              <p className="text-[11px] text-slate-400">
                Separate multiple handles with commas or spaces.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="coverage-notes-input"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Favorite Local Parks, Museums, or Notes</span>
              </label>
              <textarea
                id="coverage-notes-input"
                rows={2}
                value={parentNotes}
                onChange={(e) => setParentNotes(e.target.value)}
                placeholder="Tell us about go-to rainy day spots or fenced toddler parks in your town..."
                data-testid="coverage-notes-input"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 resize-none"
              />
            </div>

            {existingRequests.length > 0 && (
              <div
                data-testid="existing-coverage-requests-summary"
                className="px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400"
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Community queue requests saved locally:</span>
                </span>
                <span className="font-bold text-teal-400">
                  {existingRequests.length}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-700 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                data-testid="cancel-coverage-modal-button"
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="submit-coverage-request-button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Coverage Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
