import axios, { AxiosResponse } from "axios";
import { STATUS } from "@/constants/status";
import { useLogoutUser } from "@/utils/authHelpers";

type RuntimeConfig = {
  BASE_URL: string;
};

// Fallbacks: primero runtime (config.js), luego Vite env, luego CRA env, luego localhost
const baseUrl =
  (window as any).__APP_CONFIG__?.BASE_URL ??
  (import.meta as any)?.env?.VITE_API_BASE_URL ??
  (process?.env as any)?.REACT_APP_API_BASE_URL ??
  "https://localhost:44330";

export const api = axios.create({
  baseURL: `${baseUrl}/api`,
  withCredentials: true,
  timeout: 1500000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de solicitud: adjunta el token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accesToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de respuesta
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const originalRequest = error.config;

    // TIMEOUT
    if (error.code === "ECONNABORTED") {
      console.warn("⏱ Timeout excedido");
      return Promise.reject(error);
    }

    // NETWORK ERROR sin respuesta
    if (!error.response) {
      console.warn("🌐 Network error without response");
      return Promise.reject(error);
    }

    // 401 → cerrar sesión
    if (error.response.status === STATUS.UNAUTHORIZED) {
      useLogoutUser()();
      return Promise.reject(error);
    }

    // 403 → posible renovación de token
    if (
      error.response.status === STATUS.TOKEN_REFRESH_REQUIRED &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      const nuevoToken = error.response?.data?.resultado?.[0]?.accesToken;
      if (nuevoToken) {
        console.info("🔁 Token renovado automáticamente");
        localStorage.setItem("accesToken", nuevoToken);
        (originalRequest as any).headers.Authorization = `Bearer ${nuevoToken}`;
        return api(originalRequest); // 🔁 Reintenta la petición original
      }
    }

    return Promise.reject(error);
  },
);
