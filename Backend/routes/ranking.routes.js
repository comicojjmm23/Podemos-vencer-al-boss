// =======================================================
// routes/ranking.routes.js — Ranking global + posición individual
// =======================================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ------------------------------------
// GET /api/ranking — Ranking global (Top 50 con XP > 0)
// ------------------------------------
router.get('/', async (req, res) => {
  try {
    const ranking = await User.find({ xp: { $gt: 0 } })
      .sort({ level: -1, xp: -1 })
      .select('username level xp coins achievements')
      .limit(50)
      .lean();

    const sanitizedRanking = ranking.map((user, index) => ({
      username: user.username || `Jugador ${index + 1}`,
      level: user.level ?? 1,
      xp: user.xp ?? 0,
      coins: user.coins ?? 0,
      achievements: (user.achievements || []).map(a => ({
        code: a.code,
        title: a.title,
        iconUrl: a.iconUrl
      })),
      position: index + 1 // 🏅 posición en el ranking
    }));

    res.json(sanitizedRanking);
  } catch (err) {
    console.error('[ranking GET]', err.message);
    res.status(500).json({ msg: 'Error del servidor al obtener el ranking' });
  }
});

// ------------------------------------
// GET /api/ranking/:id — Posición individual
// ------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username level xp coins achievements');
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const higherRankedCount = await User.countDocuments({
      $or: [
        { level: { $gt: user.level } },
        { level: user.level, xp: { $gt: user.xp } }
      ],
      xp: { $gt: 0 }
    });

    const position = higherRankedCount + 1;

    res.json({
      username: user.username || "Jugador",
      level: user.level ?? 1,
      xp: user.xp ?? 0,
      coins: user.coins ?? 0,
      achievements: (user.achievements || []).map(a => ({
        code: a.code,
        title: a.title,
        iconUrl: a.iconUrl
      })),
      position
    });
  } catch (err) {
    console.error('[ranking/:id GET]', err.message);
    res.status(500).json({ msg: 'Error del servidor al obtener posición en ranking' });
  }
});

module.exports = router;
