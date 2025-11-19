import React, { useEffect, useState } from "react";
import "./Inventory.css";

const Inventory = ({ token }) => {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar inventario al montar
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/inventory`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setItems(data);
        } else {
          setMessage(data.msg || "Error al cargar inventario");
        }
      } catch (err) {
        console.error("Error al obtener inventario:", err);
        setMessage("Error de conexión");
      }
    };
    fetchInventory();
  }, [API_URL, token]);

  // Eliminar ítem del inventario
  const deleteItem = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ítem del inventario?")) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.purchasedItems); // refrescamos inventario
        setMessage(data.msg);
      } else {
        setMessage(data.msg || "Error al eliminar ítem");
      }
    } catch {
      setMessage("Error de conexión");
    }
  };

  return (
    <div className="inventory-container">
      <h2>🎒 Inventario</h2>
      {message && <p className="inventory-message">{message}</p>}

      <div className="inventory-grid">
        {items.length === 0 ? (
          <p>No tienes ítems comprados aún</p>
        ) : (
          items.map(item => (
            <div key={item._id} className="inventory-card neon-card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className="inventory-type">{item.type}</span>
              <span className="inventory-cost">
                {item.cost} {item.currency === "coins" ? "🪙" : "💎"}
              </span>
              <button
                onClick={() => deleteItem(item._id)}
                className="btn-delete"
              >
                ❌ Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Inventory;
