import React, { useEffect } from "react";
import "./MissionToast.css";

const MissionToast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000); // se cierra en 3 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`mission-toast ${type}`}>
      <p>{message}</p>
    </div>
  );
};

export default MissionToast;
