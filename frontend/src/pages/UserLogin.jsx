import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginRequest } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await loginRequest(email, password);
      setToken(token);
      navigate('/');
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Login</h1>
      <form className="form" onSubmit={onSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        {error && <p className="muted" style={{color:'#ff8080'}}>{error}</p>}
        <button disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <p className="muted">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
      <p className="muted">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </section>
  );
}
