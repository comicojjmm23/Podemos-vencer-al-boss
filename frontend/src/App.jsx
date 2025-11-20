// =======================================================
// App.jsx
// Punto de entrada principal de la aplicación
// Maneja autenticación y rutas protegidas con PrivateRoute
// =======================================================

import React, { useState, useEffect } from "react";
// CAMBIO IMPORTANTE: Usamos HashRouter para evitar errores 404 en Vercel
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { API_URL } from "./config"; // ✅ 1. Importamos la configuración

import AuthScreen from "./components/AuthScreen";   // Pantalla de Login/Registro
import Dashboard from "./components/Dashboard";     // Panel del Jugador
import PrivateRoute from "./components/PrivateRoute"; // Protector de rutas
import "./styles/theme.css";                        // Estilos base

// ✅ 2. Usamos la variable inteligente
const API_BASE = `${API_URL}/api`;

const App = () => {
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Leer token una sola vez al inicio
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    setAuthLoading(false);
  }, []);

  // Función de logout
  const handleLogout = async () => {
    try {
      // Aquí usa la API_BASE correcta automáticamente
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.warn("No se pudo notificar al servidor, cierre local.", error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
  };

  if (authLoading) {
    return <div className="loading-screen">Cargando aplicación...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de login */}
        <Route path="/login" element={<AuthScreen setToken={setToken} />} />

        {/* Ruta protegida del dashboard */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard token={token} handleLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
};

export default App;