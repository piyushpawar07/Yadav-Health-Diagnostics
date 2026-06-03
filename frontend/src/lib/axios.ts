import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yadav-health-diagnostics.onrender.com';

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
