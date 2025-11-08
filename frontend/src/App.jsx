import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Product from './pages/Product.jsx';
import AdminLanding from './pages/Admin.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminMice from './pages/AdminMice.jsx';
import AdminReviews from './pages/AdminReviews.jsx';
import UserLogin from './pages/UserLogin.jsx';
import UserRegister from './pages/UserRegister.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Profile from './pages/Profile.jsx';

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
        <div className="app">
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:slug" element={<Product />} />
              <Route path="/admin" element={<AdminLanding />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/mice" element={<AdminMice />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/register" element={<UserRegister />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}


