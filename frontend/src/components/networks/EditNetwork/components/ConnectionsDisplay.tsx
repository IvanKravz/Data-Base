import React from 'react';

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
    return (
        <div className="connections-display-container">
            {/* Секция для отображения связей */}
            <div className="connections-display-section">
                <div className="connections-display-header">
                    <h3 className="connections-display-title">Добавленные связи</h3>
                    <span className="connections-count">{selectedConnections.length}</span>
                </div>

                {selectedConnections.length > 0 ? (
                    <div className="connections-list">
                        {selectedConnections.map((item, index) => (
                            <div key={index} className="connection-card">
                                <div className="connection-card-header">
                                    <h4 className="connection-card-title">Связь № {index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveConnection(index)}
                                        className="connection-card-remove"
                                        title="Удалить связь"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="connection-card-details">
                                    <div className="connection-card-division">
                                        <span className="connection-card-division">Подразделение: </span>
                                        <span className="connection-equipment">{item.division.name}</span>
                                    </div>
                                    <div className="connection-card-facility">
                                        <span className="connection-card-facility">Объект: </span>
                                        <span className="connection-equipment">{item.facility.name}</span>
                                    </div>
                                    <div className="connection-card-equipment">
                                        <span className="connection-card-equipment">Оборудование: </span>
                                        <span className="connection-equipment">{item.equipment.name}, зав. № {item.equipment.serial_number}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔗</div>
                        <p className="empty-state-text">Нет добавленных связей</p>
                    </div>
                )}
            </div>

            {/* Секция для отображения направлений */}
            <div className="connections-display-section">
                <div className="connections-display-header">
                    <h3 className="connections-display-title">Созданные направления</h3>
                    <span className="connections-count">{selectedDirections.length}</span>
                </div>

                {selectedDirections.length > 0 ? (
                    <div className="connections-list">
                        {selectedDirections.map((direction, index) => (
                            <div key={index} className="direction-card">
                                <div className="direction-card-header">
                                    <h4 className="direction-card-title">Направление #{index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveDirection(index)}
                                        className="connection-card-remove"
                                        title="Удалить направление"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="direction-path">
                                    <div className="direction-from">
                                        {direction.from.division.name} - {direction.from.facility.name}
                                    </div>
                                    <div className="direction-arrow">→</div>
                                    <div className="direction-to">
                                        {direction.to.division.name} - {direction.to.facility.name}
                                    </div>
                                </div>

                                <div className="direction-details">
                                    {(direction.bandwidth || direction.latency || direction.description) && (
                                        <>
                                            {direction.bandwidth && (
                                                <div className="direction-detail-item">
                                                    <span className="direction-detail-label">Пропускная способность:</span>
                                                    <span>{direction.bandwidth} Mbps</span>
                                                </div>
                                            )}
                                            {direction.latency && (
                                                <div className="direction-detail-item">
                                                    <span className="direction-detail-label">Задержка:</span>
                                                    <span>{direction.latency} ms</span>
                                                </div>
                                            )}
                                            {direction.description && (
                                                <div className="direction-detail-item">
                                                    <span className="direction-detail-label">Описание:</span>
                                                    <span>{direction.description}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">↔️</div>
                        <p className="empty-state-text">Нет созданных направлений</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectionsDisplay;