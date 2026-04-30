import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import CustomerDashboard from './pages/customer/Dashboard';
import ReturnForm from './pages/customer/ReturnForm';
import Shop from './pages/customer/Shop';
import AdminDashboard from './pages/admin/Dashboard';
import BehavioralDeepDive from './pages/admin/BehavioralDeepDive';
import VisionDeepDive from './pages/admin/VisionDeepDive';
import NetworkDeepDive from './pages/admin/NetworkDeepDive';
import ChatDeepDive from './pages/admin/ChatDeepDive';
import PrePurchaseDeepDive from './pages/admin/PrePurchaseDeepDive';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/customer/login" element={<Login />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/shop" element={<Shop />} />
        <Route path="/customer/return" element={<ReturnForm />} />
        
        {/* Admin Portal Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/behavioral" element={<BehavioralDeepDive />} />
        <Route path="/admin/vision" element={<VisionDeepDive />} />
        <Route path="/admin/network" element={<NetworkDeepDive />} />
        <Route path="/admin/chats" element={<ChatDeepDive />} />
        <Route path="/admin/prepurchase" element={<PrePurchaseDeepDive />} />
      </Routes>
    </Router>
  );
}

export default App;
