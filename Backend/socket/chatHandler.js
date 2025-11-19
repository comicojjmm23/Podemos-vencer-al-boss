const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const User = require("../models/User");

const blockedUsersByRoom = new Map(); // roomId => Set(userIds)

module.exports = (io, socket) => {
  // =======================================================
  // Evento: Unirse a sala
  // =======================================================
  socket.on("joinRoom", async ({ missionId, userId }) => {
    try {
      if (!missionId || !userId) {
        socket.emit("joinError", { message: "Datos incompletos para unirse a la sala" });
        return;
      }

      const user = await User.findById(userId);
      socket.isAdmin = user?.role === "admin" || user?.role === "profesor";

      let room;
      if (missionId === "general") {
        room = await ChatRoom.findOne({ title: "Chat General" });
        if (!room) {
          room = new ChatRoom({ title: "Chat General", createdBy: userId, participants: [userId] });
          await room.save();
        }
      } else {
        room = await ChatRoom.findOne({ mission: missionId });
        if (!room) {
          room = new ChatRoom({
            title: `Sala misión ${missionId}`,
            mission: missionId,
            createdBy: userId,
            participants: [userId]
          });
          await room.save();
        }
      }

      const roomId = room._id.toString();

      if (blockedUsersByRoom.get(roomId)?.has(userId)) {
        socket.emit("blocked", { message: "🚫 Has sido bloqueado por el profesor." });
        return;
      }

      socket.join(roomId);
      socket.roomMongoId = roomId;
      socket.userId = userId;

      socket.emit("joinedRoom", {
        roomId,
        title: room.title,
        pinnedMessage: room.pinnedMessage || "",
        locked: room.locked || false
      });
    } catch (err) {
      socket.emit("joinError", { message: "No se pudo unir a la sala" });
    }
  });

  // =======================================================
  // Evento: Enviar mensaje
  // =======================================================
  socket.on("chatMessage", async ({ senderId, content }) => {
    try {
      const roomId = socket.roomMongoId;
      if (!roomId || !senderId || !content?.trim()) {
        socket.emit("messageError", { message: "Mensaje inválido o sin sala." });
        return;
      }

      const room = await ChatRoom.findById(roomId);
      if (room.locked && !socket.isAdmin) {
        socket.emit("messageError", { message: "🔒 El chat está bloqueado por el profesor." });
        return;
      }

      if (blockedUsersByRoom.get(roomId)?.has(senderId)) {
        socket.emit("messageError", { message: "🚫 No puedes enviar mensajes en esta sala." });
        return;
      }

      const rawMessage = await Message.create({
        room: roomId,
        sender: senderId,
        content: content.trim(),
        type: "text"
      });

      const populatedMessage = await rawMessage.populate("sender", "username");

      io.to(roomId).emit("newMessage", {
        sender: {
          _id: populatedMessage.sender._id,
          username: populatedMessage.sender.username
        },
        content: populatedMessage.content,
        type: populatedMessage.type,
        time: populatedMessage.time,
        createdAt: populatedMessage.createdAt
      });
    } catch (err) {
      socket.emit("messageError", { message: "No se pudo enviar el mensaje." });
    }
  });

  // =======================================================
  // Evento: Bloquear / desbloquear usuario
  // =======================================================
  socket.on("blockUser", ({ roomId, targetUserId }) => {
    if (!socket.isAdmin) return;
    if (!blockedUsersByRoom.has(roomId)) blockedUsersByRoom.set(roomId, new Set());
    blockedUsersByRoom.get(roomId).add(targetUserId);
    io.to(roomId).emit("userBlocked", { targetUserId });
  });

  socket.on("unblockUser", ({ roomId, targetUserId }) => {
    if (!socket.isAdmin) return;
    blockedUsersByRoom.get(roomId)?.delete(targetUserId);
    io.to(roomId).emit("userUnblocked", { targetUserId });
  });

  // =======================================================
  // Evento: Bloquear / desbloquear sala (persistente)
  // =======================================================
  socket.on("lockRoom", async (roomId) => {
    if (!socket.isAdmin) return;
    try {
      await ChatRoom.findByIdAndUpdate(roomId, { locked: true });
      io.to(roomId).emit("chatLocked", { message: "🔒 El chat ha sido bloqueado por el profesor." });
    } catch (err) {
      console.error("❌ Error al bloquear sala:", err.message);
    }
  });

  socket.on("unlockRoom", async (roomId) => {
    if (!socket.isAdmin) return;
    try {
      await ChatRoom.findByIdAndUpdate(roomId, { locked: false });
      io.to(roomId).emit("chatUnlocked", { message: "✅ El chat ha sido desbloqueado." });
    } catch (err) {
      console.error("❌ Error al desbloquear sala:", err.message);
    }
  });

  // =======================================================
  // Evento: Fijar pauta (mensaje anclado)
  // =======================================================
  socket.on("pinMessage", async ({ roomId, content }) => {
    if (!socket.isAdmin || !roomId || !content?.trim()) return;

    try {
      await ChatRoom.findByIdAndUpdate(roomId, { pinnedMessage: content.trim() });
      io.to(roomId).emit("messagePinned", {
        content: content.trim(),
        pinnedBy: socket.userId
      });
    } catch (err) {
      console.error("❌ Error al fijar pauta:", err.message);
      socket.emit("messageError", { message: "No se pudo fijar la pauta." });
    }
  });

  // =======================================================
  // Evento: Desconexión
  // =======================================================
  socket.on("disconnect", () => {
    console.log("👋 Jugador desconectado");
  });
};
