import React, { useState, useEffect, useRef } from 'react';
import { Shield, Send, Bot, User, AlertTriangle, X, CheckCircle, Clock } from 'lucide-react';
import { initChat, sendMessage, analyzeResponseRisk } from '../utils/chatEngine';

const FLAG_COLORS = {
  HIGH_RISK: 'text-danger',
  SUSPICIOUS: 'text-warning',
  WARDROBING: 'text-accent',
  INCONSISTENCY: 'text-orange-400',
};

const FraudChatbot = ({ claim, onClose, onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatFlags, setChatFlags] = useState([]);
  const [chatRiskScore, setChatRiskScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const endRef = useRef(null);

  useEffect(() => {
    initChat(claim.reason || claim.description);
    const greeting = {
      role: 'bot',
      text: `Hello! I'm ReturnShield SecureVerify, your AI return assistant. I noticed your return request for **${claim.product}** is pending verification. 

You mentioned the reason is: "${claim.reason || 'Not specified'}". 

To help process this quickly, could you please provide a few more details about when you first noticed the issue?`,
    };
    setMessages([greeting]);
    setIsReady(true);
  }, [claim]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isComplete) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    // Analyze this response for risk signals
    const { score, flags } = analyzeResponseRisk(userText);
    const newChatRisk = Math.min(100, chatRiskScore + score);
    setChatRiskScore(newChatRisk);
    setChatFlags(prev => [...prev, ...flags]);

    try {
      const botReply = await sendMessage(userText);
      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);
      setMessages(prev => [...prev, { role: 'bot', text: botReply }]);

      // Auto-complete after 5 exchanges
      if (newCount >= 5) {
        setTimeout(() => finalizeChatSession(newChatRisk, [...chatFlags, ...flags]), 800);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Verification complete. Thank you for your responses.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const finalizeChatSession = (finalScore, allFlags) => {
    setIsComplete(true);
    const riskLevel = finalScore >= 60 ? 'HIGH' : finalScore >= 30 ? 'MEDIUM' : 'LOW';
    const recommendation = finalScore >= 60
      ? 'Manual Investigation Required'
      : finalScore >= 30
      ? 'Enhanced Verification Needed'
      : 'Proceed with Return';

    const chatSummary = {
      claimId: claim.id,
      customer: claim.customer,
      product: claim.product,
      chatRiskScore: finalScore,
      riskLevel,
      recommendation,
      flags: allFlags,
      messages: messages.map(m => ({ role: m.role, text: m.text })),
      completedAt: new Date().toISOString(),
    };

    // Persist to localStorage for Admin Dashboard
    const existing = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    const updated = [chatSummary, ...existing.filter(s => s.claimId !== claim.id)];
    localStorage.setItem('chatSessions', JSON.stringify(updated));

    // Also update the claim itself with the chat risk
    const claims = JSON.parse(localStorage.getItem('claims') || '[]');
    const claimIdx = claims.findIndex(c => c.id === claim.id);
    if (claimIdx !== -1) {
      claims[claimIdx].chatRiskScore = finalScore;
      claims[claimIdx].chatRiskLevel = riskLevel;
      claims[claimIdx].chatRecommendation = recommendation;
      claims[claimIdx].chatFlags = allFlags;
      localStorage.setItem('claims', JSON.stringify(claims));
    }

    if (onComplete) onComplete(chatSummary);

    setMessages(prev => [...prev, {
      role: 'bot',
      text: `Thank you for completing the verification. Your return request has been forwarded for review. Reference ID: **${claim.id}**. Expected response within 24 hours.`,
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const riskColor = chatRiskScore >= 60 ? '#ff4d4d' : chatRiskScore >= 30 ? '#ffae42' : '#00e676';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl h-[85vh] bg-[#0f172a]/90 border border-white/10 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-300 relative">
        
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02] backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20">
            <Shield className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white tracking-tight">ReturnShield AI</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">SecureVerify Live Interrogation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Live Risk Level</div>
              <div className="flex items-center gap-2 justify-end">
                 <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-700 ease-out" 
                      style={{ width: `${chatRiskScore}%`, backgroundColor: riskColor }}
                    />
                 </div>
                 <span className="font-mono text-sm font-bold" style={{ color: riskColor }}>{chatRiskScore}%</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Ticker for detected flags */}
        <div className="h-10 bg-black/20 border-b border-white/5 flex items-center px-8 gap-4 overflow-hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Analysis Stream:</span>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {chatFlags.length > 0 ? (
              chatFlags.map((f, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border ${
                  f.type === 'HIGH_RISK' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  f.type === 'SUSPICIOUS' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-accent/10 border-accent/20 text-accent'
                } animate-in slide-in-from-right-4 duration-300`}>
                  <AlertTriangle size={10} />
                  {f.text}
                </div>
              ))
            ) : (
              <span className="text-[10px] text-slate-600 font-medium">Monitoring response patterns for risk signals...</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-inner ${
                msg.role === 'bot' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-slate-400 border border-white/10'
              }`}>
                {msg.role === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-5 py-3 rounded-[1.25rem] text-sm leading-relaxed shadow-xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-accent to-accent/80 text-white rounded-tr-none'
                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-sm'
                }`}>
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                      {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                  ))}
                </div>
                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-tighter px-1">
                  {msg.role === 'bot' ? 'ReturnShield AI' : 'Customer'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                <Bot size={18} />
              </div>
              <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-[1.25rem] rounded-tl-none flex gap-1.5 items-center backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white/[0.02] border-t border-white/5 backdrop-blur-xl">
          {isComplete ? (
            <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center text-success border border-success/30 shadow-[0_0_30px_-10px_rgba(0,230,118,0.3)]">
                <CheckCircle size={32} />
              </div>
              <div className="text-center">
                <h4 className="text-white font-bold">Verification Complete</h4>
                <p className="text-sm text-slate-400 mt-1">Our specialists are now reviewing your session.</p>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/50 to-purple-500/50 rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500" />
              <div className="relative flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your verification details here..."
                  className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-accent/50 transition-all placeholder:text-slate-600 shadow-inner"
                  disabled={isTyping || !isReady}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !input.trim() || !isReady}
                  className="bg-accent hover:bg-accent/90 disabled:opacity-30 disabled:hover:bg-accent text-white w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-accent/20 active:scale-95"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="flex justify-between items-center mt-4 px-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Question {Math.min(exchangeCount + 1, 5)}/5</span>
                  </div>
                  <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(exchangeCount / 5) * 100}%` }} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 font-medium">Session is encrypted and monitored for security</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FraudChatbot;
