import type { FestivalOffer, TestPricing } from '../types';

export const MIN_DISCOUNT_PERCENT = 0;
export const MAX_DISCOUNT_PERCENT = 100;
export const OFFER_NAME_MAX_LENGTH = 60;

export type OfferInput = Pick<FestivalOffer, 'name' | 'generalDiscountPercent' | 'testDiscounts' | 'startsAt' | 'endsAt'>;

export const isOfferActive = (offer: FestivalOffer | null | undefined, now = new Date()): offer is FestivalOffer =>
  !!offer && new Date(offer.startsAt) <= now && now < new Date(offer.endsAt);

// A test's own discount overrides the general discount. Prices round to whole rupees.
export const getTestPricing = (testId: string, originalPrice: number, offer: FestivalOffer | null | undefined): TestPricing => {
  const discountPercent = offer ? (offer.testDiscounts[testId] ?? offer.generalDiscountPercent) : 0;
  const finalPrice = Math.round(originalPrice * (1 - discountPercent / 100));
  return {
    originalPrice,
    discountPercent,
    discountAmount: originalPrice - finalPrice,
    finalPrice,
  };
};

const isValidPercent = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= MIN_DISCOUNT_PERCENT && value <= MAX_DISCOUNT_PERCENT;

// Shared by the admin form and the API, so both give the same messages
export const validateOfferInput = (
  input: any,
  knownTestIds: string[],
  now = new Date()
): { offer: OfferInput; error?: undefined } | { offer?: undefined; error: string } => {
  const name = String(input?.name ?? '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > OFFER_NAME_MAX_LENGTH) {
    return { error: `Offer name must be 2 to ${OFFER_NAME_MAX_LENGTH} characters.` };
  }

  const percentRange = `${MIN_DISCOUNT_PERCENT}% to ${MAX_DISCOUNT_PERCENT}%`;
  if (!isValidPercent(input.generalDiscountPercent)) {
    return { error: `General discount must be a number from ${percentRange}.` };
  }

  const rawTestDiscounts = input.testDiscounts ?? {};
  if (typeof rawTestDiscounts !== 'object' || Array.isArray(rawTestDiscounts)) {
    return { error: 'Test discounts are in an invalid format.' };
  }
  const testDiscounts: Record<string, number> = {};
  for (const [testId, percent] of Object.entries(rawTestDiscounts)) {
    if (!knownTestIds.includes(testId)) {
      return { error: 'A test discount refers to a test that does not exist.' };
    }
    if (!isValidPercent(percent)) {
      return { error: `Each test discount must be a number from ${percentRange}.` };
    }
    testDiscounts[testId] = percent;
  }

  if (input.generalDiscountPercent === 0 && !Object.values(testDiscounts).some(p => p > 0)) {
    return { error: 'Set a general discount or at least one test discount above 0%.' };
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: 'Please choose a valid start and end date and time.' };
  }
  if (endsAt <= startsAt) {
    return { error: 'The offer must end after it starts.' };
  }
  if (endsAt <= now) {
    return { error: 'The end date and time must be in the future.' };
  }

  return {
    offer: {
      name,
      generalDiscountPercent: input.generalDiscountPercent,
      testDiscounts,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    },
  };
};
