// Header.tsx
import React from 'react';
import './Header.css';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onNavigateToManagement: () => void;
  onNavigateToCreate: () => void;
  divisionId?: string;
  divisionName?: string;
  canCreateNetworks: boolean;
}

export function Header({
  onNavigateToManagement,
  onNavigateToCreate,
  divisionId,
  divisionName,
  canCreateNetworks
}: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Используем историю навигации если есть, иначе - запасной вариант
    if (divisionId) {
      navigate(`/divisions/${divisionId}`);
    } else {
      navigate('/');
    }
  };

  const getHeaderTitle = () => {
    if (divisionName) {
      return `Сети связи: ${divisionName}`;
    }
    return 'Сети связи: Все подразделения';
  };

  return (
    <div className="communication-header">
      <div className="communication-header-title">
        {divisionId && (
          <button onClick={handleBack} className="communication-header-back-button">
            <ArrowLeft className="communication-header-back-icon" />
          </button>
        )}
        <h1>{getHeaderTitle()}</h1>
      </div>
      {canCreateNetworks && (<div className="header-actions">
        <button className="view-toggle-button" onClick={onNavigateToManagement}>
          <Settings size={18} />
          Управление сетевыми объектами
        </button>
        <button className="communication-header-create-button" onClick={onNavigateToCreate}>
          <Plus size={18} />
          Создать сеть
        </button>
      </div>
      )}
    </div>
  );
}