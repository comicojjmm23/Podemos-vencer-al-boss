// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "TU_CLAVE_SECRETA_SUPER_LARGA_AQUI_PARA_PRODUCCION";

module.exports = async function (req, res, next) {
  let token = null;

  // 1. Buscar token en formato estándar
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Alternativa: formato antiguo
  if (!token) {
    token = req.header("x-auth-token");
  }

  // 3. Si no hay token, rechazar
  if (!token) {
    return res.status(401).json({ msg: "Acceso denegado. No hay token." });
  }

  try {
    // 4. Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 5. Buscar usuario completo en la base de datos
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ msg: "Usuario no encontrado." });
    }

    // 6. Adjuntar usuario completo a la solicitud
    req.user = user;
    next();
  } catch (err) {
    console.error("AUTH error:", err.message);
    res.status(401).json({ msg: "Token inválido o expirado." });
  }
};
