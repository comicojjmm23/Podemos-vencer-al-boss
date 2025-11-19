const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MissionHistorySchema = new Schema({
    // Referencia al jugador que completó la misión
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Hace referencia al modelo 'User'
        required: true
    },
    // 🛑 CAMBIO CLAVE: Referencia directa a la misión original para usar populate()
    mission: {
        type: Schema.Types.ObjectId,
        ref: 'Mission', // Debe referenciar al modelo 'Mission'
        required: true
    },
    // El estado (útil para el historial)
    status: {
        type: String,
        enum: ['completed', 'rejected'], 
        default: 'completed' 
    },
    // Recompensas ganadas en ese momento (para registro)
    xpEarned: {
        type: Number,
        default: 0
    },
    coinsEarned: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MissionHistory', MissionHistorySchema);
