import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useNavigate, useLocation } from "react-router-dom";

const socket = io('https://whatsappbackapi.onrender.com'); // Use your deployed backend URL

export default function WhatsAppLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [qrCode, setQrCode] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [userName, setUserName] = useState('');

   useEffect(() => {
     
        const userNameFromState = location.state?.id;
        const user = userNameFromState || localStorage.getItem('User_name');
        setLoggedInUser(user);
        if (user) {
          setUserName(user);
        } else {
          navigate("/");
        }
    }, [location.state, navigate]);

  useEffect(() => {
    socket.on('qr', (data) => {
      setQrCode(data);
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
          <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
        </>
      ) : (
        <p>Waiting for QR code...</p>
      )}
    </div>
  );
}
