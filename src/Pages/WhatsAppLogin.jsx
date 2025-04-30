import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://whatsappbackapi.onrender.com', {
  transports: ['websocket'], // Ensure websocket transport is used to avoid polling issues
});

export default function WhatsAppLogin() {
  const [qrCode, setQrCode] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [connectionError, setConnectionError] = useState(false); // To handle connection errors

  useEffect(() => {
    // Event listener for the 'qr' event emitted by backend
    socket.on('qr', (data) => {
      setQrCode(data);
      setConnectionError(false); // Clear any previous connection error
    });

    // Event listener for 'ready' event (connected and authenticated)
    socket.on('ready', () => {
      setIsReady(true);
      setConnectionError(false); // Clear any previous connection error
    });

    // Event listener for connection error
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(true); // Set connection error state
    });

    // Clean up the socket events when component is unmounted
    return () => {
      socket.off('qr');
      socket.off('ready');
      socket.off('connect_error');
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {connectionError ? (
        <p className="text-red-600 text-xl">❌ Error connecting to WhatsApp backend.</p>
      ) : isReady ? (
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
