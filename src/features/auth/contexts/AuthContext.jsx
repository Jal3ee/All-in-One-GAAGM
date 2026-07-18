import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/apiAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setLoading(false);
    };

    loadUser();

    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener('authStateChange', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
