// frontend/src/components/Auth/Profile2FA.jsx
import React, { useState } from "react";
import axios from "axios";
import "./Profile2FA.css";

const API_URL = "http://localhost:5000/api/auth";

const Profile2FA = ({ token, isTwoFAEnabledInitial = false, xp = 200, coins = 300 }) => {
  const [qr, setQr] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(isTwoFAEnabledInitial);

  const requireToken = () => {
    if (!token) {
      setMessage("No hay token. Inicia sesión nuevamente.");
      return false;
    }
    return true;
  };

  const toggle2FA = async () => {
    if (!requireToken()) return;
    try {
      setLoading(true);
      setMessage("");
      if (!isTwoFAEnabled) {
        const res = await axios.post(
          `${API_URL}/enable-2fa`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQr(res.data.qr);
        setIsTwoFAEnabled(true);
        setMessage(res.data.msg || "2FA habilitado. Escanea el QR.");
      } else {
        const res = await axios.post(
          `${API_URL}/disable-2fa`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQr(null);
        setIsTwoFAEnabled(false);
        setMessage(res.data.msg || "2FA deshabilitado.");
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || "Error al cambiar estado de 2FA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-2fa-container">
      {/* HUD Gamer */}
      <div className="hud-bar">
        <span className="hud-xp">⚡ XP: {xp}</span>
        <span className="hud-coins">🪙 Monedas: {coins}</span>
        <span className={`hud-2fa ${isTwoFAEnabled ? "on" : "off"}`}>
          🔐 2FA: {isTwoFAEnabled ? "ON" : "OFF"}
        </span>
      </div>

      <h2>Seguridad: Autenticación en dos pasos</h2>

      <p className="status">
        Estado:{" "}
        <strong className={isTwoFAEnabled ? "enabled" : "disabled"}>
          {isTwoFAEnabled ? "Habilitado" : "Deshabilitado"}
        </strong>
      </p>

      <div className="toggle-wrapper">
        <label className="switch">
          <input
            type="checkbox"
            checked={isTwoFAEnabled}
            onChange={toggle2FA}
            disabled={loading}
          />
          <span className="slider">
            <span className="switch-text">
              {isTwoFAEnabled ? "ON" : "OFF"}
            </span>
          </span>
        </label>
      </div>

      {message && <p className="status-message">{message}</p>}

      {qr && (
        <div className="qr-block">
          <p>Escanea este QR en Google Authenticator:</p>
          <img src={qr} alt="QR para Google Authenticator" />
          <p className="hint">
            Tip: realiza un login de prueba para confirmar el 2FA.
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile2FA;
