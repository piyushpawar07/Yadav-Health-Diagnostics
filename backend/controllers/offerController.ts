import { readDbAsync, writeDb, getOfferPoster, saveOfferPoster, deleteOfferPoster, OfferPoster } from '../models/db';
import { validateOfferInput } from '../../frontend/src/lib/offers';
import { getActiveOffer, parsePosterDataUrl } from '../services/offerService';

const sendPoster = (res: any, poster: OfferPoster, cacheControl: string) => {
  res.set({
    'Content-Type': poster.contentType,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(poster.data);
};

// Public: the poster is visible only while its offer is running
export const getPublicOfferPoster = async (req: any, res: any) => {
  const db = await readDbAsync();
  const offer = getActiveOffer(db);
  const poster = offer?.posterUpdatedAt ? await getOfferPoster() : null;
  if (!poster) {
    return res.status(404).json({ error: 'No offer poster is available right now.' });
  }
  sendPoster(res, poster, 'public, max-age=300');
};

export const getAdminOffer = async (req: any, res: any) => {
  const db = await readDbAsync();
  res.json({ offer: db.offer });
};

export const saveAdminOffer = async (req: any, res: any) => {
  const db = await readDbAsync();
  const result = validateOfferInput(req.body, db.tests.map(t => t.id));
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  db.offer = {
    ...result.offer,
    posterUpdatedAt: db.offer?.posterUpdatedAt ?? null,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  res.json({ offer: db.offer });
};

export const deleteAdminOffer = async (req: any, res: any) => {
  const db = await readDbAsync();
  if (!db.offer) {
    return res.status(404).json({ error: 'There is no festival offer to remove.' });
  }

  db.offer = null;
  writeDb(db);
  await deleteOfferPoster();
  res.json({ success: true, message: 'Festival offer removed. All tests are back to their normal prices.' });
};

export const uploadAdminOfferPoster = async (req: any, res: any) => {
  const result = parsePosterDataUrl(req.body.image);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const db = await readDbAsync();
  if (!db.offer) {
    return res.status(400).json({ error: 'Save the festival offer before adding a poster.' });
  }

  await saveOfferPoster(result.poster);
  db.offer = { ...db.offer, posterUpdatedAt: new Date().toISOString() };
  writeDb(db);
  res.json({ offer: db.offer });
};

export const deleteAdminOfferPoster = async (req: any, res: any) => {
  const db = await readDbAsync();
  if (!db.offer?.posterUpdatedAt) {
    return res.status(404).json({ error: 'There is no poster to remove.' });
  }

  await deleteOfferPoster();
  db.offer = { ...db.offer, posterUpdatedAt: null };
  writeDb(db);
  res.json({ offer: db.offer });
};

// Admin preview, available before the offer starts
export const getAdminOfferPoster = async (req: any, res: any) => {
  const poster = await getOfferPoster();
  if (!poster) {
    return res.status(404).json({ error: 'There is no poster.' });
  }
  sendPoster(res, poster, 'private, no-store');
};
