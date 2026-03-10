import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('microwave_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('backend-offline'));
    }
    return Promise.reject(error);
  }
);
