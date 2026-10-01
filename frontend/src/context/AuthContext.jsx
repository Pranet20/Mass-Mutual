import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage if previously authenticated session exists
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (activeToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
      }
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Validate session against /api/auth/me on initial app load
  useEffect(() => {
    const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (activeToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
      axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
      .then((res) => {
        setUser((prev) => ({
          ...(prev || {}),
          ...res.data,
          access_token: activeToken
        }));
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          console.warn('Session expired or invalid, clearing stale credentials.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      });
    }
  }, []);

  // Set up global Axios interceptors for JWT Bearer token propagation and 401 auto-logout
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Stale, expired, or invalid JWT detected: purge storage and show LoginModal
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const userData = res.data;
    if (userData.access_token) {
      localStorage.setItem('access_token', userData.access_token);
      localStorage.setItem('token', userData.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
    }
    setUser(userData);
    return userData;
  };

  const signup = async (email, password, name, role = 'employee', employee_id = null, business_unit = 'Global Technology', department = 'Software Engineering', designation = 'Senior Engineer') => {
    const res = await axios.post('/api/auth/signup', { 
      email, 
      password, 
      name, 
      role, 
      employee_id,
      business_unit,
      department,
      designation
    });
    const userData = res.data;
    if (userData.access_token) {
      localStorage.setItem('access_token', userData.access_token);
      localStorage.setItem('token', userData.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
    }
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
