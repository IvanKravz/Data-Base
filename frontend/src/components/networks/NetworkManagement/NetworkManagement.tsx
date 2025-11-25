import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NetworkTabs from '../NetworkTabs/NetworkTabs';
import './NetworkManagement.css';

const NetworkManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('accessToken');

  const handleBack = () => {
    // Получаем divisionId из state навигации
    const stateDivisionId = location.state?.divisionId;
    
    if (stateDivisionId) {
      // Если есть divisionId в state - переходим к сетям подразделения
      navigate(`/divisions/${stateDivisionId}/networks`);
    } else if (id) {
      // Если есть id в параметрах URL - переходим к сетям подразделения
      navigate(`/divisions/${id}/networks`);
    } else {
      // Глобальный режим - переходим к общему списку сетей
      navigate('/networks');
    }
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