import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://misbackend-e078.onrender.com';

export default function WhatsAppAdminPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, sessionId: '', qrImage: '' });

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/sessions`);
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const resetSession = async (sessionId) => {
    if (!window.confirm(`Reset session ${sessionId}? This will force QR login again.`)) return;
    try {
      await axios.post(`${BASE_URL}/reset-session`, { sessionId });
      alert(`✅ Session ${sessionId} reset. Restart backend to re-init.`);
      fetchSessions();
    } catch (err) {
      alert(`❌ Failed to reset session ${sessionId}`);
    }
  };

  const startSession = async (sessionId) => {
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/start-session`, { sessionId });
      alert(`✅ Session ${sessionId} started.`);
      fetchSessions();
    } catch (err) {
      alert(`❌ Failed to start session ${sessionId}`);
    } finally {
      setLoading(false);
    }
  };

  const openQrModal = async (sessionId) => {
    try {
      const res = await axios.get(`${BASE_URL}/whatsapp/session/${sessionId}/qr`);
      if (res.data.status === 'ready') {
        setQrModal({ open: true, sessionId, qrImage: res.data.qrImage });
      } else {
        alert(res.data.message || 'QR not ready yet. Try again shortly.');
      }
    } catch (err) {
      alert('❌ Failed to load QR image');
    }
  };

  const closeQrModal = () => {
    setQrModal({ open: false, sessionId: '', qrImage: '' });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 relative">
      <h2 className="text-2xl font-bold mb-4">🛠️ WhatsApp Session Admin</h2>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Session ID</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
            <th className="p-2 border">QR</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.sessionId} className="text-center">
              <td className="p-2 border">{s.sessionId}</td>
              <td className="p-2 border">
                {s.ready ? (
                  <span className="text-green-600 font-medium">✅ Ready</span>
                ) : (
                  <span className="text-yellow-600 font-medium">🕓 Not Ready</span>
                )}
              </td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => startSession(s.sessionId)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                  disabled={loading}
                >
                  Start
                </button>
                <button
                  onClick={() => resetSession(s.sessionId)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                >
                  Reset
                </button>
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => openQrModal(s.sessionId)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  View QR
                </button>
              </td>
            </tr>
          ))}
          {!sessions.length && (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-500">
                No sessions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* QR Modal */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center relative">
            <h3 className="text-lg font-bold mb-2">Scan QR - {qrModal.sessionId}</h3>
            <img src={qrModal.qrImage} alt="QR Code" className="mx-auto mb-4" />
            <button
              onClick={closeQrModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
