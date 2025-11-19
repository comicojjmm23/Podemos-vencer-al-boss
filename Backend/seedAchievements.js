// =======================================================
// seedAchievements.js — Inserta logros iniciales en MongoDB Atlas
// =======================================================
require("dotenv").config();
const mongoose = require("mongoose");
const Achievement = require("./models/Achievement");

const achievements = [
  {
    code: "WELCOME",
    title: "Bienvenido Guerrero",
    description: "Te registraste en la plataforma. ¡Comienza la aventura!",
    iconUrl: "/icons/welcome.png",
    key: "accountCreated",
    threshold: 0
  },
  {
    code: "FIRST_MISSION",
    title: "Primer Paso",
    description: "Completaste tu primera misión. ¡El viaje comienza!",
    iconUrl: "/icons/mission1.png",
    key: "missionsCompleted",
    threshold: 1
  },
  {
    code: "MISSIONS_2",
    title: "Doble Hack-n-Slash",
    description: "Completaste 2 misiones. ¡Gran comienzo!",
    iconUrl: "/icons/mission2.png",
    key: "missionsCompleted",
    threshold: 2
  },
  {
    code: "MISSIONS_5",
    title: "Héroe en Ascenso",
    description: "Completaste 5 misiones. ¡Ya eres un referente!",
    iconUrl: "/icons/mission5.png",
    key: "missionsCompleted",
    threshold: 5
  },
  {
    code: "MISSIONS_10",
    title: "Maestro de Aventuras",
    description: "Completaste 10 misiones. ¡Eres un verdadero guerrero!",
    iconUrl: "/icons/mission10.png",
    key: "missionsCompleted",
    threshold: 10
  },
  {
    code: "COINS_500",
    title: "Avaro del Tesoro",
    description: "Acumulaste 500 monedas. ¡El oro fluye en tus manos!",
    iconUrl: "/icons/coins.png",
    key: "coinsCollected",
    threshold: 500
  },
  {
    code: "COINS_1000",
    title: "Banquero del Reino",
    description: "Acumulaste 1000 monedas. ¡Eres rico en gloria y oro!",
    iconUrl: "/icons/coins2.png",
    key: "coinsCollected",
    threshold: 1000
  },
  {
    code: "LEVEL_5",
    title: "Subida de Nivel",
    description: "Alcanzaste el nivel 5. ¡Tu poder crece!",
    iconUrl: "/icons/level5.png",
    key: "levelReached",
    threshold: 5
  },
  {
    code: "LEVEL_10",
    title: "Veterano",
    description: "Alcanzaste el nivel 10. ¡Un verdadero héroe!",
    iconUrl: "/icons/level10.png",
    key: "levelReached",
    threshold: 10
  },
  {
    code: "FIRST_PURCHASE",
    title: "Comprador Novato",
    description: "Realizaste tu primera compra en la tienda.",
    iconUrl: "/icons/store.png",
    key: "itemPurchased",
    threshold: 1
  }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ Conectado a MongoDB Atlas:", mongoose.connection.name);
    await Achievement.deleteMany({});
    await Achievement.insertMany(achievements);
    console.log(`🏆 ${achievements.length} logros insertados correctamente`);
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error al insertar logros:", err.message);
    process.exit(1);
  }
})();
