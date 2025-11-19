// models/StoreItem.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definición del esquema de un ítem de la tienda
const StoreItemSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String
    },
    cost: {
        type: Number,
        required: true,
        min: 0 // El costo mínimo es 0
    },
    currency: { // Define la moneda de compra
        type: String,
        enum: ['coins', 'gems'],
        default: 'coins'
    },
    type: { // Tipo de ítem (Ej: cosmético, potenciador, etc.)
        type: String,
        enum: ['cosmetic', 'boost', 'inventory', 'achievement'],
        default: 'cosmetic'
    },
    isAvailable: { // Para ocultar ítems temporalmente
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StoreItem', StoreItemSchema);