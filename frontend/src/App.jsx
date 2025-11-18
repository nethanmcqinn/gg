import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Product from './pages/Product.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminMice from './pages/AdminMice.jsx';
import AdminReviews from './pages/AdminReviews.jsx';
import AdminBrands from './pages/AdminBrands.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import UserLogin from './pages/UserLogin.jsx';
import UserRegister from './pages/UserRegister.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Profile from './pages/Profile.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6ee7ff' },
    background: { default: '#0b0d10', paper: '#12161a' },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Admin Routes - Separate Layout (No Navbar/Footer) */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}>
            <Route path="dashboard" element={null} />
            <Route path="mice" element={<AdminMice />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Main Store Routes - With Navbar/Footer */}
          <Route path="*" element={
            <div className="app">
              <Navbar />
              <main className="container">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:slug" element={<Product />} />
                  <Route path="/login" element={<UserLogin />} />
                  <Route path="/register" element={<UserRegister />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                </Routes>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}


