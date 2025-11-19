// =======================================================
// MissionCard.jsx — Tarjeta de Misión (Lógica Blindada - Final Fix)
// =======================================================
import React from 'react';
import './MissionCard.css';

const MissionCard = ({
  mission,
  onSubmitFile,    // función para entregar archivo
  onOpenSurvey,    // función para abrir encuesta
  onApprove,       // (Admin) aprobar
  onReject,        // (Admin) rechazar
  onOpenChat,      // abrir chat
  completed        // bool que viene del padre
}) => {

  // 1. Determinar clase de dificultad para colores
  const difficultyClass =
    mission.difficulty === 'facil' ? 'easy' :
    mission.difficulty === 'medio' ? 'medium' : 'hard';

  // 2. LÓGICA FINAL DE COMPLETADO BASADA EN EL TIPO DE MISIÓN
  let isReallyCompleted = completed || Boolean(mission.submittedFile);
  
  // AÑADIMOS CHEQUEO ESPECÍFICO PARA ENCUESTAS Y OTROS ESTADOS COMUNES
  if (mission.type === 'survey') {
    // Si la misión es encuesta, verificamos si existe un flag de envío de encuesta
    // Asumimos que el backend podría enviar: mission.submittedSurvey o mission.isSurveyCompleted
    isReallyCompleted = isReallyCompleted || mission.submittedSurvey || mission.isSurveyCompleted;
  }
  
  // Refuerzo final para cualquier flag booleano que el backend envíe:
  isReallyCompleted = isReallyCompleted || mission.completed === true || mission.status === 'completed';

  return (
    <article
      className={`mission-review-card ${difficultyClass} ${isReallyCompleted ? 'completed' : ''}`}
      role="group"
      aria-labelledby={`mission-title-${mission._id}`}
    >
      {/* --- HEADER DE LA MISIÓN --- */}
      <header className="mission-header">
        <h4 id={`mission-title-${mission._id}`} className="mission-title">
          {mission.title}
        </h4>

        {/* Badge de Estado */}
        <div className="mission-checklist">
          <div className={`status-badge ${isReallyCompleted ? 'status-complete' : 'status-pending'}`}>
            {isReallyCompleted ? "✅ COMPLETADA" : "⏳ PENDIENTE"}
          </div>
        </div>
      </header>

      {/* --- INFORMACIÓN --- */}
      <div className="mission-info">
        <span className="mission-difficulty-tag">
          {mission.difficulty ? mission.difficulty.toUpperCase() : "NORMAL"}
        </span>
        <span className="mission-reward-tag">
          +{mission.xpReward || 0} XP | {mission.coinsReward || 0} 🪙
        </span>
      </div>

      {/* --- CONTENIDO CONDICIONAL --- */}
      
      {/* CASO 1: COMPLETADA (Mostramos el éxito, ocultamos botones de acción) */}
      {isReallyCompleted ? (
        <div className="mission-completed-state">
          <div className="mission-hud-success">
            🎉 ¡MISIÓN CUMPLIDA!
          </div>
          
          {/* Si hay archivo, lo mostramos */}
          {mission.submittedFile && (
            <div className="submitted-file-box">
              <span className="icon">📎</span>
              <span className="text">Archivo: {mission.submittedFile}</span>
            </div>
          )}

           {/* Si hay mensaje del estudiante, lo mostramos */}
          {mission.studentMessage && (
             <div className="student-message-box">
               💬 "{mission.studentMessage}"
             </div>
          )}
          
          {/* Si NO hay archivo pero está completa (ej. Encuesta), mostramos mensaje genérico */}
          {!mission.submittedFile && (
             <div className="student-message-box" style={{fontStyle: 'italic', color:'#00ffaa'}}>
               ✅ Registro de actividad confirmado.
             </div>
          )}
        </div>
      ) : (
        /* CASO 2: PENDIENTE (Mostramos botones para completar) */
        <div className="mission-pending-state">
           
           {/* Botón para subir archivo */}
           {mission.type === "file" && onSubmitFile && (
              <button
                className="mission-action-btn submit"
                onClick={() => onSubmitFile(mission._id)}
              >
                📤 ENTREGAR TAREA
              </button>
           )}

           {/* Botón para encuestas */}
           {mission.type === "survey" && onOpenSurvey && (
              <button
                className="mission-action-btn survey"
                onClick={() => onOpenSurvey(mission._id)}
              >
                📋 RESPONDER ENCUESTA
              </button>
           )}
        </div>
      )}

      {/* --- FOOTER DE ACCIONES (Chat y Admin) --- */}
      <div className="actions-footer">
        {onOpenChat && (
          <button
            className="mission-action-btn chat"
            onClick={() => onOpenChat(mission._id)}
            title="Abrir canal de comunicaciones"
          >
            💬 CHAT
          </button>
        )}

        {/* Botones de Admin (Solo aparecen si se pasan las funciones) */}
        {onApprove && (
          <button className="mission-action-btn approve" onClick={() => onApprove(mission._id)}>
            ✔️ APROBAR
          </button>
        )}
        {onReject && (
          <button className="mission-action-btn reject" onClick={() => onReject(mission._id)}>
            ❌ RECHAZAR
          </button>
        )}
      </div>

    </article>
  );
};

export default MissionCard;