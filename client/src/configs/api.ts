import axios from "axios";

const api = axios.create({
  // VITE_API_URL lets the client call the API directly.
  // When unset, production uses same-origin '/api' (proxied by client/vercel.json) and dev uses localhost:3000.
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/" : "http://localhost:3000"),
  withCredentials: true,
  timeout: 120_000, // image generation can take a while
});

// Pull a human-readable message out of any API error
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (!error.response) return "Cannot reach the server. Check your connection.";
    return error.response.data?.message || error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
};

export default api;
