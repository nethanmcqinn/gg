import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('No reset token provided');
    }
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage('');
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Password reset successfully! You can now login.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage(data.message || 'Password reset failed');
      }
    } catch (e) {
      setMessage('Password reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section>
        <h1>Reset Password</h1>
        <p className="muted">{message}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Reset Password</h1>
      <form className="form" onSubmit={onSubmit}>
        <input type="password" placeholder="New Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
        {message && <p className="muted" style={{color: message.includes('successfully') ? '#80ff80' : '#ff8080'}}>{message}</p>}
        <button disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
      </form>
    </section>
  );
}
