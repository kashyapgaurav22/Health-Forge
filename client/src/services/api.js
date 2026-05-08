import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Products API
export const getProducts = (params) => API.get('/products', { params });
export const getProduct = (id) => API.get(`/products/${id}`);
export const getCategories = () => API.get('/products/categories');

// Cart API
export const getCart = () => API.get('/cart');
export const addToCart = (product_id, quantity = 1) => API.post('/cart', { product_id, quantity });
export const updateCartItem = (id, quantity) => API.put(`/cart/${id}`, { quantity });
export const removeCartItem = (id) => API.delete(`/cart/${id}`);

// Payments API
export const createOrder = () => API.post('/payments/create-order');
export const verifyPayment = (data) => API.post('/payments/verify', data);
export const createManualOrder = () => API.post('/payments/create-manual-order');

export default API;
