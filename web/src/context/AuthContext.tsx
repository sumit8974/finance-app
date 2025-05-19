
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import api from '@/api/axios';
import { setToken } from '@/utils/token';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);      
      const token = await api.post('/auth/login', { email, password });
      setToken(token.data.token);
      // Assuming the API returns a user object
      const user = await api.get('/users/token', {
        headers: {
          Authorization: `Bearer ${token.data.data.token}`,
        }
      })
      console.log(user);
      
      // For demo purposes, we'll accept any email/password and create a fake user
      const userDetails = {
        id: user.data.user.id,
        name: user.data.user.username,
        email: user.data.user.email,
        roleId: user.data.user.role_id,
      };
      console.log("t",userDetails);
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(userDetails));
      setUser(userDetails);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      // This is a mock implementation. In a real app, you'd call an API
      setLoading(true);
      
      const user = await api.post('/auth/register', { "username": name, email, password });
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Registration failed",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
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
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
