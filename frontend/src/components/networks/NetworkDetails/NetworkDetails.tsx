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
  onHighlightNode?: (id: string, type: 'division' | 'subdivision' | 'facility') => void;
  onClearHighlight?: () => void;
}

const NetworkDetails: React.FC<NetworkDetailsProps> = ({
  network,
  onHighlightNode,
  onClearHighlight
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

  console.log('network', network)

  const securityDisplay = {
    'public': 'Открытая',
    'confidential': 'Конфиденциальная',
    'secret': 'Секретная',
    'top_secret': 'Совершенно секретная',
  };

  const handleNodeHover = (id: string, type: 'division' | 'subdivision' | 'facility') => {
    setHighlightedItem(id);
    if (onHighlightNode) onHighlightNode(id, type);
  };

  const handleNodeLeave = () => {
    setHighlightedItem(null);
    if (onClearHighlight) onClearHighlight();
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

  return (
    <div className="network-details-container">
      <h3 className="network-details-title">{network.name}</h3>

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
            <span className="network-details-value-sidebar">{network.network_class}</span>
          </div>
          <div className="network-details-item">
            <span className="network-details-label">
              <span className="network-details-label-text">Уровень секретности:</span>
            </span>
            <span className={`network-details-value-sidebar security-${network.security_level}`}>
              {securityDisplay[network.security_level] || network.security_level}
            </span>
          </div>
          {network.description && (
            <div className="network-details-item">
              <span className="network-details-label">
                <span className="network-details-label-text">Описание:</span>
              </span>
              <span className="network-details-value-sidebar">{network.description}</span>
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
            <span className="network-details-value-sidebar">{network.protocol}</span>
          </div>
          {network.ip_range && (
            <div className="network-details-item">
              <span className="network-details-label">
                <span className="network-details-label-text">IP диапазон:</span>
              </span>
              <span className="network-details-value-sidebar">{network.ip_range}</span>
            </div>
          )}
          {network.throughput && (
            <div className="network-details-item">
              <span className="network-details-label">
                <span className="network-details-label-text">Пропускная способность:</span>
              </span>
              <span className="network-details-value-sidebar">{network.throughput} Mbps</span>
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
          {network.divisions && network.divisions.length > 0 ? (
            network.divisions.map(division => {
              // Находим подразделения, принадлежащие текущему отделу
              const divisionSubdivisions = network.subdivisions?.filter(
                sub => sub.division === division.id
              ) || [];

              return (
                <div key={`division-${division.id}`} className="hierarchy-node">
                  <div
                    className={`hierarchy-item hierarchy-division ${highlightedItem === `division-${division.id}` ? 'highlighted' : ''} ${isNodeExpanded('division', division.id) ? 'expanded' : ''}`}
                    onMouseEnter={() => handleNodeHover(`division-${division.id}`, 'division')}
                    onMouseLeave={handleNodeLeave}
                    onClick={() => toggleNode('division', division.id)}
                  >
                    <span className="hierarchy-toggle">
                      <ChevronRight
                        className={`toggle-icon ${isNodeExpanded('division', division.id) ? 'expanded' : ''}`}
                        size={18}
                      />
                    </span>
                    <Building size={18} className="hierarchy-icon" />
                    {division.name}
                  </div>

                  {isNodeExpanded('division', division.id) && (
                    <div className="hierarchy-children">
                      {divisionSubdivisions.length > 0 ? (
                        divisionSubdivisions.map(subdivision => {
                          // Находим объекты, принадлежащие текущему подразделению
                          const subdivisionFacilities = network.facilities?.filter(
                            fac => fac.subdivision === subdivision.id
                          ) || [];

                          return (
                            <div key={`subdivision-${subdivision.id}`} className="hierarchy-node">
                              <div
                                className={`hierarchy-item hierarchy-subdivision ${highlightedItem === `subdivision-${subdivision.id}` ? 'highlighted' : ''} ${isNodeExpanded('subdivision', subdivision.id) ? 'expanded' : ''}`}
                                onMouseEnter={() => handleNodeHover(`subdivision-${subdivision.id}`, 'subdivision')}
                                onMouseLeave={handleNodeLeave}
                                onClick={() => toggleNode('subdivision', subdivision.id)}
                              >
                                <span className="hierarchy-toggle">
                                  <ChevronRight
                                    className={`toggle-icon ${isNodeExpanded('subdivision', subdivision.id) ? 'expanded' : ''}`}
                                    size={18}
                                  />
                                </span>
                                <Building size={18} className="hierarchy-icon" />
                                {subdivision.name}
                              </div>

                              {isNodeExpanded('subdivision', subdivision.id) && (
                                <div className="hierarchy-children">
                                  {subdivisionFacilities.length > 0 ? (
                                    subdivisionFacilities.map(facility => (
                                      <div
                                        key={`facility-${facility.id}`}
                                        className={`hierarchy-item hierarchy-facility ${highlightedItem === `facility-${facility.id}` ? 'highlighted' : ''}`}
                                        onMouseEnter={() => handleNodeHover(`facility-${facility.id}`, 'facility')}
                                        onMouseLeave={handleNodeLeave}
                                      >
                                        <Building size={18} className="hierarchy-icon" />
                                        {facility.name}
                                      </div>
                                    ))
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
                          Нет подразделений в отделе
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-hierarchy">
              Иерархия сети не определена
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NetworkDetails;