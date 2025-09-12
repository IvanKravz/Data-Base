import React from 'react';
import './Header.css';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Network } from '../../../types';

interface HeaderProps {
  onCreateNetwork: (networkData: Omit<Network, 'id'>) => void;
  onToggleView: () => void;
  viewMode: string;
  divisionId: string;
}

export function Header({ onCreateNetwork, onToggleView, viewMode, divisionId }: HeaderProps) {
  const navigate = useNavigate();

  // console.log('divisionId', divisionId)

  const handleBack = () => {
    navigate(`/divisions/${divisionId}`);
  };

  const getHeaderTitle = () => {
    return viewMode === 'networks' ? 'Сети связи' : 'Управление сетевыми объектами';
  };

  const getToggleButtonText = () => {
    return viewMode === 'networks' ? 'Управление сетевыми объектами' : 'Просмотр сетей';
  };

  return (
    <div className="communication-header">
      <div className="communication-header-title">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft className="communication-header-back-icon" />
        </button>
        <h1>{getHeaderTitle()}</h1>
      </div>
      <div className="header-actions">
        <button className="view-toggle-button" onClick={onToggleView}>
          {getToggleButtonText()}
        </button>
        {viewMode === 'networks' && (
          <button className="communication-header-create-button" onClick={() => onCreateNetwork({})}>
            Создать сеть
          </button>
        )}
      </div>
    </div>
  );
}