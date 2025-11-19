// backend/models/MissionSubmission.js

const mongoose = require('mongoose');

const MissionSubmissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia al usuario que realizó la entrega
        required: true
    },
    mission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mission', // Referencia a la misión entregada
        required: true
    },
    filePath: {
        type: String, // Ruta o nombre del archivo guardado por Multer
        required: true
    },
    message: {
        type: String, // Mensaje opcional del estudiante
        default: ''
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    // Estado de la revisión: 'pending', 'approved', 'rejected'
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Campo para guardar la recompensa una vez aprobada (para evitar duplicados)
    isRewarded: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('MissionSubmission', MissionSubmissionSchema);