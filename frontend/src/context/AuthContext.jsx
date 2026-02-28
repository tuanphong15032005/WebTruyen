// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});

const defaultUser = {
  id: 1,
  name: 'Author Demo',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(defaultUser);

  const login = (mockUser) => {
    setUser(mockUser || defaultUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
