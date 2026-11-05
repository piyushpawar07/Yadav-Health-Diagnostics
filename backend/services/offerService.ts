import { BloodTest, FestivalOffer, ActiveOfferSummary } from '../../frontend/src/types';
import { LocalDatabase, OfferPoster } from '../models/db';
import { getTestPricing, isOfferActive } from '../../frontend/src/lib/offers';

export const MAX_POSTER_BYTES = 2 * 1024 * 1024;

export const getActiveOffer = (db: LocalDatabase, now = new Date()): FestivalOffer | null =>
  isOfferActive(db.offer, now) ? db.offer : null;

// The only place prices shown to patients are calculated
export const withPricing = <T extends BloodTest>(test: T, offer: FestivalOffer | null): T => ({
  ...test,
  pricing: getTestPricing(test.id, test.sellingPrice, offer),
});

export const toActiveOfferSummary = (offer: FestivalOffer | null): ActiveOfferSummary | null =>
  offer && {
    name: offer.name,
    generalDiscountPercent: offer.generalDiscountPercent,
    endsAt: offer.endsAt,
    // The version makes browsers fetch a replaced poster instead of a cached one
    posterUrl: offer.posterUpdatedAt ? `/api/offers/poster?v=${encodeURIComponent(offer.posterUpdatedAt)}` : null,
  };

// Accepts only real JPEG, PNG or WebP images, checked by their file signature
export const parsePosterDataUrl = (dataUrl: unknown): { poster: OfferPoster; error?: undefined } | { poster?: undefined; error: string } => {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ''));
  if (!match) {
    return { error: 'Poster must be a JPEG, PNG or WebP image.' };
  }

  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0 || data.length > MAX_POSTER_BYTES) {
    return { error: `Poster must be smaller than ${MAX_POSTER_BYTES / 1024 / 1024} MB.` };
  }

  const contentType = match[1];
  const signatures: Record<string, (d: Buffer) => boolean> = {
    'image/jpeg': d => d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff,
    'image/png': d => d.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': d => d.subarray(0, 4).toString('ascii') === 'RIFF' && d.subarray(8, 12).toString('ascii') === 'WEBP',
  };
  if (!signatures[contentType](data)) {
    return { error: 'The poster file is damaged or is not the image type it claims to be.' };
  }

  return { poster: { contentType, data } };
};
