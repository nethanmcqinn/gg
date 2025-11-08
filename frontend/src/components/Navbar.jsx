import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { token, setToken, isAuthed, userInfo } = useAuth();

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
              <span className="muted">{userInfo?.email || 'Welcome!'}</span>
              {userInfo?.role === 'admin' && (
                <NavLink to="/admin">Admin</NavLink>
              )}
              <button onClick={logout} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer'}}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


