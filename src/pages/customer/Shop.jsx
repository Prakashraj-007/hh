import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Search, Package, LogOut, Check, X,
  ChevronLeft, ChevronRight, Star, Ruler, ArrowRight,
  Eye, MousePointerClick, Clock
} from 'lucide-react';
import { PRODUCTS } from '../../data/products';
import { trackSearch, trackPurchase } from '../../utils/searchIntentEngine';
import { trackBehaviorEvent, BehaviorEvent } from '../../utils/behaviorTracker';

const CATEGORY_FILTERS = ['All', 'Fashion', 'Electronics', 'Footwear', 'Accessories'];

// ── Simulated reviews per product (3 per item) ──────────────
const SIMULATED_REVIEWS = [
  { name: 'Priya S.',   rating: 5, text: 'Absolutely loved the quality. Fits true to size!', verified: true },
  { name: 'Rahul M.',   rating: 4, text: 'Great product, delivery was fast. Slight color difference from photos.', verified: true },
  { name: 'Ananya K.',  rating: 5, text: 'Bought this for a wedding — got so many compliments!', verified: false },
];

const SIZE_GUIDE_DATA = {
  Fashion:     { sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], tip: 'For ethnic wear, size up if between sizes.' },
  Footwear:    { sizes: ['UK5', 'UK6', 'UK7', 'UK8', 'UK9', 'UK10'], tip: 'Our footwear runs half a size small — size up.' },
  Accessories: { sizes: ['One Size', 'Adjustable'], tip: 'Most accessories are one-size; check product description for exceptions.' },
};

// ── Gallery emoji variants ────────────────────────────────────
const getGallerySlides = (product) => [
  { label: 'Front View',   emoji: product.emoji },
  { label: 'Detail Shot',  emoji: product.emoji + '✨' },
  { label: 'Style View',   emoji: '🛍️' },
];

const Shop = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [toast, setToast] = useState(null);
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [galleryIndex, setGalleryIndex]       = useState(0);
  const [showReviews, setShowReviews]          = useState(false);
  const [showSizeGuide, setShowSizeGuide]      = useState(false);
  const [modalOpenedAt, setModalOpenedAt]      = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) { navigate('/customer/login'); return; }
    setUser(JSON.parse(loggedInUser));
  }, [navigate]);

  // ── Debounced search tracking ──────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (searchDebounce) clearTimeout(searchDebounce);
    if (val.trim().length >= 2 && user) {
      const timeout = setTimeout(() => trackSearch(user.id, val.trim()), 600);
      setSearchDebounce(timeout);
    }
  };

  // ── Open product modal + track PRODUCT_VIEWED ──────────────
  const openModal = (product) => {
    setSelectedProduct(product);
    setGalleryIndex(0);
    setShowReviews(false);
    setShowSizeGuide(false);
    const now = Date.now();
    setModalOpenedAt(now);
    if (user) {
      trackBehaviorEvent(user.id, BehaviorEvent.PRODUCT_VIEWED, {
        productId: product.id,
        category: product.category,
        price: product.price,
      });
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setShowReviews(false);
    setShowSizeGuide(false);
  };

  // ── Gallery navigation + track IMAGE_VIEWED ────────────────
  const handleGalleryNav = (dir) => {
    const slides = getGallerySlides(selectedProduct);
    const next = (galleryIndex + dir + slides.length) % slides.length;
    setGalleryIndex(next);
    if (user) {
      trackBehaviorEvent(user.id, BehaviorEvent.IMAGE_VIEWED, {
        productId: selectedProduct.id,
        slideIndex: next,
      });
    }
  };

  // ── Read Reviews + track ───────────────────────────────────
  const handleReadReviews = () => {
    setShowReviews(true);
    if (user && selectedProduct) {
      trackBehaviorEvent(user.id, BehaviorEvent.REVIEW_READ, { productId: selectedProduct.id });
    }
  };

  // ── Size Guide + track ─────────────────────────────────────
  const handleSizeGuide = () => {
    setShowSizeGuide(true);
    if (user && selectedProduct) {
      trackBehaviorEvent(user.id, BehaviorEvent.SIZE_GUIDE_OPENED, { productId: selectedProduct.id });
    }
  };

  // ── Buy Now ────────────────────────────────────────────────
  const handleBuy = (product) => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() - product.deliveryDays);

    const newOrder = {
      id: `ORD-${Date.now()}`,
      product: product.name,
      category: product.category,
      amount: `₹${product.price.toLocaleString()}`,
      purchaseDate: deliveryDate.toISOString().split('T')[0],
      policyDays: product.policyDays,
      productId: product.id,
    };

    // Track BUY_NOW with time delta
    if (user) {
      trackBehaviorEvent(user.id, BehaviorEvent.BUY_NOW, {
        productId: product.id,
        category: product.category,
        price: product.price,
        secondsInModal: modalOpenedAt ? Math.round((Date.now() - modalOpenedAt) / 1000) : null,
      });
      trackPurchase(user.id);
    }

    const updatedOrders = [...(loggedInUser.orders || []), newOrder];
    loggedInUser.orders = updatedOrders;
    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    closeModal();

    setToast(`${product.name} purchased!`);
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

  const alreadyPurchased = (product) => (user?.orders || []).some(o => o.product === product.name);

  const getDeliveryLabel = (days) => {
    if (days === 1) return { text: 'Same Day', color: 'text-success' };
    if (days <= 2)  return { text: `${days}-Day Delivery`, color: 'text-accent' };
    return { text: `${days}-Day Delivery`, color: 'text-text-secondary' };
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary">

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-success text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <Check size={18} /> {toast}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border-color bg-bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent" size={24} />
            <span className="text-xl font-bold">ReturnShield</span>
            <span className="text-sm text-text-secondary border-l border-border-color pl-3 ml-1">Shop</span>
          </div>

          {/* Search */}
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
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/customer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition">
              <Package size={18} /> My Orders
            </Link>
            <button onClick={() => { localStorage.removeItem('loggedInUser'); navigate('/customer/login'); }} className="p-2 text-text-muted hover:text-danger transition">
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
                activeCategory === cat ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Search Intent tip */}
      {query && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="p-3 bg-[rgba(139,92,246,0.1)] border border-accent/30 rounded-lg text-sm flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent shrink-0" />
            <span className="text-text-secondary">
              <span className="text-accent font-medium">ReturnShield AI</span> is analyzing your search intent in real-time.
            </span>
          </div>
        </div>
      )}

      {/* ── Product Grid ──────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {activeCategory === 'All' ? 'All Products' : activeCategory}
            <span className="text-sm font-normal text-text-secondary ml-2">({filteredProducts.length} items)</span>
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-text-muted bg-bg-secondary px-3 py-1.5 rounded-full border border-border-color">
            <Eye size={12} className="text-accent" />
            <span>AI behavior tracking <span className="text-accent font-semibold">active</span></span>
          </div>
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
                  className="card p-0 overflow-hidden flex flex-col hover:border-accent/50 transition-all group cursor-pointer"
                  onClick={() => openModal(product)}
                >
                  {/* Product Image */}
                  <div
                    className="w-full aspect-square flex items-center justify-center text-6xl relative"
                    style={{ background: `${product.color}18`, borderBottom: `2px solid ${product.color}30` }}
                  >
                    <span style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{product.emoji}</span>
                    {!purchased && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-full flex items-center gap-1">
                          <MousePointerClick size={11} /> View Details
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: product.color }}>
                      {product.category}
                    </div>
                    <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-[11px] text-text-muted mb-2 line-clamp-2">{product.description}</p>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-base">₹{product.price.toLocaleString()}</span>
                        <span className={`text-[10px] font-medium ${deliveryLabel.color}`}>{deliveryLabel.text}</span>
                      </div>
                      <div className="text-[10px] text-text-muted mb-2">{product.policyDays}-day return policy</div>

                      {purchased ? (
                        <div className="w-full py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold text-center flex items-center justify-center gap-1">
                          <Check size={12} /> Purchased
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(product); }}
                          className="w-full py-1.5 rounded-lg text-xs font-semibold transition bg-bg-secondary text-text-secondary hover:bg-accent hover:text-white"
                        >
                          View & Buy
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

      {/* ── Rich Product Modal ────────────────────────────── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-bg-card border border-border-color rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-bg-card border-b border-border-color px-6 py-4 flex justify-between items-center">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: selectedProduct.color }}>
                  {selectedProduct.category}
                </div>
                <h2 className="text-xl font-bold leading-tight">{selectedProduct.name}</h2>
              </div>
              <button onClick={closeModal} className="p-2 text-text-muted hover:text-white transition rounded-lg hover:bg-bg-secondary">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* ── Image Gallery ────────────────────────────── */}
              <div
                className="relative w-full rounded-xl overflow-hidden mb-6 flex items-center justify-center"
                style={{ height: '240px', background: `${selectedProduct.color}15`, border: `2px solid ${selectedProduct.color}30` }}
              >
                {/* Gallery Slides */}
                <div className="flex flex-col items-center">
                  <span className="text-8xl" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }}>
                    {getGallerySlides(selectedProduct)[galleryIndex].emoji}
                  </span>
                  <span className="text-xs text-text-muted mt-3 font-medium">
                    {getGallerySlides(selectedProduct)[galleryIndex].label}
                  </span>
                </div>

                {/* Nav Arrows */}
                <button
                  onClick={() => handleGalleryNav(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg-card/80 hover:bg-bg-card border border-border-color rounded-full flex items-center justify-center transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => handleGalleryNav(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg-card/80 hover:bg-bg-card border border-border-color rounded-full flex items-center justify-center transition"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {getGallerySlides(selectedProduct).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition ${i === galleryIndex ? 'bg-white' : 'bg-white/30'}`}
                    />
                  ))}
                </div>

                {/* AI Tracking badge */}
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-[10px] text-accent px-2 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck size={9} /> AI Tracking
                </div>
              </div>

              {/* ── Price + Meta ──────────────────────────────── */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="text-3xl font-bold">₹{selectedProduct.price.toLocaleString()}</div>
                  <div className="text-sm text-text-secondary mt-1">{selectedProduct.description}</div>
                </div>
                <div className="text-right text-sm">
                  <div className={`font-semibold ${getDeliveryLabel(selectedProduct.deliveryDays).color}`}>
                    {getDeliveryLabel(selectedProduct.deliveryDays).text}
                  </div>
                  <div className="text-text-muted text-[11px] mt-1">{selectedProduct.policyDays}-day return policy</div>
                </div>
              </div>

              {/* ── Action Chips ──────────────────────────────── */}
              <div className="flex flex-wrap gap-2 mb-6">
                {/* Read Reviews */}
                {!showReviews && (
                  <button
                    onClick={handleReadReviews}
                    id="btn-read-reviews"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-bg-secondary border border-border-color hover:border-accent/50 hover:bg-accent/10 transition"
                  >
                    <Star size={13} className="text-warning" /> Read Reviews
                  </button>
                )}

                {/* Size Guide — fashion/footwear only */}
                {['Fashion', 'Footwear', 'Accessories'].includes(selectedProduct.category) && !showSizeGuide && (
                  <button
                    onClick={handleSizeGuide}
                    id="btn-size-guide"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-bg-secondary border border-border-color hover:border-accent/50 hover:bg-accent/10 transition"
                  >
                    <Ruler size={13} className="text-accent" /> Size Guide
                  </button>
                )}

                {/* Return policy timing chip (tracked on /customer/return visit) */}
                <div className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-lg bg-bg-secondary border border-border-color text-text-muted">
                  <Clock size={12} /> {selectedProduct.policyDays}-Day Returns
                </div>
              </div>

              {/* ── Reviews Panel ─────────────────────────────── */}
              {showReviews && (
                <div className="mb-6 bg-bg-secondary rounded-xl p-4 border border-border-color animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Star size={14} className="text-warning" /> Customer Reviews
                    </h3>
                    <span className="text-[10px] text-text-muted">3 verified reviews</span>
                  </div>
                  <div className="space-y-3">
                    {SIMULATED_REVIEWS.map((review, i) => (
                      <div key={i} className="bg-bg-card p-3 rounded-lg border border-border-color">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{review.name}</span>
                            {review.verified && (
                              <span className="text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded-full">✓ Verified</span>
                            )}
                          </div>
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, s) => (
                              <Star key={s} size={10} className="text-warning fill-warning" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Size Guide Panel ──────────────────────────── */}
              {showSizeGuide && SIZE_GUIDE_DATA[selectedProduct.category] && (
                <div className="mb-6 bg-bg-secondary rounded-xl p-4 border border-border-color animate-fade-in">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Ruler size={14} className="text-accent" /> Size Guide
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SIZE_GUIDE_DATA[selectedProduct.category].sizes.map(s => (
                      <span key={s} className="px-3 py-1 rounded-lg bg-bg-card border border-border-color text-sm font-semibold">{s}</span>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted italic">
                    💡 {SIZE_GUIDE_DATA[selectedProduct.category].tip}
                  </p>
                </div>
              )}

              {/* ── Buy Now Button ────────────────────────────── */}
              {alreadyPurchased(selectedProduct) ? (
                <div className="w-full py-3 rounded-xl bg-success/10 text-success font-semibold text-center flex items-center justify-center gap-2">
                  <Check size={18} /> Already Purchased
                </div>
              ) : (
                <button
                  id="btn-buy-now"
                  onClick={() => handleBuy(selectedProduct)}
                  className="w-full py-3 rounded-xl font-bold text-base transition flex items-center justify-center gap-2"
                  style={{ background: selectedProduct.color, color: '#fff' }}
                >
                  Buy Now — ₹{selectedProduct.price.toLocaleString()} <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
