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

  // Decode token and extract user info
  useEffect(() => {
    if (token) {
      localStorage.setItem('gg_user_token', token);
      const decoded = decodeJWT(token);
      if (decoded) {
        setUserInfo({
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          isAdmin: decoded.role === 'admin',
        });
      }
    } else {
      localStorage.removeItem('gg_user_token');
      setUserInfo(null);
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      setToken,
      isAuthed: !!token,
      // keep backwards-compatible names: `user` and `userInfo`
      user: userInfo,
      userInfo,
    }),
    [token, userInfo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


