// =======================================================
// models/ChatRoom.js — Salas de chat generales o por misión
// =======================================================
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ChatRoomSchema = new Schema({
  // 🏷️ Título de la sala
  title: {
    type: String,
    required: true,
    trim: true
  },

  // 🎯 Misión asociada (si aplica)
  mission: {
    type: Schema.Types.ObjectId,
    ref: "Mission",
    default: null
  },

  // 👤 Creador de la sala (normalmente el profesor)
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 👥 Participantes activos
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  // 📌 Pauta anclada por el profesor
  pinnedMessage: {
    type: String,
    default: ""
  },

  // 🔒 Estado de bloqueo del chat (persistente)
  locked: {
    type: Boolean,
    default: false
  },

  // 🕒 Fecha de creación
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = model("ChatRoom", ChatRoomSchema);
