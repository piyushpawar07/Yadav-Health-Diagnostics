import { Booking } from '../../frontend/src/types';
import { findNearbyVisit } from '../../frontend/src/lib/nearby';

// Telegram is a third party, so alerts share only the area, never patient details.
// Staff open the dashboard behind the admin login to see them.
const buildAlertText = (booking: Booking, bookings: Booking[]) => {
  const details = [
    `New slot: ${booking.appointmentDate}, ${booking.appointmentTime}`,
    `Area: ${booking.visitArea || 'Not given'}, PIN ${booking.visitPincode || 'not given'}`,
  ].join('\n');
  const nearby = findNearbyVisit(booking, bookings);
  if (!nearby) return `🏠 NEW HOME VISIT BOOKING\n${details}`;

  const closeness = nearby.distanceKm === null ? 'Same PIN code as' : `${nearby.distanceKm.toFixed(1)} km from`;
  const nearbyArea = nearby.visit.visitArea ? ` in ${nearby.visit.visitArea}` : '';
  return `📍 NEARBY BOOKING\n${closeness} the ${nearby.visit.appointmentTime} visit${nearbyArea}\n${details}`;
};

// Never throws: a failed alert must not affect the booking
export const sendHomeVisitAlert = async (booking: Booking, bookings: Booking[]): Promise<void> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  // Telegram rejects the whole message if a button links to a non-https address
  const appUrl = process.env.APP_URL;
  const replyMarkup = appUrl?.startsWith('https://')
    ? { inline_keyboard: [[{ text: 'Open dashboard', url: appUrl }]] }
    : undefined;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: buildAlertText(booking, bookings), reply_markup: replyMarkup }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { description?: string } | null;
      console.error(`Telegram alert failed (${response.status}): ${body?.description || response.statusText}`);
    }
  } catch (error: any) {
    console.error(`Telegram alert failed: ${error.message}`);
  }
};
