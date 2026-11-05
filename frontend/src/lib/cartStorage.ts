// Keeps each patient's cart in this browser, so it survives logout and page reloads.
// Only test IDs are stored; prices always come from the latest test list.
const cartKey = (userId: string) => `yadav_diagnostics_cart_${userId}`;

export const loadSavedCartIds = (userId: string): string[] => {
  try {
    const ids = JSON.parse(localStorage.getItem(cartKey(userId)) || '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return []; // Storage blocked or data damaged: start with an empty cart
  }
};

export const saveCartIds = (userId: string, ids: string[]) => {
  try {
    if (ids.length > 0) localStorage.setItem(cartKey(userId), JSON.stringify(ids));
    else localStorage.removeItem(cartKey(userId));
  } catch {
    // Storage blocked (for example private browsing): the cart still works until the page closes
  }
};
