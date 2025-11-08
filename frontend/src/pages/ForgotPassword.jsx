import { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Password reset email sent! Check your inbox.');
        setEmail('');
      } else {
        setMessage(data.message || 'Failed to send reset email');
      }
    } catch (e) {
      setMessage('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Forgot Password</h1>
      <form className="form" onSubmit={onSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        {message && <p className="muted" style={{color: message.includes('sent') ? '#80ff80' : '#ff8080'}}>{message}</p>}
        <button disabled={loading}>{loading ? 'Sending...' : 'Send Reset Email'}</button>
      </form>
      <p className="muted">
        <Link to="/login">Back to Login</Link>
      </p>
    </section>
  );
}
