import React from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, Search, MessageSquare, LayoutDashboard, Camera, Network, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'Claims Queue', path: '/admin', icon: LayoutDashboard },
    { name: 'Behavioral DNA', path: '/admin/behavioral', icon: TrendingUp },
    { name: 'Vision Forensics', path: '/admin/vision', icon: Camera },
    { name: 'Network Risk', path: '/admin/network', icon: Network },
    { name: 'AI Chat Logs', path: '/admin/chats', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-card border-r border-border-color hidden md:block sticky top-0 h-screen">
        <div className="p-6 border-b border-border-color flex items-center gap-2">
          <ShieldCheck className="text-accent" size={28} />
          <span className="text-xl font-bold">ReturnShield</span>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                location.pathname === item.path 
                  ? 'bg-accent/10 text-accent' 
                  : 'text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              <item.icon size={20} /> {item.name}
            </Link>
          ))}
          <div className="mt-8 pt-4 border-t border-border-color">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:text-white hover:bg-bg-secondary transition text-sm">
               ← Return to Portal
            </Link>
          </div>
        </nav>
      </aside>

      <main className="flex-1">
        {/* Header */}
        <header className="bg-bg-card border-b border-border-color px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <h1 className="text-xl font-bold capitalize">
            {menuItems.find(i => i.path === location.pathname)?.name || 'Admin Portal'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Ops Commander</span>
            <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold">A</div>
          </div>
        </header>

        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
