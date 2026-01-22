// AuthContext.js
import React, { createContext, useState } from 'react';

export const AuthContext = createContext({
  token: null,
  role: null,
  isLoggedIn: false,
  login: (token, role) => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  const login = (jwt, userRole) => {
    setToken(jwt);
    setRole(userRole);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        isLoggedIn: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
