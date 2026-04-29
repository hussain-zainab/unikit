import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach token ───────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('unikit_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('unikit_token');
      await AsyncStorage.removeItem('unikit_user');
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  setPassword: (userId, password) => api.post('/auth/set-password', { userId, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
};

// ─── Batches ──────────────────────────────────────────────────────────────────
export const batchService = {
  getAll: () => api.get('/batches'),
  getById: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  addStudent: (batchId, userId) => api.post(`/batches/${batchId}/add-student`, { userId }),
  removeStudent: (batchId, userId) => api.post(`/batches/${batchId}/remove-student`, { userId }),
  addTeacher: (batchId, userId) => api.post(`/batches/${batchId}/add-teacher`, { userId }),
  setLock: (batchId, lock, password) =>
    api.post(`/batches/${batchId}/lock`, { lock, password }),
  verifyLock: (batchId, password) =>
    api.post(`/batches/${batchId}/verify-lock`, { password }),
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcementService = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceService = {
  startSession: (batchId, subject, date) =>
    api.post('/attendance/start', { batchId, subject, date }),
  markStudent: (sessionId, studentId, status) =>
    api.post(`/attendance/${sessionId}/mark`, { studentId, status }),
  submitSession: (sessionId) => api.post(`/attendance/${sessionId}/submit`),
  getBatchSessions: (batchId, params) =>
    api.get(`/attendance/batch/${batchId}`, { params }),
  getBatchStats: (batchId) => api.get(`/attendance/stats/${batchId}`),
  getStudentStats: (studentId) => api.get(`/attendance/student/${studentId}`),
  getReport: (batchId) => api.get(`/attendance/report/${batchId}`),
};

// ─── Timetable ────────────────────────────────────────────────────────────────
export const timetableService = {
  getAll: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  delete: (id) => api.delete(`/timetable/${id}`),
};

// ─── Complaints ───────────────────────────────────────────────────────────────
export const complaintService = {
  getAll: () => api.get('/complaints'),
  create: (data) => api.post('/complaints', data),
  respond: (id, data) => api.put(`/complaints/${id}/respond`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
};
