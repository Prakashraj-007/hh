import React, { useState, useEffect } from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, Search, X, AlertCircle, FileText, Camera, Network, Clock, User, CheckCircle, MessageSquare } from 'lucide-react';

const AdminDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeTab, setActiveTab] = useState('claims');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('claims') || '[]');
    setClaims(saved);
    const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    setChatSessions(sessions);
  }, []);

  const resetClaims = () => {
    localStorage.removeItem('claims');
    localStorage.removeItem('chatSessions');
    setClaims([]);
    setChatSessions([]);
  };

  const getChatSession = (claimId) =>
    chatSessions.find(s => s.claimId === claimId) || null;

  const highRiskCount = claims.filter(c => c.riskLevel === 'High').length;
  const autoApproved = claims.filter(c => c.status === 'Approved').length;
  const percentApproved = claims.length ? Math.round((autoApproved / claims.length) * 100) : 0;
  
  // Calculate final 2-day alerts
  const finalDayAlerts = claims.filter(c => c.policyDays - c.requestedOnDay <= 1).length;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-card border-r border-border-color hidden md:block">
        <div className="p-6 border-b border-border-color flex items-center gap-2">
          <ShieldCheck className="text-accent" size={28} />
          <span className="text-xl font-bold">Fraud Ops</span>
        </div>
        <nav className="p-4 flex flex-col gap-2 h-[calc(100vh-80px)]">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-bg-hover text-accent rounded-lg font-medium">
            <AlertTriangle size={20} /> Claims Review
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-bg-secondary rounded-lg font-medium transition">
            <TrendingUp size={20} /> Analytics
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-bg-secondary rounded-lg font-medium transition">
            <Search size={20} /> Deep Search
          </a>
        </nav>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="bg-bg-card border-b border-border-color px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Claims Review queue</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={resetClaims}
              className="btn btn-outline border-danger text-danger hover:bg-danger/10 flex items-center gap-2"
            >
              <X size={18} /> Reset All Claims
            </button>
            <div className="h-8 w-px bg-border-color mx-2"></div>
            <span className="text-sm font-medium">Operations Team</span>
            <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold">A</div>
          </div>
        </header>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="card">
              <div className="text-text-secondary font-medium mb-2">Claims Today</div>
              <div className="text-3xl font-bold">{claims.length}</div>
            </div>
            <div className="card">
              <div className="text-text-secondary font-medium mb-2">High Risk</div>
              <div className="text-3xl font-bold text-danger">{highRiskCount}</div>
            </div>
            <div className="card">
              <div className="text-text-secondary font-medium mb-2">Auto Approved</div>
              <div className="text-3xl font-bold text-success">{percentApproved}%</div>
            </div>
            <div className="card border-warning bg-[rgba(245,158,11,0.05)]">
              <div className="text-text-secondary font-medium mb-2">Final 2-Day Alerts</div>
              <div className="text-3xl font-bold text-warning">{finalDayAlerts}</div>
            </div>
            <div className="card border-accent bg-[rgba(139,92,246,0.05)]">
              <div className="flex items-center gap-1 text-text-secondary font-medium mb-2">
                <MessageSquare size={14} className="text-accent" /> AI Chats Done
              </div>
              <div className="text-3xl font-bold text-accent">{chatSessions.length}</div>
              {chatSessions.filter(s => s.riskLevel === 'HIGH').length > 0 && (
                <div className="text-xs text-danger mt-1">{chatSessions.filter(s => s.riskLevel === 'HIGH').length} flagged HIGH</div>
              )}
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('claims')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'claims' ? 'bg-accent text-white' : 'btn btn-outline'
              }`}
            >Claims Review</button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
                activeTab === 'chat' ? 'bg-accent text-white' : 'btn btn-outline'
              }`}
            >
              <MessageSquare size={14} /> AI Chat Interrogations
              {chatSessions.length > 0 && (
                <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{chatSessions.length}</span>
              )}
            </button>
          </div>

          {/* ── CLAIMS TABLE ── */}
          {activeTab === 'claims' && (
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-border-color bg-bg-secondary flex justify-between items-center">
              <h2 className="font-semibold text-lg">Recent Claims</h2>
              <button className="btn btn-outline text-sm">Export CSV</button>
            </div>
            <div className="table-container border-none rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Window</th>
                    <th>Requested On</th>
                    <th>Risk Score</th>
                    <th>AI Chat</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-8 text-text-secondary">No claims found. Run the customer demo first.</td></tr>
                  ) : claims.map(claim => {
                    const session = getChatSession(claim.id);
                    return (
                    <tr key={claim.id}>
                      <td className="font-medium text-accent">{claim.id}</td>
                      <td>{claim.customer}</td>
                      <td>{claim.product}</td>
                      <td>{claim.policyDays} Days</td>
                      <td>
                        Day {claim.requestedOnDay}
                        {claim.policyDays - claim.requestedOnDay <= 1 && (
                          <AlertCircle size={14} className="inline text-warning ml-1 mb-0.5" />
                        )}
                      </td>
                      <td>
                        <span className={`font-bold ${claim.riskLevel === 'High' ? 'text-danger' : claim.riskLevel === 'Medium' ? 'text-warning' : 'text-success'}`}>
                          {claim.score}/100
                        </span>
                      </td>
                      <td>
                        {session ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                            session.riskLevel === 'HIGH' ? 'bg-danger/10 text-danger' :
                            session.riskLevel === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                            'bg-success/10 text-success'
                          }`}>
                            <MessageSquare size={10} /> {session.chatRiskScore}/100
                          </span>
                        ) : claim.score > 20 ? (
                          <span className="text-xs text-text-muted italic">Pending</span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${claim.riskLevel === 'High' ? 'badge-danger' : claim.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="text-accent hover:text-white font-medium"
                          onClick={() => setSelectedClaim(claim)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* ── AI CHAT INTERROGATIONS TAB ── */}
          {activeTab === 'chat' && (
            <div className="flex flex-col gap-4">
              {chatSessions.length === 0 ? (
                <div className="card text-center py-16 text-text-secondary">
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No chat interrogations yet.</p>
                  <p className="text-sm mt-1">Chat activates automatically when a claim's risk score exceeds 20.</p>
                </div>
              ) : chatSessions.map((session, idx) => (
                <div key={idx} className="card p-0 overflow-hidden">
                  {/* Session Header */}
                  <div className="p-4 border-b border-border-color bg-bg-secondary flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <MessageSquare size={16} className="text-accent" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{session.customer} — {session.product}</div>
                        <div className="text-xs text-text-muted">Claim {session.claimId} • {new Date(session.completedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        session.riskLevel === 'HIGH' ? 'bg-danger/10 text-danger' :
                        session.riskLevel === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        Chat Risk: {session.chatRiskScore}/100 · {session.riskLevel}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recommendation */}
                    <div className="bg-bg-secondary rounded-xl p-3 flex flex-col gap-1">
                      <div className="text-[10px] text-text-muted uppercase font-bold">AI Recommendation</div>
                      <div className={`font-semibold text-sm ${
                        session.riskLevel === 'HIGH' ? 'text-danger' :
                        session.riskLevel === 'MEDIUM' ? 'text-warning' : 'text-success'
                      }`}>{session.recommendation}</div>
                    </div>

                    {/* Flags */}
                    <div className="bg-bg-secondary rounded-xl p-3">
                      <div className="text-[10px] text-text-muted uppercase font-bold mb-2">Detected Fraud Signals</div>
                      {session.flags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {session.flags.map((f, fi) => (
                            <span key={fi} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              f.type === 'HIGH_RISK' ? 'bg-danger/10 text-danger' :
                              f.type === 'WARDROBING' ? 'bg-warning/10 text-warning' :
                              f.type === 'SUSPICIOUS' ? 'bg-orange-500/10 text-orange-400' :
                              'bg-bg-primary text-text-muted'
                            }`}>{f.text}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-success flex items-center gap-1"><CheckCircle size={12} /> No fraud signals detected</div>
                      )}
                    </div>

                    {/* Transcript preview */}
                    <div className="bg-bg-secondary rounded-xl p-3">
                      <div className="text-[10px] text-text-muted uppercase font-bold mb-2">Transcript ({session.messages?.length || 0} messages)</div>
                      <div className="flex flex-col gap-1 max-h-20 overflow-y-auto">
                        {session.messages?.slice(-3).map((m, mi) => (
                          <div key={mi} className={`text-[10px] px-2 py-1 rounded ${
                            m.role === 'user' ? 'bg-accent/10 text-accent text-right' : 'bg-bg-primary text-text-secondary'
                          }`}>
                            <span className="font-bold">{m.role === 'user' ? 'Customer' : 'AI'}: </span>
                            {m.text?.substring(0, 60)}{m.text?.length > 60 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Claim Detail Drawer */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-bg-card h-full overflow-y-auto border-l border-border-color shadow-2xl animate-fade-in" style={{animationDuration: '0.2s'}}>
            <div className="sticky top-0 bg-bg-card border-b border-border-color p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                Claim {selectedClaim.id}
                <span className={`badge ${selectedClaim.riskLevel === 'High' ? 'badge-danger' : selectedClaim.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                  {selectedClaim.riskLevel} Risk
                </span>
              </h2>
              <button onClick={() => setSelectedClaim(null)} className="text-text-secondary hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">

              {/* Top Row: Score + Customer Intelligence */}
              <div className="grid grid-cols-3 gap-4">
                {/* Final Score */}
                <div className="card bg-bg-secondary p-4 flex flex-col items-center justify-center text-center">
                  <div className={`text-5xl font-bold mb-1 ${selectedClaim.riskLevel === 'High' ? 'text-danger' : selectedClaim.riskLevel === 'Medium' ? 'text-warning' : 'text-success'}`}>
                    {selectedClaim.score}
                  </div>
                  <div className="text-xs text-text-muted uppercase tracking-wider">Final Risk Score</div>
                  <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${
                    selectedClaim.riskLevel === 'High' ? 'bg-danger/10 text-danger' :
                    selectedClaim.riskLevel === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>{selectedClaim.riskLevel || 'Low'} Risk</div>
                </div>

                {/* Customer Intelligence */}
                <div className="col-span-2 card p-4">
                  <h3 className="text-xs text-text-muted uppercase font-bold mb-3 flex items-center gap-2">
                    <User size={14}/> Customer Intelligence
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col gap-0.5 bg-bg-secondary p-2 rounded-lg">
                      <span className="text-[10px] text-text-muted uppercase">Account Age</span>
                      <span className="font-semibold">
                        {selectedClaim.accountAgeDays
                          ? `${(selectedClaim.accountAgeDays / 365).toFixed(1)} Years`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 bg-bg-secondary p-2 rounded-lg">
                      <span className="text-[10px] text-text-muted uppercase">Trust Score</span>
                      <span className={`font-bold text-base ${
                        (selectedClaim.trustScore || 0) > 70 ? 'text-success' :
                        (selectedClaim.trustScore || 0) > 40 ? 'text-warning' : 'text-danger'
                      }`}>
                        {selectedClaim.trustScore ?? '—'}<span className="text-xs text-text-muted font-normal">/100</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 bg-bg-secondary p-2 rounded-lg">
                      <span className="text-[10px] text-text-muted uppercase">Total Spend</span>
                      <span className="font-semibold text-success">
                        {selectedClaim.totalSpend
                          ? `₹${selectedClaim.totalSpend.toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 bg-bg-secondary p-2 rounded-lg">
                      <span className="text-[10px] text-text-muted uppercase">Return Ratio</span>
                      <span className={`font-semibold ${(selectedClaim.returnRatio || 0) > 0.3 ? 'text-danger' : 'text-text-primary'}`}>
                        {selectedClaim.returnRatio !== undefined
                          ? `${(selectedClaim.returnRatio * 100).toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability Layer */}
              <div className="card border-border-color p-0 overflow-hidden">
                <div className="bg-bg-secondary p-3 border-b border-border-color flex justify-between items-center">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileText size={18} className="text-accent" /> Behavioral DNA Analysis
                  </div>
                  <div className="text-[10px] text-text-muted bg-bg-primary px-2 py-1 rounded">Confidence: 94.2%</div>
                </div>
                <div className="p-4 flex flex-col gap-4">
                   <div className="grid grid-cols-4 gap-2 mb-2">
                      <div className="text-center p-2 bg-bg-primary rounded border border-border-color">
                        <div className="text-xs text-text-muted mb-1">Behavior</div>
                        <div className="font-bold">{selectedClaim.behaviorScore}</div>
                      </div>
                      <div className="text-center p-2 bg-bg-primary rounded border border-border-color">
                        <div className="text-xs text-text-muted mb-1">Image AI</div>
                        <div className="font-bold">{selectedClaim.imageScore}</div>
                      </div>
                      <div className="text-center p-2 bg-bg-primary rounded border border-border-color">
                        <div className="text-xs text-text-muted mb-1">Network</div>
                        <div className="font-bold">{selectedClaim.networkScore}</div>
                      </div>
                      <div className="text-center p-2 bg-bg-primary rounded border border-border-color">
                        <div className="text-[10px] text-text-muted mb-1">🛍️ Wardrobing</div>
                        <div className={`font-bold ${(selectedClaim.wardrobingScore || 0) > 30 ? 'text-warning' : ''}`}>
                          {selectedClaim.wardrobingScore || 0}
                        </div>
                      </div>
                   </div>

                   {/* Formula */}
                   <div className="bg-bg-primary p-3 rounded-lg border border-dashed border-border-color text-center font-mono text-xs">
                      (<span className="text-accent">{selectedClaim.behaviorScore || 0}</span>×0.35) +
                      (<span className="text-accent">{selectedClaim.imageScore || 0}</span>×0.20) +
                      (<span className="text-accent">{selectedClaim.networkScore || 0}</span>×0.25) +
                      (<span className="text-warning">{selectedClaim.wardrobingScore || 0}</span>×0.20) =
                      <span className="text-lg font-bold ml-2 text-white">{selectedClaim.score}</span>
                   </div>

                   {selectedClaim.behaviorBreakdown && (
                     <div className="p-3 bg-bg-secondary/50 rounded-lg border border-border-color/50">
                        <h5 className="text-[10px] text-text-muted uppercase font-bold mb-2">🧠 Behavioral DNA Breakdown</h5>
                        <div className="flex flex-col gap-1.5 text-xs">
                          {[
                            { label: 'Frequency (30d)', val: selectedClaim.behaviorBreakdown.frequency },
                            { label: 'Return Ratio', val: selectedClaim.behaviorBreakdown.ratio },
                            { label: 'Return Velocity', val: selectedClaim.behaviorBreakdown.velocity },
                            { label: 'Deadline Abuse', val: selectedClaim.behaviorBreakdown.deadline },
                            { label: 'High-Value Abuse', val: selectedClaim.behaviorBreakdown.highValue },
                            { label: 'Category Abuse', val: selectedClaim.behaviorBreakdown.category },
                          ].map(({ label, val }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="w-36 text-text-muted shrink-0">{label}</span>
                              <div className="flex-1 bg-bg-primary rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, (val / 30) * 100)}%` }} />
                              </div>
                              <span className="font-mono w-6 text-right text-accent">{val}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 border-t border-border-color pt-1.5 mt-0.5">
                            <span className="w-36 text-text-muted shrink-0">Loyalty Offset</span>
                            <div className="flex-1 bg-bg-primary rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(100, Math.abs(selectedClaim.behaviorBreakdown.loyalty || 0) / 30 * 100)}%` }} />
                            </div>
                            <span className="font-mono w-6 text-right text-success">{selectedClaim.behaviorBreakdown.loyalty}</span>
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-1 border-t border-border-color mt-0.5">
                            <span>Total B-Score</span>
                            <span className="font-mono">{selectedClaim.behaviorScore}</span>
                          </div>
                        </div>
                     </div>
                   )}

                   {selectedClaim.networkBreakdown && (
                     <div className="p-3 bg-bg-secondary/50 rounded-lg border border-border-color/50">
                        <h5 className="text-[10px] text-text-muted uppercase font-bold mb-2">🔗 Network Graph Breakdown</h5>
                        <div className="flex flex-col gap-1.5 text-xs">
                          {[
                            { label: 'Shared Device', val: selectedClaim.networkBreakdown.sharedDevice, max: 40 },
                            { label: 'Address Risk', val: selectedClaim.networkBreakdown.addressRisk, max: 30 },
                            { label: 'Linked Accounts', val: selectedClaim.networkBreakdown.linkedAccounts, max: 20 },
                          ].map(({ label, val, max }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="w-36 text-text-muted shrink-0">{label}</span>
                              <div className="flex-1 bg-bg-primary rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, (val / max) * 100)}%` }} />
                              </div>
                              <span className="font-mono w-6 text-right text-accent">{val}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold text-xs pt-1 border-t border-border-color mt-0.5">
                            <span>Total N-Score</span>
                            <span className="font-mono">{selectedClaim.networkScore}</span>
                          </div>
                        </div>
                     </div>
                   )}

                   {selectedClaim.wardrobingBreakdown && (
                     <div className="p-3 bg-[rgba(234,179,8,0.05)] rounded-lg border border-warning/30">
                        <h5 className="text-[10px] text-warning uppercase font-bold mb-1">🛍️ Search Intent / Wardrobing Analysis</h5>
                        
                        {/* Fraud Pattern Distinction Note */}
                        <div className="text-[10px] text-text-muted mb-3 p-2 bg-bg-primary rounded border border-border-color/50">
                          <span className="text-warning font-bold">Wardrobing</span> = early return (Day 1–{Math.floor((selectedClaim.policyDays||7)*0.5)}) after occasion search •
                          <span className="text-danger font-bold ml-1">Deadline Abuse</span> = late return (Day {(selectedClaim.policyDays||7)-1}–{selectedClaim.policyDays||7})
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                           <div className="flex justify-between"><span>Occasion Keywords:</span> <span className="font-mono text-warning">{selectedClaim.wardrobingBreakdown.occasionScore}</span></div>
                           <div className="flex justify-between"><span>Urgency Delivery Search:</span> <span className="font-mono text-warning">{selectedClaim.wardrobingBreakdown.urgencyScore}</span></div>
                           <div className="flex justify-between"><span>Post-Event Quick Return:</span> <span className="font-mono text-warning">{selectedClaim.wardrobingBreakdown.speedScore}</span></div>
                           <div className="flex justify-between"><span>Repeat Event Cycle:</span> <span className="font-mono text-warning">{selectedClaim.wardrobingBreakdown.repeatPatternScore}</span></div>
                           <div className="flex justify-between"><span>Historical Correlation:</span> <span className="font-mono text-warning">{selectedClaim.wardrobingBreakdown.historicalCorrelation}</span></div>
                           <div className="flex justify-between font-bold border-t border-border-color pt-1 mt-1">
                             <span>Total W-Score:</span>
                             <span className="font-mono text-warning">{selectedClaim.wardrobingScore}</span>
                           </div>
                        </div>

                        {/* Return Day Zone Bar */}
                        {selectedClaim.requestedOnDay && selectedClaim.policyDays && (
                          <div className="mt-3">
                            <div className="text-[10px] text-text-muted mb-1">
                              Return requested on Day <strong>{selectedClaim.requestedOnDay}</strong> of {selectedClaim.policyDays}-day window:
                            </div>
                            <div className="relative h-4 rounded-full overflow-hidden flex text-[9px] font-bold">
                              <div className="flex-1 bg-[rgba(234,179,8,0.4)] flex items-center justify-center text-warning">🛍 Wardrobing</div>
                              <div style={{flex: 0.4}} className="bg-[rgba(34,197,94,0.4)] flex items-center justify-center text-success">✓</div>
                              <div className="flex-1 bg-[rgba(239,68,68,0.4)] flex items-center justify-center text-danger">⚠ Deadline</div>
                            </div>
                            <div className="relative h-3">
                              <div
                                className="absolute -translate-x-1/2 text-white text-[10px] font-bold"
                                style={{ left: `${Math.min(97, Math.max(3, (selectedClaim.requestedOnDay / selectedClaim.policyDays) * 100))}%` }}
                              >▲</div>
                            </div>
                          </div>
                        )}
                     </div>
                   )}

                   <div>
                      <h4 className="text-sm font-semibold mb-2">Primary Risk Drivers:</h4>
                      <ul className="space-y-1">
                        {selectedClaim.logs?.map((log, idx) => (
                          <li key={idx} className={`text-xs flex items-start gap-2 ${log.startsWith('[Wardrobing]') ? 'text-warning' : ''}`}>
                            <span className={`mt-0.5 shrink-0 ${log.startsWith('[Wardrobing]') ? 'text-warning' : 'text-danger'}`}>•</span>
                            <span>{log.replace('[Wardrobing] ', '')}</span>
                          </li>
                        ))}
                      </ul>
                   </div>
                </div>
              </div>

              {/* Quick Status Cards — Image, Network, Wardrobing */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-0 overflow-hidden">
                  <div className="bg-bg-secondary p-3 border-b border-border-color flex items-center gap-2 font-semibold text-sm">
                     <Camera size={16} className="text-accent" /> Image Forensics
                  </div>
                  <div className="p-3 text-xs">
                    {selectedClaim.logs && selectedClaim.logs.some(l => l.includes('image') || l.includes('Forensics')) ? (
                      <div className="text-danger font-medium flex items-center gap-2"><AlertCircle size={14}/> Duplicate image in DB</div>
                    ) : (
                      <div className="text-success flex items-center gap-2"><CheckCircle size={14}/> Original image verified</div>
                    )}
                  </div>
                </div>

                <div className="card p-0 overflow-hidden">
                  <div className="bg-bg-secondary p-3 border-b border-border-color flex items-center gap-2 font-semibold text-sm">
                     <Network size={16} className="text-accent" /> Network Risk
                  </div>
                  <div className="p-3 text-xs">
                     {selectedClaim.logs && selectedClaim.logs.some(l => l.includes('Shared Device') || l.includes('Network Cluster')) ? (
                      <div className="text-danger font-medium flex items-center gap-2"><AlertCircle size={14}/> Shared device identified</div>
                    ) : (
                      <div className="text-success flex items-center gap-2"><CheckCircle size={14}/> Clean device footprint</div>
                    )}
                  </div>
                </div>

                <div className="card p-0 overflow-hidden">
                  <div className="bg-bg-secondary p-3 border-b border-border-color flex items-center gap-2 font-semibold text-sm">
                     <span>🛍️</span> Wardrobing
                  </div>
                  <div className="p-3 text-xs">
                     {(selectedClaim.wardrobingScore || 0) > 25 ? (
                      <div className="text-warning font-medium flex items-center gap-2"><AlertCircle size={14}/> Occasion purchase pattern detected</div>
                    ) : (
                      <div className="text-success flex items-center gap-2"><CheckCircle size={14}/> No wardrobing signals</div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Chat Assessment Panel */}
              {(() => {
                const session = getChatSession(selectedClaim.id);
                return session ? (
                  <div className="card border-accent/30 bg-[rgba(139,92,246,0.04)] p-0 overflow-hidden">
                    <div className="bg-bg-secondary p-3 border-b border-accent/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <MessageSquare size={16} className="text-accent" />
                        Conversational Fraud Interrogation — AI Assessment
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        session.riskLevel === 'HIGH' ? 'bg-danger/10 text-danger' :
                        session.riskLevel === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        Chat Risk {session.chatRiskScore}/100 · {session.riskLevel}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className={`p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                        session.riskLevel === 'HIGH' ? 'bg-danger/10 text-danger' :
                        session.riskLevel === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        <AlertTriangle size={16} /> {session.recommendation}
                      </div>
                      {session.flags?.length > 0 && (
                        <div>
                          <div className="text-[10px] text-text-muted uppercase font-bold mb-1.5">Fraud Signals Detected During Chat</div>
                          <div className="flex flex-wrap gap-1.5">
                            {session.flags.map((f, fi) => (
                              <span key={fi} className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                                f.type === 'HIGH_RISK' ? 'bg-danger/10 text-danger' :
                                f.type === 'WARDROBING' ? 'bg-warning/10 text-warning' :
                                f.type === 'SUSPICIOUS' ? 'bg-orange-500/10 text-orange-400' :
                                'bg-bg-primary text-text-muted'
                              }`}>{f.text}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-bold mb-1.5">Chat Transcript</div>
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {session.messages?.map((m, mi) => (
                            <div key={mi} className={`flex ${ m.role === 'user' ? 'justify-end' : 'justify-start' }`}>
                              <div className={`text-[11px] px-2.5 py-1.5 rounded-xl max-w-[85%] ${
                                m.role === 'user' ? 'bg-accent/20 text-text-primary rounded-br-sm' : 'bg-bg-primary text-text-secondary rounded-bl-sm'
                              }`}>
                                <span className="font-bold text-[9px] uppercase opacity-60 block mb-0.5">{m.role === 'user' ? 'Customer' : 'SecureVerify AI'}</span>
                                {m.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedClaim.score > 20 ? (
                  <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl text-sm text-text-muted flex items-center gap-2">
                    <MessageSquare size={16} className="text-accent" />
                    AI Chat was offered to this customer (score &gt; 20) — awaiting completion.
                  </div>
                ) : null;
              })()}

              {/* Action Buttons */}
              <div className="mt-4 flex gap-4">
                <button className="btn bg-danger text-white flex-1 py-3 text-lg" onClick={() => setSelectedClaim(null)}>Block Return</button>
                <button className="btn btn-outline flex-1 py-3 text-lg" onClick={() => setSelectedClaim(null)}>Request Info</button>
                <button className="btn bg-success text-white flex-1 py-3 text-lg" onClick={() => setSelectedClaim(null)}>Force Approve</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
