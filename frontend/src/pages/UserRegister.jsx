import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as yup from 'yup';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Validation schema
const registerSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must not exceed 50 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function UserRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setErrors({});
    setSuccess('');
    
    setLoading(true);
    try {
      // Validate form data
      await registerSchema.validate(
        { email, password, confirmPassword }, 
        { abortEarly: false }
      );
      
      // Proceed with registration
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setSuccess(data.message);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (e) {
      if (e.name === 'ValidationError') {
        // Handle Yup validation errors
        const validationErrors = {};
        e.inner.forEach(err => {
          validationErrors[err.path] = err.message;
        });
        setErrors(validationErrors);
      } else {
        setError(e.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Register</h1>
      <form className="form" onSubmit={onSubmit}>
        <div>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e)=>{setEmail(e.target.value); setErrors({...errors, email: ''});}} 
            style={{ borderColor: errors.email ? '#ff8080' : '' }}
          />
          {errors.email && <p className="muted" style={{color:'#ff8080', fontSize: '12px', marginTop: '4px'}}>{errors.email}</p>}
        </div>
        
        <div>
          <input 
            type="password" 
            placeholder="Password (min 6 characters)" 
            value={password} 
            onChange={(e)=>{setPassword(e.target.value); setErrors({...errors, password: ''});}} 
            style={{ borderColor: errors.password ? '#ff8080' : '' }}
          />
          {errors.password && <p className="muted" style={{color:'#ff8080', fontSize: '12px', marginTop: '4px'}}>{errors.password}</p>}
        </div>
        
        <div>
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e)=>{setConfirmPassword(e.target.value); setErrors({...errors, confirmPassword: ''});}} 
            style={{ borderColor: errors.confirmPassword ? '#ff8080' : '' }}
          />
          {errors.confirmPassword && <p className="muted" style={{color:'#ff8080', fontSize: '12px', marginTop: '4px'}}>{errors.confirmPassword}</p>}
        </div>
        
        {error && <p className="muted" style={{color:'#ff8080'}}>{error}</p>}
        {success && <p className="muted" style={{color:'#80ff80'}}>{success}</p>}
        <button disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
