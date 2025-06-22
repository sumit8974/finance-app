import axios from 'axios';
import { getToken, removeToken } from '../utils/token';

const apiUrl = import.meta.env.VITE_API_URL;
console.log('API URL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl, // Replace with your API base URL
  timeout: 30000, // Request timeout
  withCredentials: false,
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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
