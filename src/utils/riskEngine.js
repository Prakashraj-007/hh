export const calculateRiskScore = (claim, userProfile, existingClaims = [], wardrobingIntent = null) => {
  let logs = [];
  let behaviorBreakdown = {
    frequency: 0,
    ratio: 0,
    velocity: 0,
    deadline: 0,
    highValue: 0,
    category: 0,
    loyalty: 0
  };
  
  // Combine past history with claims from the current session for real-time analysis
  const currentSessionReturns = existingClaims.filter(c => c.customer === userProfile.name);
  const totalReturns = (userProfile.totalReturns || 0) + currentSessionReturns.length;
  const totalOrders = (userProfile.totalOrders || 1) + currentSessionReturns.length;
  const returnRatio = totalReturns / totalOrders;

  // A. Return Frequency (Last 30 days)
  const historyReturns = userProfile.history?.filter(h => {
    const diff = (new Date('2026-04-29') - new Date(h.date)) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length || 0;
  
  const recentReturns = historyReturns + currentSessionReturns.length;

  if (recentReturns >= 2) {
    behaviorBreakdown.frequency = 20;
    logs.push(`${recentReturns} returns detected in last 30 days (High Frequency)`);
  }

  // B. Return Ratio
  if (returnRatio > 0.4) {
    behaviorBreakdown.ratio = 20;
    logs.push(`Return ratio is ${(returnRatio * 100).toFixed(1)}% (Unusually High)`);
  }

  // C. Return Velocity (Multiple returns in a short window)
  if (recentReturns >= 2 && userProfile.accountAgeDays < 90) {
    behaviorBreakdown.velocity = 15;
    logs.push("High return velocity on a relatively new account");
  }

  // D. Dynamic Deadline Abuse (Proportional to the finality of the request)
  const daysUsed = claim.requestedOnDay;
  const policyDays = claim.policyDays;
  const urgencyFactor = daysUsed / policyDays; // 0.0 to 1.0
  
  // Base abuse score scales linearly with the day requested
  let deadlineAbuseScore = Math.round(urgencyFactor * 20); 
  
  // Multiply if there is a historical pattern
  let historicalDeadlinePatterns = userProfile.history?.filter(h => h.policy - h.returnedOn <= 1).length || 0;
  if (urgencyFactor > 0.8 && historicalDeadlinePatterns > 0) {
    deadlineAbuseScore += 15; // Pattern bonus
    logs.push(`Repeated last-moment return pattern detected (Day ${daysUsed}/${policyDays})`);
  } else if (urgencyFactor > 0.9) {
    logs.push(`High-urgency return requested on final allowed day (Day ${daysUsed}/${policyDays})`);
  }
  behaviorBreakdown.deadline = deadlineAbuseScore;

  // F. High Value Abuse (Dynamic based on price vs average)
  const amount = parseInt(claim.amount?.replace(/[^0-9]/g, '') || '0');
  const avgOrderValue = (userProfile.totalSpend / totalOrders) || 1000;
  
  if (amount > avgOrderValue) {
    const valueRatio = amount / avgOrderValue;
    // Score increases as the item price exceeds the user's normal spending habits
    behaviorBreakdown.highValue = Math.min(25, Math.round((valueRatio - 1) * 10));
    if (behaviorBreakdown.highValue > 10) {
      logs.push(`High-value outlier: This item is ${(valueRatio).toFixed(1)}x more expensive than user's normal AOV`);
    }
  }

  // G. Category Abuse
  const sameCategoryReturns = userProfile.history?.filter(h => h.category === claim.category).length || 0;
  behaviorBreakdown.category = Math.min(20, sameCategoryReturns * 5);
  if (behaviorBreakdown.category > 0) {
    logs.push(`Category Focus: User has ${sameCategoryReturns} previous returns in ${claim.category}`);
  }

  // I. Loyalty Offset (Trust Bonus - Dynamic based on account age)
  let loyaltyBonus = 0;
  if (userProfile.accountAgeDays > 30) {
    // Scales up to -30 points for very old accounts (1000+ days)
    loyaltyBonus = Math.min(30, Math.round((userProfile.accountAgeDays / 1000) * 30));
    behaviorBreakdown.loyalty = -loyaltyBonus;
    logs.push(`Loyalty Credit: ${userProfile.accountAgeDays} day account age applied -${loyaltyBonus} trust offset`);
  }

  // 2. Aggregate Behavioral Score
  let behaviorScore = Object.values(behaviorBreakdown).reduce((a, b) => a + b, 0);
  behaviorScore = Math.max(0, Math.min(100, behaviorScore));

  // 3. Network Graph Engine (Simulated Logic)
  let networkBreakdown = {
    sharedDevice: 0,
    addressRisk: 0,
    linkedAccounts: 0
  };

  // A. Shared Device Check
  if (userProfile.linkedAccounts > 2) {
    networkBreakdown.sharedDevice = 40;
    logs.push(`Shared Device: This hardware (${userProfile.deviceId}) is linked to ${userProfile.linkedAccounts} different user accounts.`);
  }

  // B. High-Risk Address Check (Simulated via addressHash)
  if (userProfile.addressHash === 'ADDR-99999') {
    networkBreakdown.addressRisk = 30;
    logs.push("Address Alert: This delivery location has a high historical return-to-order ratio across multiple users.");
  }

  // C. Linked Account Velocity
  if (userProfile.linkedAccounts > 4) {
    networkBreakdown.linkedAccounts = 20;
    logs.push("Network Cluster: User belongs to a dense cluster of accounts with shared payment/shipping patterns.");
  }

  const networkScore = Math.min(100, Object.values(networkBreakdown).reduce((a, b) => a + b, 0));

  // 4. Image Forensics Engine (Simulated for Prototype)
  const imageScore = claim.hasImage ? (userProfile.imageRisk || 0) : 0;
  if (claim.hasImage && imageScore > 60) logs.push("Computer Vision detected similar image in database (Forensics Alert)");
  if (!claim.hasImage) logs.push("No image proof provided; image forensic model skipped.");

  // 5. Search Intent / Wardrobing Engine
  const wardrobingScore = wardrobingIntent?.intentScore || 0;
  const wardrobingBreakdown = wardrobingIntent?.intentBreakdown || null;
  if (wardrobingScore > 0) {
    wardrobingIntent?.flags?.forEach(f => logs.push(`[Wardrobing] ${f}`));
  }

  // 6. Final Adaptive Risk Score (5-Engine Weighted Formula)
  // B=0.35, I=0.20, N=0.25, W=0.20
  const finalScore = Math.max(0, Math.min(100,
    (behaviorScore * 0.35) +
    (imageScore * 0.20) +
    (networkScore * 0.25) +
    (wardrobingScore * 0.20)
  ));

  // 7. Decision Recommendation
  let status = 'Approved';
  let riskLevel = 'Low';
  if (finalScore > 65) {
    status = 'Manual Review';
    riskLevel = 'High';
  } else if (finalScore > 30) {
    status = 'Soft Verification';
    riskLevel = 'Medium';
  }

  return {
    score: Math.round(finalScore),
    behaviorScore,
    behaviorBreakdown,
    imageScore,
    networkScore,
    networkBreakdown,
    wardrobingScore,
    wardrobingBreakdown,
    trustScore: userProfile.trustScore,
    riskLevel,
    status,
    logs
  };
};
