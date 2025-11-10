// =============================================================================
// API CLIENT CONFIGURATION
// =============================================================================

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Methods
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (data: any) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const brandsApi = {
  getAll: () => api.get('/brands'),
  getById: (id: number) => api.get(`/brands/${id}`),
  create: (data: any) => api.post('/brands', data),
  update: (id: number, data: any) => api.put(`/brands/${id}`, data),
  delete: (id: number) => api.delete(`/brands/${id}`),
};

export const devicesApi = {
  getAll: (params?: any) => api.get('/devices', { params }),
  getById: (id: number) => api.get(`/devices/${id}`),
  create: (data: any) => api.post('/devices', data),
  update: (id: number, data: any) => api.put(`/devices/${id}`, data),
  delete: (id: number) => api.delete(`/devices/${id}`),
};

export const repairTypesApi = {
  getAll: (params?: any) => api.get('/repair-types', { params }),
  create: (data: any) => api.post('/repair-types', data),
  update: (id: number, data: any) => api.put(`/repair-types/${id}`, data),
  delete: (id: number) => api.delete(`/repair-types/${id}`),
};

export const partTypesApi = {
  getAll: () => api.get('/part-types'),
  create: (data: any) => api.post('/part-types', data),
  update: (id: number, data: any) => api.put(`/part-types/${id}`, data),
  delete: (id: number) => api.delete(`/part-types/${id}`),
};

export const customersApi = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: number) => api.get(`/customers/${id}`),
  search: (query: string) => api.post('/customers/search', { query }),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const ordersApi = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: number) => api.get(`/orders/${id}`),
  getStats: () => api.get('/orders/stats'),
  create: (data: any) => api.post('/orders', data),
  update: (id: number, data: any) => api.put(`/orders/${id}`, data),
  updateStatus: (id: number, status: string, notes?: string) =>
    api.patch(`/orders/${id}/status`, { status, notes }),
  cancel: (id: number) => api.delete(`/orders/${id}`),
};

export const pricingApi = {
  getAll: (params?: any) => api.get('/pricing', { params }),
  getMatrix: (params?: any) => api.get('/pricing/matrix', { params }),
  getById: (id: number) => api.get(`/pricing/${id}`),
  estimate: (deviceModelId: number, repairTypeId: number, partTypeId: number) =>
    api.get('/pricing/estimate', {
      params: { deviceModelId, repairTypeId, partTypeId },
    }),
  create: (data: any) => api.post('/pricing', data),
  update: (id: number, data: any) => api.put(`/pricing/${id}`, data),
  bulkUpsert: (prices: any[]) => api.post('/pricing/bulk', { prices }),
  delete: (id: number) => api.delete(`/pricing/${id}`),
};

export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getById: (id: number) => api.get(`/notifications/${id}`),
  send: (data: any) => api.post('/notifications/send', data),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: (params?: any) => api.get('/analytics/revenue', { params }),
  getRepairs: () => api.get('/analytics/repairs'),
  getCustomers: () => api.get('/analytics/customers'),
};

export default api;
