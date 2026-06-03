import React from 'react';
import { Activity } from 'lucide-react';

export default function LabLogo() {
  return (
    <div className="flex items-center gap-2 select-none group cursor-pointer">
      <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/15 group-hover:scale-105 transition-all">
        <Activity className="h-4.5 w-4.5 text-slate-950 animate-pulse stroke-[3]" />
      </div>
      <div>
        <p className="font-extrabold text-xs tracking-wider text-slate-100 uppercase leading-none font-sans">
          Yadav
        </p>
        <p className="font-black text-[9px] tracking-widest text-emerald-400 uppercase leading-none mt-1 font-mono">
          Diagnostics
        </p>
      </div>
    </div>
  );
}
