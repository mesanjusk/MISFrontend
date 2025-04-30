import { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Connect to the backend server using socket.io
const socket = io('https://whatsappbackapi.onrender.com'); // Replace with your backend URL

export default function WhatsAppLogin() {
  const [qrCode, setQrCode] = useState(null); // To store the QR code
  const [isReady, setIsReady] = useState(false); // To track if WhatsApp is ready

  useEffect(() => {
    // Listen for 'qr' event from backend to get the QR code
    socket.on('qr', (data) => {
      // Assuming `data` contains the QR code in base64 format or a URL
      setQrCode(data); // Set the received QR code
    });

    // Listen for 'ready' event to indicate that WhatsApp is ready
    socket.on('ready', () => {
      setIsReady(true); // Set WhatsApp as ready
    });

    // Clean up the event listeners when the component is unmounted
    return () => {
      socket.off('qr');
      socket.off('ready');
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {isReady ? (
        <p className="text-green-600 text-xl">✅ WhatsApp is connected!</p>
      ) : qrCode ? (
        <>
          <p className="text-gray-700 mb-4">Scan this QR code with your phone:</p>
          <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-lg">
            <img
              src={`data:image/png;base64,${qrCode}`} // Ensure the QR code is a valid base64 image
              alt="WhatsApp QR Code"
              className="w-72 h-72 rounded-lg border-4 border-gray-400 transition-transform transform hover:scale-110"
            />
          </div>
        </>
      ) : (
        <p className="text-gray-700">Waiting for QR code...</p>
      )}
    </div>
  );
}
