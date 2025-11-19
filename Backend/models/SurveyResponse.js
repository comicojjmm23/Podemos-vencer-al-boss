// models/SurveyResponse.js
const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  mission: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: Object, default: {} }, // Ej: { "0": "Opción A", "1": "Opción C" }
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Evita respuestas duplicadas por usuario en la misma encuesta
surveyResponseSchema.index({ mission: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
