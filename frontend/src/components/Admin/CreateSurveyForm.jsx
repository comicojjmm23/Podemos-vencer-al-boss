import React, { useState } from 'react';
import { API_URL } from '../../config'; // ✅ 1. Importamos la variable (ajusta la ruta si es necesario)

const CreateSurveyForm = ({ token, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: [''] }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ 2. Usamos la variable API_URL
    const res = await fetch(`${API_URL}/api/missions/survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, questions, xpReward: 50, coinsReward: 20 })
    });
    const data = await res.json();
    if (res.ok) {
      onCreated(data);
      setTitle('');
      setDescription('');
      setQuestions([]);
    } else {
      alert(data.msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="survey-form neon-card">
      <h2>Crear Encuesta</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" required />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" />

      {questions.map((q, qi) => (
        <div key={qi} className="question-block">
          <input
            value={q.question}
            onChange={e => updateQuestion(qi, 'question', e.target.value)}
            placeholder={`Pregunta ${qi + 1}`}
            required
          />
          {q.options.map((opt, oi) => (
            <input
              key={oi}
              value={opt}
              onChange={e => updateOption(qi, oi, e.target.value)}
              placeholder={`Opción ${oi + 1}`}
              required
            />
          ))}
          <button type="button" onClick={() => addOption(qi)}>➕ Añadir opción</button>
        </div>
      ))}

      <button type="button" onClick={addQuestion}>➕ Añadir pregunta</button>
      <button type="submit" className="btn-primary">Crear Encuesta</button>
    </form>
  );
};

export default CreateSurveyForm;