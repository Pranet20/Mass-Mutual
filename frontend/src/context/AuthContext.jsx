import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Always initialize user as null on app launch so Sign In modal pops up first
  const [user, setUser] = useState(null);

  // Set up global Axios interceptor for JWT Bearer token propagation
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      if (user?.access_token) {
        config.headers.Authorization = `Bearer ${user.access_token}`;
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

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
