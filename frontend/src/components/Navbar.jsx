import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { Badge, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function Navbar() {
  const { token, setToken, isAuthed, userInfo } = useAuth();
  const { getCartCount } = useCart();

  function logout() {
    setToken('');
  }

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">GGClicks</Link>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/catalog">Catalog</NavLink>
          {isAuthed ? (
            <>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/orders">Orders</NavLink>
              {/* show user's name if available, fallback to email */}
              <span className="muted" style={{ marginLeft: 12 }}>{userInfo?.name || userInfo?.email || 'Welcome!'}</span>
              {userInfo?.role === 'admin' && (
                <>
                  <NavLink to="/admin">Admin</NavLink>
                  <NavLink to="/admin/orders">Orders</NavLink>
                </>
              )}
              <IconButton 
                component={Link} 
                to="/cart" 
                color="inherit"
                sx={{ ml: 1 }}
              >
                <Badge badgeContent={getCartCount()} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              <button onClick={logout} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer'}}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
              <IconButton 
                component={Link} 
                to="/cart" 
                color="inherit"
                sx={{ ml: 1 }}
              >
                <Badge badgeContent={getCartCount()} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


