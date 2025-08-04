import React from 'react';
import './Header.css';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface HeaderProps {
  onCreateNetwork?: () => void;
}



export function Header({ onCreateNetwork }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="communication-header">
      <div className="communication-header-title">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft className="back-button-icon" />
        </button>
        <h1>Сети связи</h1>
      </div>
      <button
        className="communication-header-create-button"
        onClick={onCreateNetwork}
      >
        <span>Create Network</span>
      </button>
    </div>
  );
}