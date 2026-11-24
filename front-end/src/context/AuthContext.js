import { API_BASE_URL } from '../apiBase.js';
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    id: null,
    name: '',
    role: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          const response = await axios.get(`${API_BASE_URL}/verify-token`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAuthState({
            isAuthenticated: true,
            id: response.data.id,
            name: response.data.name,
            role: response.data.role
          });

        }
      } catch {
        setAuthState({
          isAuthenticated: false,
          id: null,
          name: '',
          role: ''
        });
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
