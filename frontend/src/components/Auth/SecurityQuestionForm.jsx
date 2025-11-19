import React, { useState } from 'react';
import './SecurityQuestionForm.css';

const SecurityQuestionForm = ({ token }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/api/auth/set-security-question', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ securityQuestion: question, securityAnswer: answer }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.msg || 'Error al actualizar la pregunta.');
        return;
      }

      setMsg('✅ Pregunta de seguridad actualizada con éxito');
      setQuestion('');
      setAnswer('');
    } catch {
      setLoading(false);
      setError('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="security-card">
      <h3 className="neon-title">🛡️ Configurar Pregunta de Seguridad</h3>

      {error && <p className="alert error">{error}</p>}
      {msg && <p className="alert success">{msg}</p>}

      <form onSubmit={handleSubmit} className="security-form">
        <label>Elige o escribe tu pregunta</label>
        <select
          className="neon-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        >
          <option value="">-- Selecciona una pregunta --</option>
          <option value="Nombre de tu primera mascota">🐶 Nombre de tu primera mascota</option>
          <option value="Ciudad donde naciste">🌆 Ciudad donde naciste</option>
          <option value="Comida favorita">🍕 Comida favorita</option>
        </select>

        <input
          type="text"
          className="neon-input"
          placeholder="O escribe tu propia pregunta"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        <label>Respuesta</label>
        <input
          type="text"
          className="neon-input"
          placeholder="Tu respuesta secreta"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />

        <button type="submit" className="btn-primary neon-glow" disabled={loading}>
          {loading ? '⏳ Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
};

export default SecurityQuestionForm;
