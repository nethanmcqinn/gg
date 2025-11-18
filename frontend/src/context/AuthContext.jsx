import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// Simple JWT decoder (just to get payload, no verification needed on client)
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

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gg_user_token') || '');
  const [userInfo, setUserInfo] = useState(null);
  const [isDeactivated, setIsDeactivated] = useState(false);

  // Decode token and extract user info
  useEffect(() => {
    const syncUser = async () => {
      if (!token) {
        localStorage.removeItem('gg_user_token');
        setUserInfo(null);
        setIsDeactivated(false);
        return;
      }

      localStorage.setItem('gg_user_token', token);
      const decoded = decodeJWT(token);

      // Try to fetch authoritative profile from server so that profile edits persist across sessions
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const me = await res.json();
          
          // Check if user is deactivated
          if (me.isActive === false) {
            setIsDeactivated(true);
            // Auto logout
            setToken('');
            localStorage.removeItem('gg_user_token');
            setUserInfo(null);
            return;
          }
          
          setIsDeactivated(false);
          setUserInfo({
            id: me._id || me.id || (decoded && decoded.id),
            email: me.email || (decoded && decoded.email),
            name: me.name || (decoded && (decoded.name || (decoded.email ? decoded.email.split('@')[0] : ''))),
            role: me.role || (decoded && decoded.role),
            isAdmin: (me.role || (decoded && decoded.role)) === 'admin',
            photoUrl: me.photoUrl || undefined,
          });
          return;
        }
      } catch (e) {
        // network error or unauthorized - fall back to token-derived info
        console.warn('Failed to fetch /api/users/me, falling back to token payload', e.message || e);
      }

      if (decoded) {
        setUserInfo({
          id: decoded.id,
          email: decoded.email,
          name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : ''),
          role: decoded.role,
          isAdmin: decoded.role === 'admin',
        });
      }
    };

    syncUser();
  }, [token]);

  // Check user status periodically (every 30 seconds) when user is logged in
  useEffect(() => {
    if (!token) return;

    const checkUserStatus = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/users/me`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (!res.ok) {
          // Token is invalid, logout
          setToken('');
          localStorage.removeItem('gg_user_token');
          setUserInfo(null);
          setIsDeactivated(false);
          return;
        }

        const me = await res.json();
        
        // If user is deactivated, auto-logout
        if (me.isActive === false) {
          setIsDeactivated(true);
          setToken('');
          localStorage.removeItem('gg_user_token');
          setUserInfo(null);
          window.location.href = '/login?deactivated=true';
          return;
        }
        
        setIsDeactivated(false);
      } catch (e) {
        console.warn('Failed to check user status:', e.message);
      }
    };

    // Check immediately on focus
    window.addEventListener('focus', checkUserStatus);
    
    // Also check periodically every 30 seconds
    const interval = setInterval(checkUserStatus, 30000);

    return () => {
      window.removeEventListener('focus', checkUserStatus);
      clearInterval(interval);
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      setToken,
      isAuthed: !!token && !isDeactivated,
      isDeactivated,
      // keep backwards-compatible names: `user` and `userInfo`
      user: userInfo,
      userInfo,
      // allow components to update the cached user info (e.g. after profile edits)
      setUserInfo,
    }),
    [token, userInfo, isDeactivated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


