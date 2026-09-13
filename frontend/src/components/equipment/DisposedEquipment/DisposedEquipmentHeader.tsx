// components/equipment/DisposedEquipment/DisposedEquipmentHeader/DisposedEquipmentHeader.tsx
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './styles/DisposedEquipmentHeader.css';

interface DisposedEquipmentHeaderProps {
  onBack: () => void;
  title?: string;
  children?: React.ReactNode;
}

const DisposedEquipmentHeader: React.FC<DisposedEquipmentHeaderProps> = ({
  onBack,
  title = 'Списанная техника',
  children,
}) => {
  return (
    <div className="disposed-header-wrapper">
      <div className="disposed-header-left">
        <button
          onClick={onBack}
          className="disposed-back-button"
          title="Назад"
        >
          <ArrowLeft className="disposed-back-icon" />
        </button>
        <h2 className="disposed-page-title">{title}</h2>
      </div>
      {children && <div className="disposed-header-right">{children}</div>}
    </div>
  );
};

export default DisposedEquipmentHeader;