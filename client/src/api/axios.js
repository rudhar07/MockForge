import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Global 401 handler. When a token is missing/expired/invalid, the backend
// returns 401. Instead of letting each page render a scary "unavailable" card,
// we clear the stale session and bounce to /login, leaving a one-time flag the
// Login page reads to show a "session expired" toast.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Never trigger the expired-session flow for the auth calls themselves —
    // a 401 there means "wrong credentials", which the page surfaces inline.
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');
    const onAuthPage =
      window.location.pathname === '/login' || window.location.pathname === '/register';

    if (status === 401 && !isAuthRoute && !onAuthPage) {
      localStorage.removeItem('userInfo');
      sessionStorage.setItem('sessionExpired', '1');
      window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

export default API;
