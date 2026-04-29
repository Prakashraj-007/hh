import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, ShieldCheck, ChevronRight, LogOut, CheckCircle } from 'lucide-react';
import { MOCK_PAST_CLAIMS } from '../../data';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existingClaims, setExistingClaims] = useState([]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
      navigate('/customer/login');
    } else {
      setUser(JSON.parse(loggedInUser));
    }
    
    // Load claims to check for duplicates
    const savedClaims = JSON.parse(localStorage.getItem('claims') || '[]');
    setExistingClaims(savedClaims);
  }, [navigate]);

  const isReturned = (orderId) => existingClaims.some(c => c.orderId === orderId);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/customer/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border-color bg-bg-card">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent" size={24} />
            <span className="text-xl font-bold">ReturnShield</span>
            <span className="text-sm text-text-secondary ml-2 border-l border-border-color pl-2">Customer Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/customer/shop" className="btn btn-primary flex items-center gap-2 text-sm">
              🛍️ Shop Now
            </Link>
            <span className="text-sm font-medium">Hello, {user.name}</span>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-bg-hover rounded-lg text-text-muted hover:text-danger transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Orders & Returns</h1>
          <div className="text-sm text-text-secondary">Account ID: {user.id}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card bg-bg-card flex flex-col gap-2">
            <span className="text-text-secondary font-medium">Total Orders</span>
            <span className="text-3xl font-bold">{user.orders.length}</span>
          </div>
          <div className="card bg-bg-card flex flex-col gap-2">
            <span className="text-text-secondary font-medium">Eligible Returns</span>
            <span className="text-3xl font-bold text-warning">
              {user.orders.length}
            </span>
          </div>
          <div className="card bg-bg-card flex flex-col gap-2">
            <span className="text-text-secondary font-medium">Refund Status</span>
            <span className="text-3xl font-bold text-accent">Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Eligible Orders */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package size={20} /> Eligible for Return
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {user.orders.map((order) => (
                <div key={order.id} className="card p-4 flex justify-between items-center animate-fade-in">
                  <div>
                    <h3 className="font-semibold text-lg">{order.product}</h3>
                    <div className="text-sm text-text-secondary mt-1">
                      Order {order.id} • Delivered {order.purchaseDate}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <div className="badge badge-info">
                        {order.policyDays} Day Policy
                      </div>
                      <div className={`badge ${
                        (order.policyDays - (Math.floor((new Date('2026-04-29') - new Date(order.purchaseDate)) / (1000 * 60 * 60 * 24)))) <= 2 
                        ? 'badge-danger' : 'badge-success'
                      }`}>
                        {order.policyDays - (Math.floor((new Date('2026-04-29') - new Date(order.purchaseDate)) / (1000 * 60 * 60 * 24)))} Days Left
                      </div>
                    </div>
                  </div>
                  {isReturned(order.id) ? (
                    <div className="text-success font-semibold flex items-center gap-2">
                       <CheckCircle size={20} /> Return Submitted
                    </div>
                  ) : (
                    <Link 
                      to={`/customer/return?orderId=${order.id}`} 
                      className="btn btn-outline flex items-center gap-1"
                    >
                      Return <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Past Claims */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock size={20} /> Previous Claims
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {MOCK_PAST_CLAIMS.filter(c => c.customer === user.name).length > 0 ? (
                MOCK_PAST_CLAIMS.filter(c => c.customer === user.name).map((claim) => (
                  <div key={claim.id} className="card p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold">{claim.product}</h3>
                      <span className={`badge ${claim.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                        {claim.status}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary flex justify-between">
                      <span>{claim.id}</span>
                      <span>Requested: {claim.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-text-muted bg-bg-secondary rounded-xl border border-dashed border-border-color">
                  No previous claims found.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
