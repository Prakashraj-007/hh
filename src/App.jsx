import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import CustomerDashboard from './pages/customer/Dashboard';
import ReturnForm from './pages/customer/ReturnForm';
import Shop from './pages/customer/Shop';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/customer/login" element={<Login />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/shop" element={<Shop />} />
        <Route path="/customer/return" element={<ReturnForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
