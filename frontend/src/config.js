// =======================================================
// config.js
// Archivo de configuración para la URL de la API
// =======================================================

// AHORA BUSCAMOS LA VARIABLE CON EL PREFIJO ESTÁNDAR DE VERCEL/NEXT.JS
// (usamos este prefijo para forzar la inyección en la fase de build)
const VERCEL_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Definimos la URL de la API.
// Priorizamos la variable de entorno de Vercel si existe.
// Si no existe, usamos localhost (para desarrollo local)
export const API_URL = VERCEL_API_URL 
  ? VERCEL_API_URL 
  : "http://localhost:5000"; 

// Opcional: Para debuggear en el navegador si la variable se cargó
console.log("API URL Cargada:", API_URL);