import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setMessage('No verification token provided');
    }
  }, [token]);

  async function verifyEmail() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Email verified successfully! You can now login.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage(data.message || 'Verification failed');
      }
    } catch (e) {
      setMessage('Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Email Verification</h1>
      {loading ? (
        <p>Verifying your email...</p>
      ) : (
        <p className="muted">{message}</p>
      )}
    </section>
  );
}
