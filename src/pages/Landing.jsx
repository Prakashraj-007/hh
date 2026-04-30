import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, LayoutDashboard, ChevronRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1e1e2e] via-bg-primary to-bg-primary">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-16 animate-fade-in">
        <ShieldCheck className="text-accent" size={48} />
        <div>
          <h1 className="text-4xl font-bold tracking-tight">ReturnShield <span className="text-accent">AI</span></h1>
          <p className="text-text-muted text-sm font-medium tracking-widest uppercase">Forensic Claims Intelligence</p>
        </div>
      </div>

      {/* Portal Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        {/* Customer Portal Card */}
        <div 
          onClick={() => navigate('/customer/login')}
          className="group relative cursor-pointer"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative card h-full p-8 flex flex-col items-center text-center transition-all duration-300 group-hover:translate-y-[-4px] group-hover:bg-bg-hover">
            <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform duration-500">
              <User size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Customer Portal</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-8">
              Experience the seamless, AI-guided return process. Submit claims, verify products, and chat with the forensic bot.
            </p>
            <div className="mt-auto flex items-center gap-2 text-accent font-semibold group-hover:gap-3 transition-all">
              Launch Demo <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Admin Portal Card */}
        <div 
          onClick={() => navigate('/admin')}
          className="group relative cursor-pointer"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-danger to-warning rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative card h-full p-8 flex flex-col items-center text-center transition-all duration-300 group-hover:translate-y-[-4px] group-hover:bg-bg-hover">
            <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center text-danger mb-6 group-hover:scale-110 transition-transform duration-500">
              <LayoutDashboard size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Admin Dashboard</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-8">
              Access real-time forensic intelligence. Monitor claims, review image forensics, and oversee AI-automated approvals.
            </p>
            <div className="mt-auto flex items-center gap-2 text-danger font-semibold group-hover:gap-3 transition-all">
              Access Admin <ChevronRight size={18} />
            </div>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="mt-20 opacity-30 text-xs font-mono tracking-widest uppercase animate-fade-in" style={{animationDelay: '0.4s'}}>
        System v2.0 // Secured by HackHustle
      </div>
    </div>
  );
};

export default Landing;

