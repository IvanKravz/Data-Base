import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NetworkTabs from '../NetworkTabs/NetworkTabs';
import './NetworkManagement.css';

const NetworkManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const handleBack = () => {
    navigate(`/divisions/${id}/networks`);
  };

  return (
    <div className="network-management-container">
      <div className="network-management-header">
        <div className="network-management-header-title">
          <button onClick={handleBack} className="back-button">
            <ArrowLeft className="back-icon" />
          </button>
          <h1>Управление сетевыми объектами</h1>
        </div>
      </div>
      
      <div className="network-management-content">
        <NetworkTabs token={token} />
      </div>
    </div>
  );
};

export default NetworkManagement;