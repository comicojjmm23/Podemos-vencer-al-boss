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

// 👇 NUEVA LÓGICA CORS (LEER MÚLTIPLES ORÍGENES SEPARADOS POR COMA) 👇

// Define la lista de orígenes permitidos, separando por comas.
// Si la variable no existe, usa localhost para desarrollo.
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) // Lee y limpia espacios
  : ['http://localhost:3000', 'http://localhost:5000']; 

// Función para validar el origen entrante. Necesaria si se usa credentials: true.
const corsOriginValidator = (origin, callback) => {
    // 1. Permite peticiones sin origen (ej: Postman, curl, aplicaciones nativas)
    if (!origin) return callback(null, true);
    
    // 2. Permite si el origen está en la lista de ALLOWED_ORIGINS
    if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
    }
    
    // 3. Bloquea cualquier otro
    const msg = `El origen ${origin} no está permitido por la política CORS.`;
    callback(new Error(msg), false);
};

// =======================================================
// 3. Middlewares base
// =======================================================
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 🌐 Configuración CORS para Express
app.use(cors({
  origin: corsOriginValidator, // Usamos la nueva función para soportar múltiples orígenes
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // Crucial si manejas tokens o cookies de sesión
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
app.use("/api", require("./routes/chat.routes")); 

// =======================================================
// 7. Manejo de errores
// =======================================================
app.use((req, res) => {
  res.status(404).json({ msg: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("💥 Error global:", err);
  // Manejamos errores de CORS para dar un mensaje más claro
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ msg: "Acceso denegado por política de seguridad (CORS). Verifica tu origen." });
  }
  res.status(err.status || 500).json({ msg: err.message || "Error del servidor" });
});

// =======================================================
// 8. Socket.IO — Chat en tiempo real
// =======================================================
const io = new Server(server, {
  cors: {
    origin: corsOriginValidator, // ⬅️ Aplicamos la misma función de validación aquí
    methods: ["GET", "POST"],
    credentials: true // Necesario para la sesión de Socket.IO
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
    console.log(`🌐 Orígenes CORS permitidos: ${ALLOWED_ORIGINS.join(', ')}`); // ⬅️ Nuevo log útil
  });
});