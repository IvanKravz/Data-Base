// NetworkDetailsPanel.tsx
import React from 'react';
import { X } from 'lucide-react';

interface NetworkDetailsPanelProps {
  selectedNode: string | null;
  memberships: any[];
  onClosePanel?: () => void;
}

const pick = (...vals: any[]): string => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
    if (v && typeof v === 'object' && typeof v.name === 'string' && v.name.trim()) return v.name;
  }
  return '';
};

const NetworkDetailsPanel: React.FC<NetworkDetailsPanelProps> = ({
  selectedNode,
  memberships,
  onClosePanel,
}) => {
  const getNodeData = (nodeId: string) => {
    const [type, id] = nodeId.split('-');
    const numId = parseInt(id, 10);
    let node;

    switch (type) {
      case 'division':
        node = Array.from(new Map(memberships.map(m =>
          [m.division?.id, m.division])).values()).find(d => d && d.id === numId);
        break;
      case 'facility':
        node = Array.from(new Map(memberships.map(m =>
          [m.facility?.id, m.facility])).values()).find(f => f && f.id === numId);
        break;
      case 'equipment':
        node = Array.from(new Map(memberships.map(m =>
          [m.equipment?.id, m.equipment])).values()).find(e => e && e.id === numId);
        break;
      default:
        return null;
    }

    return { type, node };
  };

  const renderNodeDetails = (nodeId: string) => {
    const info = getNodeData(nodeId);
    if (!info) return null;
    const { type, node } = info;

    return (
      <div className="network-details-content-column">
        {type === 'facility' && (
          <>
            <div className="network-details-item-panel">
              <div className="network-details-label">Тип объекта:</div>
              <div className="network-details-value">
                {pick(node.facility_type_display, node.type_display, node.category, node.facility_type, node.type) || 'Не указан'}
              </div>
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
              <div className="network-details-label">Тип устройства:</div>
              <div className="network-details-value">
                {pick(node.device_type_display, node.category, node.device_type) || 'Не указан'}
              </div>
            </div>
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
    const info = getNodeData(selectedNode);
    return info?.node?.name || 'Без названия';
  };

  if (selectedNode && selectedNode.startsWith('division-')) return null;

  return (
    <div
      className={`network-visualization-details ${selectedNode ? 'active' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="network-visualization-details-header">
        <h4 className="network-visualization-details-title">{getNodeTitle()}</h4>
        <div className="network-visualization-details-actions">
          {selectedNode && onClosePanel && (
            <button
              className="network-details-close-button"
              onClick={(e) => { e.stopPropagation(); onClosePanel(); }}
              aria-label="Закрыть панель"
            >
              <X size={18} />
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