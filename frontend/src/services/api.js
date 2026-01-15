// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Helper to wait for Clerk to initialize if needed
const waitForClerk = () => {
  return new Promise((resolve) => {
    if (window?.Clerk?.loaded) return resolve(window.Clerk);
    const interval = setInterval(() => {
      if (window?.Clerk?.loaded) {
        clearInterval(interval);
        resolve(window.Clerk);
      }
    }, 100);
    // Timeout after 3 seconds to prevent infinite hang
    setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, 3000);
  });
};

API.interceptors.request.use(async (config) => {
  try {
    const clerk = await waitForClerk();
    
    // Pass the name of the template you created in your Clerk Dashboard
    const token = await clerk?.session?.getToken({ template: 'short-lived-token' });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (import.meta.env.DEV) {
      console.warn('[API] No token found; request may be unauthenticated');
    }
  } catch (err) {
    console.error('[API] Auth Interceptor Error:', err);
  }
  return config;
}, (error) => Promise.reject(error));

export default API;