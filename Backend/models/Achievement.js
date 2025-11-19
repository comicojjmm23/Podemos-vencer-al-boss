const mongoose = require("mongoose");

const AchievementSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true // ej: WELCOME, MISSIONS_2
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  iconUrl: {
    type: String,
    default: "/icons/trophy.png" // emblema visual
  },
  key: {
    type: String, // ej: "missionsCompleted", "accountCreated"
    required: true
  },
  threshold: {
    type: Number,
    default: 0 // ej: 2 misiones
  }
}, {
  timestamps: true // 👈 útil para orden cronológico y auditoría
});

// 👇 Exportación en CommonJS
module.exports = mongoose.model("Achievement", AchievementSchema);
