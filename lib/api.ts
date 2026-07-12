import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

// Tambahkan state antrean untuk menangani concurrent refresh token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: auto-refresh kalau dapat 401 dengan antrean
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
      // Jika proses refresh sedang berjalan, masukkan request ini ke antrean
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest); // jalankan kembali request asli
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios
          .post(
            `${BASE_URL}/api/admin/auth/refresh`,
            {},
            { withCredentials: true },
          )
          .then((res) => {
            const newToken = res.data?.data?.accessToken;
            if (newToken) {
              setAccessToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              processQueue(null, newToken); // bebaskan antrean
              resolve(api(originalRequest));
            } else {
              processQueue(
                new Error("Token refresh returned empty access token"),
              );
              reject(error);
            }
          })
          .catch((err) => {
            processQueue(err, null); // batalkan semua request di antrean
            setAccessToken(null);
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  },
);

export default api;
