import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/compte');
  };

  return (
    <nav style={{ backgroundColor: '#222', padding: '1rem', color: '#fff', display: 'flex', alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>Admin Portal</h2>
      <button
        onClick={handleLogout}
        style={{
          marginLeft: 'auto',
          backgroundColor: '#ff4d4f',
          border: 'none',
          color: 'white',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
      >
        Déconnexion
      </button>
    </nav>
  );
}
