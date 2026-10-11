import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle session expiry smoothly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 unauthorized and not on login page, clear local session state
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Event or redirect can be dispatched here
    }
    return Promise.reject(error);
  }
);
