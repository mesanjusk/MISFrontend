import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://misbackend-e078.onrender.com';

export default function WhatsAppAdminPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">🛠️ WhatsApp Session Admin</h2>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Session ID</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
            <th className="p-2 border">QR Page</th>
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
                <a
                  href={`/qr/${s.sessionId}`}
                  className="text-blue-500 underline text-xs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open QR
                </a>
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
    </div>
  );
}
