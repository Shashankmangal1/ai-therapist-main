"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  login: (user: User) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Set loading to false initially for SSR, will be set to true on client if needed
  const [loading, setLoading] = useState(typeof window === "undefined" ? false : true);
  const router = useRouter();

  const checkSession = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      console.log(
        "SessionContext: Token from localStorage:",
        token ? "exists" : "not found"
      );

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      console.log("SessionContext: Fetching user data...");
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("SessionContext: Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("SessionContext: User data received:", data);
        const userData = data.user;
        const { password, ...safeUserData } = userData;
        setUser(safeUserData);
        console.log("SessionContext: User state updated:", safeUserData);
      } else {
        console.log("SessionContext: Failed to get user data");
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      }
    } catch (error) {
      console.error("SessionContext: Error checking session:", error);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    setLoading(false);
  };

  const logout = async () => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      setUser(null);
      router.push("/");
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      console.log("SessionContext: Initial check");
      checkSession();
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        logout,
        checkSession,
        login,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
