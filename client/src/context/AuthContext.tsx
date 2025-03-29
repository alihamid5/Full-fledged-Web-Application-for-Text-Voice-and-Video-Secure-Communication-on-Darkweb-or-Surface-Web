import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define User type
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}

// Define Auth Context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Mock admin and user for testing
const mockUsers = [
  {
    id: '1',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://mui.com/static/images/avatar/1.jpg',
    role: 'user' as const,
  },
  {
    id: '2',
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: 'https://mui.com/static/images/avatar/2.jpg',
    role: 'admin' as const,
  },
];

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // In a real app, this would be a fetch call to your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      if (!email) {
        throw new Error('Email is required');
      }
      
      if (!password) {
        throw new Error('Password is required');
      }
      
      // For testing purposes, let admin login with admin@example.com/admin123
      if (email === 'admin@example.com' && password === 'admin123') {
        setUser(mockUsers[1]);
        localStorage.setItem('user', JSON.stringify(mockUsers[1]));
        return;
      }

      // Mock successful login for any other credentials
      const foundUser = mockUsers.find(u => u.email === email);
      
      // Use foundUser if it exists, otherwise create a new generic user
      const loggedInUser = foundUser || {
        id: '3',
        username: email.split('@')[0],
        name: email.split('@')[0],
        email,
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
        role: 'user' as const,
      };
      
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // In a real app, this would be a fetch call to your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Validate inputs
      if (!username || !email || !password) {
        throw new Error('All fields are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Check if email is already in use
      if (mockUsers.some(u => u.email === email)) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        username,
        name: username,
        email,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
        role: 'user',
      };
      
      // Save user to state and local storage
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Provide the context value
  const contextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook
export const useAuth = () => useContext(AuthContext);