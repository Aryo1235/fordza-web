import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Simpan access token di memory (bukan localStorage — lebih aman dari XSS)
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Axios instance dengan base config
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // kirim cookie secara otomatis (refresh token)
});

// Request interceptor: tambahkan access token ke setiap request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh kalau dapat 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Kalau 401 dan belum pernah retry
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // Coba refresh token (pakai cookie httpOnly refresh_token otomatis)
        const res = await axios.post(
          `${BASE_URL}/api/admin/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data?.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest); // retry request original
        }
      } catch {
        // Refresh gagal → logout
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
