import { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Connect to your backend socket server
const socket = io('https://whatsappbackapi.onrender.com');  // Update with your backend URL

export default function WhatsAppLogin() {
  const [qrCode, setQrCode] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Handle socket connection
    socket.on('connect', () => {
      console.log('Connected to backend socket');
    });

    // Receive QR code from backend
    socket.on('qr', (data) => {
      console.log('QR Code received:', data);  // Debugging log
      setQrCode(data);
    });

    // Handle WhatsApp being ready
    socket.on('ready', () => {
      console.log('WhatsApp is ready!');
      setIsReady(true);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
    });

    return () => {
      socket.off('qr');
      socket.off('ready');
      socket.off('connect_error');
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {isReady ? (
        <p className="text-green-600 text-xl">✅ WhatsApp is connected!</p>
      ) : qrCode ? (
        <>
          <p className="text-gray-700 mb-4">Scan this QR with your phone</p>
          <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
        </>
      ) : (
        <p>Waiting for QR code...</p>
      )}
    </div>
  );
}
