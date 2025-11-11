// NetworkDetailsPanel.tsx
import React from 'react';
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
  const getNodeData = (nodeId: string) => {
    const [type, id] = nodeId.split('-');
    let node;

    switch (type) {
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

    return { type, node };
  };

  const renderNodeDetails = (nodeId: string) => {
    const { type, node } = getNodeData(nodeId);
    if (!node) return null;

    return (
      <div className="network-details-content-column">
        {type === 'facility' && (
          <>
            <div className="network-details-item-panel">
              <div className="network-details-label">Тип объекта:</div>
              <div className="network-details-value">{node.type?.name || 'Не указан'}</div>
            </div>
            <div className="network-details-item-panel">
              <div className="network-details-label">Адрес:</div>
              <div className="network-details-value">{node.address || 'Не указан'}</div>
            </div>
            <div className="network-details-item-panel">
              <div className="network-details-label">Класс объекта:</div>
              <div className="network-details-value">{node.class_display || 'Не указан'}</div>
            </div>

          </>
        )}

        {type === 'equipment' && (
          <>
            <div className="network-details-item-panel">
              <div className="network-details-label">Заводской номер:</div>
              <div className="network-details-value">{node.serial_number || 'Не указан'}</div>
            </div>
            <div className="network-details-item-panel">
              <div className="network-details-label">Инвентарный номер:</div>
              <div className="network-details-value">{node.inventory_number || 'Не указан'}</div>
            </div>
          </>
        )}
      </div>
    );
  };

  const getNodeTitle = () => {
    if (!selectedNode) return 'Детали';

    const { type, node } = getNodeData(selectedNode);
    if (!node) return 'Детали';

    return node.name || 'Без названия';
  };

  // Не показываем панель для подразделений
  if (selectedNode && selectedNode.startsWith('division-')) {
    return null;
  }

  return (
    <div className={`network-visualization-details ${selectedNode ? 'active' : ''}`}>
      <div className="network-visualization-details-header">
        <h4 className="network-visualization-details-title">
          {getNodeTitle()}
        </h4>
        <div className="network-visualization-details-actions">
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