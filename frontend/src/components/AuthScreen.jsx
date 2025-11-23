// =======================================================
// AuthScreen.jsx
// Pantalla de autenticación "Gamer" v4 (SINTAXIS CORREGIDA)
// =======================================================

import React, { useState } from "react";
import { API_URL } from "../config"; // ✅ Importamos la variable inteligente
import "./AuthScreen.css"; 
import logoIUJO from "../assets/iujologo-gamer.png";

// ❌ AQUÍ BORRAMOS LA LÍNEA MALA QUE TENÍAS

const AuthScreen = ({ setToken }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    username: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Flujo 2FA
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");

  // Flujo Reset con pregunta de seguridad
  const [resetStep, setResetStep] = useState(1);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [method, setMethod] = useState("email");

  const { nombre, apellido, cedula, username, email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // -------------------------
  // LOGIN / REGISTER
  // -------------------------
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    const endpoint = isRegister ? "register" : "login";
    const body = isRegister
      ? { nombre, apellido, cedula, username, email, password }
      : { email, password };

    try {
      // ✅ CORRECCIÓN: Agregamos /api/auth/ antes del endpoint
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.msg || "Error desconocido.");
        return;
      }

      if (data.twoFARequired) {
        setSuccess(data.msg || "Se requiere verificación 2FA.");
        setStep(2);
        return;
      }

      if (!data.token) {
        setError("Respuesta inválida del servidor: falta el token.");
        return;
      }

      setToken(data.token);
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      if (isRegister) {
        setSuccess("HUD_WELCOME");
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 3000); 
      } else {
        window.location.href = "/dashboard"; 
      }

    } catch {
      setLoading(false);
      setError("Error de conexión con el servidor.");
    }
  };

  // -------------------------
  // VERIFY 2FA
  // -------------------------
  const onVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      // ✅ CORRECCIÓN: Ruta completa /api/auth/verify-2fa
      const res = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.msg || "Código inválido.");
        return;
      }

      if (!data.token) {
        setError("Respuesta inválida del servidor: falta el token.");
        return;
      }

      setToken(data.token);
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "/dashboard";
    } catch {
      setLoading(false);
      setError("Error de conexión con el servidor.");
    }
  };

  // -------------------------
  // RESET PASSWORD
  // -------------------------
  const onRequestQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    const payload = method === "cedula" ? { cedula } : { email };
    
    // ✅ CORRECCIÓN: Rutas completas con /api/auth/
    const endpoint =
      method === "cedula"
        ? `${API_URL}/api/auth/forgot-password`
        : `${API_URL}/api/auth/forgot-password-by-email`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.msg || "Error al solicitar pregunta.");
        return;
      }

      setSecurityQuestion(data.question);
      setResetStep(2);
    } catch {
      setLoading(false);
      setError("Error de conexión con el servidor.");
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    const payload =
      method === "cedula"
        ? { cedula, securityAnswer, newPassword: password }
        : { email, securityAnswer, newPassword: password };

    // ✅ CORRECCIÓN: Rutas completas con /api/auth/
    const endpoint =
      method === "cedula"
        ? `${API_URL}/api/auth/reset-password-with-security`
        : `${API_URL}/api/auth/reset-password-by-email`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.msg || "Error al restablecer la contraseña.");
        return;
      }

      setSuccess("✅ Contraseña restablecida con éxito, ya puedes iniciar sesión");
      setIsReset(false);
      setResetStep(1);
      setSecurityAnswer("");
      setSecurityQuestion("");
      setFormData({ ...formData, password: "" });
    } catch {
      setLoading(false);
      setError("Error de conexión con el servidor.");
    }
  };

  // ... El resto del render (return) se queda igual ...
  // (Copia aquí todo el bloque return (...) que ya tenías, está bien)
  
  return (
    <main className="auth-container" role="main" aria-label="Pantalla de autenticación principal">
      {/* ... Todo tu código HTML/JSX sigue aquí igual ... */}
       <div className="auth-card" role="region" aria-label="Formulario de acceso">
        
        {/* LOGO FLOTANTE */}
        <div className="logo-container">
          <img
            src={logoIUJO}
            // A11Y: Texto alternativo con descripción
            alt="Logotipo IUJO. Logo estilizado de gamer en tonos neón."
            className="auth-logo"
            // Fallbacks para imagen
            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/300x100/1a0033/00e5ff?text=IUJO+Logo"; }}
          />
        </div>

        {/* A11Y: Título principal como <h1> */}
        <h1 className="title">
          {step === 1
            ? isReset
              ? "Recuperar Acceso" 
              : isRegister
              ? "Crear Perfil de Jugador" 
              : "PODEMOS VENCER AL BOSS" 
            : "Verificación en 2 Pasos"}
        </h1>

        {/* --- Lógica de Mensajes (A11Y: Live Region) --- */}
        <div aria-live="polite">
          {error && (
            <p className="message error-message" role="alert">
              {error}
            </p>
          )}

          {success === "HUD_WELCOME" && (
            <div className="hud-success" role="status">
              <p className="hud-text">¡Bienvenido al equipo, guerrero!</p>
              <p className="hud-subtext">
                Tu cuenta ha sido creada. Prepárate para la batalla.
              </p>
            </div>
          )}
          
          {success && success !== "HUD_WELCOME" && (
              <p className="message success-message" role="status">
               {success}
            </p>
          )}
        </div>

        {/* LOGIN / REGISTRO */}
        {step === 1 && !isReset && (
          <form
            onSubmit={onSubmit}
            className="auth-form"
            role="form"
            aria-label={isRegister ? "Formulario de registro de usuario" : "Formulario de inicio de sesión"}
          >
            {isRegister && (
              <>
                {/* NOMBRE */}
                <div className="input-group">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder=" " 
                    name="nombre"
                    id="nombre-input" // A11Y: ID único
                    value={nombre}
                    onChange={onChange}
                    required
                    disabled={loading}
                    autoComplete="given-name"
                    aria-describedby="nombre-desc"
                  />
                  <label className="auth-label" htmlFor="nombre-input">Nombre</label>
                  <span className="input-icon" aria-hidden="true">📝</span>
                  <p id="nombre-desc" className="sr-only">Introduce tu nombre.</p>
                </div>

                {/* APELLIDO */}
                <div className="input-group">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder=" "
                    name="apellido"
                    id="apellido-input" // A11Y: ID único
                    value={apellido}
                    onChange={onChange}
                    required
                    disabled={loading}
                    autoComplete="family-name"
                    aria-describedby="apellido-desc"
                  />
                  <label className="auth-label" htmlFor="apellido-input">Apellido</label>
                  <span className="input-icon" aria-hidden="true">📝</span>
                  <p id="apellido-desc" className="sr-only">Introduce tu apellido.</p>
                </div>

                {/* CÉDULA */}
                <div className="input-group">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder=" "
                    name="cedula"
                    id="cedula-input" // A11Y: ID único
                    value={cedula}
                    onChange={onChange}
                    required
                    disabled={loading}
                    autoComplete="off"
                    aria-describedby="cedula-desc"
                  />
                  <label className="auth-label" htmlFor="cedula-input">Cédula</label>
                  <span className="input-icon" aria-hidden="true">🆔</span>
                  <p id="cedula-desc" className="sr-only">Introduce tu número de identificación o cédula.</p>
                </div>

                {/* USERNAME */}
                <div className="input-group">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder=" "
                    name="username"
                    id="username-input" // A11Y: ID único
                    value={username}
                    onChange={onChange}
                    required
                    disabled={loading}
                    autoComplete="username"
                    aria-describedby="username-desc"
                  />
                  <label className="auth-label" htmlFor="username-input">Username</label>
                  <span className="input-icon" aria-hidden="true">👤</span>
                  <p id="username-desc" className="sr-only">El nombre de usuario que usarás para jugar.</p>
                </div>
              </>
            )}

            {/* EMAIL */}
            <div className="input-group">
              <input
                type="email"
                className="auth-input"
                placeholder=" "
                name="email"
                id="email-input" // A11Y: ID único
                value={email}
                onChange={onChange}
                required
                disabled={loading}
                autoComplete="email"
                inputMode="email"
                aria-describedby="email-desc"
              />
              <label className="auth-label" htmlFor="email-input">Email</label>
              <span className="input-icon" aria-hidden="true">✉️</span>
              <p id="email-desc" className="sr-only">Tu correo electrónico de contacto.</p>
            </div>

            {/* PASSWORD */}
            <div className="input-group">
              <input
                type="password"
                className="auth-input"
                placeholder=" "
                name="password"
                id="password-input" // A11Y: ID único
                value={password}
                onChange={onChange}
                required
                disabled={loading}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={isRegister ? 6 : undefined}
                aria-describedby="password-desc"
              />
              <label className="auth-label" htmlFor="password-input">
                {isRegister ? "Contraseña (mín. 6)" : "Contraseña"}
              </label>
              <span className="input-icon" aria-hidden="true">🔒</span>
              <p id="password-desc" className="sr-only">Tu contraseña de acceso seguro.</p>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner-neon"></div> : isRegister ? "Registrar" : "Iniciar Sesión"}
            </button>

            {/* TOGGLE MODO */}
            <p className="toggle-mode">
              {isRegister ? "¿Ya tienes una cuenta?" : "¿Eres un nuevo jugador?"}
              <span
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsRegister(!isRegister);
                  setIsReset(false);
                  clearMessages();
                }}
                onKeyDown={(e) => e.key === "Enter" && setIsRegister(!isRegister)}
              >
                {isRegister ? " Inicia sesión" : " Regístrate aquí"}
              </span>
            </p>

            {/* OLVIDÉ CONTRASEÑA */}
            {!isRegister && (
              <p className="toggle-mode">
                ¿Olvidaste tu contraseña?
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setIsReset(true);
                    setIsRegister(false);
                    clearMessages();
                    setResetStep(1);
                    setSecurityQuestion("");
                    setSecurityAnswer("");
                    setFormData({ ...formData, password: "" });
                  }}
                  onKeyDown={(e) => e.key === "Enter" && setIsReset(true)}
                >
                  {" "}Restablécela aquí
                </span>
              </p>
            )}
          </form>
        )}

        {/* RESET PASSWORD */}
        {step === 1 && isReset && (
          <>
            {resetStep === 1 && (
              <form
                onSubmit={onRequestQuestion}
                className="auth-form"
                role="form"
                aria-label="Formulario de búsqueda de cuenta"
              >
                {/* A11Y: El label del select debe tener una clase para estilo si lo necesita */}
                <label className="auth-label-static" htmlFor="reset-method-input" style={{marginBottom: '0.5rem', display: 'block', color: '#B0E0FF', textAlign: 'left', paddingLeft: '45px', fontWeight: 'bold'}}>
                    Método de recuperación
                </label>
                <select
                  id="reset-method-input" // A11Y: ID único y asociado
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="auth-input" 
                >
                  <option value="email">✉️ Usar correo electrónico</option>
                  <option value="cedula">🆔 Usar cédula</option>
                </select>

                {method === "cedula" ? (
                  <div className="input-group" style={{marginTop: '1.3rem'}}>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder=" "
                      name="cedula"
                      id="reset-cedula-input" // A11Y: ID único
                      value={cedula}
                      onChange={onChange}
                      required
                      disabled={loading}
                      autoComplete="off"
                      aria-describedby="reset-cedula-desc"
                    />
                    <label className="auth-label" htmlFor="reset-cedula-input">Cédula</label>
                    <span className="input-icon" aria-hidden="true">🆔</span>
                    <p id="reset-cedula-desc" className="sr-only">Introduce tu número de identificación para buscar la cuenta.</p>
                  </div>
                ) : (
                  <div className="input-group" style={{marginTop: '1.3rem'}}>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder=" "
                      name="email"
                      id="reset-email-input" // A11Y: ID único
                      value={email}
                      onChange={onChange}
                      required
                      disabled={loading}
                      autoComplete="email"
                      inputMode="email"
                      aria-describedby="reset-email-desc"
                    />
                    <label className="auth-label" htmlFor="reset-email-input">Email</label>
                    <span className="input-icon" aria-hidden="true">✉️</span>
                    <p id="reset-email-desc" className="sr-only">Introduce tu correo electrónico para buscar la cuenta.</p>
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <div className="spinner-neon"></div> : "Continuar"}
                </button>

                <p className="toggle-mode">
                  ¿Recordaste tu contraseña?
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setIsReset(false);
                      clearMessages();
                    }}
                    onKeyDown={(e) => e.key === "Enter" && setIsReset(false)}
                  >
                    {" "}Inicia sesión aquí
                  </span>
                </p>
              </form>
            )}

            {resetStep === 2 && (
              <form
                onSubmit={onResetPassword}
                className="auth-form"
                role="form"
                aria-label="Formulario de nueva contraseña con pregunta de seguridad"
              >
                {/* A11Y: Añadido role="status" si no está dentro de aria-live */}
                <p className="security-question" role="status">❓ {securityQuestion}</p>

                {/* RESPUESTA DE SEGURIDAD */}
                <div className="input-group">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder=" "
                    name="securityAnswer"
                    id="securityAnswer-input" // A11Y: ID único
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="off"
                    aria-describedby="securityAnswer-desc"
                  />
                  <label className="auth-label" htmlFor="securityAnswer-input">Tu respuesta secreta</label>
                  <span className="input-icon" aria-hidden="true">🧠</span>
                  <p id="securityAnswer-desc" className="sr-only">Respuesta a la pregunta de seguridad para verificar tu identidad.</p>
                </div>

                {/* NUEVA CONTRASEÑA */}
                <div className="input-group">
                  <input
                    type="password"
                    className="auth-input"
                    placeholder=" "
                    name="password"
                    id="new-password-input" // A11Y: ID único
                    value={password}
                    onChange={onChange}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={6}
                    aria-describedby="new-password-desc"
                  />
                  <label className="auth-label" htmlFor="new-password-input">Nueva contraseña</label>
                  <span className="input-icon" aria-hidden="true">🔑</span>
                  <p id="new-password-desc" className="sr-only">Introduce tu nueva contraseña (mínimo 6 caracteres).</p>
                </div>

                {/* BOTONES */}
                <div className="actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setResetStep(1);
                      setSecurityQuestion("");
                      setSecurityAnswer("");
                      clearMessages();
                    }}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    ← Volver
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                    {loading ? <div className="spinner-neon"></div> : "Restablecer"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* VERIFY 2FA */}
        {step === 2 && (
          <form
            onSubmit={onVerify2FA}
            className="auth-form"
            role="form"
            aria-label="Formulario de verificación en dos pasos"
          >
            {/* CÓDIGO 2FA */}
            <div className="input-group">
              <input
                type="text"
                className="auth-input"
                placeholder=" "
                name="code"
                id="code-input" // A11Y: ID único
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                aria-describedby="code-desc"
              />
              <label className="auth-label" htmlFor="code-input">Código de 6 dígitos</label>
              <span className="input-icon" aria-hidden="true">🧩</span>
              <p id="code-desc" className="sr-only">Introduce el código de verificación que te hemos enviado.</p>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="spinner-neon"></div> : "Verificar código"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setStep(1);
                clearMessages();
              }}
              disabled={loading}
            >
              ← Volver
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default AuthScreen;