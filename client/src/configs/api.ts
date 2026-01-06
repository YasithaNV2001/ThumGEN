import axios from "axios";

const api = axios.create({
  // If we are in Production (Vercel), use the current domain ('/')
  // If we are in Development (Localhost), use port 3000
  baseURL: import.meta.env.PROD ? '/' : 'http://localhost:3000',
  withCredentials: true,
});

export default api;