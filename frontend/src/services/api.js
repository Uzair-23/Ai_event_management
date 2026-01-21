// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  headers: { 'Content-Type': 'application/json' },
});


// Helper to wait for Clerk to initialize
const waitForClerk = () => {
  return new Promise((resolve) => {
    if (window?.Clerk?.loaded) {
      console.log('[API] Clerk already loaded');
      return resolve(window.Clerk);
    }
    
    console.log('[API] Waiting for Clerk to load...');
    const interval = setInterval(() => {
      if (window?.Clerk?.loaded) {
        clearInterval(interval);
        console.log('[API] Clerk loaded successfully');
        resolve(window.Clerk);
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.warn('[API] Clerk load timeout');
      resolve(null);
    }, 5000);
  });
};

API.interceptors.request.use(async (config) => {
  try {
    console.log(`[API] Request to: ${config.method.toUpperCase()} ${config.url}`);
    
    const clerk = await waitForClerk();
    
    if (!clerk) {
      console.warn('[API] Clerk not available');
      return config;
    }

    if (!clerk.session) {
      console.warn('[API] No active Clerk session');
      return config;
    }

    // Get the session token - try different methods
    let token = null;
    
    try {
      // Method 1: Try getting token with template (if you have one set up)
      token = await clerk.session.getToken({ template: 'short-lived-token' });
      console.log('[API] Got token with template');
    } catch (templateErr) {
      console.log('[API] Template method failed, trying default...');
      try {
        // Method 2: Try getting token without template
        token = await clerk.session.getToken();
        console.log('[API] Got token without template');
      } catch (defaultErr) {
        console.error('[API] Failed to get token:', defaultErr);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token attached to request, length:', token.length);
    } else {
      console.warn('[API] No token obtained');
    }
  } catch (err) {
    console.error('[API] Auth Interceptor Error:', err);
  }
  
  return config;
}, (error) => {
  console.error('[API] Request interceptor error:', error);
  return Promise.reject(error);
});

// Response interceptor for better error logging
API.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('[API] Response Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    } else if (error.request) {
      console.error('[API] Request Error: No response received');
    } else {
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;