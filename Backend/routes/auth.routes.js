const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const User = require("../models/User");
const Achievement = require("../models/Achievement");
const auth = require("../middleware/auth");
const { checkAchievements } = require("../utils/achievementSystem");

const JWT_SECRET = process.env.JWT_SECRET || "TU_CLAVE_SECRETA_SUPER_LARGA_AQUI";

// ------------------------------
// Utilidades
// ------------------------------
const generateToken = (user) => {
  const payload = { user: { id: user.id, role: user.role } };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "5h" });
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const normalizeAnswer = (answer) =>
  typeof answer === "string" ? answer.trim().toLowerCase() : "";

// Validación de email: debe terminar en .com
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[cC][oO][mM]$/.test(email);
// Validación de cédula: máximo 10 dígitos numéricos
const isValidCedula = (cedula) => /^\d{1,10}$/.test(cedula);



const badRequest = (res, msg) => res.status(400).json({ msg });
const notFound = (res, msg) => res.status(404).json({ msg });
const serverError = (res, msg = "Error del servidor") =>
  res.status(500).json({ msg });

// ------------------------------
// RUTA 1: REGISTRO
// ------------------------------
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, cedula, username, email, password } = req.body;
    if (!nombre || !apellido || !cedula || !username || !email || !password) {
      return badRequest(res, "Faltan campos obligatorios");
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return badRequest(res, "Correo inválido. Solo se aceptan correos que terminen en .com");
    }

    if (!isValidCedula(cedula.trim())) {
  return badRequest(res, "⚠️Cédula inválida: debe contener solo números y máximo 10 dígitos");
}


    let user = await User.findOne({ email: normalizedEmail });
    if (user) return badRequest(res, "El usuario con este email ya existe");

    const cedulaExists = await User.findOne({ cedula });
    if (cedulaExists) return badRequest(res, "Ya existe un usuario con esta cédula");

    const hashedPassword = await hashPassword(password);

    user = new User({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      cedula: cedula.trim(),
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      achievements: []
    });

    const welcomeAchievement = await Achievement.findOne({ code: "WELCOME" });
    if (welcomeAchievement) {
      user.achievements.push({
        code: welcomeAchievement.code,
        title: welcomeAchievement.title,
        description: welcomeAchievement.description,
        iconUrl: welcomeAchievement.iconUrl,
        unlockedAt: new Date()
      });
    }

    await user.save();
    const unlocked = await checkAchievements(user._id, "accountCreated", true);

    const token = generateToken(user);
    return res.json({
      token,
      msg: "Registro exitoso",
      unlockedAchievements: unlocked,
      user: {
        nombre: user.nombre,
        apellido: user.apellido,
        cedula: user.cedula,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("REGISTER error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 2: LOGIN
// ------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, "Faltan email o contraseña");

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return badRequest(res, "Correo inválido. Solo se aceptan correos que terminen en .com");
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return badRequest(res, "Credenciales inválidas");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return badRequest(res, "Credenciales inválidas");

    if (user.isTwoFAEnabled) {
      return res.json({ msg: "Ingresa tu código de Google Authenticator", twoFARequired: true });
    }

    const token = generateToken(user);
    return res.json({
      token,
      msg: "Inicio de sesión exitoso",
      user: {
        nombre: user.nombre,
        apellido: user.apellido,
        cedula: user.cedula,
        username: user.username,
        email: user.email
      },
      achievements: user.achievements
    });
  } catch (err) {
    console.error("LOGIN error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 3: CAMBIAR CONTRASEÑA
// ------------------------------
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return badRequest(res, "Faltan campos");

    const user = await User.findById(req.user.id);
    if (!user) return notFound(res, "Usuario no encontrado");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return badRequest(res, "La contraseña actual es incorrecta");

    user.password = await hashPassword(newPassword);
    await user.save();

    return res.json({ msg: "Contraseña actualizada con éxito" });
  } catch (err) {
    console.error("CHANGE-PASSWORD error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 4: RESET FORZADO
// ------------------------------
router.post("/force-reset", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return badRequest(res, "Faltan campos");

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return badRequest(res, "Correo inválido. Solo se aceptan correos que terminen en .com");
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return notFound(res, "Usuario no encontrado");

    user.password = await hashPassword(newPassword);
    await user.save();

    return res.json({ msg: "Contraseña actualizada, ya puedes iniciar sesión" });
  } catch (err) {
    console.error("FORCE RESET error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 6: HABILITAR 2FA
// ------------------------------
router.post("/enable-2fa", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return notFound(res, "Usuario no encontrado");

    const secret = speakeasy.generateSecret({ name: `BossApp (${user.email})` });
    user.twoFASecret = secret.base32;
    user.isTwoFAEnabled = true;
    await user.save();

    const qrDataURL = await qrcode.toDataURL(secret.otpauth_url);
    return res.json({ msg: "2FA habilitado", qr: qrDataURL });
  } catch (err) {
    console.error("ENABLE-2FA error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 7: DESHABILITAR 2FA
// ------------------------------
router.post("/disable-2fa", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return notFound(res, "Usuario no encontrado");

    user.isTwoFAEnabled = false;
    user.twoFASecret = null;
    await user.save();

    return res.json({ msg: "2FA deshabilitado exitosamente" });
  } catch (err) {
    console.error("DISABLE-2FA error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// ------------------------------
// RUTA 8: VERIFICAR 2FA
// ------------------------------
router.post("/verify-2fa", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return badRequest(res, "Faltan email o código 2FA");

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return badRequest(res, "Correo inválido. Solo se aceptan correos que terminen en .com");
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return notFound(res, "Usuario no encontrado");

    if (!user.isTwoFAEnabled || !user.twoFASecret) {
      return badRequest(res, "2FA no habilitado para este usuario");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token: code,
      window: 1
    });

    if (!verified) return badRequest(res, "Código inválido");

    const token = generateToken(user);
    return res.json({
      token,
      msg: "Autenticación completada con éxito",
      user: {
        nombre: user.nombre,
        apellido: user.apellido,
        cedula: user.cedula,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("VERIFY-2FA error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 9: CONFIGURAR PREGUNTA DE SEGURIDAD
// ------------------------------
router.put("/set-security-question", auth, async (req, res) => {
  try {
    const { securityQuestion, securityAnswer } = req.body;
    if (!securityQuestion || !securityAnswer) {
      return badRequest(res, "Faltan campos obligatorios");
    }

    const user = await User.findById(req.user.id);
    if (!user) return notFound(res, "Usuario no encontrado");

    user.securityQuestion = securityQuestion;
    user.securityAnswer = normalizeAnswer(securityAnswer); // se hashea en el pre('save')
    await user.save();

    return res.json({ msg: "Pregunta de seguridad actualizada con éxito" });
  } catch (err) {
    console.error("SET-SECURITY-QUESTION error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// ------------------------------
// RUTA 10: RESET PASSWORD CON PREGUNTA DE SEGURIDAD
// ------------------------------
router.post("/reset-password-with-security", async (req, res) => {
  try {
    const { cedula, securityAnswer, newPassword } = req.body;
    if (!cedula || !securityAnswer || !newPassword) {
      return badRequest(res, "Faltan cédula, respuesta de seguridad o nueva contraseña");
    }

    if (!isValidCedula(cedula.trim())) {
  return badRequest(res, "⚠️ Cédula inválida: debe contener solo números y máximo 10 dígitos");
}


    const user = await User.findOne({ cedula: cedula.trim() });
    if (!user) return notFound(res, "Usuario no encontrado");

    if (!user.securityQuestion || !user.securityAnswer) {
      return badRequest(res, "El usuario no tiene configurada una pregunta de seguridad");
    }

    const isMatch = await user.compareSecurityAnswer(securityAnswer);
    if (!isMatch) return badRequest(res, "Respuesta de seguridad incorrecta");

    // Si la respuesta es correcta, actualizamos la contraseña
    user.password = await hashPassword(newPassword);
    await user.save();

    return res.json({ msg: "Contraseña actualizada con éxito. Ya puedes iniciar sesión." });
  } catch (err) {
    console.error("RESET-PASSWORD-WITH-SECURITY error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 11: OBTENER PREGUNTA DE SEGURIDAD (Forgot Password)
// ------------------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { cedula } = req.body;
    if (!cedula) return badRequest(res, "Falta la cédula");

    const user = await User.findOne({ cedula: cedula.trim() });
    if (!user) return notFound(res, "Usuario no encontrado");
if (!isValidCedula(cedula.trim())) {

  return badRequest(res, "⚠️Cédula inválida: debe contener solo números y máximo 10 dígitos");
}

    if (!user.securityQuestion) {
      return badRequest(res, "El usuario no tiene configurada una pregunta de seguridad");
    }

    return res.json({ question: user.securityQuestion });
  } catch (err) {
    console.error("FORGOT-PASSWORD error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 12: OBTENER PREGUNTA DE SEGURIDAD POR EMAIL
// ------------------------------
router.post("/forgot-password-by-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return badRequest(res, "Falta el correo electrónico");

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return notFound(res, "Usuario no encontrado");

    if (!user.securityQuestion) {
      return badRequest(res, "El usuario no tiene configurada una pregunta de seguridad");
    }

    return res.json({ question: user.securityQuestion });
  } catch (err) {
    console.error("FORGOT-PASSWORD-BY-EMAIL error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// RUTA 13: RESET PASSWORD POR EMAIL
// ------------------------------
router.post("/reset-password-by-email", async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;
    if (!email || !securityAnswer || !newPassword) {
      return badRequest(res, "Faltan correo, respuesta o nueva contraseña");
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return notFound(res, "Usuario no encontrado");

    if (!user.securityQuestion || !user.securityAnswer) {
      return badRequest(res, "El usuario no tiene configurada una pregunta de seguridad");
    }

    const isMatch = await user.compareSecurityAnswer(securityAnswer);
    if (!isMatch) return badRequest(res, "Respuesta de seguridad incorrecta");

    user.password = await hashPassword(newPassword);
    await user.save();

    return res.json({ msg: "Contraseña actualizada con éxito. Ya puedes iniciar sesión." });
  } catch (err) {
    console.error("RESET-PASSWORD-BY-EMAIL error:", err.message);
    return serverError(res);
  }
});

// ------------------------------
// Exportación del router
// ------------------------------
module.exports = router;
