import React from 'react';
import { MapPin, Phone, Mail, Clock, Map, Navigation, Shield, Compass } from 'lucide-react';
import { LabInfo } from '../types';

interface LabMapProps {
  labInfo: LabInfo;
}

export default function LabMap({ labInfo }: LabMapProps) {
  // Convert standard Google Maps links to Embed links if possible
  const getEmbedUrl = (link: string) => {
    if (!link) return '';
    try {
      // If it's already an embed URL, return as-is
      if (link.includes('embed') || link.includes('maps/embed')) {
        return link;
      }
      // If it contains a mid-coordinates or place ID, parse or just construct a generic search embed query
      const url = new URL(link);
      const searchParams = url.searchParams;
      const q = searchParams.get('q') || searchParams.get('query') || `${labInfo.latitude},${labInfo.longitude}`;
      return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    } catch (e) {
      // Fallback embed structure using lat/lng
      return `https://maps.google.com/maps?q=${labInfo.latitude},${labInfo.longitude}&z=14&output=embed`;
    }
  };

  const embedUrl = getEmbedUrl(labInfo.googleMapLink);

  return (
    <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Detail Cards */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl mt-0.5">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Physical Laboratory Address</p>
                <p className="text-slate-200 mt-1.5 text-sm font-medium leading-relaxed leading-6">{labInfo.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Contact Hotline</p>
                  <p className="text-slate-350 text-xs font-mono mt-0.5">{labInfo.phone}</p>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Support Email</p>
                  <p className="text-slate-350 text-xs font-mono mt-0.5 truncate">{labInfo.email}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start border-t border-slate-850 pt-4">
              <div className="p-2.5 bg-slate-950 text-slate-400 border border-slate-850 rounded-xl mt-0.5">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Laboratory Operating Hours</p>
                <p className="text-slate-200 mt-1.5 text-xs font-medium leading-relaxed">{labInfo.openingHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-850 p-4.5 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Compass className="h-4 w-4" /> Satellite Coordinates
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 text-center">
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Latitude</p>
                <p className="text-slate-300 font-mono text-xs font-bold mt-1">{labInfo.latitude}° N</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Longitude</p>
                <p className="text-slate-300 font-mono text-xs font-bold mt-1">{labInfo.longitude}° E</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Rendering Container */}
        <div className="lg:col-span-7 relative h-72 lg:h-auto min-h-[300px] border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, opacity: 0.85 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer"
              title={`${labInfo.labName} location map`}
              className="absolute inset-0 h-full w-full grayscale contrast-125"
            ></iframe>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Map className="h-12 w-12 text-slate-700 animate-bounce duration-1000 mb-3" />
              <p className="text-slate-400 font-bold text-sm">Laboratory Interactive Map</p>
              <p className="text-slate-600 text-xs mt-1.5 max-w-sm">
                Iframe visualization is temporarily disabled. Visit external Google Maps to chart exact path coordinates.
              </p>
              <a
                href={labInfo.googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5"
              >
                <Navigation className="h-3.5 w-3.5" /> Navigate Path
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
