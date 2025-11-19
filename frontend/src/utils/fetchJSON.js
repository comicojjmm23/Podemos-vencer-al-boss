// =======================================================
// fetchJSON.js
// Helper para llamadas fetch con manejo automático de token y 401
// =======================================================

export async function fetchJSON(url, options = {}) {
  // Recupera el token guardado en localStorage
  const token = localStorage.getItem("token");

  // Construye los headers
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });

    // Detecta si la respuesta es JSON
    const contentType = res.headers.get("content-type") || "";
    const isJSON = contentType.includes("application/json");
    const body = isJSON ? await res.json() : await res.text();

    // Manejo de errores
    if (!res.ok) {
      if (res.status === 401) {
        console.warn("⚠️ Token inválido o expirado, cerrando sesión...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login"; // Redirige automáticamente
      }
      throw { status: res.status, body };
    }

    return body;
  } catch (err) {
    console.error("[fetchJSON error]", url, err);
    throw err;
  }
}
