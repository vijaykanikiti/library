import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint) {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials) => {
    const res = await api.post("/auth/login", credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
  },
  googleLogin: async ({ email, name, idToken }) => {
    const res = await api.post("/auth/google", { email, name, idToken });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
  logout: async () => {
    try {
      const res = await api.post("/auth/logout");
      return res.data;
    } catch {
      return { message: "Logged out" };
    }
  },
  verifyOtp: async (data) => {
    const res = await api.post("/auth/verify-otp", data);
    return res.data;
  },
  resendOtp: async (data) => {
    const res = await api.post("/auth/resend-otp", data);
    return res.data;
  },
};

export const booksApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/books", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/books/${id}`);
    return res.data;
  },
  getFeatured: async () => {
    const res = await api.get("/books/featured");
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get("/books/categories");
    return res.data;
  },
  create: async (bookData) => {
    const res = await api.post("/books", bookData);
    return res.data;
  },
  update: async (id, bookData) => {
    const res = await api.put(`/books/${id}`, bookData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/books/${id}`);
    return res.data;
  },
};

export const loansApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/loans", { params });
    return res.data;
  },
  getMyActive: async () => {
    const res = await api.get("/loans/my-active");
    return res.data;
  },
  getMyHistory: async (page = 0, size = 10) => {
    const res = await api.get("/loans/history", { params: { page, size } });
    return res.data;
  },
  issue: async (data) => {
    const res = await api.post("/loans/issue", data);
    return res.data;
  },
  returnBook: async (loanId) => {
    const res = await api.post(`/loans/${loanId}/return`);
    return res.data;
  },
  renew: async (loanId) => {
    const res = await api.post(`/loans/${loanId}/renew`);
    return res.data;
  },
};

export const reserveApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/reservations", { params });
    return res.data;
  },
  getMy: async () => {
    const res = await api.get("/reservations/my");
    return res.data;
  },
  reserve: async (bookId) => {
    const res = await api.post("/reservations", { bookId });
    return res.data;
  },
  cancel: async (reserveId) => {
    const res = await api.post(`/reservations/${reserveId}/cancel`);
    return res.data;
  },
};

export const finesApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/fines", { params });
    return res.data;
  },
  getMy: async () => {
    const res = await api.get("/fines/my");
    return res.data;
  },
  recordPayment: async (fineId, data) => {
    const res = await api.post(`/fines/${fineId}/record-payment`, data);
    return res.data;
  },
};

export const userApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/users", { params });
    return res.data;
  },
  getMembers: async (query = "") => {
    const res = await api.get("/users/members", { params: { query } });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  updateProfile: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  updateStatus: async (id, statusData) => {
    const res = await api.patch(`/users/${id}/status`, statusData);
    return res.data;
  },
};

export const reportApi = {
  getDashboardStats: async () => {
    const res = await api.get("/reports/dashboard");
    return res.data;
  },
  getIssued: async (startDate, endDate) => {
    const res = await api.get("/reports/issued", {
      params: { startDate, endDate },
    });
    return res.data;
  },
  getReturned: async (startDate, endDate) => {
    const res = await api.get("/reports/returned", {
      params: { startDate, endDate },
    });
    return res.data;
  },
  getOverdue: async () => {
    const res = await api.get("/reports/overdue");
    return res.data;
  },
  getPopular: async (limit = 10) => {
    const res = await api.get("/reports/popular", { params: { limit } });
    return res.data;
  },
  getFines: async (startDate, endDate) => {
    const res = await api.get("/reports/fines", {
      params: { startDate, endDate },
    });
    return res.data;
  },
};

export const adminApi = {
  getSettings: async () => {
    const res = await api.get("/admin/settings");
    return res.data;
  },
  updateSetting: async (key, data) => {
    const res = await api.put(`/admin/settings/${key}`, data);
    return res.data;
  },
  getAuditLogs: async (params = {}) => {
    const res = await api.get("/admin/audit-logs", { params });
    return res.data;
  },
  runOverdueCheck: async () => {
    const res = await api.post("/admin/run-overdue-check");
    return res.data;
  },
};

export default api;