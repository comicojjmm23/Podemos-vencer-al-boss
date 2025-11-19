// ========================================================
// models/Mission.js
// ========================================================
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MissionSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  xpReward: {
    type: Number,
    required: true,
    min: 1
  },
  coinsReward: {
    type: Number,
    required: true,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'boss'], // 👈 en minúsculas
    default: 'easy'
  },
  type: {
    type: String,
    enum: ['survey', 'file'], // 👈 nuevo campo
    required: true
  },
  questions: [
    {
      question: { type: String },
      options: [{ type: String }],
      correctAnswer: { type: String, default: null }
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User' // referencia al profesor/admin que la creó
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mission', MissionSchema);
