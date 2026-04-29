import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Camera, Network, TrendingUp, Search } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="container flex justify-between items-center py-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-accent" size={32} />
          <span className="text-2xl font-bold">ReturnShield <span className="text-accent">AI</span></span>
        </div>
        <div className="flex gap-4">
          <Link to="/customer/login" className="btn btn-outline">Customer Portal</Link>
          <Link to="/admin" className="btn btn-primary">Admin Portal</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl animate-fade-in">
          Detect Return Fraud <br/> <span className="text-accent">Before Refunds Happen</span>
        </h1>
        <p className="text-xl text-secondary mb-10 max-w-2xl animate-fade-in" style={{animationDelay: '0.1s'}}>
          AI-powered fraud intelligence for e-commerce returns. Detect suspicious behavior, image manipulation, linked accounts, and return policy abuse in real time.
        </p>
        
        <div className="flex gap-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <Link to="/customer/login" className="btn btn-outline text-lg px-8 py-3">Try Customer Demo</Link>
          <Link to="/admin" className="btn btn-primary text-lg px-8 py-3">View Admin Dashboard</Link>
        </div>
      </main>

      {/* Stats Section */}
      <section className="bg-bg-secondary py-16">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-success mb-2">₹12L+</div>
            <div className="text-text-secondary font-medium">Fraud Prevented</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">87%</div>
            <div className="text-text-secondary font-medium">Auto Approvals</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">92%</div>
            <div className="text-text-secondary font-medium">Detection Accuracy</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">4.5s</div>
            <div className="text-text-secondary font-medium">Avg Review Time</div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Enterprise-Grade Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon={<Activity />} title="Behavioral DNA Intelligence" desc="Track return frequency, high-value abuse, and dynamic deadline exploitation." />
          <FeatureCard icon={<Camera />} title="Image Forensics" desc="Detect duplicate images, metadata mismatches, and edited proof photos." />
          <FeatureCard icon={<Network />} title="Network Fraud Detection" desc="Identify shared devices, IP addresses, and linked flagged accounts." />
          <FeatureCard icon={<TrendingUp />} title="Adaptive Risk Scoring" desc="Real-time multi-dimensional risk scoring combining behavior, images, and network." />
          <FeatureCard icon={<Search />} title="Explainable AI Decisions" desc="Transparent reasoning for every blocked or reviewed return." />
          <FeatureCard icon={<ShieldCheck />} title="Fraud Operations Dashboard" desc="Premium internal dashboard for your fraud review team." />
        </div>
      </section>

      {/* Pitch Banner */}
      <section className="container py-20 text-center">
        <div className="card glass inline-block max-w-3xl">
          <h3 className="text-2xl font-semibold mb-4 text-warning">Strategic Policy Abuse Prevention</h3>
          <p className="text-lg text-text-secondary">
            We don't just detect fake returns. We detect strategic abuse of <strong className="text-white">any return policy window</strong> before refunds happen.
          </p>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="card flex flex-col items-start gap-4">
    <div className="p-3 bg-bg-secondary rounded-lg text-accent">
      {icon}
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-text-secondary">{desc}</p>
  </div>
);

export default Landing;
