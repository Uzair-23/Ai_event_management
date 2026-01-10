import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// attach token from Clerk session (async) with retry and wait for Clerk/session readiness
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getClerkTokenWithRetry(maxRetries = 5, baseDelay = 200) {
  // wait for Clerk and session to be available (in case Clerk is still initializing)
  const waitForClerkReady = async (maxWaitRounds = 5) => {
    let round = 0;
    while (round < maxWaitRounds && (!window?.Clerk || !window?.Clerk?.session)) {
      await sleep(baseDelay);
      round += 1;
    }
    return !!(window?.Clerk && window?.Clerk?.session && typeof window.Clerk.session.getToken === 'function');
  };

  const ready = await waitForClerkReady();
  if (!ready) {
    if (import.meta.env.DEV) console.warn('[API] window.Clerk.session.getToken not available after waiting');
    return null;
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const token = await window.Clerk.session.getToken({ forceRefresh: false });
      return token || null;
    } catch (err) {
      attempt += 1;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      if (import.meta.env.DEV) console.warn(`[API] getToken attempt ${attempt} failed; retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  if (import.meta.env.DEV) console.warn('[API] Failed to retrieve Clerk token after retries');
  return null;
}

API.interceptors.request.use(async (config) => {
  try {
    const token = await getClerkTokenWithRetry();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // no token found; allow public routes to proceed but warn in dev
      if (import.meta.env.DEV) console.warn('[API] No Clerk session token found; proceeding without Authorization header');
    }
  } catch (err) {
    console.warn('[API] Error retrieving Clerk token:', err);
  }
  return config;
}, (error) => Promise.reject(error));

export default API;