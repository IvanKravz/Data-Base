import React from 'react';
import './Header.css';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Network } from '../../../types';

interface HeaderProps {
  onNavigateToManagement: () => void;
  onNavigateToCreate: () => void;
  divisionId: string;
}

export function Header({ onNavigateToManagement, onNavigateToCreate, divisionId }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/divisions/${divisionId}`);
  };

  return (
    <div className="communication-header">
      <div className="communication-header-title">
        <button onClick={handleBack} className="communication-header-back-button">
          <ArrowLeft className="communication-header-back-icon" />
        </button>
        <h1>Сети связи</h1>
      </div>
      <div className="header-actions">
        <button className="view-toggle-button" onClick={onNavigateToManagement}>
          <Settings size={18} />
          Управление сетевыми объектами
        </button>
        <button className="communication-header-create-button" onClick={onNavigateToCreate}>
          <Plus size={18} />
          Создать сеть
        </button>
      </div>
    </div>
  );
}