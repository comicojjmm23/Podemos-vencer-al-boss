import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config'; // ✅ 1. Importamos la variable inteligente
import './MissionSubmission.css';

// ✅ 2. Usamos la variable para construir la URL base
const API_BASE = `${API_URL}/api`;

const MAX_SIZE_MB = 10;

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const MissionSubmission = ({ token, mission, onSubmissionSuccess, onBack }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateFile = (file) => {
    if (!file) return '⚠️ Debes seleccionar un archivo.';
    if (!allowedTypes.includes(file.type)) return '❌ Tipo de archivo no permitido.';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `❌ El archivo supera los ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    const error = validateFile(selected);
    if (error) {
      toast.error(error);
      setFile(null);
    } else {
      setFile(selected);
      setSubmitted(false);
      console.log("Archivo seleccionado:", selected.name, selected.type, selected.size);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('⚠️ Debes seleccionar un archivo válido');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('submissionFile', file);
      formData.append('message', message);

      // Aquí axios usará la nueva API_BASE correcta
      const response = await axios.post(`${API_BASE}/missions/submit/${mission._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('✅ Tarea entregada con éxito');
      setSubmitted(true);
      if (onSubmissionSuccess) onSubmissionSuccess();
      setFile(null);
      setMessage('');
    } catch (err) {
      console.error('Error al entregar:', err);
      const msg = err.response?.data?.msg || '❌ Error al entregar la tarea';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mission-submission-container">
      <h2 className="mission-title">⚔️ Entrega de Tarea</h2>

      <div className="mission-info">
        <p><strong>{mission.title}</strong></p>
        <p>Dificultad: {mission.difficulty.toUpperCase()}</p>
        <p>Recompensa: +{mission.xpReward} XP | {mission.coinsReward} 🪙</p>
      </div>

      {submitted && (
        <div className="mission-complete-hud" role="status" aria-live="polite">
          <p className="mission-complete-text">✅ ¡Tarea completada!</p>
          <p className="mission-complete-subtext">Tu entrega fue registrada con éxito. ¡Buen trabajo, guerrero!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mission-form">
        <label className="file-label">
          📎 Subir Archivo (PDF, DOCX, JPG, PNG, GIF)
          <input
            type="file"
            name="submissionFile"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.png,.gif"
          />
        </label>

        {file && <p className="file-name">📎 {file.name}</p>}

        <textarea
          className="message-input"
          placeholder="💬 Mensaje o comentario para el profesor..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {uploading && <div className="progress-bar"><div className="progress"></div></div>}

        <div className="form-actions">
          <button type="button" className="btn cancel" onClick={onBack}>
            ❌ Cancelar
          </button>
          <button type="submit" className="btn submit" disabled={uploading}>
            ⚡ {uploading ? 'Subiendo...' : 'Entregar Tarea'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MissionSubmission;