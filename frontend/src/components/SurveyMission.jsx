// =======================================================
// SurveyMission.jsx
// Componente para responder encuestas tipo misión
// =======================================================

import React, { useState } from 'react';
import { API_URL } from '../config'; // ✅ 1. Importamos la variable inteligente
import './SurveyMission.css';

const SurveyMission = ({ mission, token, onBack, onSuccess }) => {
  const [answers, setAnswers] = useState({});

  const handleChange = (qIndex, value) => {
    setAnswers({ ...answers, [qIndex]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ 2. Usamos la variable API_URL
      const res = await fetch(`${API_URL}/api/missions/survey/submit/${mission._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        alert(data.msg || 'Error al enviar encuesta');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="survey-card neon-card">
      <h2 className="survey-title">📝 {mission.title}</h2>
      <p className="survey-description">{mission.description}</p>

      {mission.questions?.map((q, i) => (
        <div key={i} className="survey-question">
          <h3 className="question-text">❓ {q.question}</h3>
          <div className="options-grid">
            {q.options.map((opt, j) => (
              <label
                key={j}
                className={`option-btn ${answers[i] === opt ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`q-${i}`}
                  value={opt}
                  onChange={() => handleChange(i, opt)}
                  required
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="survey-actions">
        <button type="button" onClick={onBack} className="btn-secondary">
          ← Volver
        </button>
        <button type="submit" className="btn-primary neon-glow">
          🚀 Enviar respuestas
        </button>
      </div>
    </form>
  );
};

export default SurveyMission;