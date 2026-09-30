import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage if previously authenticated session exists
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Set up global Axios interceptor for JWT Bearer token propagation
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const activeToken = user?.access_token || localStorage.getItem('access_token') || localStorage.getItem('token');
      if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [user]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const userData = res.data;
    if (userData.access_token) {
      localStorage.setItem('access_token', userData.access_token);
      localStorage.setItem('token', userData.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
    return userData;
  };

  const signup = async (email, password, name, role, employee_id) => {
    const res = await axios.post('/api/auth/signup', { email, password, name, role, employee_id });
    const userData = res.data;
    if (userData.access_token) {
      localStorage.setItem('access_token', userData.access_token);
      localStorage.setItem('token', userData.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
    return userData;
  };

  const googleLogin = async (email, name) => {
    const res = await axios.post('/api/auth/google', { email, name });
    const userData = res.data;
    if (userData.access_token) {
      localStorage.setItem('access_token', userData.access_token);
      localStorage.setItem('token', userData.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
