import { apiClient } from "@/utils/api";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const accessToken = localStorage.getItem("access_token");

        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);

          // Verify token is still valid by checking auth status
          checkAuthStatus();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const data = await apiClient.getCurrentUser();
      if (data.success) {
        const userData = data.data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        // Token is invalid, try to refresh
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          logout();
        }
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      // Try to refresh token
      const refreshSuccess = await refreshToken();
      if (!refreshSuccess) {
        logout();
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const data = await apiClient.login(email, password);

      if (data.success) {
        // Store tokens and user data
        localStorage.setItem("access_token", data.data.tokens.accessToken);
        localStorage.setItem("refresh_token", data.data.tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        setUser(data.data.user);
        return true;
      } else {
        console.error("Login failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);

      const data = await apiClient.register(userData);

      if (data.success) {
        // Store tokens and user data
        localStorage.setItem("access_token", data.data.tokens.accessToken);
        localStorage.setItem("refresh_token", data.data.tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        setUser(data.data.user);
        return true;
      } else {
        console.error("Signup failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem("refresh_token");

      if (!refreshTokenValue) {
        return false;
      }

      const data = await apiClient.refreshToken(refreshTokenValue);

      if (data.success) {
        // Update tokens
        localStorage.setItem("access_token", data.data.tokens.accessToken);
        localStorage.setItem("refresh_token", data.data.tokens.refreshToken);
        return true;
      } else {
        // Refresh failed, logout user
        logout();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
