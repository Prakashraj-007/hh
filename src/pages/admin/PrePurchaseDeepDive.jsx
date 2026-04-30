import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import {
  MousePointerClick, Star, Ruler, Clock, ArrowRight, ShieldAlert,
  CheckCircle, AlertCircle, TrendingUp, Info, Eye, Zap
} from 'lucide-react';

// Signal definitions with Genuine vs Risky comparison
const SIGNAL_META = [
  {
    key: 'researchDepth',
    icon: Eye,
    color: '#8b5cf6',
    label: 'Product Research Depth',
    maxScore: 20,
    weight: '20 pts',
    genuinePattern: 'Views multiple images, reads reviews, checks product description and specs',
    riskyPattern: 'No images viewed, reviews skipped — minimal product engagement before purchase',
    tip: 'Genuine buyers typically spend 30–60s exploring the product gallery before deciding.',
  },
  {
    key: 'sizeFitBehavior',
    icon: Ruler,
    color: '#06b6d4',
    label: 'Size / Fit Behavior',
    maxScore: 15,
    weight: '15 pts',
    genuinePattern: 'Opens size guide, checks fit reviews, compares size options',
    riskyPattern: 'Skips size guide entirely for Fashion or Footwear items',
    tip: 'Applies only to Fashion, Footwear, and Accessories. High wardrobing correlation when skipped.',
  },
  {
    key: 'returnPolicyTiming',
    icon: Clock,
    color: '#f59e0b',
    label: 'Return Policy Timing',
    maxScore: 20,
    weight: '20 pts',
    genuinePattern: 'Does not visit the Return page before making a purchase',
    riskyPattern: 'Navigates to the Return Policy page BEFORE completing their purchase',
    tip: 'This is the strongest single signal. Checking return policy pre-purchase is a strong temporary-use indicator.',
  },
  {
    key: 'buyNowSpeed',
    icon: Zap,
    color: '#ef4444',
    label: 'Buy Now Speed',
    maxScore: 30,
    weight: '30 pts',
    genuinePattern: 'Spends 30s+ in the product modal browsing before buying',
    riskyPattern: 'Purchases within 5–15 seconds of first viewing the product',
    tip: 'The fastest genuine buyers take 15–30s. Sub-5s purchase speed is a near-certain risk signal.',
  },
  {
    key: 'browseDepth',
    icon: ArrowRight,
    color: '#22c55e',
    label: 'Browse Depth / Path',
    maxScore: 15,
    weight: '15 pts',
    genuinePattern: 'Browses 3+ products before settling on a purchase',
    riskyPattern: 'Buys the only product they ever viewed — no comparison browsing at all',
    tip: 'Serial returners often have a pre-selected target item and go directly to it.',
  },
];

const getRiskColor = (score, max) => {
  const pct = score / max;
  if (pct >= 0.6) return { text: 'text-danger', bg: 'bg-danger', badge: 'bg-danger/10 text-danger', label: 'High Risk' };
  if (pct >= 0.3) return { text: 'text-warning', bg: 'bg-warning', badge: 'bg-warning/10 text-warning', label: 'Medium' };
  return { text: 'text-success', bg: 'bg-success', badge: 'bg-success/10 text-success', label: 'Low Risk' };
};

const PrePurchaseDeepDive = () => {
  const [latestClaim, setLatestClaim] = useState(null);

  useEffect(() => {
    const claims = JSON.parse(localStorage.getItem('claims') || '[]');
    if (claims.length > 0) setLatestClaim(claims[0]);
  }, []);

  const breakdown = latestClaim?.prePurchaseBreakdown || null;
  const totalScore = latestClaim?.prePurchaseScore ?? null;
  const riskLevel  = latestClaim?.prePurchaseRisk   || 'Unknown';

  return (
    <AdminLayout>
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <MousePointerClick className="text-accent" size={26} />
            <h2 className="text-2xl font-bold">Pre-Purchase Behavior Engine</h2>
          </div>
          <p className="text-text-secondary text-sm ml-11">
            Analyzes on-site behavior signals captured in the 10–15 minutes before checkout to predict return intent.
            Contributes <span className="text-accent font-bold">15%</span> of the final risk score.
          </p>
        </div>
        {totalScore !== null && (
          <div className={`text-center px-5 py-3 rounded-xl border ${
            riskLevel === 'High' ? 'border-danger/30 bg-danger/5' :
            riskLevel === 'Medium' ? 'border-warning/30 bg-warning/5' :
            'border-success/30 bg-success/5'
          }`}>
            <div className={`text-4xl font-black ${
              riskLevel === 'High' ? 'text-danger' : riskLevel === 'Medium' ? 'text-warning' : 'text-success'
            }`}>{totalScore}</div>
            <div className="text-xs text-text-muted mt-1">/ 100 Pre-Buy Risk</div>
            <div className={`text-xs font-bold mt-1 ${
              riskLevel === 'High' ? 'text-danger' : riskLevel === 'Medium' ? 'text-warning' : 'text-success'
            }`}>{riskLevel} Risk</div>
          </div>
        )}
      </div>

      {/* ── No data state ─────────────────────────────────── */}
      {!latestClaim && (
        <div className="card text-center py-20 text-text-secondary">
          <MousePointerClick size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold mb-2">No Claims Processed Yet</p>
          <p className="text-sm text-text-muted">Run the customer portal demo: browse the shop → buy a product → submit a return.</p>
        </div>
      )}

      {latestClaim && (
        <>
          {/* ── Score Overview ─────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {SIGNAL_META.map(sig => {
              const raw = breakdown?.[sig.key] ?? 0;
              const risk = getRiskColor(raw, sig.maxScore);
              return (
                <div key={sig.key} className="card p-3 text-center" style={{ borderLeftColor: sig.color, borderLeftWidth: '3px' }}>
                  <sig.icon size={18} className="mx-auto mb-1" style={{ color: sig.color }} />
                  <div className={`text-2xl font-black ${risk.text}`}>{raw}</div>
                  <div className="text-[9px] text-text-muted mt-0.5">/ {sig.maxScore} pts</div>
                  <div className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full ${risk.badge}`}>{risk.label}</div>
                </div>
              );
            })}
          </div>

          {/* ── Latest Claim Context ──────────────────────── */}
          <div className="card p-4 mb-8 bg-bg-secondary border-accent/20">
            <div className="flex items-center gap-2 mb-2 text-xs text-text-muted font-bold uppercase tracking-wider">
              <Info size={13} /> Analyzed Claim
            </div>
            <div className="flex gap-6 text-sm">
              <div><span className="text-text-muted">Customer: </span><span className="font-semibold">{latestClaim.customer}</span></div>
              <div><span className="text-text-muted">Product: </span><span className="font-semibold">{latestClaim.product}</span></div>
              <div><span className="text-text-muted">Category: </span><span className="font-semibold">{latestClaim.category}</span></div>
              <div><span className="text-text-muted">Claim ID: </span><span className="font-mono text-accent">{latestClaim.id}</span></div>
            </div>
          </div>

          {/* ── Signal Deep Dive Cards ────────────────────── */}
          <div className="flex flex-col gap-5 mb-8">
            {SIGNAL_META.map((sig, idx) => {
              const raw  = breakdown?.[sig.key] ?? 0;
              const risk = getRiskColor(raw, sig.maxScore);
              const pct  = Math.round((raw / sig.maxScore) * 100);
              const triggered = raw > 0;

              return (
                <div key={sig.key} className="card p-0 overflow-hidden" style={{ borderLeftColor: sig.color, borderLeftWidth: '3px' }}>
                  {/* Card Header */}
                  <div className="p-4 border-b border-border-color flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${sig.color}20` }}>
                        <sig.icon size={18} style={{ color: sig.color }} />
                      </div>
                      <div>
                        <div className="font-bold">{sig.label}</div>
                        <div className="text-xs text-text-muted">Max contribution: {sig.weight}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-2xl font-black ${risk.text}`}>{raw}</div>
                        <div className="text-[10px] text-text-muted">/ {sig.maxScore}</div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${risk.badge}`}>
                        {triggered ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                        {triggered ? risk.label : 'Passed'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-text-muted mb-1">
                        <span>Risk Contribution</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: sig.color }}
                        />
                      </div>
                    </div>

                    {/* Genuine vs Risky */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-success text-[10px] font-bold uppercase mb-1.5">
                          <CheckCircle size={11} /> Genuine Buyer Pattern
                        </div>
                        <p className="text-[11px] text-text-secondary">{sig.genuinePattern}</p>
                      </div>
                      <div className={`rounded-lg p-3 border ${triggered ? 'bg-danger/5 border-danger/30' : 'bg-bg-secondary border-border-color'}`}>
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase mb-1.5 ${triggered ? 'text-danger' : 'text-text-muted'}`}>
                          <ShieldAlert size={11} /> {triggered ? '⚠ Risk Pattern Detected' : 'Risky Buyer Pattern'}
                        </div>
                        <p className="text-[11px] text-text-secondary">{sig.riskyPattern}</p>
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="text-[10px] text-text-muted italic flex items-start gap-1.5">
                      <Info size={11} className="shrink-0 mt-0.5" />
                      {sig.tip}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Weight Breakdown ──────────────────────────── */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="text-accent" size={20} />
              <h3 className="font-bold text-lg">How Pre-Purchase Score Feeds the Final Score</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Behavioral History', weight: '30%', color: '#8b5cf6' },
                { label: 'Network Security',   weight: '20%', color: '#3b82f6' },
                { label: 'Search Intent',      weight: '15%', color: '#f59e0b' },
                { label: 'Image Forensics',    weight: '20%', color: '#ec4899' },
                { label: 'Pre-Purchase',       weight: '15%', color: '#22c55e', highlight: true },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-center ${m.highlight ? 'border-success/40 bg-success/5' : 'border-border-color bg-bg-secondary'}`}
                >
                  <div className="text-2xl font-black mb-1" style={{ color: m.color }}>{m.weight}</div>
                  <div className={`text-[10px] font-semibold ${m.highlight ? 'text-success' : 'text-text-muted'}`}>{m.label}</div>
                  {m.highlight && <div className="text-[9px] text-success mt-1">← This Engine</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default PrePurchaseDeepDive;
