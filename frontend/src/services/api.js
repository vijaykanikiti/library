import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const booksApi = {
  getAll: async (params = {}) => {
    const res = await apiClient.get("/books", { params });
    return res.data;
  },
  getFeatured: async () => {
    const res = await apiClient.get("/books/featured");
    return res.data;
  },
  getCategories: async () => {
    const res = await apiClient.get("/books/categories");
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/books/${id}`);
    return res.data;
  },
};

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post("/auth/login", credentials);
    if (res.data?.token) {
      localStorage.setItem("auth_token", res.data.token);
    }
    return res.data;
  },
  register: async (data) => {
    const res = await apiClient.post("/auth/register", data);
    return res.data;
  },
  googleLogin: async ({ email, name, idToken }) => {
    const res = await apiClient.post("/auth/google", { email, name, idToken });
    if (res.data?.token) {
      localStorage.setItem("auth_token", res.data.token);
    }
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    try {
      await apiClient.post("/auth/logout");
    } catch {}
  },
};

export default apiClient;