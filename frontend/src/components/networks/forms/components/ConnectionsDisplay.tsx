import React, { useState, useMemo } from 'react';

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

interface ConnectionsDisplayProps {
    selectedConnections: SelectedItem[];
    selectedDirections: NetworkDirection[];
    onRemoveConnection: (index: number) => void;
    onRemoveDirection: (index: number) => void;
}

const ConnectionsDisplay: React.FC<ConnectionsDisplayProps> = ({
    selectedConnections,
    selectedDirections,
    onRemoveConnection,
    onRemoveDirection
}) => {
    const [connectionSearch, setConnectionSearch] = useState('');
    const [directionSearch, setDirectionSearch] = useState('');

    // Фильтрация связей
    const filteredConnections = useMemo(() => {
        if (!connectionSearch) return selectedConnections;
        
        const searchLower = connectionSearch.toLowerCase();
        return selectedConnections.filter((item, index) => {
            const connectionNumber = (index + 1).toString();
            return (
                connectionNumber.includes(searchLower) ||
                item.division.name.toLowerCase().includes(searchLower) ||
                item.facility.name.toLowerCase().includes(searchLower) ||
                item.equipment.name.toLowerCase().includes(searchLower) ||
                item.equipment.serial_number.toLowerCase().includes(searchLower)
            );
        });
    }, [selectedConnections, connectionSearch]);

    // Фильтрация направлений
    const filteredDirections = useMemo(() => {
        if (!directionSearch) return selectedDirections;
        
        const searchLower = directionSearch.toLowerCase();
        return selectedDirections.filter((direction, index) => {
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
    }, [selectedDirections, directionSearch]);

    return (
        <div className="network-form-connections-display-container">
            {/* Секция для отображения связей */}
            <div className="network-form-connections-display-section">
                <div className="network-form-connections-display-header">
                    <div className="network-form-connections-display-header-content">
                        <h3 className="network-form-connections-display-title">Добавленные связи</h3>
                        <span className="network-form-connections-count">
                            {filteredConnections.length}/{selectedConnections.length}
                        </span>
                        
                    </div>
                    <div className="network-form-search-container">
                        <input
                            type="text"
                            placeholder="Поиск по номеру, подразделению, объекту, оборудованию..."
                            value={connectionSearch}
                            onChange={(e) => setConnectionSearch(e.target.value)}
                            className="network-form-search-input"
                        />
                        {connectionSearch && (
                            <button
                                onClick={() => setConnectionSearch('')}
                                className="network-form-search-clear"
                                title="Очистить поиск"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {filteredConnections.length > 0 ? (
                    <div className="network-form-connections-list">
                        {filteredConnections.map((item, index) => {
                            // Находим оригинальный индекс для корректного удаления
                            const originalIndex = selectedConnections.findIndex(conn => 
                                conn.division.id === item.division.id &&
                                conn.facility.id === item.facility.id &&
                                conn.equipment.id === item.equipment.id
                            );
                            
                            return (
                                <div key={originalIndex} className="network-form-connection-card">
                                    <div className="network-form-connection-card-header">
                                        <h4 className="network-form-connection-card-title">
                                            Связь № {originalIndex + 1}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveConnection(originalIndex)}
                                            className="network-form-connection-card-remove"
                                            title="Удалить связь"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="network-form-connection-card-details">
                                        <div className="network-form-connection-card-division">
                                            <span>Подразделение: </span>
                                            <span className="network-form-connection-equipment">{item.division.name}</span>
                                        </div>→
                                        <div className="network-form-connection-card-facility">
                                            <span>Объект: </span>
                                            <span className="network-form-connection-equipment">{item.facility.name}</span>
                                        </div>→
                                        <div className="network-form-connection-card-equipment">
                                            <span>Оборудование: </span>
                                            <span className="network-form-connection-equipment">
                                                {item.equipment.name}, зав. № {item.equipment.serial_number}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="network-form-empty-state">
                        <div className="network-form-empty-state-icon">
                            {connectionSearch ? '🔍' : '🔗'}
                        </div>
                        <p className="network-form-empty-state-text">
                            {connectionSearch 
                                ? 'По вашему запросу ничего не найдено' 
                                : 'Нет добавленных связей'
                            }
                        </p>
                        {connectionSearch && (
                            <button
                                onClick={() => setConnectionSearch('')}
                                className="network-form-clear-search-button"
                            >
                                Очистить поиск
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Секция для отображения направлений */}
            <div className="network-form-connections-display-section">
                <div className="network-form-connections-display-header">
                    <div className="network-form-connections-display-header-content">
                        <h3 className="network-form-connections-display-title">Созданные направления</h3>
                        <span className="network-form-connections-count">
                            {filteredDirections.length}/{selectedDirections.length}
                        </span>
                    </div>
                    <div className="network-form-search-container">
                        <input
                            type="text"
                            placeholder="Поиск по номеру, подразделению, объекту, оборудованию..."
                            value={directionSearch}
                            onChange={(e) => setDirectionSearch(e.target.value)}
                            className="network-form-search-input"
                        />
                        {directionSearch && (
                            <button
                                onClick={() => setDirectionSearch('')}
                                className="network-form-search-clear"
                                title="Очистить поиск"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {filteredDirections.length > 0 ? (
                    <div className="network-form-connections-list">
                        {filteredDirections.map((direction, index) => {
                            // Находим оригинальный индекс для корректного удаления
                            const originalIndex = selectedDirections.findIndex(dir => 
                                dir.from.division.id === direction.from.division.id &&
                                dir.from.facility.id === direction.from.facility.id &&
                                dir.from.equipment.id === direction.from.equipment.id &&
                                dir.to.division.id === direction.to.division.id &&
                                dir.to.facility.id === direction.to.facility.id &&
                                dir.to.equipment.id === direction.to.equipment.id &&
                                dir.bandwidth === direction.bandwidth &&
                                dir.latency === direction.latency &&
                                dir.description === direction.description
                            );

                            return (
                                <div key={originalIndex} className="network-form-direction-card">
                                    <div className="network-form-direction-card-header">
                                        <h4 className="network-form-direction-card-title">
                                            Направление #{originalIndex + 1}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveDirection(originalIndex)}
                                            className="network-form-connection-card-remove"
                                            title="Удалить направление"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="network-form-direction-path">
                                        <div className="network-form-direction-from">
                                            {direction.from.division.name} - {direction.from.facility.name} - {direction.from.equipment.name}, зав. № {direction.from.equipment.serial_number}
                                        </div>
                                        <div className="network-form-direction-arrow">→</div>
                                        <div className="network-form-direction-to">
                                            {direction.to.division.name} - {direction.to.facility.name} - {direction.to.equipment.name}, зав. № {direction.to.equipment.serial_number}
                                        </div>
                                    </div>

                                    <div className="network-form-direction-details">
                                        {(direction.bandwidth || direction.latency || direction.description) && (
                                            <>
                                                {direction.bandwidth && (
                                                    <div className="network-form-direction-detail-item">
                                                        <span className="network-form-direction-detail-label">Пропускная способность:</span>
                                                        <span>{direction.bandwidth} Mbps</span>
                                                    </div>
                                                )}
                                                {direction.latency && (
                                                    <div className="network-form-direction-detail-item">
                                                        <span className="network-form-direction-detail-label">Задержка:</span>
                                                        <span>{direction.latency} ms</span>
                                                    </div>
                                                )}
                                                {direction.description && (
                                                    <div className="network-form-direction-detail-item">
                                                        <span className="network-form-direction-detail-label">Описание:</span>
                                                        <span>{direction.description}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="network-form-empty-state">
                        <div className="network-form-empty-state-icon">
                            {directionSearch ? '🔍' : '↔️'}
                        </div>
                        <p className="network-form-empty-state-text">
                            {directionSearch 
                                ? 'По вашему запросу ничего не найдено' 
                                : 'Нет созданных направлений'
                            }
                        </p>
                        {directionSearch && (
                            <button
                                onClick={() => setDirectionSearch('')}
                                className="network-form-clear-search-button"
                            >
                                Очистить поиск
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectionsDisplay;