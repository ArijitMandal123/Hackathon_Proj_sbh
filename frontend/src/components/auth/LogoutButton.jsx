import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // Redirect to home page after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    handleLogout();
  }, [navigate]);

  return (
    <button onClick={handleLogout}>Logout</button>
  );
};

export default LogoutButton; 