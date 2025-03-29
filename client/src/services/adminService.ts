// Import axios and API_URL for commented out real API calls
// import axios from 'axios';
// import { API_URL } from '../utils/constants';

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  avatar?: string;
  createdAt: string;
}

// Analytics types
export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  messagesPerDay: Array<{ date: string; count: number }>;
  activeChats: number;
  totalMessages: number;
  averageResponseTime: string;
  fileUploads: number;
  callsInitiated: number;
}

// Settings types
export interface SystemSettings {
  maxFileSize: number;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  messageRetentionDays: number;
  allowFileSharing: boolean;
  allowVoiceCalls: boolean;
  allowVideoCalls: boolean;
  maintenanceMode: boolean;
  idleTimeoutMinutes: number;
}

// Mock data
const mockUsers: User[] = [
  { 
    id: '1', 
    username: 'johndoe', 
    email: 'john@example.com', 
    name: 'John Doe', 
    role: 'user', 
    status: 'active', 
    lastActive: '2023-08-15T14:30:00Z',
    avatar: '',
    createdAt: '2023-01-15T10:00:00Z'
  },
  { 
    id: '2', 
    username: 'janesmith', 
    email: 'jane@example.com', 
    name: 'Jane Smith', 
    role: 'user', 
    status: 'active', 
    lastActive: '2023-08-16T09:45:00Z',
    avatar: '',
    createdAt: '2023-02-20T15:30:00Z'
  },
  { 
    id: '3', 
    username: 'mikejohnson', 
    email: 'mike@example.com', 
    name: 'Mike Johnson', 
    role: 'admin', 
    status: 'active', 
    lastActive: '2023-08-16T11:20:00Z',
    avatar: '',
    createdAt: '2023-01-05T09:15:00Z'
  },
  { 
    id: '4', 
    username: 'saralee', 
    email: 'sara@example.com', 
    name: 'Sara Lee', 
    role: 'user', 
    status: 'inactive', 
    lastActive: '2023-08-10T16:50:00Z',
    avatar: '',
    createdAt: '2023-03-12T13:45:00Z'
  },
  { 
    id: '5', 
    username: 'robertbrown', 
    email: 'robert@example.com', 
    name: 'Robert Brown', 
    role: 'user', 
    status: 'suspended', 
    lastActive: '2023-08-05T10:15:00Z',
    avatar: '',
    createdAt: '2023-02-01T08:30:00Z'
  }
];

const mockAnalytics: Analytics = {
  totalUsers: 250,
  activeUsers: 180,
  messagesPerDay: [
    { date: '2023-08-10', count: 356 },
    { date: '2023-08-11', count: 421 },
    { date: '2023-08-12', count: 389 },
    { date: '2023-08-13', count: 452 },
    { date: '2023-08-14', count: 478 },
    { date: '2023-08-15', count: 412 },
    { date: '2023-08-16', count: 398 }
  ],
  activeChats: 65,
  totalMessages: 12845,
  averageResponseTime: '2.5 minutes',
  fileUploads: 278,
  callsInitiated: 142
};

const mockSettings: SystemSettings = {
  maxFileSize: 10,
  allowRegistration: true,
  requireEmailVerification: true,
  messageRetentionDays: 90,
  allowFileSharing: true,
  allowVoiceCalls: true,
  allowVideoCalls: true,
  maintenanceMode: false,
  idleTimeoutMinutes: 30
};

// Admin API functions
export const adminApi = {
  // User management
  getUsers: async (): Promise<User[]> => {
    // In a real app, this would call the API
    // return axios.get(`${API_URL}/api/admin/users`).then(response => response.data);
    
    return new Promise(resolve => {
      setTimeout(() => resolve(mockUsers), 500);
    });
  },
  
  getUser: async (userId: string): Promise<User> => {
    // In a real app, this would call the API
    // return axios.get(`${API_URL}/api/admin/users/${userId}`).then(response => response.data);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('User not found'));
        }
      }, 500);
    });
  },
  
  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>): Promise<User> => {
    // In a real app, this would call the API
    // return axios.post(`${API_URL}/api/admin/users`, userData).then(response => response.data);
    
    return new Promise(resolve => {
      setTimeout(() => {
        const newUser: User = {
          ...userData,
          id: `user-${Date.now()}`,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        mockUsers.push(newUser);
        resolve(newUser);
      }, 500);
    });
  },
  
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    // In a real app, this would call the API
    // return axios.put(`${API_URL}/api/admin/users/${userId}`, userData).then(response => response.data);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = mockUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          const updatedUser = {
            ...mockUsers[userIndex],
            ...userData
          };
          mockUsers[userIndex] = updatedUser;
          resolve(updatedUser);
        } else {
          reject(new Error('User not found'));
        }
      }, 500);
    });
  },
  
  deleteUser: async (userId: string): Promise<void> => {
    // In a real app, this would call the API
    // return axios.delete(`${API_URL}/api/admin/users/${userId}`).then(response => response.data);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userIndex = mockUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          mockUsers.splice(userIndex, 1);
          resolve();
        } else {
          reject(new Error('User not found'));
        }
      }, 500);
    });
  },
  
  // Analytics
  getAnalytics: async (): Promise<Analytics> => {
    // In a real app, this would call the API
    // return axios.get(`${API_URL}/api/admin/analytics`).then(response => response.data);
    
    return new Promise(resolve => {
      setTimeout(() => resolve(mockAnalytics), 500);
    });
  },
  
  // Settings
  getSettings: async (): Promise<SystemSettings> => {
    // In a real app, this would call the API
    // return axios.get(`${API_URL}/api/admin/settings`).then(response => response.data);
    
    return new Promise(resolve => {
      setTimeout(() => resolve(mockSettings), 500);
    });
  },
  
  updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    // In a real app, this would call the API
    // return axios.put(`${API_URL}/api/admin/settings`, settings).then(response => response.data);
    
    return new Promise(resolve => {
      setTimeout(() => {
        const updatedSettings = {
          ...mockSettings,
          ...settings
        };
        Object.assign(mockSettings, updatedSettings);
        resolve(updatedSettings);
      }, 500);
    });
  }
};

export default adminApi; 