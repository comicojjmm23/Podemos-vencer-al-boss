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

// 👇 LÓGICA CORS DEFINITIVA: SOPORTE DINÁMICO DE ORÍGENES CON CREDENTIALS: TRUE 👇

// Lista de orígenes permitidos (incluyendo el comodín de Vercel)
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5000']; 

// Función para generar la configuración de CORS en tiempo de ejecución
const corsOptions = {
    // La función 'origin' verifica si el origen entrante está permitido 
    // y lo refleja en la cabecera 'Access-Control-Allow-Origin'.
    origin: (origin, callback) => {
        // 1. Permitir peticiones sin origen (ej: Postman, apps nativas).
        if (!origin) return callback(null, true);

        // 2. Comprobar si hay una coincidencia con la lista estricta
        let originIsAllowed = false;

        for (const allowed of ALLOWED_ORIGINS) {
            // Coincidencia exacta
            if (allowed === origin) {
                originIsAllowed = true;
                break;
            }

            // Coincidencia con comodín (ej: *.vercel.app)
            if (allowed.includes('*')) {
                // Crear una expresión regular para validar el subdominio
                const regex = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
                if (regex.test(origin)) {
                    originIsAllowed = true;
                    break;
                }
            }
        }
        
        // 3. Devolver el resultado de la validación
        if (originIsAllowed) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`), false);
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false // ⬅️ CAMBIO: Si solo usas JWT, pon esto a false para relajar la restricción CORS.
};

// =======================================================
// 3. Middlewares base
// =======================================================
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// 🌐 Configuración CORS para Express
app.use(cors(corsOptions)); // ⬅️ Usamos el objeto de configuración dinámico
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
    origin: corsOptions.origin, // ⬅️ Aplicamos la misma función de validación aquí
    methods: ["GET", "POST"],
    credentials: false // ⬅️ CAMBIO: Si solo usas JWT, pon esto a false
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
    console.log(`🌐 Orígenes CORS permitidos (Raw): ${process.env.CORS_ORIGIN || ALLOWED_ORIGINS.join(', ')}`); 
  });
});