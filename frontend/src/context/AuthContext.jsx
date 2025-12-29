import { createContext, useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';
import API from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ id: decoded.id, role: decoded.role });
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser({ id: data.user.id, role: data.user.role, name: data.user.name });
    return data;
  };

  const register = async (payload) => {
    const { data } = await API.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    setUser({ id: data.user.id, role: data.user.role, name: data.user.name });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};