import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config/api";

const AuthContext = createContext();

const API_BASE = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("sgs_token") || null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  // Set default axios header
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }

  // Fetch user profile on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/auth/me`);
        if (res.data.user) {
          setUser(res.data.user);
          setCredits(res.data.user.credits || 0);
        }
      } catch (err) {
        console.error("Auto auth error:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [token]);

  const login = async (identifier, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        identifier,
        password,
      });

      const { token: newToken, user: userData } = res.data;

      localStorage.setItem("sgs_token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      setCredits(userData.credits || 0);

      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      throw new Error(msg);
    }
  };

  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, formData);

      const { token: newToken, user: userData } = res.data;

      localStorage.setItem("sgs_token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      setCredits(userData.credits || 5);

      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem("sgs_token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    setCredits(0);
  };

  const updateCredits = (newCredits) => {
    setCredits(newCredits);
    if (user) {
      setUser((prev) => (prev ? { ...prev, credits: newCredits } : null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        credits,
        loading,
        login,
        register,
        logout,
        updateCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
