const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

export const STORE_URL = isProduction 
  ? 'https://health-forge-user.vercel.app' // User should replace this with their actual Vercel URL
  : 'http://localhost:5173';

export const API_BASE_URL = isProduction 
  ? 'https://health-forge.onrender.com/api' 
  : 'http://localhost:5000/api';
