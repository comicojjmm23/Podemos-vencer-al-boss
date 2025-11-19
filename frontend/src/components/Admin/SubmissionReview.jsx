// frontend/src/components/Admin/SubmissionReview.jsx

import React, { useState, useEffect } from 'react';

// Ajusta el puerto si tu backend no corre en 5000
const API_BASE = 'http://localhost:5000/api'; 
// Asegúrate de que esta ruta coincida con la configuración de archivos estáticos en tu server.js
const FILE_DOWNLOAD_URL = 'http://localhost:5000/uploads/submissions/'; 

const SubmissionReview = ({ token }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // =======================================================
    // FUNCIÓN PARA OBTENER ENTREGAS PENDIENTES
    // =======================================================
    const fetchSubmissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/missions/submissions/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                // Si el servidor devuelve un 403 o 401, el error será claro
                throw new Error(`Error ${res.status}: Fallo de autenticación o rol.`);
            }

            const data = await res.json();
            setSubmissions(data);

        } catch (err) {
            console.error('Error al obtener entregas:', err);
            setError('No se pudieron cargar las entregas. Revisa la consola y el token.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSubmissions();
        }
    }, [token]);

    // =======================================================
    // FUNCIÓN PARA APROBAR O RECHAZAR
    // =======================================================
    const handleReviewAction = async (submissionId, action) => {
        if (isProcessing) return;

        const confirmMessage = action === 'approve' 
            ? '¿Estás seguro de que quieres APROBAR esta entrega y aplicar las recompensas al estudiante?'
            : '¿Estás seguro de que quieres RECHAZAR esta entrega?';

        if (!window.confirm(confirmMessage)) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/missions/review/${submissionId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ action })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.msg || 'Error desconocido al revisar la entrega.');
            }

            alert(`Entrega ${action === 'approve' ? 'APROBADA' : 'RECHAZADA'} con éxito.`);
            
            // Recargar la lista para quitar la entrega que ya fue revisada
            fetchSubmissions(); 

        } catch (err) {
            alert(`Fallo en la revisión: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // =======================================================
    // RENDERIZADO
    // =======================================================
    if (loading) return <div className="p-4">Cargando entregas pendientes...</div>;
    if (error) return <div className="p-4 text-red-500">Error al cargar: {error}</div>;

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">📝 Revisión de Entregas ({submissions.length})</h2>
            <button 
                onClick={fetchSubmissions} 
                className="mb-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                disabled={isProcessing}
            >
                {isProcessing ? 'Procesando...' : 'Actualizar Lista'}
            </button>

            {submissions.length === 0 ? (
                <p className="text-gray-500">¡No hay entregas pendientes de revisión!</p>
            ) : (
                <div className="space-y-4">
                    {submissions.map((submission) => (
                        <div key={submission._id} className="border p-4 rounded-lg shadow-md bg-gray-50">
                            <h3 className="text-lg font-semibold mb-2 text-indigo-700">Misión: {submission.mission?.title || 'Misión Desconocida'}</h3>
                            
                            {/* Detalles del Estudiante y Misión */}
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3 border-b pb-2">
                                <p><strong>Estudiante:</strong> {submission.user?.username || 'Usuario Desconocido'} (Nivel {submission.user?.level || 1})</p>
                                <p><strong>Recompensa:</strong> {submission.mission?.xpReward} XP | {submission.mission?.coinsReward} 🪙</p>
                                <p><strong>Fecha de Entrega:</strong> {new Date(submission.submittedAt).toLocaleDateString()}</p>
                                <p><strong>Dificultad:</strong> {submission.mission?.difficulty}</p>
                            </div>
                            
                            {/* Mensaje del Estudiante */}
                            <p className="mb-3"><strong>Mensaje de Entrega:</strong> 
                                <span className="italic ml-2 text-gray-700">{submission.message || 'Sin mensaje.'}</span>
                            </p>

                            {/* Enlace al Archivo */}
                            <div className="mb-4">
                                <strong>Archivo Adjunto:</strong>
                                <a 
                                    href={`${FILE_DOWNLOAD_URL}${submission.filePath}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium break-all"
                                >
                                    Descargar: {submission.filePath}
                                </a>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex space-x-3 pt-2 border-t mt-3">
                                <button 
                                    className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 disabled:bg-gray-400 transition"
                                    onClick={() => handleReviewAction(submission._id, 'approve')}
                                    disabled={isProcessing}
                                >
                                    ✅ Aprobar
                                </button>
                                <button 
                                    className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 disabled:bg-gray-400 transition"
                                    onClick={() => handleReviewAction(submission._id, 'reject')}
                                    disabled={isProcessing}
                                >
                                    ❌ Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubmissionReview;