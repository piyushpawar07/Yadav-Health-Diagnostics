import axios from 'axios';

const API_BASE_URL_RAW = String(import.meta.env.VITE_API_URL || '');
const API_BASE_URL = API_BASE_URL_RAW
  .replace(/\/+$|\s+/g, '')
  .replace(/\/api(?:\/.*)?$/, '');

// Debug: log resolved API base URL at runtime (built into the frontend bundle)
console.log('API_BASE_URL (resolved):', API_BASE_URL);

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically inject authorization token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yadav_diagnostics_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data) {
      return Promise.reject(error);
    }
    return Promise.reject({
      ...error,
      message: error.message || 'Network or server error',
    });
  }
);

export default axiosClient;
