// NetworkDetailsPanel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface NetworkDetailsPanelProps {
  selectedNode: string | null;
  memberships: any[];
  onClosePanel?: () => void;
}

const NetworkDetailsPanel: React.FC<NetworkDetailsPanelProps> = ({ 
  selectedNode, 
  memberships,
  onClosePanel
}) => {
  const navigate = useNavigate();

  const renderNodeDetails = (nodeId: string) => {
    const [type, id] = nodeId.split('-');
    let node;
    
    switch(type) {
      case 'division':
        const division = Array.from(new Map(memberships.map(m => 
          [m.division?.id, m.division])).values()).find(d => d && d.id === parseInt(id));
        node = division;
        break;
      case 'facility':
        const facility = Array.from(new Map(memberships.map(m => 
          [m.facility?.id, m.facility])).values()).find(f => f && f.id === parseInt(id));
        node = facility;
        break;
      case 'equipment':
        const equipment = Array.from(new Map(memberships.map(m => 
          [m.equipment?.id, m.equipment])).values()).find(e => e && e.id === parseInt(id));
        node = equipment;
        break;
      default:
        return null;
    }

    if (!node) return null;

    return (
      <>
        <div className="network-details-item">
          <div className="network-details-label">Название</div>
          <div className="network-details-value">{node.name}</div>
        </div>
        
        {type === 'facility' && (
          <>
            <div className="network-details-item">
              <div className="network-details-label">Адрес</div>
              <div className="network-details-value">{node.address || 'Не указан'}</div>
            </div>
            <div className="network-details-item">
              <div className="network-details-label">Тип объекта</div>
              <div className="network-details-value">{node.type?.name || 'Не указан'}</div>
            </div>
          </>
        )}
        
        {type === 'equipment' && (
          <>
            <div className="network-details-item">
              <div className="network-details-label">Заводской номер</div>
              <div className="network-details-value">{node.serial_number || 'Не указан'}</div>
            </div>
            <div className="network-details-item">
              <div className="network-details-label">Инвентарный номер</div>
              <div className="network-details-value">{node.inventory_number || 'Не указан'}</div>
            </div>
          </>
        )}
      </>
    );
  };

  const handleNavigate = () => {
    if (!selectedNode) return;
    
    const [type, id] = selectedNode.split('-');
    const node = Array.from(new Map(memberships.map(m => {
      if (type === 'facility') return [m.facility?.id, m.facility];
      if (type === 'equipment') return [m.equipment?.id, m.equipment];
      return [null, null];
    })).values()).find(item => item && item.id === parseInt(id));

    if (node) {
      if (type === 'facility') {
        navigate(`/facilities/${node.id}`);
      } else if (type === 'equipment') {
        navigate(`/equipment/${node.id}`);
      }
    }
  };

  const getNodeTypeName = () => {
    if (!selectedNode) return 'Детали';
    
    const type = selectedNode.split('-')[0];
    if (type === 'division') return 'Подразделение';
    if (type === 'facility') return 'Объект';
    return 'Оборудование';
  };

  return (
    <div className={`network-visualization-details ${selectedNode ? 'active' : ''}`}>
      <div className="network-visualization-details-header">
        <h4 className="network-visualization-details-title">
          {getNodeTypeName()}
        </h4>
        <div className="network-visualization-details-actions">
          {(selectedNode?.startsWith('facility-') || selectedNode?.startsWith('equipment-')) && (
            <button 
              className="network-details-button"
              onClick={handleNavigate}
            >
              {selectedNode.startsWith('facility-') ? 'Перейти к объекту' : 'Перейти к оборудованию'}
            </button>
          )}
          {selectedNode && onClosePanel && (
            <button 
              className="network-details-close-button"
              onClick={onClosePanel}
              aria-label="Закрыть панель"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      <div className="network-visualization-details-content">
        {selectedNode && renderNodeDetails(selectedNode)}
      </div>
    </div>
  );
};

export default NetworkDetailsPanel;