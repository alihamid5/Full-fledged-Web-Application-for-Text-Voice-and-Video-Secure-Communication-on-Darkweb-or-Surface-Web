// API URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Socket URL (same as API URL for this app)
export const SOCKET_URL = API_URL;

// File upload size limit in bytes (10MB)
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

// Allowed file types for uploads
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
};

// Message types
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  VOICE_NOTE = 'voice_note'
}

// User roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// User status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

// Chat types
export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
  GLOBAL = 'global'
}

// Call types
export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

// Call status
export enum CallStatus {
  RINGING = 'ringing',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  MISSED = 'missed',
  REJECTED = 'rejected'
}

// Notification types
export enum NotificationType {
  MESSAGE = 'message',
  CALL = 'call',
  FRIEND_REQUEST = 'friend_request',
  SYSTEM = 'system'
}

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_CHATS: '/admin/chats',
  ADMIN_SETTINGS: '/admin/settings',
  NOT_FOUND: '/404'
};

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  USERS: {
    GET_PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    GET_USER: (id: string) => `/api/users/${id}`,
    SEARCH_USERS: '/api/users/search',
    ONLINE_USERS: '/api/users/online',
  },
  CHATS: {
    GET_CHATS: '/api/chats',
    CREATE_CHAT: '/api/chats',
    GET_CHAT: (id: string) => `/api/chats/${id}`,
    UPDATE_CHAT: (id: string) => `/api/chats/${id}`,
    DELETE_CHAT: (id: string) => `/api/chats/${id}`,
    GLOBAL_CHAT: '/api/chats/global',
  },
  MESSAGES: {
    GET_MESSAGES: (chatId: string) => `/api/chats/${chatId}/messages`,
    SEND_MESSAGE: (chatId: string) => `/api/chats/${chatId}/messages`,
    DELETE_MESSAGE: (chatId: string, messageId: string) => 
      `/api/chats/${chatId}/messages/${messageId}`,
    READ_MESSAGES: (chatId: string) => `/api/chats/${chatId}/read`,
  },
  FILES: {
    UPLOAD: '/api/files/upload',
    DOWNLOAD: (fileId: string) => `/api/files/${fileId}`,
  },
  CALLS: {
    INITIATE: '/api/calls/initiate',
    JOIN: (callId: string) => `/api/calls/${callId}/join`,
    END: (callId: string) => `/api/calls/${callId}/end`,
  },
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // User events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USERS_ONLINE: 'users:online',
  USER_TYPING: 'user:typing',
  USER_STOP_TYPING: 'user:stop-typing',
  
  // Chat events
  CHAT_CREATED: 'chat:created',
  CHAT_UPDATED: 'chat:updated',
  CHAT_DELETED: 'chat:deleted',
  CHAT_USER_ADDED: 'chat:user-added',
  CHAT_USER_REMOVED: 'chat:user-removed',
  
  // Message events
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:receive',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read',
  
  // Call events
  CALL_INITIATED: 'call:initiated',
  CALL_ACCEPTED: 'call:accepted',
  CALL_REJECTED: 'call:rejected',
  CALL_ENDED: 'call:ended',
  CALL_SIGNAL: 'call:signal',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Validation Patterns
export const VALIDATION = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PHONE: /^\+?[0-9]{10,15}$/,
};

// File upload settings
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
};

// Theme settings
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Language settings
export const LANGUAGES = {
  ENGLISH: 'en',
  FRENCH: 'fr',
  SPANISH: 'es',
  GERMAN: 'de',
  CHINESE: 'zh',
  ARABIC: 'ar',
};

// Other constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEBOUNCE_TIMEOUT = 300; // ms
export const TOKEN_KEY = 'chat_auth_token';
export const USER_KEY = 'chat_user';

// UI constants
export const DEBOUNCE_DELAY = 300; // ms
export const SNACKBAR_DURATION = 5000; // ms 