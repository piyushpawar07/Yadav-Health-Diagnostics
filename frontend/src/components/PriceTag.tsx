import React from 'react';
import { TestPricing } from '../types';

export const formatRupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
export const formatPercent = (percent: number) => `${Number(percent.toFixed(2))}%`;

interface PriceTagProps {
  pricing?: TestPricing;
  price: number;           // Used when the API sent no pricing
  size?: 'sm' | 'md' | 'lg';
}

// Shows the server-calculated price: original, discount and final payable amount
export default function PriceTag({ pricing, price, size = 'md' }: PriceTagProps) {
  const finalClass = {
    sm: 'text-xs font-semibold',
    md: 'text-xl font-black',
    lg: 'text-2xl font-black',
  }[size];

  if (!pricing || pricing.discountPercent <= 0) {
    return <span className={`${finalClass} text-emerald-400 font-mono`}>{formatRupees(pricing?.finalPrice ?? price)}</span>;
  }

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate-500 line-through font-mono">{formatRupees(pricing.originalPrice)}</span>
        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-extrabold uppercase">
          {formatPercent(pricing.discountPercent)} off
        </span>
      </span>
      <span className={`${finalClass} text-emerald-400 font-mono`}>{formatRupees(pricing.finalPrice)}</span>
      <span className="text-[10px] text-amber-300/90 font-semibold">You save {formatRupees(pricing.discountAmount)}</span>
    </span>
  );
}
