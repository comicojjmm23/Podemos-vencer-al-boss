// =======================================================
// 1. Dependencias y configuración
// =======================================================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");

// =======================================================
// 2. Inicialización
// =======================================================
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const DB_URI = process.env.MONGO_URI;

// =======================================================
// 3. Middlewares base
// =======================================================
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================================
// 4. Archivos estáticos
// =======================================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================================================
// 5. Conexión a MongoDB
// =======================================================
const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("✅ MongoDB conectado con éxito");
  } catch (err) {
    console.error("❌ Error de conexión a MongoDB:", err.message);
    process.exit(1);
  }
};

// =======================================================
// 6. Rutas
// =======================================================
app.get("/", (req, res) => {
  res.send({ message: "⚔️ Backend activo | Podemos vencer al Boss!" });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/ranking", require("./routes/ranking.routes"));
app.use("/api/missions", require("./routes/mission.routes"));
app.use("/api/store", require("./routes/store.routes"));
app.use("/api", require("./routes/chat.routes")); // ✅ cambio clave aquí

// =======================================================
// 7. Manejo de errores
// =======================================================
app.use((req, res) => {
  res.status(404).json({ msg: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("💥 Error global:", err);
  res.status(err.status || 500).json({ msg: err.message || "Error del servidor" });
});

// =======================================================
// 8. Socket.IO — Chat en tiempo real
// =======================================================
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

const setupChatHandlers = require("./socket/chatHandler");

io.on("connection", (socket) => {
  console.log("🎮 Nuevo jugador conectado");
  setupChatHandlers(io, socket);
});

// =======================================================
// 9. Iniciar servidor solo si MongoDB está listo
// =======================================================
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`📡 Servidor en puerto ${PORT}`);
    console.log(`🗂️ Static files: http://localhost:${PORT}/uploads`);
    console.log(`🧠 Socket.IO activo en /socket.io`);
  });
});
