export const RETURN_POLICIES = {
  'Electronics': 7,
  'Fashion': 14,
  'Grocery': 3,
  'Accessories': 10
};

export const MOCK_CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    accountAgeDays: 1530,
    totalOrders: 45,
    totalReturns: 2,
    totalSpend: 245000,
    previousFlags: 0,
    trustScore: 95,
    deviceId: 'DEV-ALPHA-99',
    addressHash: 'ADDR-12345',
    linkedAccounts: 1,
    networkRisk: 5,
    imageRisk: 10,
    history: [
      { product: 'MacBook Air', category: 'Electronics', policy: 7, returnedOn: 2, amount: 90000, date: '2025-12-10' },
      { product: 'USB-C Hub', category: 'Electronics', policy: 7, returnedOn: 3, amount: 2500, date: '2026-01-15' }
    ],
    orders: [
      { id: 'ORD-101', product: 'MacBook Pro M3', category: 'Electronics', amount: '₹1,45,000', purchaseDate: '2026-04-25', policyDays: 7 },
      { id: 'ORD-102', product: 'iPhone 15 Pro', category: 'Electronics', amount: '₹1,20,000', purchaseDate: '2026-04-28', policyDays: 7 }
    ]
  },
  {
    id: 'CUST-002',
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    accountAgeDays: 45,
    totalOrders: 6,
    totalReturns: 1,
    totalSpend: 15000,
    previousFlags: 2,
    trustScore: 15,
    deviceId: 'DEV-GAMMA-22', // SHARED DEVICE
    addressHash: 'ADDR-99999', // HIGH RETURN ADDRESS
    linkedAccounts: 5,
    networkRisk: 85,
    imageRisk: 90,
    history: [
      { product: 'Sony Headphones', category: 'Electronics', policy: 7, returnedOn: 7, amount: 12000, date: '2026-04-05' }
    ],
    orders: [
      { id: 'ORD-201', product: 'Nike Air Max', category: 'Fashion', amount: '₹8,500', purchaseDate: '2026-04-28', policyDays: 14 },
      { id: 'ORD-202', product: 'Levi\'s Denim', category: 'Fashion', amount: '₹3,200', purchaseDate: '2026-04-20', policyDays: 14 }
    ]
  },
  {
    id: 'CUST-003',
    name: 'Sneha Patel',
    email: 'sneha@example.com',
    accountAgeDays: 400,
    totalOrders: 18,
    totalReturns: 3,
    totalSpend: 45000,
    previousFlags: 0,
    trustScore: 70,
    networkRisk: 25,
    imageRisk: 15,
    history: [
      { product: 'T-Shirt', category: 'Fashion', policy: 14, returnedOn: 13, amount: 1200, date: '2026-03-20' },
      { product: 'Jeans', category: 'Fashion', policy: 14, returnedOn: 5, amount: 2500, date: '2026-04-01' },
      { product: 'Coffee Maker', category: 'Electronics', policy: 7, returnedOn: 6, amount: 5000, date: '2026-04-10' }
    ],
    orders: [
      { id: 'ORD-301', product: 'Organic Avocados', category: 'Grocery', amount: '₹450', purchaseDate: '2026-04-27', policyDays: 3 },
      { id: 'ORD-302', product: 'Almonds 1kg', category: 'Grocery', amount: '₹800', purchaseDate: '2026-04-28', policyDays: 3 }
    ]
  },
  {
    id: 'CUST-004',
    name: 'Anjali Gupta',
    email: 'anjali@example.com',
    accountAgeDays: 200,
    totalOrders: 12,
    totalReturns: 1,
    totalSpend: 35000,
    previousFlags: 0,
    trustScore: 85,
    networkRisk: 10,
    imageRisk: 5,
    history: [],
    orders: [
      { id: 'ORD-401', product: 'Ray-Ban Aviators', category: 'Accessories', amount: '₹6,200', purchaseDate: '2026-04-20', policyDays: 10 },
      { id: 'ORD-402', product: 'Fossil Watch', category: 'Accessories', amount: '₹12,000', purchaseDate: '2026-04-25', policyDays: 10 }
    ]
  },
  {
    id: 'CUST-005',
    name: 'Amit Sharma',
    email: 'amit@example.com',
    accountAgeDays: 600,
    totalOrders: 25,
    totalReturns: 2,
    totalSpend: 85000,
    previousFlags: 0,
    trustScore: 90,
    networkRisk: 5,
    imageRisk: 5,
    history: [],
    orders: [
      { id: 'ORD-501', product: 'Sony WH-1000XM5', category: 'Electronics', amount: '₹28,000', purchaseDate: '2026-04-22', policyDays: 7 },
      { id: 'ORD-502', product: 'PS5 DualSense', category: 'Electronics', amount: '₹5,500', purchaseDate: '2026-04-26', policyDays: 7 }
    ]
  },
  {
    id: 'CUST-006',
    name: 'Priya Reddy',
    email: 'priya@example.com',
    accountAgeDays: 150,
    totalOrders: 8,
    totalReturns: 0,
    totalSpend: 12000,
    previousFlags: 0,
    trustScore: 80,
    networkRisk: 15,
    imageRisk: 10,
    history: [],
    orders: [
      { id: 'ORD-601', product: 'Zara Evening Dress', category: 'Fashion', amount: '₹4,500', purchaseDate: '2026-04-18', policyDays: 14 },
      { id: 'ORD-602', product: 'H&M Blazer', category: 'Fashion', amount: '₹3,500', purchaseDate: '2026-04-28', policyDays: 14 }
    ]
  },
  {
    id: 'CUST-007',
    name: 'Karan Malhotra',
    email: 'karan@example.com',
    accountAgeDays: 10,
    totalOrders: 2,
    totalReturns: 0,
    totalSpend: 200,
    previousFlags: 0,
    trustScore: 50,
    networkRisk: 40,
    imageRisk: 20,
    history: [],
    orders: [
      { id: 'ORD-701', product: 'Whole Wheat Bread', category: 'Grocery', amount: '₹60', purchaseDate: '2026-04-29', policyDays: 3 }
    ]
  },
  {
    id: 'CUST-008',
    name: 'Megha Jain',
    email: 'megha@example.com',
    accountAgeDays: 800,
    totalOrders: 35,
    totalReturns: 4,
    totalSpend: 120000,
    previousFlags: 0,
    trustScore: 88,
    networkRisk: 10,
    imageRisk: 5,
    history: [],
    orders: [
      { id: 'ORD-801', product: 'Leather Wallet', category: 'Accessories', amount: '₹1,500', purchaseDate: '2026-04-24', policyDays: 10 },
      { id: 'ORD-802', product: 'Gold Earrings', category: 'Accessories', amount: '₹15,000', purchaseDate: '2026-04-27', policyDays: 10 }
    ]
  },
  {
    id: 'CUST-009',
    name: 'Suresh Kumar',
    email: 'suresh@example.com',
    accountAgeDays: 1200,
    totalOrders: 50,
    totalReturns: 5,
    totalSpend: 300000,
    previousFlags: 0,
    trustScore: 96,
    networkRisk: 5,
    imageRisk: 0,
    history: [],
    orders: [
      { id: 'ORD-901', product: 'Samsung S23 Ultra', category: 'Electronics', amount: '₹1,10,000', purchaseDate: '2026-04-24', policyDays: 7 }
    ]
  },
  {
    id: 'CUST-100',
    name: 'Deepa Das',
    email: 'deepa@example.com',
    accountAgeDays: 300,
    totalOrders: 15,
    totalReturns: 2,
    totalSpend: 25000,
    previousFlags: 0,
    trustScore: 78,
    networkRisk: 20,
    imageRisk: 15,
    history: [],
    orders: [
      { id: 'ORD-1001', product: 'Floral Saree', category: 'Fashion', amount: '₹2,500', purchaseDate: '2026-04-19', policyDays: 14 }
    ]
  }
];

export const MOCK_PAST_CLAIMS = [
  { id: 'CLM-001', date: '2026-04-20', product: 'Bluetooth Speaker', category: 'Electronics', status: 'Approved', requestedOnDay: 2, customer: 'Rahul Verma' },
  { id: 'CLM-002', date: '2026-04-10', product: 'Denim Jacket', category: 'Fashion', status: 'Approved', requestedOnDay: 13, customer: 'Vikram Singh' },
  { id: 'CLM-003', date: '2026-04-25', product: 'Smart Watch', category: 'Electronics', status: 'Approved', requestedOnDay: 7, customer: 'Sneha Patel' }
];
