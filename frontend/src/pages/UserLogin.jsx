import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as yup from 'yup';
import { loginRequest } from '../services/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { signInWithGoogle } from '../services/firebase.js';
import { Button, Divider, Box, Alert, Paper, Container } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import BlockIcon from '@mui/icons-material/Block';
import LoginIcon from '@mui/icons-material/Login';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

//  JWT decoder sa token
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Validation sa login yup gamit natin
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setErrors({});
    setLoading(true);
    
    try {
      // Validate form data
      await loginSchema.validate({ email, password }, { abortEarly: false });
      
      // Proceed with login
      const { token } = await loginRequest(email, password);
      setToken(token);
      
      // Decode token to check if user is admin
      const decoded = decodeJWT(token);
      if (decoded && decoded.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (e) {
      if (e.name === 'ValidationError') {
        // Handle Yup validation errors
        const validationErrors = {};
        e.inner.forEach(err => {
          validationErrors[err.path] = err.message;
        });
        setErrors(validationErrors);
      } else {
        // Check if it's a deactivation error
        if (e.message && e.message.includes('deactivated')) {
          setErrorCode('ACCOUNT_DEACTIVATED');
        }
        setError(e.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);

    try {
      // Sign in with Google popup
      const { idToken } = await signInWithGoogle();
      
      // Send the Firebase ID token to your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }

      // Set the JWT token from your backend
      setToken(data.token);
      
      // Decode token to check if user is admin
      const decoded = decodeJWT(data.token);
      if (decoded && decoded.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (e) {
      console.error('Google sign-in error:', e);
      setError(e.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper 
        elevation={8} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(18, 22, 26, 0.95) 0%, rgba(11, 13, 16, 0.98) 100%)',
          border: '1px solid rgba(110, 231, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #6ee7ff 0%, #4a9eff 100%)',
          }
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6ee7ff 0%, #4a9eff 100%)',
            mb: 2,
            boxShadow: '0 8px 24px rgba(110, 231, 255, 0.3)'
          }}>
            <LoginIcon sx={{ fontSize: 32, color: '#0b0d10' }} />
          </Box>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 600, color: '#fff' }}>Login</h1>
          <p style={{ color: '#999', marginTop: '8px', fontSize: '14px' }}>Welcome back to GGClicks</p>
        </Box>
      
      {searchParams.get('deactivated') === 'true' && (
        <Alert 
          severity="error" 
          icon={<BlockIcon />}
          sx={{ mb: 3, borderRadius: '8px' }}
        >
          <strong>Account Deactivated</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
            Your account has been deactivated by the administrator. Please contact support for assistance.
          </p>
        </Alert>
      )}
      <form className="form" onSubmit={onSubmit}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <EmailOutlinedIcon sx={{ 
            position: 'absolute', 
            left: 12, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#6ee7ff',
            fontSize: 20
          }} />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e)=>{setEmail(e.target.value); setErrors({...errors, email: ''});}} 
            style={{ 
              borderColor: errors.email ? '#ff8080' : 'rgba(110, 231, 255, 0.2)',
              paddingLeft: '44px',
              transition: 'all 0.3s ease',
              borderWidth: '2px'
            }}
          />
          {errors.email && <p className="muted" style={{color:'#ff8080', fontSize: '12px', marginTop: '4px'}}>{errors.email}</p>}
        </div>
        
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <LockOutlinedIcon sx={{ 
            position: 'absolute', 
            left: 12, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#6ee7ff',
            fontSize: 20
          }} />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e)=>{setPassword(e.target.value); setErrors({...errors, password: ''});}} 
            style={{ 
              borderColor: errors.password ? '#ff8080' : 'rgba(110, 231, 255, 0.2)',
              paddingLeft: '44px',
              transition: 'all 0.3s ease',
              borderWidth: '2px'
            }}
          />
          {errors.password && <p className="muted" style={{color:'#ff8080', fontSize: '12px', marginTop: '4px'}}>{errors.password}</p>}
        </div>
        
        {error && (
          errorCode === 'ACCOUNT_DEACTIVATED' ? (
            <Alert 
              severity="error" 
              icon={<BlockIcon />}
              sx={{ my: 2, borderRadius: '8px' }}
            >
              <strong>Account Deactivated</strong>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                Your account has been deactivated by the administrator. Please contact support for assistance.
              </p>
            </Alert>
          ) : (
            <p className="muted" style={{color:'#ff8080'}}>{error}</p>
          )
        )}
        <button 
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#555' : 'linear-gradient(135deg, #6ee7ff 0%, #4a9eff 100%)',
            border: 'none',
            color: '#0b0d10',
            fontWeight: 600,
            fontSize: '16px',
            padding: '14px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(110, 231, 255, 0.3)',
            transform: loading ? 'none' : 'translateY(0)',
          }}
          onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 6px 24px rgba(110, 231, 255, 0.4)')}
          onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 16px rgba(110, 231, 255, 0.3)')}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <Box sx={{ my: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Divider sx={{ flex: 1, borderColor: 'rgba(110, 231, 255, 0.2)' }} />
        <span style={{ color: '#6ee7ff', fontSize: '14px', fontWeight: 500 }}>OR</span>
        <Divider sx={{ flex: 1, borderColor: 'rgba(110, 231, 255, 0.2)' }} />
      </Box>

      <Button
        variant="outlined"
        fullWidth
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        sx={{
          py: 1.5,
          textTransform: 'none',
          fontSize: '16px',
          fontWeight: 500,
          borderColor: 'rgba(110, 231, 255, 0.3)',
          borderWidth: '2px',
          color: '#fff',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#6ee7ff',
            backgroundColor: 'rgba(110, 231, 255, 0.05)',
            borderWidth: '2px',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(110, 231, 255, 0.2)',
          },
          '&:disabled': {
            borderColor: 'rgba(110, 231, 255, 0.1)',
          }
        }}
      >
        {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
      </Button>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <p className="muted" style={{ fontSize: '14px', color: '#999', marginBottom: '12px' }}>
          Don't have an account?{' '}
          <Link 
            to="/register" 
            style={{ 
              color: '#6ee7ff', 
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Register
          </Link>
        </p>
        <p className="muted" style={{ fontSize: '14px', color: '#999' }}>
          <Link 
            to="/forgot-password"
            style={{ 
              color: '#6ee7ff', 
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Forgot password?
          </Link>
        </p>
      </Box>
      </Paper>
    </Container>
  );
}
