import axios from 'axios';

const IS_BROWSER = typeof window !== 'undefined';
// In browser, rewrite rules route /api to the backend.
const BASE_URL = IS_BROWSER ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://api:8000');

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  if (IS_BROWSER) {
    const token = localStorage.getItem('vf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
