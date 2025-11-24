// =======================================================
// config.js
// Archivo de configuración para la URL de la API en Vite
// =======================================================

// Accedemos a la variable de entorno con el prefijo VITE_
// Esta variable se define en .env para desarrollo y .env.production para producción
const VITE_API_URL = import.meta.env.VITE_API_URL;

// Definimos la URL de la API.
// Si la variable existe, usamos esa (Railway en producción o localhost en desarrollo).
// Si no existe, usamos un fallback explícito.
export const API_URL = VITE_API_URL || "http://localhost:5000";

// Debug: Mostrar la URL cargada en consola para verificar que se inyectó correctamente
console.log("✅ API URL Cargada:", API_URL);
