import React from 'react';
import { FlaskConical, Clock, Heart, ShoppingCart, Check } from 'lucide-react';
import { BloodTest } from '../types';

interface TestCardProps {
  key?: React.Key;
  test: BloodTest;
  onAddToCart: (test: BloodTest) => void;
  isAddedToCart: boolean;
  onViewDetails: (test: BloodTest) => void;
}

export default function TestCard({ test, onAddToCart, isAddedToCart, onViewDetails }: TestCardProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group shadow-lg shadow-black/10">
      <div>
        <div className="flex justify-between items-start gap-2 mb-3">
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {test.category}
          </span>
          <span className="text-slate-500 text-xs font-mono flex items-center gap-1.5 bg-slate-950/30 px-2 py-0.5 rounded-md border border-slate-900">
            <Clock className="h-3 w-3 text-slate-400" /> {test.reportTime}
          </span>
        </div>

        <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-emerald-400 transition-colors duration-250 leading-snug">
          {test.testName}
        </h3>

        <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
          {test.description}
        </p>

        <div className="mt-4 space-y-2 border-t border-slate-850 pt-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500">Specimen:</span>
            <span className="bg-slate-950/40 text-slate-300 px-2 py-0.5 rounded border border-slate-900/60 font-mono">
              {test.sampleType}
            </span>
          </div>
          {test.preparationInstructions && (
            <div className="text-[11px] text-slate-400 line-clamp-1">
              <span className="font-semibold text-slate-500">Preparation:</span> {test.preparationInstructions}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block leading-none">Diagnostic Cost</span>
          <span className="text-xl font-black text-emerald-400 inline-flex items-baseline mt-0.5 font-mono">
            ₹{test.sellingPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(test)}
            className="px-3 py-1.5 text-xs text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400/30 rounded-xl transition-all font-medium"
          >
            Details
          </button>
          
          <button
            type="button"
            onClick={() => onAddToCart(test)}
            className={`px-3.5 py-1.5 text-xs rounded-xl transition-all flex items-center gap-1.5 font-bold ${
              isAddedToCart
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95'
            }`}
          >
            {isAddedToCart ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" /> Book
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
