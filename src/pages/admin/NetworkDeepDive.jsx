import React from 'react';
import AdminLayout from './AdminLayout';
import { Network, ShieldCheck, Globe, Smartphone, UserPlus, AlertCircle } from 'lucide-react';

const NetworkDeepDive = () => {
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Network className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold">Network Security & Graph Analysis</h2>
          </div>
          <p className="text-text-secondary mb-8 leading-relaxed">
            Network-based fraud detection looks beyond the individual user to find clusters of fraudulent activity. 
            By tracking IP addresses, device IDs, and address delivery patterns, we identify "Account Farms" used for serial fraud.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-bg-secondary rounded-xl border border-border-color">
              <Globe className="text-accent mb-2" size={20} />
              <h4 className="font-bold text-sm mb-1">IP Risk Engine</h4>
              <p className="text-xs text-text-muted">Analyzes IP reputation, proxy usage, and data center exit nodes.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">Weight: 40%</span>
              </div>
            </div>
            <div className="p-4 bg-bg-secondary rounded-xl border border-border-color">
              <Smartphone className="text-accent mb-2" size={20} />
              <h4 className="font-bold text-sm mb-1">Device Fingerprinting</h4>
              <p className="text-xs text-text-muted">Unique browser + OS footprint tracking to identify shared hardware.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">Weight: 40%</span>
              </div>
            </div>
            <div className="p-4 bg-bg-secondary rounded-xl border border-border-color">
              <UserPlus className="text-accent mb-2" size={20} />
              <h4 className="font-bold text-sm mb-1">Linkage Analysis</h4>
              <p className="text-xs text-text-muted">Finds connections between accounts via email, phone, or address.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">Weight: 20%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="font-bold text-sm mb-4 uppercase text-text-muted flex items-center gap-2">
              <ShieldCheck size={14} /> Security Status
            </h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                <ShieldCheck size={28} />
              </div>
              <div>
                <div className="font-bold text-success text-xl uppercase">ACTIVE</div>
                <div className="text-[10px] text-text-muted">Real-time IP Monitoring</div>
              </div>
            </div>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted font-medium">Global Risk Feed</span>
                    <span className="text-success font-bold">Updated 1m ago</span>
                  </div>
                  <div className="w-full bg-bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className="bg-success h-full" style={{ width: '100%' }}></div>
                  </div>
               </div>
            </div>
          </div>

          <div className="card border-danger/20 bg-danger/5">
             <h3 className="font-bold text-danger text-sm mb-3 flex items-center gap-2">
               <AlertCircle size={16} /> Blocked Network Patterns
             </h3>
             <ul className="text-xs space-y-2 text-text-secondary">
               <li>• Tor Exit Nodes / High-Risk VPNs</li>
               <li>• 5+ Accounts on 1 Device ID</li>
               <li>• Randomized Apartment Sub-units</li>
               <li>• Virtual Mobile Number VOIPs</li>
             </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NetworkDeepDive;
