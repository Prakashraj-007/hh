// ============================================================
// Pre-Purchase Behavior Tracker — ReturnShield AI
// Tracks on-site behavior signals during the shop session
// to predict return intent before purchase.
// ============================================================

const STORAGE_KEY = (userId) => `behaviorSession_${userId}`;

// ── Event Types ──────────────────────────────────────────────
export const BehaviorEvent = {
  PRODUCT_VIEWED:    'PRODUCT_VIEWED',
  IMAGE_VIEWED:      'IMAGE_VIEWED',
  REVIEW_READ:       'REVIEW_READ',
  SIZE_GUIDE_OPENED: 'SIZE_GUIDE_OPENED',
  RETURN_PAGE_VISIT: 'RETURN_PAGE_VISIT',
  BUY_NOW:           'BUY_NOW',
};

// ── Helpers ───────────────────────────────────────────────────
const getSession = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(userId)) || 'null');
  } catch {
    return null;
  }
};

const saveSession = (userId, session) => {
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(session));
};

const initSession = (userId) => {
  const existing = getSession(userId);
  if (existing) return existing;
  const session = {
    userId,
    startedAt: Date.now(),
    events: [],
    returnPageVisitedBeforeBuy: false,
    purchasedProductId: null,
  };
  saveSession(userId, session);
  return session;
};

// ── Public: Track any shop event ─────────────────────────────
export const trackBehaviorEvent = (userId, eventType, payload = {}) => {
  if (!userId) return;
  const session = initSession(userId);
  session.events.push({
    type: eventType,
    productId: payload.productId || null,
    timestamp: Date.now(),
    ...payload,
  });

  // Mark if user visited return page BEFORE buying
  if (eventType === BehaviorEvent.RETURN_PAGE_VISIT) {
    const hasBought = session.events.some(e => e.type === BehaviorEvent.BUY_NOW);
    if (!hasBought) {
      session.returnPageVisitedBeforeBuy = true;
    }
  }

  // Record which product was purchased
  if (eventType === BehaviorEvent.BUY_NOW && payload.productId) {
    session.purchasedProductId = payload.productId;
  }

  saveSession(userId, session);
};

// ── Public: Track return page visit (called on ReturnForm mount) ──
export const trackReturnPageVisit = (userId) => {
  trackBehaviorEvent(userId, BehaviorEvent.RETURN_PAGE_VISIT);
};

// ── Public: Analyze behavior for a specific purchased product ─
export const analyzePurchaseBehavior = (userId, purchasedProductId, productCategory = '') => {
  const session = getSession(userId);

  let breakdown = {
    researchDepth: 0,
    sizeFitBehavior: 0,
    returnPolicyTiming: 0,
    buyNowSpeed: 0,
    browseDepth: 0,
  };
  let signals = [];

  if (!session || session.events.length === 0) {
    return {
      behaviorIntentScore: 0,
      breakdown,
      signals: ['No pre-purchase behavior data recorded for this session'],
      purchaseBehaviorRisk: 'Unknown',
    };
  }

  const events = session.events;
  const productEvents = events.filter(e => e.productId === purchasedProductId);

  // ── Signal 1: Product Research Depth (0–20 pts) ───────────
  // Genuine buyers view multiple images and read reviews
  const imagesViewed = productEvents.filter(e => e.type === BehaviorEvent.IMAGE_VIEWED).length;
  const reviewsRead   = productEvents.filter(e => e.type === BehaviorEvent.REVIEW_READ).length;

  if (imagesViewed === 0 && reviewsRead === 0) {
    breakdown.researchDepth = 20; // No research at all — high risk
    signals.push('Pre-Purchase [Research]: No product images viewed, no reviews read before purchase');
  } else if (imagesViewed === 0 || reviewsRead === 0) {
    breakdown.researchDepth = 10;
    signals.push(`Pre-Purchase [Research]: Minimal research — ${imagesViewed} image(s) viewed, reviews ${reviewsRead > 0 ? 'read' : 'skipped'}`);
  } else {
    signals.push(`Pre-Purchase [Research]: Genuine research — ${imagesViewed} image(s) viewed, reviews read`);
  }

  // ── Signal 2: Size / Fit Behavior (0–15 pts) ──────────────
  // Only applies to Fashion, Footwear, Accessories
  const isFitCategory = ['Fashion', 'Footwear', 'Accessories'].includes(productCategory);
  if (isFitCategory) {
    const sizeGuideOpened = productEvents.some(e => e.type === BehaviorEvent.SIZE_GUIDE_OPENED);
    if (!sizeGuideOpened) {
      breakdown.sizeFitBehavior = 15;
      signals.push(`Pre-Purchase [Size/Fit]: Size guide skipped for a ${productCategory} item — wardrobing risk elevated`);
    } else {
      signals.push(`Pre-Purchase [Size/Fit]: Size guide consulted — genuine fit-checking behavior`);
    }
  }

  // ── Signal 3: Return Policy Timing (0–20 pts) ─────────────
  // Customer visited /customer/return BEFORE making a purchase
  if (session.returnPageVisitedBeforeBuy) {
    breakdown.returnPolicyTiming = 20;
    signals.push('Pre-Purchase [Policy]: Customer visited the Return Policy page BEFORE completing purchase — strong intent signal');
  }

  // ── Signal 4: Buy Now Speed (0–30 pts) ────────────────────
  // Time from first PRODUCT_VIEWED → BUY_NOW for this product
  const firstView = productEvents.find(e => e.type === BehaviorEvent.PRODUCT_VIEWED);
  const buyNow    = productEvents.find(e => e.type === BehaviorEvent.BUY_NOW);

  if (firstView && buyNow) {
    const secondsToBuy = Math.round((buyNow.timestamp - firstView.timestamp) / 1000);

    if (secondsToBuy < 5) {
      breakdown.buyNowSpeed = 30;
      signals.push(`Pre-Purchase [Speed]: Purchased within ${secondsToBuy}s of first viewing — extremely fast (high risk)`);
    } else if (secondsToBuy < 15) {
      breakdown.buyNowSpeed = 20;
      signals.push(`Pre-Purchase [Speed]: Purchased within ${secondsToBuy}s of first viewing — very fast`);
    } else if (secondsToBuy < 30) {
      breakdown.buyNowSpeed = 10;
      signals.push(`Pre-Purchase [Speed]: Purchased within ${secondsToBuy}s of first viewing — slightly fast`);
    } else {
      signals.push(`Pre-Purchase [Speed]: ${secondsToBuy}s from view to purchase — normal browsing pace`);
    }
  } else if (!firstView) {
    // Bought without ever opening the modal — direct buy
    breakdown.buyNowSpeed = 30;
    signals.push('Pre-Purchase [Speed]: Item purchased without opening product details — no research phase detected');
  }

  // ── Signal 5: Browse Depth / Path (0–15 pts) ──────────────
  // How many UNIQUE products were expanded before purchasing
  const uniqueProductsViewed = new Set(
    events.filter(e => e.type === BehaviorEvent.PRODUCT_VIEWED && e.productId).map(e => e.productId)
  ).size;

  if (uniqueProductsViewed <= 1) {
    breakdown.browseDepth = 15;
    signals.push(`Pre-Purchase [Browse]: Only 1 product viewed before purchase — no comparison browsing`);
  } else if (uniqueProductsViewed <= 2) {
    breakdown.browseDepth = 7;
    signals.push(`Pre-Purchase [Browse]: ${uniqueProductsViewed} products viewed — limited comparison`);
  } else {
    signals.push(`Pre-Purchase [Browse]: ${uniqueProductsViewed} products viewed — thorough browsing pattern`);
  }

  // ── Final Score ───────────────────────────────────────────
  const behaviorIntentScore = Math.min(100,
    Object.values(breakdown).reduce((a, b) => a + b, 0)
  );

  let purchaseBehaviorRisk = 'Low';
  if (behaviorIntentScore >= 60) purchaseBehaviorRisk = 'High';
  else if (behaviorIntentScore >= 30) purchaseBehaviorRisk = 'Medium';

  return { behaviorIntentScore, breakdown, signals, purchaseBehaviorRisk };
};

// ── Public: Clear session after claim is submitted ────────────
export const clearBehaviorSession = (userId) => {
  localStorage.removeItem(STORAGE_KEY(userId));
};
