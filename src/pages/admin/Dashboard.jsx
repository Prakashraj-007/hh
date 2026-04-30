import React, { useState, useEffect } from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, Search, X, AlertCircle, FileText, Camera, Network, Clock, User, CheckCircle, MessageSquare, ExternalLink, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';

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
    localStorage.removeItem('imageHashes');
    setClaims([]);
    setChatSessions([]);
    window.location.reload();
  };

  const handleExportCSV = () => {
    if (claims.length === 0) return alert('No data to export');

    const headers = [
      'Claim ID', 'Customer', 'Product', 'Category', 'Reason', 'Amount', 
      'Risk Score', 'Behavior Score', 'Image Score', 'Network Score', 
      'IP Address', 'Location', 'Account Age', 'Total Spend', 'Status'
    ];

    const rows = claims.map(c => [
      c.id, 
      c.customer, 
      c.product, 
      c.category, 
      `"${c.reason}"`, 
      c.amount, 
      c.score, 
      c.behaviorScore, 
      c.imageScore, 
      c.networkScore, 
      c.ipAddress || 'N/A', 
      `"${c.location || 'N/A'}"`, 
      c.formattedAccountAge || 'N/A', 
      c.totalSpend, 
      c.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `returnshield_claims_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChatSession = (claimId) =>
    chatSessions.find(s => s.claimId === claimId) || null;

  const highRiskCount = claims.filter(c => c.riskLevel === 'High').length;
  const autoApproved = claims.filter(c => c.status === 'Approved').length;
  const percentApproved = claims.length ? Math.round((autoApproved / claims.length) * 100) : 0;
  const finalDayAlerts = claims.filter(c => c.policyDays - c.requestedOnDay <= 1).length;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Operational Intelligence</h2>
          <p className="text-text-secondary text-sm">Real-time fraud surveillance and claim orchestration.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="btn btn-outline border-accent text-accent hover:bg-accent/10 flex items-center gap-2"
          >
            <Download size={18} /> Export CSV
          </button>
          <button 
            onClick={resetClaims}
            className="btn btn-outline border-danger text-danger hover:bg-danger/10 flex items-center gap-2"
          >
            <X size={18} /> Purge Demo Data
          </button>
        </div>
      </div>

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
          <div className="text-text-secondary font-medium mb-2">Deadline Alerts</div>
          <div className="text-3xl font-bold text-warning">{finalDayAlerts}</div>
        </div>
        <div className="card border-accent bg-[rgba(139,92,246,0.05)]">
          <div className="flex items-center gap-1 text-text-secondary font-medium mb-2">
            <MessageSquare size={14} className="text-accent" /> AI Interrogations
          </div>
          <div className="text-3xl font-bold text-accent">{chatSessions.length}</div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'claims' ? 'bg-accent text-white' : 'btn btn-outline'
          }`}
        >Claims Queue</button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${
            activeTab === 'chat' ? 'bg-accent text-white' : 'btn btn-outline'
          }`}
        >
          <MessageSquare size={14} /> Chat Transcripts
        </button>
      </div>

      {/* ── CLAIMS TABLE ── */}
      {activeTab === 'claims' && (
      <div className="card p-0 overflow-hidden">
        <div className="table-container border-none rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Window</th>
                <th>Risk Score</th>
                <th>AI Chat</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-text-secondary italic">No active claims in queue. Run the customer portal demo first.</td></tr>
              ) : claims.map(claim => {
                const session = getChatSession(claim.id);
                return (
                <tr key={claim.id}>
                  <td className="font-medium text-accent">{claim.id}</td>
                  <td>{claim.customer}</td>
                  <td>{claim.product}</td>
                  <td>Day {claim.requestedOnDay} / {claim.policyDays}</td>
                  <td>
                    <span className={`font-bold ${claim.riskLevel === 'High' ? 'text-danger' : claim.riskLevel === 'Medium' ? 'text-warning' : 'text-success'}`}>
                      {claim.score}/100
                    </span>
                  </td>
                  <td>
                    {session ? (
                      <span className="text-accent font-bold flex items-center gap-1">
                        <CheckCircle size={12} className="text-success" /> {session.chatRiskScore}
                      </span>
                    ) : <span className="text-text-muted opacity-40">—</span>}
                  </td>
                  <td>
                    <span className={`badge ${claim.riskLevel === 'High' ? 'badge-danger' : claim.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="text-accent hover:underline font-medium"
                      onClick={() => setSelectedClaim(claim)}
                    >Review</button>
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
              <p>No chat sessions found.</p>
            </div>
          ) : chatSessions.map((session, idx) => (
            <div key={idx} className="card p-0 overflow-hidden border-accent/20">
              <div className="p-4 border-b border-border-color bg-bg-secondary flex justify-between items-center">
                <div className="font-bold text-sm">{session.customer} • {session.product}</div>
                <Link to="/admin/chats" className="text-[10px] text-accent flex items-center gap-1 hover:underline">
                  <ExternalLink size={10} /> View Deep Dive
                </Link>
              </div>
              <div className="p-4">
                <div className="text-xs text-text-secondary italic">"{session.messages?.[session.messages.length-1]?.text}"</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Detail Drawer */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-bg-card h-full overflow-y-auto border-l border-border-color shadow-2xl animate-slide-in-right">
            <div className="sticky top-0 bg-bg-card border-b border-border-color p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {selectedClaim.id}
                <span className={`badge ${selectedClaim.riskLevel === 'High' ? 'badge-danger' : selectedClaim.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                  {selectedClaim.riskLevel} Risk
                </span>
              </h2>
              <button onClick={() => setSelectedClaim(null)} className="text-text-secondary hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Score breakdown with Deep Dive links */}
              <div className="grid grid-cols-4 gap-3">
                <Link to="/admin/behavioral" className="card bg-bg-secondary hover:bg-bg-hover transition p-3 text-center border-l-4 border-accent">
                  <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Behavior</div>
                  <div className="text-xl font-bold">{selectedClaim.behaviorScore}</div>
                  <div className="text-[8px] text-accent mt-1 flex items-center justify-center gap-1">
                    Deep Dive <ExternalLink size={8} />
                  </div>
                </Link>
                <Link to="/admin/vision" className="card bg-bg-secondary hover:bg-bg-hover transition p-3 text-center border-l-4 border-purple-500">
                  <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Image AI</div>
                  <div className="text-xl font-bold">{selectedClaim.imageScore}</div>
                  <div className="text-[8px] text-purple-400 mt-1 flex items-center justify-center gap-1">
                    Deep Dive <ExternalLink size={8} />
                  </div>
                </Link>
                <Link to="/admin/network" className="card bg-bg-secondary hover:bg-bg-hover transition p-3 text-center border-l-4 border-blue-400">
                  <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Network</div>
                  <div className="text-xl font-bold">{selectedClaim.networkScore}</div>
                  <div className="text-[8px] text-blue-400 mt-1 flex items-center justify-center gap-1">
                    Deep Dive <ExternalLink size={8} />
                  </div>
                </Link>
                <div className="card bg-bg-secondary p-3 text-center border-l-4 border-warning">
                  <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Final</div>
                  <div className="text-xl font-bold">{selectedClaim.score}</div>
                  <div className="text-[8px] text-warning mt-1">Weighted</div>
                </div>
              </div>

              {/* Customer Intelligence */}
              <div className="card p-4">
                <h3 className="text-xs text-text-muted uppercase font-bold mb-3 flex items-center gap-2">
                  <User size={14}/> Customer Intelligence
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-0.5 bg-bg-secondary p-2 rounded-lg">
                    <span className="text-[10px] text-text-muted uppercase">Account Age</span>
                    <span className="font-semibold">{selectedClaim.formattedAccountAge || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 bg-bg-secondary p-2 rounded-lg">
                    <span className="text-[10px] text-text-muted uppercase">Connection IP</span>
                    <span className="font-semibold font-mono text-[11px]">{selectedClaim.ipAddress || '10.0.0.1'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 bg-bg-secondary p-2 rounded-lg">
                    <span className="text-[10px] text-text-muted uppercase">Total Spend</span>
                    <span className="font-semibold text-success">₹{(selectedClaim.totalSpend || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Forensics Mini Cards */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="card p-3 border-accent/20">
                    <div className="flex items-center gap-2 font-bold text-xs mb-2 text-accent">
                       <Camera size={14} /> Image Forensic Verdict
                    </div>
                    {selectedClaim.imageForensics ? (
                       <div className="space-y-1">
                          <div className="text-[10px] flex justify-between"><span>Score:</span> <span className="font-bold">{selectedClaim.imageForensics.imageScore}</span></div>
                          <div className="flex flex-wrap gap-1 mt-1">
                             {selectedClaim.imageForensics.flags?.map(f => (
                                <span key={f} className="text-[8px] bg-danger/10 text-danger px-1 py-0.5 rounded">{f}</span>
                             ))}
                          </div>
                       </div>
                    ) : <div className="text-[10px] text-text-muted italic">No forensics run</div>}
                 </div>
                 
                 <div className="card p-3 border-accent/20">
                    <div className="flex items-center gap-2 font-bold text-xs mb-2 text-blue-400">
                       <Network size={14} /> Network Risk
                    </div>
                    <div className="text-[10px] flex justify-between"><span>IP:</span> <span className="font-mono">{selectedClaim.ipAddress || '10.0.0.1'}</span></div>
                    <div className="text-[10px] flex justify-between mt-1"><span>Fraud Prob:</span> <span className="text-danger font-bold">{selectedClaim.networkScore}%</span></div>
                 </div>
              </div>

              {/* Risk Logs */}
              <div className="card p-0 overflow-hidden">
                 <div className="bg-bg-secondary p-3 border-b border-border-color flex items-center gap-2 font-semibold text-xs">
                    <FileText size={14} /> Reasoning Engine Logs
                 </div>
                 <div className="p-3 max-h-48 overflow-y-auto">
                    <ul className="space-y-1.5">
                       {selectedClaim.logs?.map((log, li) => (
                          <li key={li} className="text-[10px] text-text-secondary flex gap-2">
                             <span className="text-accent shrink-0">•</span>
                             <span>{log}</span>
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-4">
                <button className="btn bg-danger text-white flex-1 py-3 text-sm font-bold" onClick={() => setSelectedClaim(null)}>BLOCK RETURN</button>
                <button className="btn bg-success text-white flex-1 py-3 text-sm font-bold" onClick={() => setSelectedClaim(null)}>APPROVE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
