import React, { useState, useEffect } from "react";
import "./AdminCreateItems.css";

const AdminCreateItems = ({ token }) => {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    cost: 0,
    currency: "coins",
    type: "cosmetic",
    emblemUrl: ""
  });

  const API_URL = import.meta.env.VITE_API_URL;

  // Cargar ítems existentes
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_URL}/api/store/rewards`);
        const data = await res.json();
        if (res.ok) setItems(data);
      } catch (err) {
        console.error("Error al cargar ítems:", err);
      }
    };
    fetchItems();
  }, [API_URL]);

  // Crear ítem
  const createItem = async () => {
    try {
      const res = await fetch(`${API_URL}/api/store/rewards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (res.ok) {
        setItems([...items, data.item]);
        setMessage("✅ Ítem creado con éxito");
        setNewItem({ name: "", description: "", cost: 0, currency: "coins", type: "cosmetic", emblemUrl: "" });
      } else {
        setMessage(data.msg || "Error al crear ítem");
      }
    } catch {
      setMessage("Error de conexión");
    }
  };

  // Eliminar ítem
  const deleteItem = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este ítem?")) return;
    try {
      const res = await fetch(`${API_URL}/api/store/rewards/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setItems(items.filter(item => item._id !== id));
        setMessage(data.msg || "Ítem eliminado");
      } else {
        setMessage(data.msg || "Error al eliminar ítem");
      }
    } catch {
      setMessage("Error de conexión");
    }
  };

  return (
    <div className="admin-items-container">
      <h2>🛠️ Panel de Creación de Ítems</h2>
      {message && <p className="admin-message">{message}</p>}

      <div className="admin-form neon-card">
        <input
          type="text"
          placeholder="Nombre"
          value={newItem.name}
          onChange={e => setNewItem({ ...newItem, name: e.target.value })}
        />
        <textarea
          placeholder="Descripción"
          value={newItem.description}
          onChange={e => setNewItem({ ...newItem, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Costo"
          value={newItem.cost}
          onChange={e => setNewItem({ ...newItem, cost: Number(e.target.value) })}
        />
        <input
          type="text"
          placeholder="URL del emblema/logotipo"
          value={newItem.emblemUrl}
          onChange={e => setNewItem({ ...newItem, emblemUrl: e.target.value })}
        />
        <select
          value={newItem.currency}
          onChange={e => setNewItem({ ...newItem, currency: e.target.value })}
        >
          <option value="coins">Monedas 🪙</option>
          <option value="gems">Gemas 💎</option>
        </select>
        <select
          value={newItem.type}
          onChange={e => setNewItem({ ...newItem, type: e.target.value })}
        >
          <option value="cosmetic">Cosmético 🎨</option>
          <option value="boost">Potenciador ⚡</option>
          <option value="inventory">Inventario 🎒</option>
          <option value="achievement">Logro 🏆</option>
        </select>
        <button onClick={createItem} className="btn-create">➕ Crear Ítem</button>
      </div>

      <h3>📦 Ítems Disponibles</h3>
      <div className="items-grid">
        {items.length === 0 ? (
          <p>No hay ítems creados aún</p>
        ) : (
          items.map(item => (
            <div key={item._id} className="item-card neon-card">
              {item.emblemUrl && <img src={item.emblemUrl} alt="emblema" className="item-emblem" />}
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <span>{item.cost} {item.currency === "coins" ? "🪙" : "💎"}</span>
              <span className="item-type">{item.type}</span>
              <button onClick={() => deleteItem(item._id)} className="btn-delete">❌ Eliminar</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCreateItems;
