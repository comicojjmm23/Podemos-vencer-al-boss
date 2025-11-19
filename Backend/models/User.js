const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

// 🎮 Esquema de Usuario con Gamificación, Seguridad y 2FA
const UserSchema = new Schema({
  // --- Datos personales ---
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  cedula: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 10, // máximo 10 caracteres
    match: [/^\d+$/, "La cédula solo debe contener números"] // solo números
  },

  // --- Autenticación ---
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "teacher"], default: "user" },

  // --- Gamificación ---
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 100 },
  gems: { type: Number, default: 0 },

  // --- Logros desbloqueados ---
  achievements: [
    {
      code: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String },
      iconUrl: { type: String, default: "/icons/trophy.png" },
      unlockedAt: { type: Date, default: Date.now }
    }
  ],

  // --- Inventario / Ítems comprados ---
  purchasedItems: [
    {
      type: Schema.Types.ObjectId,
      ref: "StoreItem"
    }
  ],

  // --- Seguridad y 2FA ---
  twoFASecret: { type: String },
  isTwoFAEnabled: { type: Boolean, default: false },
  securityQuestion: { type: String, default: null },
  securityAnswer: { type: String, default: null },

  // --- Perfil ---
  avatarUrl: {
    type: String,
    default: "https://via.placeholder.com/150"
  },

  // --- Metadatos --- 
  createdAt: { type: Date, default: Date.now }
});

// 🔐 Middleware: hashear respuesta de seguridad si cambia
UserSchema.pre("save", async function (next) {
  if (this.isModified("securityAnswer") && this.securityAnswer) {
    const normalized = this.securityAnswer.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    this.securityAnswer = await bcrypt.hash(normalized, salt);
  }
  next();
});

// 🔐 Método: comparar respuesta de seguridad
UserSchema.methods.compareSecurityAnswer = async function (input) {
  if (!this.securityAnswer || !input) return false;
  const normalized = input.trim().toLowerCase();
  return await bcrypt.compare(normalized, this.securityAnswer);
};

module.exports = mongoose.model("User", UserSchema);
