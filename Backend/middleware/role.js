// middleware/role.js

/**
 * Middleware de autorización por rol.
 * Verifica si el rol del usuario autenticado está incluido en los roles permitidos.
 * @param {string[]} allowedRoles - Array de roles permitidos (ej: ['admin', 'teacher']).
 */
module.exports = function (allowedRoles = []) {
  return (req, res, next) => {
    // Validación de existencia de usuario y rol
    if (!req.user || typeof req.user.role !== "string") {
      return res.status(401).json({
        msg: "Acceso denegado. No se pudo verificar el rol del usuario.",
      });
    }

    const userRole = req.user.role.trim().toLowerCase();

    // Verificar si el rol está permitido
    const isAuthorized = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        msg: "Acceso denegado. Se requiere un rol autorizado para esta acción.",
        role: userRole,
        required: allowedRoles,
      });
    }

    // Rol válido → continuar
    next();
  };
};
