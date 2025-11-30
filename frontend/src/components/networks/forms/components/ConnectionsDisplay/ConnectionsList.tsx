// ConnectionsList.tsx
import React, { useState, useMemo } from 'react';
import { Building, Factory, Cpu, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface SelectedItem {
    division: { id: string; name: string };
    facility: { id: string; name: string };
    equipment: { id: string; name: string; serial_number: string };
}

interface ConnectionsListProps {
    connections: SelectedItem[];
    searchTerm: string;
    onRemoveConnection: (index: number) => void;
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({
    connections,
    searchTerm,
    onRemoveConnection
}) => {
    const [collapsedConnections, setCollapsedConnections] = useState<Set<string>>(new Set());

    // Фильтрация связей
    const filteredConnections = useMemo(() => {
        if (!searchTerm) return connections;
        
        const searchLower = searchTerm.toLowerCase();
        return connections.filter((item, index) => {
            const connectionNumber = (index + 1).toString();
            return (
                connectionNumber.includes(searchLower) ||
                item.division.name.toLowerCase().includes(searchLower) ||
                item.facility.name.toLowerCase().includes(searchLower) ||
                item.equipment.name.toLowerCase().includes(searchLower) ||
                item.equipment.serial_number.toLowerCase().includes(searchLower)
            );
        });
    }, [connections, searchTerm]);

    // Функции для управления состоянием свертывания
    const toggleConnection = (connectionKey: string) => {
        const newCollapsed = new Set(collapsedConnections);
        if (newCollapsed.has(connectionKey)) {
            newCollapsed.delete(connectionKey);
        } else {
            newCollapsed.add(connectionKey);
        }
        setCollapsedConnections(newCollapsed);
    };

    const toggleAllConnections = () => {
        if (collapsedConnections.size === filteredConnections.length) {
            // Все свернуты - развернуть все
            setCollapsedConnections(new Set());
        } else {
            // Свернуть все
            const allKeys = filteredConnections.map((_, index) => `connection-${index}`);
            setCollapsedConnections(new Set(allKeys));
        }
    };

    if (filteredConnections.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    {searchTerm ? '🔍' : '🔗'}
                </div>
                <p className="empty-state-text">
                    {searchTerm 
                        ? 'По вашему запросу ничего не найдено' 
                        : 'Нет добавленных связей'
                    }
                </p>
                {searchTerm && (
                    <button
                        onClick={() => {/* Очистка поиска должна быть в родительском компоненте */}}
                        className="clear-search-button"
                    >
                        Очистить поиск
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="connections-list">
            {filteredConnections.map((item, index) => {
                const connectionKey = `connection-${index}`;
                const isCollapsed = collapsedConnections.has(connectionKey);
                
                return (
                    <div key={index} className="connection-card">
                        <div className="connection-card-header">
                            <button
                                type="button"
                                onClick={() => toggleConnection(connectionKey)}
                                className="connection-card-toggle"
                                title={isCollapsed ? "Развернуть" : "Свернуть"}
                            >
                                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            <h4 
                                className="connection-card-title"
                                onClick={() => toggleConnection(connectionKey)}
                            >
                                Связь № {index + 1}
                            </h4>
                            <button
                                type="button"
                                onClick={() => onRemoveConnection(index)}
                                className="connection-card-remove"
                                title="Удалить связь"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        {!isCollapsed && (
                            <div className="connection-card-content">
                                <div className="connection-item">
                                    <Building className="connection-item-icon" size={16} />
                                    <div className="connection-item-content">
                                        <div className="connection-item-label">Подразделение</div>
                                        <div className="connection-item-value">{item.division.name}</div>
                                    </div>
                                </div>
                                <div className="connection-item">
                                    <Factory className="connection-item-icon" size={16} />
                                    <div className="connection-item-content">
                                        <div className="connection-item-label">Объект</div>
                                        <div className="connection-item-value">{item.facility.name}</div>
                                    </div>
                                </div>
                                <div className="connection-item">
                                    <Cpu className="connection-item-icon" size={16} />
                                    <div className="connection-item-content">
                                        <div className="connection-item-label">Оборудование</div>
                                        <div className="connection-item-value">
                                            {item.equipment.name}, зав. № {item.equipment.serial_number}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ConnectionsList;