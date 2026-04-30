import React from 'react';
import AdminLayout from './AdminLayout';
import { TrendingUp, AlertCircle, Info, Calculator, CheckCircle } from 'lucide-react';

const BehavioralDeepDive = () => {
  const calculationSteps = [
    { label: 'Return Frequency', weight: '30%', desc: 'Checks total returns in the last 30 days. High frequency indicates serial returner behavior.' },
    { label: 'Return Ratio', weight: '20%', desc: 'Calculates the ratio of returned items vs total purchased items. Over 30% triggers a warning.' },
    { label: 'Return Velocity', weight: '15%', desc: 'Detects if multiple returns are happening in a very short window (e.g., 5 items in 2 days).' },
    { label: 'Deadline Abuse', weight: '15%', desc: 'Flags returns requested in the final 24-48 hours of the policy window.' },
    { label: 'High-Value Abuse', weight: '10%', desc: 'Specifically monitors items priced over ₹5,000 for luxury-fraud patterns.' },
    { label: 'Loyalty Offset', weight: '-10%', desc: 'Reduces risk for long-term accounts with high total spend and clean history.' },
  ];

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="text-accent" size={24} />
            <h2 className="text-xl font-bold">Behavioral DNA Logic Engine</h2>
          </div>
          <p className="text-text-secondary mb-6">
            The Behavioral DNA engine analyzes historical user data to detect patterns of policy abuse. 
            It represents <span className="text-accent font-bold">35%</span> of the final risk score.
          </p>
          
          <div className="space-y-4">
            {calculationSteps.map((step, idx) => (
              <div key={idx} className="p-4 bg-bg-secondary rounded-xl border border-border-color flex justify-between items-center">
                <div>
                  <div className="font-bold flex items-center gap-2">
                    {step.label}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${step.weight.startsWith('-') ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
                      Weight: {step.weight}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-1">{step.desc}</div>
                </div>
                <Info size={16} className="text-text-muted" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card bg-accent/5 border-accent/20">
            <h3 className="font-bold text-accent mb-2 flex items-center gap-2">
              <TrendingUp size={18} /> Engine Status
            </h3>
            <div className="text-3xl font-bold mb-1">V2.4 Active</div>
            <div className="text-xs text-text-muted">Last updated: Today at 03:30 AM</div>
          </div>
          
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-warning">
              <AlertCircle size={18} /> High Risk Thresholds
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Freq {'>'} 5</span>
                <span className="text-danger font-bold">+25 pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ratio {'>'} 40%</span>
                <span className="text-danger font-bold">+30 pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Final 24h</span>
                <span className="text-warning font-bold">+15 pts</span>
              </div>
            </div>
          </div>

          <div className="card bg-success/5 border-success/20">
            <h3 className="font-bold text-success mb-2 flex items-center gap-2">
              <CheckCircle size={18} /> Verification
            </h3>
            <p className="text-xs text-text-muted italic">
              "Models cross-referenced with customer CRM data and historical chargeback logs."
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BehavioralDeepDive;
