import React, { useState } from 'react';
import './MissionForm.css';
import MissionToast from './MissionToast';
import FileMissionSubmitHUD from './FileMissionSubmitHUD'; // HUD de entrega

const MissionForm = ({ token }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    type: '',
    questions: [{ text: '', correctAnswer: 'sí' }], // 👈 cada pregunta con respuesta correcta
  });

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [createdMissionId, setCreatedMissionId] = useState(null);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { text: '', correctAnswer: 'sí' }],
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'easy',
      type: '',
      questions: [{ text: '', correctAnswer: 'sí' }],
    });
    setStatus('idle');
    setErrorMsg('');
    setCreatedMissionId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.type) {
      setErrorMsg("⚠️ Faltan campos obligatorios.");
      setStatus("error");
      setToast({ message: "Faltan campos obligatorios", type: "error" });
      return;
    }

    try {
      setStatus("loading");
      setErrorMsg("");

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        xpReward: 100,
        coinsReward: 50,
        type: formData.type,
        isActive: true,
      };

      if (formData.type === 'survey') {
        payload.questions = formData.questions
          .filter(q => q.text.trim() !== '')
          .map(q => ({
            question: q.text,
            options: ['sí', 'no'],
            correctAnswer: q.correctAnswer, // 👈 ahora se guarda
          }));
      }

      const res = await fetch('http://localhost:5000/api/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.msg || "Error al crear misión.");
        setStatus("error");
        setToast({ message: data.msg || "Error al crear misión", type: "error" });
        return;
      }

      setStatus("success");
      setToast({ message: "🎉 Misión creada con éxito", type: "success" });
      setCreatedMissionId(data._id);
    } catch (err) {
      console.error("Error de conexión:", err);
      setErrorMsg("Error de red al crear misión.");
      setStatus("error");
      setToast({ message: "Error de red al crear misión", type: "error" });
    }
  };

  return (
    <div className="mission-form neon-card">
      <h2 className="neon-title">⚔️ Crear Nueva Misión</h2>
      <form onSubmit={onSubmit}>
        <div className="input-group">
          <label>Título</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            required
            className="neon-input"
          />
        </div>

        <div className="input-group">
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            required
            className="neon-input"
          />
        </div>

        <div className="input-group">
          <label>Dificultad</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={onChange}
            className="neon-input"
          >
            <option value="easy">FÁCIL</option>
            <option value="medium">MEDIO</option>
            <option value="hard">DIFÍCIL</option>
            <option value="boss">JEFE FINAL</option>
          </select>
        </div>

        <div className="input-group">
          <label>Tipo de misión</label>
          <select
            name="type"
            value={formData.type}
            onChange={onChange}
            className="neon-input"
            required
          >
            <option value="">-- Selecciona --</option>
            <option value="survey">Encuesta</option>
            <option value="file">Subida de archivo</option>
          </select>
        </div>

        {formData.type === 'survey' && (
          <div className="survey-section">
            <h3 className="neon-subtitle">Preguntas de la encuesta</h3>
            {formData.questions.map((q, idx) => (
              <div key={idx} className="input-group">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                  placeholder={`Pregunta ${idx + 1}`}
                  className="neon-input"
                />
                <label>Respuesta correcta</label>
                <select
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(idx, 'correctAnswer', e.target.value)}
                  className="neon-input"
                >
                  <option value="sí">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addQuestion}>
              ➕ Añadir pregunta
            </button>
          </div>
        )}

        <button type="submit" className="btn-primary">
          🚀 Crear Misión
        </button>
      </form>

      {status === "loading" && <p className="loading-text">Creando misión...</p>}
      {status === "error" && <p className="error-text">{errorMsg}</p>}

      {toast && (
        <MissionToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {formData.type === "file" && createdMissionId && (
        <div style={{ marginTop: "40px" }}>
          <h3 className="neon-subtitle">🎯 Entrega de la misión recién creada</h3>
          <FileMissionSubmitHUD missionId={createdMissionId} token={token} />
        </div>
      )}
    </div>
  );
};

export default MissionForm;
