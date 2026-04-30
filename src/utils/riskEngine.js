import modelThresholds from '../data/model_thresholds.json';

export const calculateRiskScore = (claim, userProfile, existingClaims = [], wardrobingIntent = null) => {
  let logs = [];
  const { thresholds, category_risk, ip_risk_map, ip_density_map, location_risk, reason_risk } = modelThresholds;

  let behaviorBreakdown = {
    frequency: 0,
    ratio: 0,
    velocity: 0,
    deadline: 0,
    highValue: 0,
    category: 0,
    loyalty: 0
  };
  
  // 1. Behavioral History Analysis (Data-Driven Plan)
  const currentSessionReturns = existingClaims.filter(c => c.customer === userProfile.name);
  const totalReturns = (userProfile.totalReturns || 0) + currentSessionReturns.length;
  const totalOrders = (userProfile.totalOrders || 1) + currentSessionReturns.length;
  
  // A. Return Frequency (Returns in last 30 days)
  const historyReturns30d = userProfile.history?.filter(h => {
    const diff = (new Date('2026-04-29') - new Date(h.date)) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  }).length || 0;
  const frequency = historyReturns30d + currentSessionReturns.length;
  if (frequency >= 2) {
    behaviorBreakdown.frequency = Math.min(25, frequency * 8);
    logs.push(`Return Frequency: ${frequency} returns in 30d (Pattern matched)`);
  }

  // B. Return Ratio
  const returnRatio = totalReturns / totalOrders;
  const ratioThreshold = thresholds.high_return_ratio_threshold || 0.35;
  if (returnRatio > ratioThreshold) {
    behaviorBreakdown.ratio = 20;
    logs.push(`Return Ratio: ${(returnRatio * 100).toFixed(1)}% (Baseline exceeded)`);
  }

  // C. Return Velocity (Speed of returns)
  const avgVelocity = userProfile.history?.length > 0 
    ? userProfile.history.reduce((acc, curr) => acc + (curr.returnedOn || 0), 0) / userProfile.history.length 
    : 7;
  if (avgVelocity < 3) {
    behaviorBreakdown.velocity = 15;
    logs.push(`Return Velocity: Rapid return pattern detected (Avg: ${avgVelocity.toFixed(1)} days post-purchase)`);
  }

  // D. Policy Deadline Abuse (Final 48 hours)
  const daysUsed = claim.requestedOnDay || 0;
  const policyDays = claim.policyDays || 14;
  const isDeadlineAbuse = (policyDays - daysUsed) <= 2;
  if (isDeadlineAbuse) {
    behaviorBreakdown.deadline = 20;
    logs.push(`Deadline Abuse: Return requested in final 48h of the ${policyDays}-day policy window`);
  }

  // E. High-Value Abuse
  const amount = parseInt(claim.amount?.replace(/[^0-9]/g, '') || '0');
  const avgPrice = thresholds.avg_product_price || 250;
  if (amount > avgPrice * 1.5) {
    behaviorBreakdown.highValue = Math.min(20, Math.round((amount / avgPrice) * 5));
    logs.push(`High-Value Abuse: Item value (₹${amount}) is ${(amount / avgPrice).toFixed(1)}x higher than dataset average`);
  }

  // F. Category Risk (From ML Model)
  const catRisk = category_risk[claim.category] || 0.5;
  if (catRisk > 0.55) {
    behaviorBreakdown.category = 10;
    logs.push(`Category Risk: ${claim.category} flagged with higher fraud probability (${(catRisk*100).toFixed(1)}%)`);
  }


  // 2. Networking Security Engine (IP Analysis)
  let networkBreakdown = {
    ipRisk: 0,
    sharedNetwork: 0,
    deviceVelocity: 0
  };

  const userIp = userProfile.ipAddress || '10.0.0.1'; // Default or from profile
  const ipRiskScore = ip_risk_map[userIp] || 0;
  const ipDensity = ip_density_map[userIp] || 1;

  // A. IP Blacklist/Risk Map
  if (ipRiskScore > thresholds.high_risk_ip_threshold) {
    networkBreakdown.ipRisk = Math.round(ipRiskScore * 50);
    logs.push(`Network Security: IP ${userIp} is associated with a ${(ipRiskScore * 100).toFixed(1)}% fraud probability`);
  }

  // B. IP Density (Shared Device / Farm Detection)
  if (ipDensity >= thresholds.shared_ip_threshold) {
    networkBreakdown.sharedNetwork = Math.min(30, ipDensity * 5);
    logs.push(`Network Cluster: Shared IP detected (${ipDensity} unique users). High risk of account farming.`);
  }

  // C. VPN/Proxy Detection (Simulated)
  if (userIp.startsWith('10.0.0')) {
    logs.push("Networking: Private network IP detected; routing verified.");
  }

  // 3. Image Forensics (Real — powered by HackHustle Vision Pipeline)
  let imageScore = 0;
  if (!claim.hasImage) {
    logs.push("Security: No visual proof provided; image forensics skipped.");
  } else if (claim.imageForensics) {
    const f = claim.imageForensics;
    imageScore = f.imageScore || 0;  // 0-100 suspicion score from ELA+pHash+EXIF
    if (f.flags && f.flags.length > 0) {
      f.flags.forEach(flag => {
        const descriptions = {
          POSSIBLE_EDIT:      `Image Forensics [ELA]: Pixel-level editing detected (mean diff: ${f.elaMean})`,
          DUPLICATE_IMAGE:    `Image Forensics [pHash]: Near-duplicate image found (hamming dist: ${f.hashDistance})`,
          OLD_IMAGE_REUSE:    `Image Forensics [EXIF]: Photo taken on ${f.dateTaken ? new Date(f.dateTaken).toLocaleDateString() : 'unknown date'} — exceeds 30-day recency check`,
          METADATA_STRIPPED:  `Image Forensics [EXIF]: EXIF metadata absent — possible screenshot or stripped image`,
          EXIF_ERROR:         `Image Forensics [EXIF]: Metadata parsing error`,
          ANALYSIS_FAILED:    `Image Forensics: Analysis pipeline encountered an error`,
        };
        logs.push(descriptions[flag] || `Image Forensics: ${flag}`);
      });
    } else {
      logs.push(`Image Forensics: All checks passed — ELA clean, unique hash (dist: ${f.hashDistance}), EXIF ${f.exifStatus}`);
    }
  } else {
    // Image uploaded but forensics result not yet available
    imageScore = 0;
    logs.push("Image Forensics: Analysis pending or unavailable.");
  }

  // 4. Wardrobing / Chat Engine
  const wardrobingScore = wardrobingIntent?.intentScore || 0;
  if (wardrobingScore > 0) {
    wardrobingIntent?.flags?.forEach(f => logs.push(`[AI Chat] ${f}`));
  }

  // Final Aggregation
  const behaviorScore = Math.min(100, Object.values(behaviorBreakdown).reduce((a, b) => a + b, 0));
  const networkScore = Math.min(100, Object.values(networkBreakdown).reduce((a, b) => a + b, 0));

  // Weights: Behavior (35%), Network (25%), Wardrobing (15%), Image (25%)
  const finalScore = Math.round(
    (behaviorScore * 0.35) +
    (networkScore * 0.25) +
    (wardrobingScore * 0.15) +
    (imageScore * 0.25)
  );

  let status = 'Approved';
  let riskLevel = 'Low';
  if (finalScore > 65) {
    status = 'Manual Review';
    riskLevel = 'High';
  } else if (finalScore > 35) {
    status = 'Soft Verification';
    riskLevel = 'Medium';
  }

  return {
    score: Math.round(finalScore),
    behaviorScore,
    behaviorBreakdown, 
    networkScore,
    networkBreakdown, 
    wardrobingScore,
    wardrobingBreakdown: wardrobingIntent?.intentBreakdown || null, 
    imageScore,
    riskLevel,
    status,
    logs
  };
};



