// ========================================================
// routes/mission.routes.js
// ========================================================
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/upload'); // debe exponer .single(fieldName)
const authorizeRole = require('../middleware/role');

const Mission = require('../models/Mission');
const User = require('../models/User');
const MissionSubmission = require('../models/MissionSubmission');
const MissionHistory = require('../models/MissionHistory');
const SurveyResponse = require('../models/SurveyResponse');

const { checkAchievements } = require("../utils/achievementSystem"); // 👈 Logros

const ADMIN_ROLES = ['admin', 'teacher'];

// ========================================================
// CONTROLADORES
// ========================================================

// [A] LISTAR MISIONES ACTIVAS (Jugador)
const getMissions = async (req, res) => {
  try {
    const missions = await Mission.find({ isActive: true });
    res.json(missions);
  } catch (err) {
    console.error('GET MISSIONS ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor' });
  }
};

// [A.1] LISTAR TODAS LAS MISIONES (Admin/Profesor)
const getAllMissions = async (req, res) => {
  try {
    const missions = await Mission.find().sort({ createdAt: -1 });
    res.json(missions);
  } catch (err) {
    console.error('GET ALL MISSIONS ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor' });
  }
};

// [A.2] HISTORIAL DE MISIONES POR JUGADOR (formateado para frontend)
const getMissionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await MissionHistory.find({ user: userId })
      .populate('mission', 'title xpReward coinsReward difficulty type')
      .sort({ completedAt: -1 });

    const formatted = history.map((entry) => ({
      missionName: entry.mission?.title || 'Sin título',
      xpEarned: entry.xpEarned,
      coinsEarned: entry.coinsEarned,
      completedAt: entry.completedAt,
      missionType: entry.mission?.type || 'file',
      difficulty: entry.mission?.difficulty || 'easy',
      status: entry.status || 'completed' // 👈 aquí añadimos el estado
    }));

    res.json(formatted);
  } catch (err) {
    console.error('GET HISTORY ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor al obtener el historial.' });
  }
};



// [B] CREAR MISIÓN (Admin/Profesor)
const createMission = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      xpReward,
      coinsReward,
      isActive,
      type,
      questions
    } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({ msg: 'Faltan campos obligatorios' });
    }

    const missionData = {
      title,
      description,
      difficulty,
      type, // "survey" o "file"
      xpReward: Number.parseInt(xpReward ?? 0, 10) || 0,
      coinsReward: Number.parseInt(coinsReward ?? 0, 10) || 0,
      isActive: typeof isActive === 'boolean' ? isActive : true
    };

    if (type === 'survey') {
      missionData.questions = Array.isArray(questions) ? questions : [];
    }

    const mission = new Mission(missionData);
    await mission.save();

    res.status(201).json(mission);
  } catch (err) {
    console.error('CREATE MISSION ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor al crear misión' });
  }
};

// [C] ACTUALIZAR MISIÓN (Admin/Profesor)
const updateMission = async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!mission) {
      return res.status(404).json({ msg: 'Misión no encontrada.' });
    }
    res.json(mission);
  } catch (err) {
    console.error('UPDATE MISSION ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor' });
  }
};

// [D] ELIMINAR MISIÓN (Admin/Profesor)
const deleteMission = async (req, res) => {
  try {
    const missionId = req.params.id;

    await MissionSubmission.deleteMany({ mission: missionId });
    await MissionHistory.deleteMany({ mission: missionId });
    await SurveyResponse.deleteMany({ mission: missionId });

    const mission = await Mission.findByIdAndDelete(missionId);
    if (!mission) {
      return res.status(404).json({ msg: 'Misión no encontrada.' });
    }

    res.json({ msg: 'Misión eliminada correctamente.' });
  } catch (err) {
    console.error('DELETE MISSION ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor' });
  }
};

// [E] SUBMIT MISSION DE ARCHIVO (Jugador)
const submitMission = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No se subió ningún archivo de entrega.' });
  }

  const { id: missionId } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  try {
    const mission = await Mission.findById(missionId);
    if (!mission || !mission.isActive || mission.type !== 'file') {
      return res.status(404).json({ msg: 'Misión no encontrada, inactiva o no es de archivo.' });
    }

    const existingSubmission = await MissionSubmission.findOne({
      user: userId,
      mission: missionId,
      status: { $in: ['pending', 'approved'] }
    });
    if (existingSubmission) {
      return res.status(400).json({ msg: 'Ya tienes una entrega pendiente o aprobada.' });
    }

    const newSubmission = new MissionSubmission({
      user: userId,
      mission: missionId,
      filePath: req.file.filename,
      message
    });

    await newSubmission.save();

    res.json({
      msg: 'Tarea entregada con éxito. El profesor la revisará pronto.',
      submission: newSubmission
    });
  } catch (err) {
    console.error('SUBMIT FILE MISSION ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor al procesar la entrega.' });
  }
};

// [E.1] SUBMIT ENCUESTA (Jugador)
const submitSurvey = async (req, res) => {
  const { id: missionId } = req.params;
  const userId = req.user.id;
  const { answers } = req.body;

  try {
    const mission = await Mission.findById(missionId);
    if (!mission || mission.type !== 'survey' || !mission.isActive) {
      return res.status(404).json({ msg: 'Encuesta no encontrada o inactiva.' });
    }

    const existing = await SurveyResponse.findOne({ mission: missionId, user: userId });
    if (existing) {
      return res.status(400).json({ msg: 'Ya respondiste esta encuesta.' });
    }

    const response = new SurveyResponse({ mission: missionId, user: userId, answers });
    await response.save();

    // Recompensas inmediatas
    const user = await User.findById(userId);
    user.xp += mission.xpReward;
    user.coins += mission.coinsReward;

    const xpNeededForNextLevel = user.level * 1000;
    if (user.xp >= xpNeededForNextLevel) {
      user.level += 1;
      user.xp -= xpNeededForNextLevel;
    }
    await user.save();

    const missionHistory = new MissionHistory({
      user: userId,
      mission: missionId,
      status: 'completed',
      xpEarned: mission.xpReward,
      coinsEarned: mission.coinsReward,
      completedAt: new Date()
    });
    await missionHistory.save();

    // 🏆 Disparador de logros por misiones completadas (encuestas cuentan como misión)
    const completedMissions = await MissionHistory.countDocuments({ user: userId, status: "completed" });
    await checkAchievements(userId, "missionsCompleted", completedMissions);

    res.json({ msg: 'Encuesta enviada con éxito.', response });
  } catch (err) {
    console.error('SUBMIT SURVEY ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor al enviar encuesta.' });
  }
};

// [F] OBTENER ENTREGAS PENDIENTES (Admin/Profesor)
const getPendingSubmissions = async (req, res) => {
  try {
    const pendingSubmissions = await MissionSubmission.find({ status: 'pending' })
      .populate('user', 'username email level')
      .populate('mission', 'title xpReward coinsReward difficulty')
      .sort({ submittedAt: 1 });

    res.json(pendingSubmissions);
  } catch (err) {
    console.error('GET PENDING SUBMISSIONS ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor al obtener entregas pendientes.' });
  }
};

// [G] REVISAR ENTREGA (Admin/Profesor)
const reviewSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { action } = req.body;

  try {
    const submission = await MissionSubmission.findById(submissionId)
      .populate('mission')
      .populate('user');

    if (!submission || submission.status !== 'pending') {
      return res.status(400).json({ msg: 'Entrega no encontrada o ya revisada.' });
    }

    if (action === 'approve') {
      const mission = submission.mission;
      const user = submission.user;

      if (!submission.isRewarded) {
        // Aplicar recompensas
        user.xp += mission.xpReward;
        user.coins += mission.coinsReward;

        const xpNeededForNextLevel = user.level * 1000;
        if (user.xp >= xpNeededForNextLevel) {
          user.level += 1;
          user.xp -= xpNeededForNextLevel;
        }

        const missionHistory = new MissionHistory({
          user: user._id,
          mission: mission._id,
          status: 'completed',
          xpEarned: mission.xpReward,
          coinsEarned: mission.coinsReward,
          completedAt: new Date()
        });
        await missionHistory.save();

        await user.save();
        submission.isRewarded = true;
      }

      submission.status = 'approved';
      await submission.save();

      // 🏆 Disparador de logros por misiones completadas (aprobación de archivo)
      const completedMissions = await MissionHistory.countDocuments({ user: submission.user._id, status: "completed" });
      await checkAchievements(submission.user._id, "missionsCompleted", completedMissions);

      return res.json({ msg: 'Entrega aprobada y recompensas aplicadas.', user, submission });
    }

    if (action === 'reject') {
      submission.status = 'rejected';
      await submission.save();
      return res.json({ msg: 'Entrega rechazada.' });
    }

    return res.status(400).json({ msg: 'Acción no válida.' });
  } catch (err) {
    console.error('REVIEW SUBMISSION ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor al revisar la entrega.' });
  }
};

// [H] LISTAR RESPUESTAS DE ENCUESTA (Admin/Profesor)
const getSurveyResponses = async (req, res) => {
  try {
    const { id } = req.params; // missionId
    const responses = await SurveyResponse.find({ mission: id })
      .populate('user', 'username email');
    res.json(responses);
  } catch (err) {
    console.error('GET SURVEY RESPONSES ERROR:', err.message);
    res.status(500).json({ msg: 'Error del Servidor al obtener respuestas.' });
  }
};

// ========================================================
// RUTAS
// ========================================================

// Jugador
router.get('/', getMissions);
router.get('/history', auth, getMissionHistory);
router.post('/submit/:id', auth, upload.single('submissionFile'), submitMission); // file mission
router.post('/survey/submit/:id', auth, submitSurvey); // survey mission

// Admin/Profesor
router.get('/admin', auth, authorizeRole(ADMIN_ROLES), getAllMissions);
router.post('/', auth, authorizeRole(ADMIN_ROLES), createMission);
router.put('/:id', auth, authorizeRole(ADMIN_ROLES), updateMission);
router.delete('/:id', auth, authorizeRole(ADMIN_ROLES), deleteMission);
router.get('/submissions/pending', auth, authorizeRole(ADMIN_ROLES), getPendingSubmissions);
router.post('/review/:submissionId', auth, authorizeRole(ADMIN_ROLES), reviewSubmission);
router.get('/survey/responses/:id', auth, authorizeRole(ADMIN_ROLES), getSurveyResponses);

module.exports = router;
