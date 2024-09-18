import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import TopNavbar from "../Pages/topNavbar";
import Footer from './footer';

export default function AdminHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userNameFromState = location.state?.id;
    const loggedInUser = userNameFromState || localStorage.getItem('User_name');

    if (loggedInUser) {
      setUserName(loggedInUser);
    } else {
      navigate("/login");
    }
  }, [location.state, navigate]);

 
  return (
    <>
      <TopNavbar />
      <div className="container mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-6">Welcome Admin, {userName}!</h1>

      
      </div>

      <Footer />
    </>
  );
}
