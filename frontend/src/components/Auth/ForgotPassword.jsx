import React, { useState } from 'react';
import { API_URL } from '../../config'; // ✅ 1. Importamos subiendo 2 niveles

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('cedula');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const clearForm = () => {
    setCedula('');
    setEmail('');
    setAnswer('');
    setNewPassword('');
    setQuestion('');
    setMsg('');
    setStep(1);
  };

  const handleRequestQuestion = async (e) => {
    e.preventDefault();
    setMsg('');

    const payload = method === 'cedula' ? { cedula } : { email };
    
    // ✅ 2. Usamos API_URL para las rutas de solicitud
    const endpoint =
      method === 'cedula'
        ? `${API_URL}/api/auth/forgot-password`
        : `${API_URL}/api/auth/forgot-password-by-email`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestion(data.question);
        setStep(2);
      } else {
        setMsg(data.msg || 'Error al solicitar pregunta');
      }
    } catch (err) {
      console.error(err);
      setMsg('Error de conexión con el servidor');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMsg('');

    const payload =
      method === 'cedula'
        ? { cedula, securityAnswer: answer, newPassword }
        : { email, securityAnswer: answer, newPassword };

    // ✅ 3. Usamos API_URL para las rutas de reseteo
    const endpoint =
      method === 'cedula'
        ? `${API_URL}/api/auth/reset-password-with-security`
        : `${API_URL}/api/auth/reset-password-by-email`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('✅ Contraseña restablecida con éxito, ya puedes iniciar sesión');
        clearForm();
      } else {
        setMsg(data.msg || 'Error al restablecer contraseña');
      }
    } catch (err) {
      console.error(err);
      setMsg('Error de conexión con el servidor');
    }
  };

  return (
    <div className="forgot-container neon-card">
      <h2 className="neon-title">🔑 Recuperar Contraseña</h2>

      {msg && <p className="alert-msg">{msg}</p>}

      {step === 1 && (
        <form onSubmit={handleRequestQuestion}>
          <label>Selecciona el método</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="neon-input"
          >
            <option value="cedula">🆔 Usar cédula</option>
            <option value="email">✉️ Usar correo electrónico</option>
          </select>

          {method === 'cedula' ? (
            <>
              <label>Cédula</label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                required
                className="neon-input"
                placeholder="Ingresa tu cédula"
              />
            </>
          ) : (
            <>
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="neon-input"
                placeholder="Ingresa tu correo"
              />
            </>
          )}

          <button type="submit" className="btn-primary neon-glow">
            ⚡ Continuar →
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword}>
          <p className="security-question">❓ {question}</p>

          <label>Tu respuesta</label>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            className="neon-input"
            placeholder="Escribe tu respuesta"
          />

          <label>Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="neon-input"
            placeholder="Nueva contraseña"
          />

          <div className="actions">
            <button type="button" onClick={clearForm} className="btn-secondary">
              ← Volver
            </button>
            <button type="submit" className="btn-primary neon-glow">
              🚀 Restablecer
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;