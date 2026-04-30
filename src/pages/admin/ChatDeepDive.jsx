import React from 'react';
import AdminLayout from './AdminLayout';
import { MessageSquare, ShieldCheck, BrainCircuit, Activity, AlertTriangle, Scale } from 'lucide-react';

const ChatDeepDive = () => {
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold">Conversational Fraud Interrogation (CFI)</h2>
          </div>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Our AI Chat Interrogation engine uses Natural Language Understanding (NLU) to detect psychological fraud indicators. 
            When a claim hits high-risk thresholds, the AI initiates a conversation to verify details and detect inconsistencies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="p-4 bg-bg-secondary rounded-xl border border-border-color">
                <BrainCircuit className="text-purple-400 mb-2" size={20} />
                <h4 className="font-bold text-sm mb-1">Psychological Profiling</h4>
                <p className="text-xs text-text-muted">Analyzes urgency, defensive tone, and over-explanation patterns.</p>
             </div>
             <div className="p-4 bg-bg-secondary rounded-xl border border-border-color">
                <Activity className="text-purple-400 mb-2" size={20} />
                <h4 className="font-bold text-sm mb-1">Consistency Check</h4>
                <p className="text-xs text-text-muted">Flags changes in the customer's story across different messages.</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
           <div className="card bg-purple-500/5 border-purple-500/20">
              <h3 className="font-bold text-purple-400 mb-4 flex items-center gap-2">
                <Scale size={18} /> Decision Logic
              </h3>
              <div className="space-y-4">
                 <div>
                    <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Risk Contribution</div>
                    <div className="text-2xl font-bold">15% of Final</div>
                 </div>
                 <div className="p-3 bg-bg-primary rounded-lg text-xs border border-border-color/50">
                    "AI Recommendations range from 'Force Approve' to 'Flag for Investigation' based on sentiment and signal density."
                 </div>
              </div>
           </div>

           <div className="card border-warning/20 bg-warning/5">
              <h3 className="font-bold text-warning text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> Interrogation Signals
              </h3>
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-secondary">Defensive Tone</span>
                    <span className="text-danger font-bold">HIGH RISK</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-secondary">Temporal Inconsistency</span>
                    <span className="text-danger font-bold">HIGH RISK</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px]">
                    <span className="text-text-secondary">Overly Cooperative</span>
                    <span className="text-success font-bold">LOW RISK</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="card border-accent/20">
         <div className="flex items-center gap-2 font-bold mb-4">
            <ShieldCheck className="text-accent" size={18} />
            SecureVerify AI Model V3
         </div>
         <p className="text-sm text-text-secondary">
            Built on a fine-tuned LLM specialized in forensic interviewing and claim verification. 
            The model is trained on millions of real return fraud transcripts to identify "The Fraudster's Dialect."
         </p>
      </div>
    </AdminLayout>
  );
};

export default ChatDeepDive;
