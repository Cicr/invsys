import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';

// Service URLs (could be environmental variables in production)
const AUTH_URL = 'http://localhost:3001';
const PRODUCT_URL = 'http://localhost:3002';
const INVENTORY_URL = 'http://localhost:8080/api/v1';

export const authApi = axios.create({ baseURL: AUTH_URL });
export const productApi = axios.create({ baseURL: PRODUCT_URL });
export const inventoryApi = axios.create({ baseURL: INVENTORY_URL });

// Interceptor to add Auth Token
const addTokenInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

authApi.interceptors.request.use(addTokenInterceptor);
productApi.interceptors.request.use(addTokenInterceptor);
inventoryApi.interceptors.request.use(addTokenInterceptor);

// Interceptor to handle errors globally
const errorInterceptor = async (error: unknown) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  if (axiosError.response?.status === 401) {
    // Optional: Add logic to attempt token refresh
    // For now, clear storage and redirect
    localStorage.removeItem('access_token');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
};

authApi.interceptors.response.use((r) => r, errorInterceptor);
productApi.interceptors.response.use((r) => r, errorInterceptor);
inventoryApi.interceptors.response.use((r) => r, errorInterceptor);
