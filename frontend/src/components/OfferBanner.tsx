import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ActiveOfferSummary } from '../types';
import axiosClient from '../lib/axios';

interface OfferBannerProps {
  offer: ActiveOfferSummary;
  onBrowse: () => void;
}

export default function OfferBanner({ offer, onBrowse }: OfferBannerProps) {
  const [posterFailed, setPosterFailed] = useState(false);
  const posterSrc = `${axiosClient.defaults.baseURL || ''}${offer.posterUrl}`;
  const endsOn =new Date(offer.endsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  return (
    <section aria-label={`${offer.name} offer`} className="rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900/60 shadow-lg">
      {offer.posterUrl && !posterFailed && (
        // Any poster shape fills the frame: wide posters span the full width, and tall ones
        // stay whole with a blurred copy filling the sides instead of empty bars
        <button type="button" onClick={onBrowse} className="relative block w-full overflow-hidden cursor-pointer bg-slate-950">
          <img
            src={posterSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-60"
          />
          <img
            src={posterSrc}
            alt={`${offer.name} offer poster`}
            onError={() => setPosterFailed(true)}
            className="relative block w-full h-auto max-h-[520px] object-contain"
          />
        </button>
      )}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-200 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <span>
            <strong className="text-amber-300">{offer.name}</strong> is live: special prices on blood tests until {endsOn}.
          </span>
        </p>
        <button
          type="button"
          onClick={onBrowse}
          className="shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          View offer prices <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
