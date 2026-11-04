import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapPin, Phone, Navigation, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VisitLocation } from '../types';
import { NearbyVisit } from '../lib/nearby';

export interface VisitDetails {
  contactPhone: string;
  visitAddress: string;
  visitArea: string;
  visitPincode: string;
  visitLandmark: string;
  visitLocation: VisitLocation | null;
}

const LOW_ACCURACY_METERS = 200;

const mapEmbedUrl = ({ latitude, longitude }: VisitLocation) =>
  `https://maps.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`;

function LocationMap({ location }: { location: VisitLocation }) {
  return (
    <iframe
      src={mapEmbedUrl(location)}
      title="Home visit location"
      loading="lazy"
      referrerPolicy="no-referrer"
      className="w-full h-48 rounded-xl border border-slate-800"
    ></iframe>
  );
}

// Draggable pin, because device GPS can be far off, especially on laptops and indoors
function PinPicker({ start, onMove }: { start: VisitLocation; onMove: (latitude: number, longitude: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    const map = L.map(containerRef.current!, { maxZoom: 19 }).setView([start.latitude, start.longitude], 18);
    const esriTiles = (service: string, attribution?: string) => L.tileLayer(
      `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`,
      { maxZoom: 19, maxNativeZoom: 18, attribution }
    );
    const satellite = L.layerGroup([
      esriTiles('World_Imagery', 'Imagery &copy; Esri'),
      esriTiles('Reference/World_Transportation'),
      esriTiles('Reference/World_Boundaries_and_Places'),
    ]).addTo(map);
    const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });
    L.control.layers({ Satellite: satellite, Street: street }, undefined, { collapsed: false }).addTo(map);

    const icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
    const marker = L.marker([start.latitude, start.longitude], { draggable: true, icon }).addTo(map);
    const movePin = ({ lat, lng }: L.LatLng) => {
      marker.setLatLng([lat, lng]);
      onMoveRef.current(lat, lng);
    };
    marker.on('dragend', () => movePin(marker.getLatLng()));
    map.on('click', (e: L.LeafletMouseEvent) => movePin(e.latlng));

    return () => { map.remove(); };
  }, []);

  return <div ref={containerRef} className="w-full h-64 rounded-xl border border-slate-800 isolate"></div>;
}

interface HomeVisitFormProps {
  details: VisitDetails;
  onChange: (details: VisitDetails) => void;
  labPhone?: string;
}

export function HomeVisitForm({ details, onChange, labPhone }: HomeVisitFormProps) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [captureCount, setCaptureCount] = useState(0);
  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm';
  const location = details.visitLocation;

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('This browser cannot share location. Please open this site in Chrome on your phone.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({
          ...details,
          visitLocation: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: Math.round(coords.accuracy),
            pinConfirmed: false,
          },
        });
        setCaptureCount(captureCount + 1);
        setLocating(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          [err.PERMISSION_DENIED]: 'Location permission is blocked. Tap the icon beside the website address, allow Location, then try again.',
          [err.POSITION_UNAVAILABLE]: 'We could not find your location. Please turn on Location on your device and try again.',
          [err.TIMEOUT]: 'Finding your location took too long. Please move near a window and try again.',
        };
        setLocationError(messages[err.code] || 'We could not get your location. Please try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        4. Home Visit Details *
      </label>
      <input
        type="tel"
        required
        placeholder="10-digit mobile number"
        value={details.contactPhone}
        onChange={(e) => onChange({ ...details, contactPhone: e.target.value })}
        className={inputClass}
      />
      <textarea
        required
        rows={2}
        maxLength={300}
        placeholder="Full address: house no, street, area, city"
        value={details.visitAddress}
        onChange={(e) => onChange({ ...details, visitAddress: e.target.value })}
        className={inputClass}
      />
      <input
        type="text"
        required
        maxLength={80}
        placeholder="Village / area name"
        value={details.visitArea}
        onChange={(e) => onChange({ ...details, visitArea: e.target.value })}
        className={inputClass}
      />
      <input
        type="text"
        inputMode="numeric"
        required
        maxLength={6}
        pattern="[1-9][0-9]{5}"
        title="Enter your 6-digit PIN code"
        placeholder="6-digit PIN code"
        value={details.visitPincode}
        onChange={(e) => onChange({ ...details, visitPincode: e.target.value })}
        className={inputClass}
      />
      <input
        type="text"
        maxLength={150}
        placeholder="Nearby landmark (optional)"
        value={details.visitLandmark}
        onChange={(e) => onChange({ ...details, visitLandmark: e.target.value })}
        className={inputClass}
      />

      <button
        type="button"
        onClick={captureLocation}
        disabled={locating}
        className="w-full py-2.5 flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-60"
      >
        {locating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {locating ? 'Finding your location...' : location ? 'Update my location' : 'Share my current location *'}
      </button>
      <p className="text-[10px] text-slate-500 leading-normal">
        Please tap this while you are at the address above, so our technician can find you.
      </p>

      {locationError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 rounded-xl flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {locationError}
            {labPhone && ` Need help? Call the lab on ${labPhone}.`}
          </span>
        </div>
      )}

      {location && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-200">
            Find your roof on the map. If the pin is not on it, drag the pin or tap the map to move it.
          </p>
          <div key={captureCount}>
            <PinPicker
              start={location}
              onMove={(latitude, longitude) =>
                onChange({ ...details, visitLocation: { ...location, latitude, longitude, pinConfirmed: false } })
              }
            />
          </div>
          {location.pinConfirmed ? (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Pin confirmed. Our technician will come to this spot.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onChange({ ...details, visitLocation: { ...location, pinConfirmed: true } })}
              className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Yes, the pin is on the correct place *
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface VisitDetailsPanelProps {
  phone?: string;
  address?: string;
  area?: string;
  pincode?: string;
  landmark?: string;
  location?: VisitLocation;
  nearby?: NearbyVisit | null;
}

export function VisitDetailsPanel({ phone, address, area, pincode, landmark, location, nearby }: VisitDetailsPanelProps) {
  const [showMap, setShowMap] = useState(false);
  const destination = location ? `${location.latitude},${location.longitude}` : address;
  const buttonClass = 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 text-[10px] font-bold transition cursor-pointer';

  return (
    <div className="mt-2 space-y-1.5 min-w-[220px] max-w-[260px]">
      {phone && (
        <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-emerald-400 font-bold hover:underline">
          <Phone className="h-3 w-3" /> {phone}
        </a>
      )}
      {address && <p className="text-[10px] text-slate-300 whitespace-normal leading-normal">{address}{area && `, ${area}`}{pincode && ` - ${pincode}`}</p>}
      {landmark && <p className="text-[10px] text-slate-500 whitespace-normal">Near: {landmark}</p>}
      {!location && <p className="text-[10px] text-amber-400">No GPS location shared with this booking.</p>}
      {nearby && (
        <p className="text-[10px] font-bold text-sky-400 whitespace-normal leading-normal">
          📍 Nearby: {nearby.distanceKm === null ? 'same PIN code as' : `${nearby.distanceKm.toFixed(1)} km from`} {nearby.visit.patientName}'s visit ({nearby.visit.appointmentTime})
        </p>
      )}
      {location?.pinConfirmed && <p className="text-[10px] text-emerald-400">Pin confirmed by patient.</p>}
      {location && !location.pinConfirmed && location.accuracy > LOW_ACCURACY_METERS && (
        <p className="text-[10px] text-amber-400">GPS is approximate (about {location.accuracy} m). Call to confirm.</p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {location && (
          <button type="button" onClick={() => setShowMap(!showMap)} className={buttonClass}>
            <MapPin className="h-3 w-3" /> {showMap ? 'Hide map' : 'View map'}
          </button>
        )}
        {destination && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&dir_action=navigate`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
          >
            <Navigation className="h-3 w-3" /> Directions
          </a>
        )}
      </div>
      {showMap && location && <LocationMap location={location} />}
    </div>
  );
}
