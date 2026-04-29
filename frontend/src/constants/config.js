// ─── APP CONFIGURATION ────────────────────────────────────────────────────────
// Change APP_NAME here to rebrand the app instantly
export const APP_NAME = 'Unikit';
export const APP_TAGLINE = 'University Management System';

// ─── API ──────────────────────────────────────────────────────────────────────
// Change this to your backend IP/URL when deploying
export const API_BASE_URL = 'http://192.168.0.2:5000/api';

// ─── COLORS ───────────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#1A56DB',
  primaryLight: '#EBF0FF',
  primaryDark: '#1240A8',
  secondary: '#7C3AED',
  secondaryLight: '#F3EEFF',
  accent: '#0EA5E9',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  white: '#FFFFFF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  divider: '#F1F5F9',
};

// ─── ROLE COLORS ──────────────────────────────────────────────────────────────
export const ROLE_COLORS = {
  hod: '#7C3AED',
  admin: '#1A56DB',
  teacher: '#0EA5E9',
  student: '#10B981',
};

export const ROLE_LABELS = {
  hod: 'HOD',
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
};

// ─── PRIORITY COLORS ─────────────────────────────────────────────────────────
export const PRIORITY_COLORS = {
  normal: '#64748B',
  important: '#F59E0B',
  urgent: '#EF4444',
};

// ─── DAYS ─────────────────────────────────────────────────────────────────────
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── COMPLAINT CATEGORIES ─────────────────────────────────────────────────────
export const COMPLAINT_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'other', label: 'Other' },
];
