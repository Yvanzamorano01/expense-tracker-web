import axios from 'axios';

// Base API configuration - uses environment variable for production (Render)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token if exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => {
    // Return the data directly from successful responses
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      console.error('API Error:', message);
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error: Backend server is not responding');
      throw new Error('Cannot connect to the server. Please make sure the backend is running.');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      throw new Error(error.message);
    }
  }
);

export default apiClient;
