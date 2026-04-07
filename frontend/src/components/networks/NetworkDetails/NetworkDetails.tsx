import React, { useState, useEffect } from 'react';
import './NetworkDetails.css';
import { Network } from '../../../types';
import {
  ChevronRight,
  Building,
  Server,
  ShieldCheck,
  Folder,
  Settings,
  Cpu,
  Info,
  FileText
} from 'lucide-react';

interface NetworkDetailsProps {
  network: Network | null;
  onHighlightNode?: (id: string, type: 'division' | 'facility' | 'equipment') => void;
  onClearHighlight?: () => void;
  onNodeSelect?: (nodeId: string) => void;
}

// Функция для безопасного извлечения строкового значения
const getStringValue = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value && typeof value === 'object') {
    if (value.name && typeof value.name === 'string') return value.name;
    if (value.title && typeof value.title === 'string') return value.title;
    if (value.value && typeof value.value === 'string') return value.value;
  }
  return 'Не указано';
};

const NetworkDetails: React.FC<NetworkDetailsProps> = ({
  network,
  onHighlightNode,
  onClearHighlight,
  onNodeSelect
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);

  useEffect(() => {
    if (network) {
      setExpandedNodes({});
      setHighlightedItem(null);
    }
  }, [network]);

  const toggleNode = (type: string, id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
  };

  const isNodeExpanded = (type: string, id: number) => {
    return expandedNodes[`${type}-${id}`];
  };

  const securityDisplay = {
    'public': 'Открытая',
    'confidential': 'Конфиденциальная',
    'secret': 'Секретная',
    'top_secret': 'Совершенно секретная',
  };

  const handleNodeHover = (id: string, type: 'division' | 'facility' | 'equipment') => {
    setHighlightedItem(id);
    if (onHighlightNode) onHighlightNode(id, type);
  };

  const handleNodeLeave = () => {
    setHighlightedItem(null);
    if (onClearHighlight) onClearHighlight();
  };

  const handleNodeClick = (nodeId: string) => {
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  };

  if (!network) {
    return (
      <div className="network-details-empty">
        <div className="network-details-empty-icon">
          <Server size={48} className="text-gray-300" />
        </div>
        <h3 className="network-details-title">Сеть не выбрана</h3>
        <p className="network-details-empty-text">
          Выберите сеть из таблицы для просмотра детальной информации
        </p>
      </div>
    );
  }

  // Извлекаем данные из сети в соответствии с актуальной моделью
  const memberships = network.memberships || [];

  // Собираем уникальные подразделения, объекты и оборудование
  const divisionsMap = new Map();
  const facilitiesMap = new Map();
  const equipmentMap = new Map();

  memberships.forEach(membership => {
    if (membership.division && !divisionsMap.has(membership.division.id)) {
      divisionsMap.set(membership.division.id, membership.division);
    }
    if (membership.facility && !facilitiesMap.has(membership.facility.id)) {
      facilitiesMap.set(membership.facility.id, membership.facility);
    }
    if (membership.equipment && !equipmentMap.has(membership.equipment.id)) {
      equipmentMap.set(membership.equipment.id, membership.equipment);
    }
  });

  const divisions = Array.from(divisionsMap.values());
  const facilities = Array.from(facilitiesMap.values());
  const equipment = Array.from(equipmentMap.values());

  return (
    <div className="network-details-container">
      <h3 className="network-details-title">{getStringValue(network.name)}</h3>

      <div className="network-details-section">
        <h4 className="network-details-section-title">
          <Info size={20} className="icon-md" />
          Основная информация
        </h4>
        <div className="network-details-grid">
          <div className="network-details-item">
            <span className="network-details-label">
              <span className="network-details-label-text">Класс:</span>
            </span>
            <span className="network-details-value-sidebar">{getStringValue(network.network_class)}</span>
          </div>
          <div className="network-details-item">
            <span className="network-details-label">
              <span className="network-details-label-text">Уровень секретности:</span>
            </span>
            <span className={`network-details-value-sidebar security-${network.security_level}`}>
              {securityDisplay[network.security_level] || getStringValue(network.security_level)}
            </span>
          </div>
          {network.description && (
            <div className="network-details-item">
              <span className="network-details-label">
                <span className="network-details-label-text">Описание:</span>
              </span>
              <span className="network-details-value-sidebar">{getStringValue(network.description)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="network-details-section">
        <h4 className="network-details-section-title">
          <Settings size={20} className="icon-md" />
          Техническая конфигурация
        </h4>
        <div className="network-details-grid">
          <div className="network-details-item">
            <span className="network-details-label">
              <span className="network-details-label-text">Протокол:</span>
            </span>
            <span className="network-details-value-sidebar">{getStringValue(network.protocol)}</span>
          </div>
          {network.ip_range && (
            <div className="network-details-item">
              <span className="network-details-label">
                <span className="network-details-label-text">IP диапазон:</span>
              </span>
              <span className="network-details-value-sidebar">{getStringValue(network.ip_range)}</span>
            </div>
          )}
          {network.throughput && (
            <div className="network-details-item">
              <span className="network-details-label">
                <span className="network-details-label-text">Пропускная способность:</span>
              </span>
              <span className="network-details-value-sidebar">{getStringValue(network.throughput)} Mbps</span>
            </div>
          )}
        </div>
      </div>

      <div className="network-details-section">
        <h4 className="network-details-section-title">
          <Building size={20} className="icon-md" />
          Иерархия сети
        </h4>
        <div className="network-hierarchy">
          {divisions.length > 0 ? (
            divisions.map(division => {
              // Находим объекты, принадлежащие текущему подразделению
              const divisionFacilities = facilities.filter(facility => {
                return memberships.some(m =>
                  m.division && m.division.id === division.id &&
                  m.facility && m.facility.id === facility.id
                );
              });

              return (
                <div key={`division-${division.id}`} className="hierarchy-node">
                  <div
                    className={`hierarchy-item hierarchy-division ${highlightedItem === `division-${division.id}` ? 'highlighted' : ''} ${isNodeExpanded('division', division.id) ? 'expanded' : ''}`}
                    onMouseEnter={() => handleNodeHover(`division-${division.id}`, 'division')}
                    onMouseLeave={handleNodeLeave}
                    onClick={() => {
                      toggleNode('division', division.id);
                      handleNodeClick(`division-${division.id}`);
                    }}
                  >
                    <span className="hierarchy-toggle">
                      <ChevronRight
                        className={`toggle-icon ${isNodeExpanded('division', division.id) ? 'expanded' : ''}`}
                        size={18}
                      />
                    </span>
                    <Building size={18} className="hierarchy-icon" />
                    {getStringValue(division.name)}
                  </div>

                  {isNodeExpanded('division', division.id) && (
                    <div className="hierarchy-children">
                      {divisionFacilities.length > 0 ? (
                        divisionFacilities.map(facility => {
                          // Находим оборудование, принадлежащее текущему объекту
                          const facilityEquipment = equipment.filter(eq => {
                            return memberships.some(m =>
                              m.facility && m.facility.id === facility.id &&
                              m.equipment && m.equipment.id === eq.id
                            );
                          });

                          return (
                            <div key={`facility-${facility.id}`} className="hierarchy-node">
                              <div
                                className={`hierarchy-item hierarchy-facility ${highlightedItem === `facility-${facility.id}` ? 'highlighted' : ''} ${isNodeExpanded('facility', facility.id) ? 'expanded' : ''}`}
                                onMouseEnter={() => handleNodeHover(`facility-${facility.id}`, 'facility')}
                                onMouseLeave={handleNodeLeave}
                                onClick={() => {
                                  toggleNode('facility', facility.id);
                                  handleNodeClick(`facility-${facility.id}`);
                                }}
                              >
                                <span className="hierarchy-toggle">
                                  <ChevronRight
                                    className={`toggle-icon ${isNodeExpanded('facility', facility.id) ? 'expanded' : ''}`}
                                    size={18}
                                  />
                                </span>
                                <Building size={18} className="hierarchy-icon" />
                                {getStringValue(facility.type?.name)}
                              </div>

                              {isNodeExpanded('facility', facility.id) && (
                                <div className="hierarchy-children">
                                  {facilityEquipment.length > 0 ? (
                                    facilityEquipment.map(eq => (
                                      <div
                                        key={`equipment-${eq.id}`}
                                        className={`hierarchy-item hierarchy-equipment ${highlightedItem === `equipment-${eq.id}` ? 'highlighted' : ''}`}
                                        onMouseEnter={() => handleNodeHover(`equipment-${eq.id}`, 'equipment')}
                                        onMouseLeave={handleNodeLeave}
                                        onClick={() => handleNodeClick(`equipment-${eq.id}`)}
                                      >
                                        <Cpu size={18} className="hierarchy-icon" />
                                        {getStringValue(eq.name)}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="empty-hierarchy">
                                      Нет оборудования в объекте
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-hierarchy">
                          Нет объектов в подразделении
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-hierarchy">
              В сети нет подразделений
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkDetails;