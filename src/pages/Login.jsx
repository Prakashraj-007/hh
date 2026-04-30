import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ChevronRight } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../data';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (customer) => {
    // Inject simulated networking/security markers for testing
    const enrichedCustomer = {
      ...customer,
      ipAddress: customer.id === 'USR-003' ? '10.0.0.10' : '10.0.0.1', // Simulate a high-risk IP for specific personas
      location: customer.id === 'USR-003' ? 'City10' : 'City1',
      addressHash: customer.id === 'USR-003' ? 'ADDR-99999' : 'ADDR-12345',
      deviceId: `DEV-${Math.floor(Math.random()*100000)}`
    };
    localStorage.setItem('loggedInUser', JSON.stringify(enrichedCustomer));
    navigate('/customer');
  };


  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="text-accent" size={40} />
          <h1 className="text-3xl font-bold">ReturnShield <span className="text-accent">AI</span></h1>
        </div>

        <div className="card glass animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold">Select a Customer Persona</h2>
            <p className="text-text-secondary mt-2">To demonstrate different return behaviors and policies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_CUSTOMERS.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleLogin(customer)}
                className="flex items-center justify-between p-4 bg-bg-secondary border border-border-color rounded-xl hover:border-accent hover:bg-bg-hover transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-primary flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">{customer.name}</div>
                    <div className="text-xs text-text-secondary">{customer.id} • {customer.orders.length} Orders</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-muted group-hover:text-accent" />
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border-color text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-sm text-text-muted hover:text-white font-medium transition-colors"
            >
              ← Back to Portal Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
