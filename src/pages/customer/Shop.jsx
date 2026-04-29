import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Search, ShoppingCart, Package, LogOut, Check, X } from 'lucide-react';
import { PRODUCTS } from '../../data/products';
import { trackSearch, trackPurchase } from '../../utils/searchIntentEngine';

const CATEGORY_FILTERS = ['All', 'Fashion', 'Electronics', 'Footwear', 'Accessories'];

const Shop = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [searchDebounce, setSearchDebounce] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) { navigate('/customer/login'); return; }
    const u = JSON.parse(loggedInUser);
    setUser(u);
    // Track already purchased orders
    setPurchasedIds((u.orders || []).map(o => o.id));
  }, [navigate]);

  // Debounced search tracking for intent engine
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (searchDebounce) clearTimeout(searchDebounce);
    if (val.trim().length >= 2 && user) {
      const timeout = setTimeout(() => {
        trackSearch(user.id, val.trim());
      }, 600);
      setSearchDebounce(timeout);
    }
  };

  const handleBuy = (product) => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() - product.deliveryDays); // Simulate already delivered

    const newOrder = {
      id: `ORD-${Date.now()}`,
      product: product.name,
      category: product.category,
      amount: `₹${product.price.toLocaleString()}`,
      purchaseDate: deliveryDate.toISOString().split('T')[0],
      policyDays: product.policyDays,
    };

    const updatedOrders = [...(loggedInUser.orders || []), newOrder];
    loggedInUser.orders = updatedOrders;
    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setPurchasedIds(updatedOrders.map(o => o.id));

    // Track purchase in search intent engine
    trackPurchase(loggedInUser.id);

    // Show success toast
    setToast(`${product.name} added to your orders!`);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesQuery = !query.trim() ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(t => t.includes(query.toLowerCase())) ||
      p.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const alreadyPurchased = (product) => {
    return (user?.orders || []).some(o => o.product === product.name);
  };

  const getDeliveryLabel = (days) => {
    if (days === 1) return { text: 'Same Day', color: 'text-success' };
    if (days === 2) return { text: `${days}-Day Delivery`, color: 'text-accent' };
    return { text: `${days}-Day Delivery`, color: 'text-text-secondary' };
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-success text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <Check size={18} /> {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-color bg-bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent" size={24} />
            <span className="text-xl font-bold">ReturnShield</span>
            <span className="text-sm text-text-secondary border-l border-border-color pl-3 ml-1">Shop</span>
          </div>

          {/* Search Bar - Intent tracked here */}
          <div className="flex-1 max-w-lg relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder='Try "party dress", "wedding heels", "urgent blazer"...'
              className="input-field pl-10 py-2 w-full text-sm"
              value={query}
              onChange={handleSearchChange}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/customer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition">
              <Package size={18} /> My Orders
            </Link>
            <button
              onClick={() => { localStorage.removeItem('loggedInUser'); navigate('/customer/login'); }}
              className="p-2 text-text-muted hover:text-danger transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-7xl mx-auto px-6 pb-3 flex gap-2 overflow-x-auto">
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Search Intent Tip Banner */}
      {query && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="p-3 bg-[rgba(139,92,246,0.1)] border border-accent/30 rounded-lg text-sm flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent shrink-0" />
            <span className="text-text-secondary">
              <span className="text-accent font-medium">ReturnShield AI</span> is analyzing your search intent in real-time to personalize the return experience.
            </span>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {activeCategory === 'All' ? 'All Products' : activeCategory}
            <span className="text-sm font-normal text-text-secondary ml-2">({filteredProducts.length} items)</span>
          </h1>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-text-muted">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No products match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const deliveryLabel = getDeliveryLabel(product.deliveryDays);
              const purchased = alreadyPurchased(product);

              return (
                <div
                  key={product.id}
                  className="card p-0 overflow-hidden flex flex-col hover:border-accent/50 transition-colors group"
                >
                  {/* Product Image (Flat Color + Emoji) */}
                  <div
                    className="w-full aspect-square flex items-center justify-center text-6xl"
                    style={{ background: `${product.color}18`, borderBottom: `2px solid ${product.color}30` }}
                  >
                    <span style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                      {product.emoji}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: product.color }}
                    >
                      {product.category}
                    </div>
                    <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-[11px] text-text-muted mb-2 line-clamp-2">{product.description}</p>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-base">₹{product.price.toLocaleString()}</span>
                        <span className={`text-[10px] font-medium ${deliveryLabel.color}`}>
                          {deliveryLabel.text}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted mb-2">
                        {product.policyDays}-day return policy
                      </div>

                      {purchased ? (
                        <div className="w-full py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold text-center flex items-center justify-center gap-1">
                          <Check size={12} /> Purchased
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuy(product)}
                          className="w-full py-1.5 rounded-lg text-xs font-semibold transition bg-bg-secondary text-text-secondary hover:bg-accent hover:text-white"
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Shop;
