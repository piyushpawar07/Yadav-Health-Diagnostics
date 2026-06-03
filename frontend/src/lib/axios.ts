import axios from 'axios';

// Get the base API URL from environment variables, defaulting to current origin (same-port hosting)
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '';
  
  // If we are running in a Cloud dev/production environment (e.g. google Cloud Run) 
  // but VITE_API_URL is configured to point to local port 5000, ignore it so relative 
  // paths to the actual active workspace port (3000) are used instead.
  if (envUrl.includes('localhost:') || envUrl.includes('127.0.0.1:')) {
    if (typeof window !== 'undefined' && !window.location.host.includes('localhost') && !window.location.host.includes('127.0.0.1')) {
      return '';
    }
  }
  return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

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
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
