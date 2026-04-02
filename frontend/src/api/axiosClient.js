import axios from "axios";

// Dev + empty env: same-origin `/api` → Vite proxy → http://127.0.0.1:5000 (works from phone on LAN).
// Set VITE_API_BASE_URL only when you need a direct API URL (e.g. production build).
const envUrl = import.meta.env.VITE_API_BASE_URL?.trim?.() ?? "";
const baseURL =
  envUrl ||
  (import.meta.env.DEV ? "" : "http://localhost:5000");

export const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error || error?.message || "Unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);
