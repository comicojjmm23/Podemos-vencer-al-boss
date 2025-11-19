// =======================================================
// routes/user.routes.js
// Gestión de perfil, avatar, inventario y logros
// =======================================================
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const User = require("../models/User");

// =======================================================
// GET /api/users/me — Perfil del usuario autenticado
// =======================================================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error("[GET /me]", err.message);
    res.status(500).json({ msg: "Error al obtener el perfil" });
  }
});

// =======================================================
// PUT /api/users/avatar — Actualizar avatar por URL
// Body: { avatarUrl: "https://..." }
// =======================================================
router.put("/avatar", auth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return res.status(400).json({ msg: "Debes enviar una URL válida de imagen" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl: avatarUrl.trim() },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json({
      msg: "Avatar actualizado correctamente",
      avatarUrl: user.avatarUrl
    });
  } catch (err) {
    console.error("[PUT /avatar]", err.message);
    res.status(500).json({ msg: "Error al actualizar el avatar" });
  }
});

// =======================================================
// POST /api/users/avatar/upload — Subir avatar como archivo
// FormData: { avatar: <file> }
// =======================================================
router.post("/avatar/upload", auth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No se subió ninguna imagen" });
    }

    const publicPath = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl: publicPath },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json({
      msg: "Avatar subido correctamente",
      avatarUrl: user.avatarUrl
    });
  } catch (err) {
    console.error("[POST /avatar/upload]", err.message);
    res.status(500).json({ msg: "Error al subir el avatar" });
  }
});

// =======================================================
// GET /api/users/inventory — Obtener inventario del usuario
// =======================================================
router.get("/inventory", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("purchasedItems");
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user.purchasedItems);
  } catch (err) {
    console.error("[GET /inventory]", err.message);
    res.status(500).json({ msg: "Error al obtener el inventario" });
  }
});

// =======================================================
// DELETE /api/users/inventory/:itemId — Eliminar ítem del inventario
// =======================================================
router.delete("/inventory/:itemId", auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const hadItem = user.purchasedItems.some(id => id.toString() === itemId);
    if (!hadItem) {
      return res.status(404).json({ msg: "Ítem no está en tu inventario" });
    }

    user.purchasedItems = user.purchasedItems.filter(id => id.toString() !== itemId);
    await user.save();

    const populatedUser = await user.populate({
      path: "purchasedItems",
      select: "name description cost currency type"
    });

    res.json({
      msg: "Ítem eliminado correctamente",
      purchasedItems: populatedUser.purchasedItems
    });
  } catch (err) {
    console.error("[DELETE /inventory/:itemId]", err.message);
    res.status(500).json({ msg: "Error al eliminar el ítem" });
  }
});

// =======================================================
// GET /api/users/:id/achievements — Logros de otro usuario
// =======================================================
router.get("/:id/achievements", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user.achievements);
  } catch (err) {
    console.error("[GET /:id/achievements]", err.message);
    res.status(500).json({ msg: "Error al obtener logros del usuario" });
  }
});

// =======================================================
// GET /api/users/achievements — Logros del usuario autenticado
// =======================================================
router.get("/achievements", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json({ achievements: user.achievements });
  } catch (err) {
    console.error("[GET /achievements]", err.message);
    res.status(500).json({ msg: "Error al obtener tus logros" });
  }
});

// =======================================================
// Exportación
// =======================================================
module.exports = router;
