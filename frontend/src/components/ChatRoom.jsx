import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { API_URL } from "../config"; // ✅ 1. Importamos la configuración inteligente
import "./ChatRoom.css";
import SalaDebugger from "./SalaDebugger";

// ❌ Borramos const SOCKET_URL = "http://localhost:5000";

const ChatRoom = ({ roomId: missionId, user }) => {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [roomMongoId, setRoomMongoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [socketReady, setSocketReady] = useState(false);

  const [chatLocked, setChatLocked] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);

  // Estado para mostrar/ocultar la consola de depuración
  const [showDebug, setShowDebug] = useState(false);

  const isAdmin = user.role === "admin" || user.role === "profesor";

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // ✅ 2. Usamos API_URL para conectar el socket
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketReady(true);
      socket.emit("joinRoom", { missionId, userId: user._id });
    });

    socket.on("joinedRoom", async ({ roomId }) => {
      setRoomMongoId(roomId);
      setJoined(true);
      setError(null);

      try {
        await new Promise((res) => setTimeout(res, 300));

        // ✅ 3. Usamos API_URL también para los fetch de historial
        const [msgRes, roomRes] = await Promise.all([
          fetch(`${API_URL}/api/chatrooms/${roomId}/messages`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          fetch(`${API_URL}/api/chatrooms/${roomId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);

        if (!msgRes.ok || !roomRes.ok) throw new Error("Sala no encontrada");

        const messagesData = await msgRes.json();
        const roomData = await roomRes.json();

        setMessages(messagesData);
        setPinnedMessage(roomData.pinnedMessage || null);
      } catch (err) {
        setMessages([]);
        setPinnedMessage(null);
        setError("⚠️ Fallo en enlace de comunicaciones.");
      }
    });

    socket.on("newMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("joinError", () => setError("⚠️ Acceso denegado a la sala."));
    socket.on("chatLocked", ({ message }) => {
      setChatLocked(true);
      setError(message);
    });
    socket.on("chatUnlocked", () => {
      setChatLocked(false);
      setError(null);
    });
    socket.on("blocked", () => setIsBlocked(true));
    socket.on("userBlocked", ({ targetUserId }) => {
      if (targetUserId === user._id) setIsBlocked(true);
    });
    socket.on("userUnblocked", ({ targetUserId }) => {
      if (targetUserId === user._id) setIsBlocked(false);
    });
    socket.on("messagePinned", ({ content }) => setPinnedMessage(content));

    return () => {
      socket.disconnect();
      setSocketReady(false);
    };
  }, [missionId, user._id]);

  useEffect(() => {
    if (joined) {
      const timer = setTimeout(() => setJoined(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [joined]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!content.trim() || !socketRef.current || !roomMongoId || chatLocked || isBlocked) return;

    socketRef.current.emit("chatMessage", {
      senderId: user._id,
      content: content.trim(),
    });

    setContent("");
  };

  const lockChat = () => socketRef.current.emit("lockRoom", roomMongoId);
  const unlockChat = () => socketRef.current.emit("unlockRoom", roomMongoId);
  const blockUser = (targetUserId) =>
    socketRef.current.emit("blockUser", { roomId: roomMongoId, targetUserId });
  const unblockUser = (targetUserId) =>
    socketRef.current.emit("unblockUser", { roomId: roomMongoId, targetUserId });

  const pinMessage = () => {
    if (!content.trim()) return;
    socketRef.current.emit("pinMessage", { roomId: roomMongoId, content: content.trim() });
    setContent("");
  };

  const clearPinnedMessage = async () => {
    try {
      // ✅ 4. Usamos API_URL aquí también
      await fetch(`${API_URL}/api/chatrooms/${roomMongoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ pinnedMessage: "" }),
      });
      setPinnedMessage(null);
    } catch (err) {
      console.error("❌ Error al limpiar pauta:", err);
    }
  };

  return (
    <div className="chat-room">
      {/* Cabecera estilo HUD */}
      <div className="chat-title">
        <div className="title-text">
          📡 CANAL: {missionId === "general" ? "FRECUENCIA GENERAL" : missionId.toUpperCase()}
        </div>
        
        {/* Botón Toggle Debugger */}
        {socketReady && (
          <button 
            className={`btn-debug-toggle ${showDebug ? 'active' : ''}`}
            onClick={() => setShowDebug(!showDebug)}
            title="Abrir Consola de Diagnóstico"
          >
            {showDebug ? '✖ CERRAR DIAG' : '🛠️ SYS_DIAG'}
          </button>
        )}
      </div>

      {/* Avisos de estado */}
      {joined && <div className="chat-hud">✅ Conexión segura establecida</div>}
      {chatLocked && <div className="chat-warning">🔒 CANAL BLOQUEADO POR COMANDO</div>}
      {isBlocked && <div className="chat-error">🚫 TU SEÑAL HA SIDO BLOQUEADA</div>}
      
      {/* Mensaje fijado (Pauta) */}
      {pinnedMessage && (
        <div className="chat-pinned">
          <div>
            📌 <strong>ORDEN PRIORITARIA:</strong> {pinnedMessage}
          </div>
          {isAdmin && (
            <button className="block-btn" onClick={clearPinnedMessage}>
              LIMPIAR
            </button>
          )}
        </div>
      )}

      {/* Área de mensajes */}
      {error && !chatLocked ? (
        <div className="chat-error">{error}</div>
      ) : (
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">... Esperando transmisiones ...</div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${msg.type} ${
                  msg.sender?._id === user._id ? "own" : "other"
                }`}
              >
                <span className="sender">{msg.sender?.username || "Desconocido"}</span>
                <div className="content">{msg.content}</div>
                <span className="timestamp">{msg.time}</span>
                
                {/* Controles de Admin dentro del mensaje */}
                {isAdmin && msg.sender?._id !== user._id && (
                  <div style={{ marginTop: '5px', textAlign: 'right' }}>
                    <button className="block-btn" onClick={() => blockUser(msg.sender._id)} title="Bloquear Usuario">
                      🚫
                    </button>
                    <button className="block-btn unblock-btn" onClick={() => unblockUser(msg.sender._id)} title="Desbloquear Usuario">
                      ✅
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Controles de Moderación (Solo Admin) */}
      {isAdmin && roomMongoId && (
        <div className="moderation-controls">
          <button className="chat-btn" style={{height: '30px', fontSize: '0.7rem'}} onClick={lockChat}>🔒 Bloquear Canal</button>
          <button className="chat-btn" style={{height: '30px', fontSize: '0.7rem'}} onClick={unlockChat}>🔓 Desbloquear Canal</button>
        </div>
      )}

      {/* Input de texto */}
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder={chatLocked ? "🔒 Transmisión deshabilitada" : "Escribir transmisión..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!roomMongoId || !!error || chatLocked || isBlocked}
        />
        <button type="submit" className="chat-btn" disabled={!roomMongoId || !!error || chatLocked || isBlocked}>
          ENVIAR
        </button>

        {isAdmin && (
          <button type="button" className="chat-btn" style={{minWidth: '50px'}} onClick={pinMessage} disabled={!roomMongoId || !!error} title="Fijar mensaje">
            📌
          </button>
        )}
      </form>

      {/* CONSOLA DEBUGGER FLOTANTE */}
      {socketReady && showDebug && (
        <div className="debugger-overlay">
           <div className="debugger-header-bar">
             <span>📟 SYSTEM_MONITOR // V.1.0</span>
           </div>
           <div className="debugger-content">
             <SalaDebugger
              socket={socketRef.current}
              roomMongoId={roomMongoId}
              fetchStatus={error ? "fail" : messages.length > 0 ? "ok" : "pending"}
              error={error}
            />
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;