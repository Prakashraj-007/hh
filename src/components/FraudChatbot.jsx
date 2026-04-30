import React, { useState, useEffect, useRef } from 'react';
import { Shield, Send, Bot, User, AlertTriangle, X, CheckCircle, Clock, ShieldAlert, Zap } from 'lucide-react';
import { initChat, sendMessage, analyzeResponseRisk } from '../utils/chatEngine';
import modelThresholds from '../data/model_thresholds.json';

// ── EXTENDED KEYWORD SCORING ────────────────────────────────
const detectFraudSignals = (text) => {
  const t = text.toLowerCase();
  let score = 0;
  const flags = [];

  const patterns = [
    { words: ['wore', 'wear', 'worn', 'tried on', 'fit', 'fitting', 'size', 'didn\'t fit', 'too big', 'too small'], score: 15, type: 'WARDROBING', label: 'Fit/usage concern (wardrobing indicator)' },
    { words: ['event', 'party', 'wedding', 'occasion', 'function', 'festival', 'ceremony', 'trip', 'travel', 'holiday', 'vacation'], score: 20, type: 'WARDROBING', label: 'Event-linked purchase pattern' },
    { words: ['once', 'one time', 'just once', 'only once', 'single use', 'briefly', 'for a day'], score: 18, type: 'WARDROBING', label: 'Single-use admission' },
    { words: ['don\'t remember', 'not sure', 'forgot', 'can\'t recall', 'i think', 'maybe', 'probably', 'i guess', 'not really', 'kind of', 'sort of', 'approximately', 'somewhere around'], score: 12, type: 'INCONSISTENCY', label: 'Vague / evasive response' },
    { words: ['someone else', 'my friend', 'my wife', 'my husband', 'my brother', 'my sister', 'they said', 'told me to'], score: 10, type: 'INCONSISTENCY', label: 'Third-party claim' },
    { words: ['urgent', 'asap', 'immediately', 'right now', 'need it today', 'need money', 'quickly', 'fast refund', 'refund now', 'as soon as', 'hurry'], score: 15, type: 'SUSPICIOUS', label: 'Urgency pressure signal' },
    { words: ['broken', 'damaged', 'defective', 'not working', 'doesn\'t work', 'doesnt work', 'faulty', 'wrong item', 'missing', 'empty box', 'fake', 'counterfeit', 'never arrived', 'not received'], score: 20, type: 'HIGH_RISK', label: 'High-risk defect claim' },
    { words: ['changed my mind', 'don\'t need', 'don\'t want', 'not what i expected', 'didn\'t like', 'not happy', 'not satisfied', 'regret', 'impulse'], score: 8, type: 'INCONSISTENCY', label: 'Changed-mind pattern' },
  ];

  patterns.forEach(({ words, score: pts, type, label }) => {
    const matched = words.find(w => t.includes(w));
    if (matched) {
      score += pts;
      flags.push({ type, text: label });
    }
  });

  if (text.trim().split(' ').length < 4) {
    score += 8;
    flags.push({ type: 'INCONSISTENCY', text: 'Very short / evasive response' });
  }

  return { score: Math.min(60, score), flags };
};

const FLAG_STYLE = {
  HIGH_RISK:    'bg-red-500/15 border-red-500/30 text-red-400',
  SUSPICIOUS:   'bg-amber-500/15 border-amber-500/30 text-amber-400',
  WARDROBING:   'bg-purple-500/15 border-purple-500/30 text-purple-400',
  INCONSISTENCY:'bg-orange-500/15 border-orange-500/30 text-orange-400',
};

export default function FraudChatbot({ claim, onClose, onComplete, userProfile = {} }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatFlags, setChatFlags] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  const scoreRef = useRef(0);
  const [displayScore, setDisplayScore] = useState(0);
  const flagsRef = useRef([]);
  const messagesRef = useRef([]);
  const endRef = useRef(null);

  const addScore = (pts) => {
    scoreRef.current = Math.min(100, scoreRef.current + pts);
    setDisplayScore(scoreRef.current);
  };

  useEffect(() => {
    initChat(claim.reason || claim.description || 'Not specified');
    
    // DATA-DRIVEN SEEDING
    const { category_risk, ip_risk_map } = modelThresholds;
    const catRisk = category_risk[claim.category] || 0.5;
    const userIp = userProfile.ipAddress || '10.0.0.1';
    const ipRisk = ip_risk_map[userIp] || 0;

    let initialScore = 0;
    const initialFlags = [];

    if (catRisk > 0.55) {
      initialScore += 10;
      initialFlags.push({ type: 'SUSPICIOUS', text: `High-risk Category: ${claim.category}` });
    }
    if (ipRisk > 0.6) {
      initialScore += 15;
      initialFlags.push({ type: 'HIGH_RISK', text: `Network Security Alert: Flagged IP (${userIp})` });
    }

    scoreRef.current = initialScore;
    setDisplayScore(initialScore);
    flagsRef.current = initialFlags;
    setChatFlags(initialFlags);

    const greeting = {
      role: 'bot',
      text: `Hello! I'm ReturnShield SecureVerify.\n\nI noticed your return request for "${claim.product}" (${claim.category || 'General'}) stated the reason as: "${claim.reason || claim.description || 'Reason not provided'}".\n\nTo ensure network security and verify this request, could you walk me through exactly when and how you first noticed the issue?`,
    };

    messagesRef.current = [greeting];
    setMessages([greeting]);
    setIsReady(true);
  }, [claim.id]); // Only reset if the claim itself changes, not on every render


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isComplete || !isReady) return;

    const userText = input.trim();
    setInput('');

    const userMsg = { role: 'user', text: userText };
    messagesRef.current = [...messagesRef.current, userMsg];
    setMessages([...messagesRef.current]);
    setIsTyping(true);

    const { score: kwScore, flags: kwFlags } = analyzeResponseRisk(userText);
    const { score: extScore, flags: extFlags } = detectFraudSignals(userText);
    const baseScore = 3;

    const allNewFlags = [...kwFlags, ...extFlags].filter(
      f => !flagsRef.current.some(e => e.text === f.text)
    );
    flagsRef.current = [...flagsRef.current, ...allNewFlags];
    setChatFlags([...flagsRef.current]);

    addScore(kwScore + extScore + baseScore);

    try {
      const botReply = await sendMessage(userText);
      const botMsg = { role: 'bot', text: botReply };
      messagesRef.current = [...messagesRef.current, botMsg];
      setMessages([...messagesRef.current]);

      const newCount = exchangeCount + 1;
      setExchangeCount(newCount);

      if (newCount >= 5) {
        setTimeout(() => finalizeChatSession(), 800);
      }
    } catch {
      const errMsg = { role: 'bot', text: 'Verification complete. Thank you for your responses.' };
      messagesRef.current = [...messagesRef.current, errMsg];
      setMessages([...messagesRef.current]);
      finalizeChatSession();
    } finally {
      setIsTyping(false);
    }
  };

  const finalizeChatSession = () => {
    const finalScore = scoreRef.current;
    const allFlags = flagsRef.current;
    const allMessages = messagesRef.current;

    setIsComplete(true);
    const riskLevel = finalScore >= 60 ? 'HIGH' : finalScore >= 30 ? 'MEDIUM' : 'LOW';
    const recommendation =
      finalScore >= 60 ? 'Manual Investigation Required' :
      finalScore >= 30 ? 'Enhanced Verification Needed' :
      'Proceed with Return';

    const chatSummary = {
      claimId: claim.id,
      customer: claim.customer,
      product: claim.product,
      chatRiskScore: finalScore,
      riskLevel,
      recommendation,
      flags: allFlags,
      messages: allMessages.map(m => ({ role: m.role, text: m.text })),
      completedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    localStorage.setItem('chatSessions', JSON.stringify([chatSummary, ...existing.filter(s => s.claimId !== claim.id)]));

    const claims = JSON.parse(localStorage.getItem('claims') || '[]');
    const idx = claims.findIndex(c => c.id === claim.id);
    if (idx !== -1) {
      claims[idx] = { ...claims[idx], chatRiskScore: finalScore, chatRiskLevel: riskLevel, chatRecommendation: recommendation, chatFlags: allFlags };
      localStorage.setItem('claims', JSON.stringify(claims));
    }

    if (onComplete) onComplete(chatSummary);

    const finalMsg = {
      role: 'bot',
      text: `Thank you for completing the verification. Your case has been forwarded to our review team.\n\nReference ID: ${claim.id} · Response within 24 hours.`,
    };
    messagesRef.current = [...allMessages, finalMsg];
    setMessages([...messagesRef.current]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const riskColor  = displayScore >= 60 ? '#f87171' : displayScore >= 30 ? '#fbbf24' : '#34d399';
  const riskLabel  = displayScore >= 60 ? 'HIGH' : displayScore >= 30 ? 'MEDIUM' : 'LOW';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
      <div style={{
        width: '100%', maxWidth: '680px', height: '88vh',
        background: 'linear-gradient(145deg, #0d1117 0%, #0f1923 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'16px', background:'rgba(255,255,255,0.02)', flexShrink:0 }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg, #8b5cf6, #6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(139,92,246,0.35)', flexShrink:0 }}>
            <ShieldAlert size={24} color="white" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:'16px', color:'white' }}>ReturnShield AI</div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'2px' }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#34d399', boxShadow:'0 0 6px #34d399' }} />
              <span style={{ fontSize:'11px', color:'#64748b', fontWeight:600, textTransform:'uppercase' }}>SecureVerify · Live Session</span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'10px', color:'#475569', fontWeight:700, textTransform:'uppercase', marginBottom:'4px' }}>Risk Assessment</div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'80px', height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'99px' }}>
                  <div style={{ height:'100%', width:`${displayScore}%`, background:riskColor, borderRadius:'99px', transition:'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize:'14px', fontWeight:800, color:riskColor }}>{displayScore}%</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', cursor:'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Signals */}
        <div style={{ padding:'0 28px', height:'40px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:'12px', background:'rgba(0,0,0,0.2)', overflow:'hidden' }}>
          <span style={{ fontSize:'10px', color:'#334155', fontWeight:700, textTransform:'uppercase' }}>Network & Fraud Signals:</span>
          <div style={{ display:'flex', gap:'8px', overflowX:'auto' }}>
            {chatFlags.map((f, i) => (
              <div key={i} className={`${FLAG_STYLE[f.type] || ''}`} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'10px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', border:'1px solid', whiteSpace:'nowrap' }}>
                <Zap size={9} /> {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:'20px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display:'flex', gap:'12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'12px', background: msg.role === 'bot' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {msg.role === 'bot' ? <Bot size={18} color="#a78bfa" /> : <User size={18} color="#64748b" />}
              </div>
              <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', gap:'4px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding:'12px 16px', borderRadius:'14px', background: msg.role === 'user' ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: msg.role === 'user' ? 'white' : '#cbd5e1', fontSize:'13.5px' }}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && <div style={{ color:'#64748b', fontSize:'12px', marginLeft:'48px' }}>SecureVerify is analyzing...</div>}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'20px 28px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          {!isComplete ? (
            <div style={{ display:'flex', gap:'10px' }}>
              <input
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder={isReady ? "Describe the issue..." : "Initialising SecureVerify..."}
                disabled={!isReady || isTyping}
                style={{ 
                  flex:1, padding:'14px 18px', borderRadius:'14px', 
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', 
                  color:'white', outline:'none',
                  opacity: (!isReady || isTyping) ? 0.6 : 1
                }}
              />
              <button 
                onClick={handleSend} 
                disabled={!isReady || isTyping || !input.trim()}
                style={{ 
                  width:'52px', borderRadius:'14px', background:'#7c3aed', 
                  border:'none', color:'white', cursor: (!isReady || isTyping || !input.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!isReady || isTyping || !input.trim()) ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={20} />
              </button>
            </div>
          ) : (
            <div style={{ textAlign:'center', color:'#34d399', fontWeight:700 }}>Verification Complete. Forwarding to review.</div>
          )}
        </div>

      </div>
    </div>
  );
}
