// ============================================================
// Search Intent Detection Engine for Wardrobing Risk
// Analyzes in-app search sessions to detect temporary-use intent
// ============================================================

const OCCASION_KEYWORDS = [
  'wedding', 'party', 'diwali', 'farewell', 'photoshoot', 'vacation',
  'interview', 'ceremony', 'festival', 'eid', 'puja', 'reception',
  'engagement', 'birthday', 'anniversary', 'dance', 'bridal', 'lehenga',
  'saree', 'heels', 'gown', 'formal', 'occasion', 'event', 'outing', 'date night'
];

const URGENCY_KEYWORDS = [
  'urgent', 'same day', 'tomorrow', 'next day', 'fast delivery',
  'express', 'quick', 'asap', 'tonight', 'immediate', 'one day', 'rush'
];

const HIGH_RISK_CATEGORIES = ['Fashion', 'Footwear', 'Accessories'];

export const analyzeSearchIntent = (customerId, currentCategory = null, returnedOnDay = null, policyDays = null) => {
  const allSessions = JSON.parse(localStorage.getItem(`searchSessions_${customerId}`) || '[]');

  let intentBreakdown = {
    occasionScore: 0,
    urgencyScore: 0,
    speedScore: 0,
    repeatPatternScore: 0,
    historicalCorrelation: 0,
  };
  let flags = [];

  if (allSessions.length === 0) {
    return { intentScore: 0, intentBreakdown, wardrobingRisk: 'Low', flags };
  }

  const allQueries = allSessions.flatMap(s => s.queries || []);

  // === Signal 1: Occasion Keywords in Search (up to 20 pts) ===
  const matchedOccasions = allQueries.filter(q =>
    OCCASION_KEYWORDS.some(kw => q.toLowerCase().includes(kw))
  );
  if (matchedOccasions.length > 0) {
    const detectedKeyword = OCCASION_KEYWORDS.find(kw =>
      matchedOccasions.some(q => q.toLowerCase().includes(kw))
    );
    intentBreakdown.occasionScore = Math.min(20, matchedOccasions.length * 7);
    flags.push(`Occasion keyword in pre-purchase search: "${detectedKeyword}"`);
  }

  // === Signal 2: Urgency Keywords in Search (up to 15 pts) ===
  const matchedUrgency = allQueries.filter(q =>
    URGENCY_KEYWORDS.some(kw => q.toLowerCase().includes(kw))
  );
  if (matchedUrgency.length > 0) {
    intentBreakdown.urgencyScore = Math.min(15, matchedUrgency.length * 8);
    flags.push(`Urgency delivery keyword before purchase: "${matchedUrgency[0]}"`);
  }

  // === Signal 3: Post-Event Quick Return (Core Wardrobing Pattern) ===
  // Wardrobing = returned EARLY (Day 2-4), NOT late like deadline abusers (Day 6-7)
  // If they used it for the event and returned quickly → wardrobing
  if (returnedOnDay !== null && policyDays !== null) {
    const returnRatio = returnedOnDay / policyDays;

    if (intentBreakdown.occasionScore > 0 && returnRatio <= 0.5) {
      // Returned in first half of return window = post-event quick return
      intentBreakdown.speedScore = 10;
      flags.push(
        `Post-event quick return: Item returned on Day ${returnedOnDay} of ${policyDays}-day policy ` +
        `(${Math.round(returnRatio * 100)}% through window) after occasion-related search`
      );
    } else if (intentBreakdown.occasionScore > 0 && returnRatio <= 0.7) {
      intentBreakdown.speedScore = 5;
      flags.push(`Moderate early return after occasion search (Day ${returnedOnDay}/${policyDays})`);
    }
    // Note: Returns > 70% through window = deadline abuse (handled by behaviorEngine), NOT wardrobing
  }

  // === Signal 4: Repeat Event Cycle (up to 25 pts) ===
  const sessionsWithOccasion = allSessions.filter(s =>
    (s.queries || []).some(q => OCCASION_KEYWORDS.some(kw => q.toLowerCase().includes(kw)))
  );
  if (sessionsWithOccasion.length >= 3) {
    intentBreakdown.repeatPatternScore = 25;
    flags.push(`Repeat cycle: ${sessionsWithOccasion.length} separate occasion-driven sessions — consistent wardrobing pattern`);
  } else if (sessionsWithOccasion.length >= 2) {
    intentBreakdown.repeatPatternScore = 15;
    flags.push(`Repeat pattern: Multiple occasion-driven purchase sessions detected`);
  }

  // === Signal 5: Historical Correlation (up to 30 pts) ===
  // How many past sessions had: occasion search → purchase → returned early
  const pastWardrobingCycles = allSessions.filter(
    s => s.hadOccasionSearch && s.wasReturned
  ).length;
  if (pastWardrobingCycles >= 2) {
    intentBreakdown.historicalCorrelation = 30;
    flags.push(`${pastWardrobingCycles} past occasion-purchase cycles ended in return (strong wardrobing history)`);
  } else if (pastWardrobingCycles === 1) {
    intentBreakdown.historicalCorrelation = 15;
    flags.push(`Previous occasion purchase was returned after use (wardrobing correlation)`);
  }

  const intentScore = Math.min(100,
    Object.values(intentBreakdown).reduce((a, b) => a + b, 0)
  );

  let wardrobingRisk = 'Low';
  if (intentScore >= 50) wardrobingRisk = 'High';
  else if (intentScore >= 25) wardrobingRisk = 'Medium';

  return { intentScore, intentBreakdown, wardrobingRisk, flags };
};

// Save a search query to the current session
export const trackSearch = (customerId, query) => {
  if (!query || query.trim().length < 2) return;

  const storageKey = `searchSessions_${customerId}`;
  const sessions = JSON.parse(localStorage.getItem(storageKey) || '[]');

  // Get or create the active session (session = current login period)
  const activeSessionKey = `activeSession_${customerId}`;
  let activeSessionId = sessionStorage.getItem(activeSessionKey);

  if (!activeSessionId) {
    activeSessionId = `SES-${Date.now()}`;
    sessionStorage.setItem(activeSessionKey, activeSessionId);
    sessions.push({
      id: activeSessionId,
      queries: [],
      firstSearchAt: Date.now(),
      hadOccasionSearch: false,
      wasReturned: false,
    });
  }

  const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
  if (sessionIndex === -1) return;

  const session = sessions[sessionIndex];
  if (!session.queries.includes(query.trim())) {
    session.queries.push(query.trim());
  }
  session.firstSearchAt = session.firstSearchAt || Date.now();

  // Check if any query contains occasion keywords
  const hasOccasion = OCCASION_KEYWORDS.some(kw => query.toLowerCase().includes(kw));
  if (hasOccasion) session.hadOccasionSearch = true;

  sessions[sessionIndex] = session;
  localStorage.setItem(storageKey, JSON.stringify(sessions));
};

// Mark purchase happened (for speed scoring)
export const trackPurchase = (customerId) => {
  const storageKey = `searchSessions_${customerId}`;
  const sessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const activeSessionKey = `activeSession_${customerId}`;
  const activeSessionId = sessionStorage.getItem(activeSessionKey);
  if (!activeSessionId) return;

  const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].purchasedAt = Date.now();
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }
};

// Mark return happened for this session (called when return is submitted)
export const markSessionAsReturned = (customerId) => {
  const storageKey = `searchSessions_${customerId}`;
  const sessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const activeSessionKey = `activeSession_${customerId}`;
  const activeSessionId = sessionStorage.getItem(activeSessionKey);
  if (!activeSessionId) return;

  const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].wasReturned = true;
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }
};
