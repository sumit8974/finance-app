import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // Replace with your API base URL
  timeout: 10000, // Request timeout
  withCredentials: false,
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  console.log('Token:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Request Config:', config);
  return config;
});

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
