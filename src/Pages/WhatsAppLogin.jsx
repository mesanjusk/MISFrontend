import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('https://whatsappbackapi.onrender.com'); // Use your deployed backend URL

export default function WhatsAppLogin() {
  const [qrCode, setQrCode] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    socket.on('qr', (data) => {
      console.log("QR Code Data:", data);  // Check the received QR code in the console
      setQrCode(data); // Set the QR code received from the backend
    });

    socket.on('ready', () => {
      setIsReady(true);
    });

    return () => {
      socket.off('qr');
      socket.off('ready');
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {isReady ? (
        <p className="text-green-600 text-xl">✅ WhatsApp is connected!</p>
      ) : qrCode ? (
        <>
          <p className="text-gray-700 mb-4">Scan this QR with your phone</p>
          {/* Ensure that qrCode is a valid image URL or base64 string */}
          <img src={`data:image/png;base64,${qrCode}`} alt="WhatsApp QR Code" className="w-64 h-64" />
        </>
      ) : (
        <p>Waiting for QR code...</p>
      )}
    </div>
  );
}
