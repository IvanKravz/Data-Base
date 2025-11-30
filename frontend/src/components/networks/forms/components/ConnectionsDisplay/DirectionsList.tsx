// DirectionsList.tsx
import React, { useState, useMemo } from 'react';
import { Building, Factory, Cpu, ArrowRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface SelectedItem {
    division: { id: string; name: string };
    facility: { id: string; name: string };
    equipment: { id: string; name: string; serial_number: string };
}

interface NetworkDirection {
    from: SelectedItem;
    to: SelectedItem;
    bandwidth?: number;
    latency?: number;
    description?: string;
}

interface DirectionsListProps {
    directions: NetworkDirection[];
    searchTerm: string;
    onRemoveDirection: (index: number) => void;
}

const DirectionsList: React.FC<DirectionsListProps> = ({
    directions,
    searchTerm,
    onRemoveDirection
}) => {
    const [collapsedDirections, setCollapsedDirections] = useState<Set<string>>(new Set());

    // Фильтрация направлений
    const filteredDirections = useMemo(() => {
        if (!searchTerm) return directions;
        
        const searchLower = searchTerm.toLowerCase();
        return directions.filter((direction, index) => {
            const directionNumber = (index + 1).toString();
            return (
                directionNumber.includes(searchLower) ||
                direction.from.division.name.toLowerCase().includes(searchLower) ||
                direction.from.facility.name.toLowerCase().includes(searchLower) ||
                direction.from.equipment.name.toLowerCase().includes(searchLower) ||
                direction.from.equipment.serial_number.toLowerCase().includes(searchLower) ||
                direction.to.division.name.toLowerCase().includes(searchLower) ||
                direction.to.facility.name.toLowerCase().includes(searchLower) ||
                direction.to.equipment.name.toLowerCase().includes(searchLower) ||
                direction.to.equipment.serial_number.toLowerCase().includes(searchLower)
            );
        });
    }, [directions, searchTerm]);

    // Функции для управления состоянием свертывания
    const toggleDirection = (directionKey: string) => {
        const newCollapsed = new Set(collapsedDirections);
        if (newCollapsed.has(directionKey)) {
            newCollapsed.delete(directionKey);
        } else {
            newCollapsed.add(directionKey);
        }
        setCollapsedDirections(newCollapsed);
    };

    const toggleAllDirections = () => {
        if (collapsedDirections.size === filteredDirections.length) {
            // Все свернуты - развернуть все
            setCollapsedDirections(new Set());
        } else {
            // Свернуть все
            const allKeys = filteredDirections.map((_, index) => `direction-${index}`);
            setCollapsedDirections(new Set(allKeys));
        }
    };

    if (filteredDirections.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    {searchTerm ? '🔍' : '↔️'}
                </div>
                <p className="empty-state-text">
                    {searchTerm 
                        ? 'По вашему запросу ничего не найдено' 
                        : 'Нет созданных направлений'
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
            {filteredDirections.map((direction, index) => {
                const directionKey = `direction-${index}`;
                const isCollapsed = collapsedDirections.has(directionKey);

                return (
                    <div key={index} className="direction-card">
                        <div className="direction-card-header">
                            <button
                                type="button"
                                onClick={() => toggleDirection(directionKey)}
                                className="direction-card-toggle"
                                title={isCollapsed ? "Развернуть" : "Свернуть"}
                            >
                                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </button>
                            <h4
                                className="direction-card-title"
                                onClick={() => toggleDirection(directionKey)}
                            >
                                Направление № {index + 1}
                            </h4>
                            <button
                                type="button"
                                onClick={() => onRemoveDirection(index)}
                                className="connection-card-remove"
                                title="Удалить направление"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {!isCollapsed && (
                            <div className="direction-card-content">
                                <div className="direction-path">
                                    <div className="direction-node">
                                        <div className="direction-node-header">Отправляющая сторона</div>
                                        <div className="direction-node-content">
                                            <div className="direction-node-item">
                                                <Building className="direction-node-icon" size={14} />
                                                <span className="direction-node-text">
                                                    {direction.from.division.name}
                                                </span>
                                            </div>
                                            <div className="direction-node-item">
                                                <Factory className="direction-node-icon" size={14} />
                                                <span className="direction-node-text">
                                                    {direction.from.facility.name}
                                                </span>
                                            </div>
                                            <div className="direction-node-item">
                                                <Cpu className="direction-node-icon" size={14} />
                                                <span className="direction-node-text">
                                                    {direction.from.equipment.name}, зав. № {direction.from.equipment.serial_number}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="direction-arrow">
                                        <ArrowRight size={20} />
                                    </div>

                                    <div className="direction-node">
                                        <div className="direction-node-header">Принимающая сторона</div>
                                        <div className="direction-node-content">
                                            <div className="direction-node-item">
                                                <Building className="direction-node-icon" size={14} />
                                                <span className="direction-node-text">
                                                    {direction.to.division.name}
                                                </span>
                                            </div>
                                            <div className="direction-node-item">
                                                <Factory className="direction-node-icon" size={14} />
                                                <span className="direction-node-text">
                                                    {direction.to.facility.name}
                                                </span>
                                            </div>
                                            <div className="direction-node-item">
                                                <Cpu className="direction-node-icon" size={14} />
                                                <span className="direction-node-text">
                                                    {direction.to.equipment.name}, зав. № {direction.to.equipment.serial_number}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(direction.bandwidth || direction.latency || direction.description) && (
                                    <div className="direction-details">
                                        {direction.bandwidth && (
                                            <div className="direction-detail-item">
                                                <span className="direction-detail-label">Пропускная способность:</span>
                                                <span className="direction-detail-value">{direction.bandwidth} Mbps</span>
                                            </div>
                                        )}
                                        {direction.latency && (
                                            <div className="direction-detail-item">
                                                <span className="direction-detail-label">Задержка:</span>
                                                <span className="direction-detail-value">{direction.latency} ms</span>
                                            </div>
                                        )}
                                        {direction.description && (
                                            <div className="direction-detail-item">
                                                <span className="direction-detail-label">Описание:</span>
                                                <span className="direction-detail-value">{direction.description}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DirectionsList;