// =======================================================
// PrivateRoute.jsx
// Protege rutas que requieren autenticación
// =======================================================

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setAuthLoading(false); // 👈 sin delay artificial
  }, []);

  if (authLoading) {
    return <div className="loading-screen">⏳ Verificando sesión...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
