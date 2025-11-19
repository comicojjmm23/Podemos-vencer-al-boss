// =======================================================
// routes/store.routes.js
// Gestión de recompensas de la tienda
// =======================================================
const express = require('express');
const router = express.Router();

const StoreItem = require('../models/StoreItem');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkAchievements } = require("../utils/achievementSystem"); // 👈 Logros

// Middleware para verificar admin
function checkAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Acceso denegado: solo administradores' });
  }
  next();
}

// ----------------------------------------------------
// GET /api/store/rewards — Listar recompensas disponibles
// ----------------------------------------------------
router.get('/rewards', async (req, res) => {
  try {
    const items = await StoreItem.find({ isAvailable: true })
      .select('-createdAt -isAvailable');
    res.json(items);
  } catch (err) {
    console.error('[store/rewards GET]', err.message);
    res.status(500).json({ msg: 'Error del servidor al obtener la tienda de recompensas' });
  }
});

// ----------------------------------------------------
// POST /api/store/rewards — Crear recompensa (solo admin)
// ----------------------------------------------------
router.post('/rewards', auth, checkAdmin, async (req, res) => {
  try {
    const { name, description, cost, currency, type } = req.body;
    if (!name || !description || !cost || !currency || !type) {
      return res.status(400).json({ msg: 'Faltan campos obligatorios' });
    }

    const item = new StoreItem({ name, description, cost, currency, type });
    await item.save();

    res.json({ msg: 'Ítem creado con éxito', item });
  } catch (err) {
    console.error('[store/rewards POST]', err.message);
    res.status(500).json({ msg: 'Error al crear ítem en la tienda' });
  }
});

// ----------------------------------------------------
// POST /api/store/buy/:id — Comprar recompensa
// ----------------------------------------------------
router.post('/buy/:id', auth, async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    if (!item || !item.isAvailable) {
      return res.status(404).json({ msg: 'Ítem no disponible' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    // Verificar moneda
    if (item.currency === 'coins') {
      if (user.coins < item.cost) {
        return res.status(400).json({ msg: 'Monedas insuficientes' });
      }
      user.coins -= item.cost;
    } else if (item.currency === 'gems') {
      if (user.gems < item.cost) {
        return res.status(400).json({ msg: 'Gemas insuficientes' });
      }
      user.gems -= item.cost;
    }

    // Registrar la compra en el inventario del usuario
    user.purchasedItems.push(item._id);
    await user.save();

    // 🏆 Disparador de logros por compras
    const purchases = user.purchasedItems.length;
    await checkAchievements(user._id, "itemPurchased", purchases);

    // Populate para devolver ítems completos
    const populatedUser = await user.populate({
      path: 'purchasedItems',
      select: 'name description cost currency type'
    });

    res.json({
      msg: `Has comprado ${item.name}`,
      coins: populatedUser.coins,
      gems: populatedUser.gems,
      purchasedItems: populatedUser.purchasedItems
    });
  } catch (err) {
    console.error('[store/buy POST]', err.message);
    res.status(500).json({ msg: 'Error al procesar la compra' });
  }
});

// ----------------------------------------------------
// DELETE /api/store/rewards/:id — Eliminar ítem (solo admin)
// ----------------------------------------------------
router.delete('/rewards/:id', auth, checkAdmin, async (req, res) => {
  try {
    const item = await StoreItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Ítem no encontrado' });
    }

    await item.deleteOne();

    res.json({ msg: `Ítem "${item.name}" eliminado con éxito` });
  } catch (err) {
    console.error('[store/rewards DELETE]', err.message);
    res.status(500).json({ msg: 'Error al eliminar ítem de la tienda' });
  }
});

// =======================================================
// Exportación
// =======================================================
module.exports = router;
