import axios from 'axios';
import config from '../config/config';

const client = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If unauthorized, redirect to login
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Redirecting to login.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Force reload to trigger AuthContext reset and private route redirection
      window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default client;
