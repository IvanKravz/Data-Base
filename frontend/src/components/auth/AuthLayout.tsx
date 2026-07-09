import React from 'react';
import label from '../../assets/label.webp';
import './style.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <div className="auth-content">
        <div className="auth-header">
          <div className="auth-logo-container">
            <img className="menu_image" src={label} alt="Logo" />
          </div>
        </div>
        <div className="auth-form-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
}