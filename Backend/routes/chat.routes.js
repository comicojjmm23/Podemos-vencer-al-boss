const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");

// 🔧 Verifica si el ID es válido para MongoDB
const isValidMongoId = (id) => /^[a-f\d]{24}$/i.test(id);

// 🔍 Resolver sala por ID o alias "general"
const resolveRoom = async (idOrAlias) => {
  if (idOrAlias === "general") {
    let room = await ChatRoom.findOne({ title: "Chat General" });
    if (!room) {
      room = new ChatRoom({
        title: "Chat General",
        createdBy: null,
        participants: []
      });
      await room.save();
      console.log("🆕 Sala 'Chat General' creada desde resolveRoom");
    }
    return room;
  }

  if (!isValidMongoId(idOrAlias)) {
    console.warn("⚠️ ID inválido para MongoDB:", idOrAlias);
    return null;
  }

  const room = await ChatRoom.findById(idOrAlias);
  if (!room) {
    console.warn("⚠️ Sala no encontrada en MongoDB:", idOrAlias);
    return null;
  }

  return room;
};

//
// 🛠️ CREACIÓN DE SALAS
//

// Crear sala libre
router.post("/chatrooms", auth, async (req, res) => {
  try {
    const { title, missionId } = req.body;
    if (!title?.trim()) return res.status(400).json({ msg: "Falta el título de la sala" });

    const room = new ChatRoom({
      title: title.trim(),
      mission: missionId || null,
      createdBy: req.user.id,
      participants: [req.user.id]
    });

    await room.save();
    res.json({ msg: "Sala creada correctamente", room });
  } catch (err) {
    console.error("[POST /chatrooms]", err.message);
    res.status(500).json({ msg: "Error al crear la sala" });
  }
});

// Crear sala de misión
router.post("/chatrooms/mission", auth, async (req, res) => {
  try {
    const { title, missionId } = req.body;
    if (!title?.trim() || !missionId) {
      return res.status(400).json({ msg: "Faltan el título o la misión" });
    }

    const room = new ChatRoom({
      title: title.trim(),
      mission: missionId,
      createdBy: req.user.id,
      participants: [req.user.id]
    });

    await room.save();
    res.json({ msg: "Sala de misión creada", room });
  } catch (err) {
    console.error("[POST /chatrooms/mission]", err.message);
    res.status(500).json({ msg: "Error al crear sala de misión" });
  }
});

//
// 📋 CONSULTAS DE SALAS
//

// Listar todas las salas
router.get("/chatrooms", auth, async (req, res) => {
  try {
    const rooms = await ChatRoom.find()
      .populate("createdBy", "username email")
      .populate("mission", "title");

    res.json(rooms);
  } catch (err) {
    console.error("[GET /chatrooms]", err.message);
    res.status(500).json({ msg: "Error al obtener las salas" });
  }
});

// Obtener datos de una sala (incluye pauta y estado de bloqueo)
router.get("/chatrooms/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await resolveRoom(id);
    if (!room) return res.status(404).json({ msg: "Sala no encontrada" });

    res.json({
      _id: room._id,
      title: room.title,
      mission: room.mission,
      createdBy: room.createdBy,
      pinnedMessage: room.pinnedMessage || "",
      locked: room.locked || false
    });
  } catch (err) {
    console.error("[GET /chatrooms/:id]", err.message);
    res.status(500).json({ msg: "Error al obtener la sala" });
  }
});

//
// 📨 MENSAJES
//

// Obtener mensajes de una sala
router.get("/chatrooms/:id/messages", auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 GET mensajes para sala:", id);
    const room = await resolveRoom(id);
    if (!room) return res.status(404).json({ msg: "Sala no encontrada" });

    const messages = await Message.find({ room: room._id })
      .populate("sender", "username avatarUrl")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("[GET /chatrooms/:id/messages]", err.message);
    res.status(500).json({ msg: "Error al obtener mensajes" });
  }
});

// Enviar mensaje a una sala
router.post("/chatrooms/:id/messages", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ msg: "El mensaje no puede estar vacío" });
    }

    const room = await resolveRoom(id);
    if (!room) return res.status(404).json({ msg: "Sala no encontrada" });

    const msg = new Message({
      room: room._id,
      sender: req.user.id,
      content: content.trim(),
      type: "text"
    });

    await msg.save();
    const populatedMsg = await msg.populate("sender", "username avatarUrl");

    res.json({ msg: "Mensaje enviado", message: populatedMsg });
  } catch (err) {
    console.error("[POST /chatrooms/:id/messages]", err.message);
    res.status(500).json({ msg: "Error al enviar mensaje" });
  }
});

//
// 🧪 DEBUG / VERIFICACIÓN
//

router.get("/chatrooms/debug/:id", async (req, res) => {
  const { id } = req.params;
  const isValid = isValidMongoId(id);
  if (!isValid) return res.status(400).json({ valid: false, msg: "ID inválido" });

  const room = await ChatRoom.findById(id);
  if (!room) return res.status(404).json({ valid: true, exists: false });

  const messages = await Message.find({ room: room._id });
  res.json({
    valid: true,
    exists: true,
    title: room.title,
    messageCount: messages.length,
    locked: room.locked || false
  });
});

module.exports = router;
