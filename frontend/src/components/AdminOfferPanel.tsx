import React, { useEffect, useState } from 'react';
import { Sparkles, Upload, Trash2, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BloodTest, FestivalOffer } from '../types';
import axiosClient from '../lib/axios';
import { getTestPricing, isOfferActive, validateOfferInput, MAX_DISCOUNT_PERCENT } from '../lib/offers';
import { formatRupees, formatPercent } from './PriceTag';

interface AdminOfferPanelProps {
  tests: BloodTest[];
  onOfferChanged: () => void; // Reload prices shown elsewhere in the app
}

const POSTER_MAX_WIDTH = 1600;
const POSTER_MAX_BYTES = 2 * 1024 * 1024; // Matches the server limit

// datetime-local inputs use the admin's local time without a timezone
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// Shrinks large photos before upload, so posters stay small and load fast
const compressPoster = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, POSTER_MAX_WIDTH / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image.'));
    };
    image.src = url;
  });

const dataUrlBytes = (dataUrl: string) => Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);

const errorMessage = (err: any, fallback: string) => err.response?.data?.error || err.message || fallback;

export default function AdminOfferPanel({ tests, onOfferChanged }: AdminOfferPanelProps) {
  const [savedOffer, setSavedOffer] = useState<FestivalOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [generalPercent, setGeneralPercent] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [testPercents, setTestPercents] = useState<Record<string, string>>({});

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterDraft, setPosterDraft] = useState<string | null>(null); // New image waiting to be saved
  const [removePoster, setRemovePoster] = useState(false);

  const fillForm = (offer: FestivalOffer | null) => {
    setSavedOffer(offer);
    setName(offer?.name ?? '');
    setGeneralPercent(offer ? String(offer.generalDiscountPercent) : '');
    setStartsAt(offer ? toLocalInput(offer.startsAt) : '');
    setEndsAt(offer ? toLocalInput(offer.endsAt) : '');
    setTestPercents(Object.fromEntries(Object.entries(offer?.testDiscounts ?? {}).map(([id, p]) => [id, String(p)])));
    setPosterDraft(null);
    setRemovePoster(false);
  };

  const loadPosterPreview = async (offer: FestivalOffer | null) => {
    if (!offer?.posterUpdatedAt) {
      setPosterPreview(null);
      return;
    }
    try {
      const res = await axiosClient.get('/api/admin/offer/poster', { responseType: 'blob' });
      setPosterPreview(URL.createObjectURL(res.data));
    } catch {
      setPosterPreview(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get('/api/admin/offer');
        fillForm(res.data.offer);
        await loadPosterPreview(res.data.offer);
      } catch (err: any) {
        setNotice({ type: 'error', text: errorMessage(err, 'Could not load the festival offer.') });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Release object URLs made for admin previews
  useEffect(() => () => {
    if (posterPreview?.startsWith('blob:')) URL.revokeObjectURL(posterPreview);
  }, [posterPreview]);

  const parsePercent = (value: string) => (value.trim() === '' ? NaN : Number(value));
  const draftInput = {
    name,
    generalDiscountPercent: parsePercent(generalPercent),
    testDiscounts: Object.fromEntries(
      (Object.entries(testPercents) as [string, string][]).filter(([, v]) => v.trim() !== '').map(([id, v]) => [id, parsePercent(v)])
    ),
    startsAt,
    endsAt,
  };

  // Preview only. The server recalculates every price when a patient books.
  const previewOffer = Number.isFinite(draftInput.generalDiscountPercent)
    ? { ...draftInput, posterUpdatedAt: null, updatedAt: '' } as FestivalOffer
    : null;
  const belowCostCount = previewOffer
    ? tests.filter(t => getTestPricing(t.id, t.sellingPrice, previewOffer).finalPrice < t.basePrice).length
    : 0;

  const status = !savedOffer
    ? null
    : isOfferActive(savedOffer)
      ? { label: 'Active now', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
      : new Date(savedOffer.startsAt) > new Date()
        ? { label: 'Scheduled', className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' }
        : { label: 'Ended', className: 'bg-slate-800 text-slate-400 border-slate-700' };

  const handlePosterFile = async (file: File | undefined) => {
    if (!file) return;
    setNotice(null);
    try {
      const dataUrl = await compressPoster(file);
      if (dataUrlBytes(dataUrl) > POSTER_MAX_BYTES) {
        setNotice({ type: 'error', text: 'This poster is too large even after compression. Please use a smaller image.' });
        return;
      }
      setPosterDraft(dataUrl);
      setPosterPreview(dataUrl);
      setRemovePoster(false);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const result = validateOfferInput(draftInput, tests.map(t => t.id));
    if (result.error) {
      setNotice({ type: 'error', text: result.error });
      return;
    }

    setSaving(true);
    try {
      let offer: FestivalOffer = (await axiosClient.put('/api/admin/offer', result.offer)).data.offer;
      if (posterDraft) {
        offer = (await axiosClient.put('/api/admin/offer/poster', { image: posterDraft })).data.offer;
      } else if (removePoster && offer.posterUpdatedAt) {
        offer = (await axiosClient.delete('/api/admin/offer/poster')).data.offer;
        setPosterPreview(null);
      }
      fillForm(offer);
      setNotice({ type: 'success', text: 'Festival offer saved. Prices update across the website automatically.' });
      onOfferChanged();
    } catch (err: any) {
      setNotice({ type: 'error', text: errorMessage(err, 'Could not save the festival offer.') });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOffer = async () => {
    if (!confirm('Remove this festival offer? All tests will return to their normal prices.')) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await axiosClient.delete('/api/admin/offer');
      fillForm(null);
      setPosterPreview(null);
      setNotice({ type: 'success', text: res.data.message });
      onOfferChanged();
    } catch (err: any) {
      setNotice({ type: 'error', text: errorMessage(err, 'Could not remove the festival offer.') });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400';
  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5';

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-10 text-center text-slate-400 text-sm">
        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading festival offer...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-300" /> Festival Offer
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            The general discount applies to every test. A test's own discount replaces it. Leave a test blank to use the general discount, or enter 0 to exclude it.
          </p>
        </div>
        {status && <span className={`w-fit px-3 py-1 rounded-full border text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>}
      </div>

      {notice && (
        <div role={notice.type === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
          notice.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        }`}>
          {notice.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="offer-name">Offer name *</label>
          <input id="offer-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Diwali Special" maxLength={60} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="offer-general">General discount on all tests (%) *</label>
          <input id="offer-general" type="number" min={0} max={MAX_DISCOUNT_PERCENT} step="0.01" value={generalPercent} onChange={e => setGeneralPercent(e.target.value)} placeholder="e.g. 10" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="offer-start">Starts *</label>
          <input id="offer-start" type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="offer-end">Ends *</label>
          <input id="offer-end" type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <p className={labelClass}>Discount per test</p>
        {belowCostCount > 0 && (
          <p className="mb-2 text-xs text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> {belowCostCount} test{belowCostCount > 1 ? 's' : ''} would sell below base cost with these discounts.
          </p>
        )}
        <div className="overflow-x-auto border border-slate-850 rounded-xl">
          <table className="w-full text-left text-xs min-w-[560px]">
            <thead className="bg-slate-950/40 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Test</th>
                <th className="p-3">Price</th>
                <th className="p-3">Own discount (%)</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Patient pays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {tests.map(t => {
                const pricing = getTestPricing(t.id, t.sellingPrice, previewOffer);
                const valid = previewOffer && Number.isFinite(pricing.finalPrice);
                return (
                  <tr key={t.id}>
                    <td className="p-3 text-slate-200 font-semibold">{t.testName}</td>
                    <td className="p-3 font-mono text-slate-400">{formatRupees(t.sellingPrice)}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        max={MAX_DISCOUNT_PERCENT}
                        step="0.01"
                        aria-label={`Own discount for ${t.testName}`}
                        value={testPercents[t.id] ?? ''}
                        onChange={e => setTestPercents({ ...testPercents, [t.id]: e.target.value })}
                        placeholder="General"
                        className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      />
                    </td>
                    <td className="p-3 font-mono text-amber-300">
                      {valid ? `${formatPercent(pricing.discountPercent)} (${formatRupees(pricing.discountAmount)})` : '-'}
                    </td>
                    <td className={`p-3 font-mono font-bold ${valid && pricing.finalPrice < t.basePrice ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {valid ? formatRupees(pricing.finalPrice) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className={labelClass}>Home page poster (optional)</p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {posterPreview && !removePoster ? (
            <img src={posterPreview} alt="Offer poster preview" className="w-full sm:w-72 rounded-xl border border-slate-800 object-contain bg-slate-950" />
          ) : (
            <p className="text-xs text-slate-500">No poster. The home page will show a text banner during the offer.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <label className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 hover:border-amber-400">
              <Upload className="h-3.5 w-3.5" /> {posterPreview && !removePoster ? 'Replace poster' : 'Choose poster'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { handlePosterFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {posterPreview && !removePoster && (
              <button type="button" onClick={() => { setRemovePoster(true); setPosterDraft(null); }} className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Remove poster
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-2">JPEG, PNG or WebP. Large images are resized before upload. Patients see it only while the offer is running.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-850 pt-5">
        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-sm rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-2">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save offer'}
        </button>
        {savedOffer && (
          <button type="button" disabled={saving} onClick={handleRemoveOffer} className="px-5 py-2.5 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50 font-bold text-sm rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" /> Remove offer
          </button>
        )}
      </div>
    </form>
  );
}
