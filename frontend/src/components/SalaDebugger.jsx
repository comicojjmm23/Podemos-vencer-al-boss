import React, { useEffect, useState } from "react";
import { API_URL } from "../config"; // ✅ 1. Importamos la variable inteligente
import "./SalaDebugger.css";

const SalaDebugger = ({ socket, roomMongoId, fetchStatus, error }) => {
  const [connected, setConnected] = useState(false);
  const [ping, setPing] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);

  // 🎮 Estado de conexión del socket
  useEffect(() => {
    if (!socket || typeof socket.connected === "undefined") return;

    const updateConnection = () => setConnected(socket.connected);

    socket.on("connect", updateConnection);
    socket.on("disconnect", updateConnection);

    // Inicializa estado
    updateConnection();

    return () => {
      socket.off("connect", updateConnection);
      socket.off("disconnect", updateConnection);
    };
  }, [socket]);

  // 🧪 Ping cada 5s si está conectado
  useEffect(() => {
    if (!socket || !socket.connected) return;

    const pingInterval = setInterval(() => {
      const start = Date.now();
      socket.emit("pingCheck", () => {
        const latency = Date.now() - start;
        setPing(latency);
      });
    }, 5000);

    return () => clearInterval(pingInterval);
  }, [socket, connected]);

  // 🧠 Verificación extendida de sala
  useEffect(() => {
    if (!roomMongoId) return;

    const fetchRoomInfo = async () => {
      try {
        // ✅ 2. Usamos API_URL para que el debugger funcione en producción
        const res = await fetch(`${API_URL}/api/chatrooms/debug/${roomMongoId}`);
        const data = await res.json();
        setRoomInfo(data);
      } catch (err) {
        console.error("❌ Error al verificar sala:", err);
        setRoomInfo(null);
      }
    };

    fetchRoomInfo();
  }, [roomMongoId]);

  return (
    <div className="sala-debugger">
      <h3>🧠 SalaDebugger HUD</h3>

      <div className={`status ${connected ? "ok" : "fail"}`}>
        Socket: {connected ? "🟢 Conectado" : "🔴 Desconectado"}
      </div>

      <div className="info">
        Sala ID: <code>{roomMongoId || "⏳ esperando..."}</code>
      </div>

      <div className={`fetch ${fetchStatus === "ok" ? "ok" : fetchStatus === "fail" ? "fail" : "pending"}`}>
        Fetch: {fetchStatus === "ok"
          ? "✅ Mensajes cargados"
          : fetchStatus === "fail"
          ? "❌ Error al cargar mensajes"
          : "⏳ Cargando..."}
      </div>

      {ping !== null && <div className="ping">Ping: {ping}ms</div>}
      {error && <div className="error">⚠️ {error}</div>}

      {roomInfo && (
        <div className="room-info">
          <hr />
          <div className={`existence ${roomInfo.exists ? "ok" : "fail"}`}>
            Sala: {roomInfo.exists ? "✅ Existe" : "❌ No encontrada"}
          </div>
          {roomInfo.title && <div className="title">Título: {roomInfo.title}</div>}
          <div className="count">Mensajes: {roomInfo.messageCount}</div>
        </div>
      )}
    </div>
  );
};

export default SalaDebugger;