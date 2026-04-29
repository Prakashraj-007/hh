// ============================================================
// Fraud Interrogation Chat Engine — ReturnShield AI
// Logic sourced from: https://github.com/Gouthamrec/hh-chatbot
// Purpose: Conversational Fraud Interrogation via AI Chat
// Enabled only when totalRiskScore > 20
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// Replace with actual Gemini API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDemo_Replace_With_Real_Key";

let chat = null;

// ── SYSTEM PROMPT ──────────────────────────────────────────
// Instructs Gemini to conduct fraud interrogation naturally
const SYSTEM_PROMPT = `You are ReturnShield SecureVerify, an AI fraud interrogation assistant embedded in a retail return verification portal.

Your role is to conduct a natural, conversational verification to detect potential fraud patterns including:
- Wardrobing (using items for events then returning them)
- Deadline abuse (returning items just before the policy expires)
- Organised return fraud
- Inconsistent or fabricated return reasons

Guidelines:
- Be polite and professional — NEVER accusatory or confrontational
- Ask ONE focused question at a time
- Probe for inconsistencies gently (e.g., exact dates, usage details, urgency signals)
- Listen for keywords like: "used once", "just for an event", "party", "wore it", "urgent refund", "wrong item" (when unlikely)
- Keep responses under 3 sentences — be concise
- After 5 exchanges, end with: "Thank you for verifying. Your case has been forwarded for review."

Focus areas to investigate:
1. Actual reason for the return (probe beyond stated reason)
2. When and how the item was used
3. Was there a specific occasion or event?
4. Urgency around the refund
5. Specific defect details (inconsistencies reveal fabrication)

Do NOT directly accuse the customer. Instead, ask clarifying questions that expose inconsistencies.`;

// ── INITIALISE CHAT SESSION ────────────────────────────────
export const initChat = (initialReason = "Not provided") => {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `${SYSTEM_PROMPT}\n\nCRITICAL CONTEXT: The customer initially stated their return reason as: "${initialReason}". Your goal is to see if their detailed chat responses remain consistent with this reason or reveal a different truth (like wardrobing).`,
    });
    chat = model.startChat({ history: [] });
    console.log("[ChatEngine] Gemini chat session initialised with reason:", initialReason);
    return true;
  } catch (e) {
    console.warn("[ChatEngine] Gemini init failed — switching to mock mode:", e.message);
    chat = null;
    return false;
  }
};

// ── RISK KEYWORD ANALYSIS ──────────────────────────────────
// Analyses the customer's response for known fraud signals
export const analyzeResponseRisk = (userText) => {
  let score = 0;
  const flags = [];
  const text = userText.toLowerCase();

  // HIGH RISK — typically fabricated damage claims
  const highRiskKeywords = [
    'broken', 'not working', 'doesnt work', "doesn't work",
    'different', 'fake', 'empty box', 'damaged', 'wrong item',
    'never arrived', 'missing parts', 'defective'
  ];

  // SUSPICIOUS — urgency signals indicating motivation to commit fraud
  const suspiciousKeywords = [
    'urgent', 'refund now', 'immediately', 'asap', 'as soon as possible',
    'lost', 'stolen', 'need money', 'financial', 'friend told', 'someone said'
  ];

  // WARDROBING — clear usage-for-event then return indicators
  const wardrobingKeywords = [
    'wore it once', 'used it once', 'used once', 'just for',
    'event', 'party', 'occasion', 'one time', 'wedding', 'function',
    'festival', 'wore once', 'used for the event', 'only wore'
  ];

  // INCONSISTENCY — vague or self-contradicting responses
  const inconsistencyKeywords = [
    "don't remember", "not sure", "maybe", "someone else",
    "i think", "i guess", "not really", "kind of", "sort of"
  ];

  highRiskKeywords.forEach(word => {
    if (text.includes(word)) {
      score += 20;
      flags.push({ type: 'HIGH_RISK', text: `High-risk claim detected: "${word}"` });
    }
  });

  suspiciousKeywords.forEach(word => {
    if (text.includes(word)) {
      score += 15;
      flags.push({ type: 'SUSPICIOUS', text: `Urgency signal: "${word}"` });
    }
  });

  wardrobingKeywords.forEach(word => {
    if (text.includes(word)) {
      score += 20;
      flags.push({ type: 'WARDROBING', text: `Wardrobing indicator: "${word}"` });
    }
  });

  inconsistencyKeywords.forEach(word => {
    if (text.includes(word)) {
      score += 10;
      flags.push({ type: 'INCONSISTENCY', text: `Vague/inconsistent response: "${word}"` });
    }
  });

  return { score: Math.min(100, score), flags };
};

// ── MOCK RESPONSES (fallback when no API key) ──────────────
// Simulates a realistic fraud interrogation conversation
const MOCK_RESPONSES = [
  "Thank you for reaching out. Could you describe in detail the issue you experienced with the product?",
  "I see — and when exactly did you first notice this issue? Was it right after delivery, or after you had used it?",
  "That's helpful to know. Did you use the product at all before deciding to return it? Perhaps for a specific occasion or event?",
  "For our verification process, could you tell me precisely which part of the product is not functioning as expected?",
  "I appreciate your responses. I've captured the details of your return. Our specialist team will review your case and respond within 24 hours. Thank you for your cooperation.",
];
let mockIndex = 0;

// ── SEND MESSAGE ───────────────────────────────────────────
export const sendMessage = async (userMessage) => {
  if (chat) {
    try {
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (e) {
      console.warn("[ChatEngine] Gemini API error — using mock response:", e.message);
    }
  }
  // Fallback to scripted mock responses
  const response = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
  mockIndex++;
  return response;
};

// ── RESET SESSION ──────────────────────────────────────────
export const resetChat = () => {
  chat = null;
  mockIndex = 0;
};
