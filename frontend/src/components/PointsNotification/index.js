import React from 'react';
import { toast } from 'react-toastify';

// Custom toast component for points notifications
export const showPointsToast = (points, action) => {
  const toastContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ 
        backgroundColor: '#4CAF50', 
        color: 'white', 
        borderRadius: '50%', 
        width: '24px', 
        height: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        +{points}
      </div>
      <span>{action}</span>
    </div>
  );
  
  toast.success(toastContent, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Generic points notification
export const PointsNotification = ({ points, action, visible, onClose }) => {
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        +{points}
      </div>
      <span>{action}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  );
};
