
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import api from '@/api/axios';

// Define user type
export type User = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatar?: string;
};

// Define context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if user is logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('access_token');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);      
      const token = await api.post('/auth/login', { email, password });
      setToken(token.data.token);
      const user = await api.get('/users/token', {
        headers: {
          Authorization: `Bearer ${token.data.token}`,
        }
      })
      const userDetails = {
        id: user.data.user.id,
        name: user.data.user.username,
        email: user.data.user.email,
        roleId: user.data.user.role_id,
      };
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(userDetails));
      localStorage.setItem('access_token', token.data.token);
      setUser(userDetails);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLoading(false);
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      await api.post('/auth/register', { "username": name, email, password });
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      setLoading(false);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  // Value to be provided to consumers
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
