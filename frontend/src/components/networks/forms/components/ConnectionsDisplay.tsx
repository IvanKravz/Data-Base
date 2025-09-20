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
        <div className="network-form-connections-display-container">
            {/* Секция для отображения связей */}
            <div className="network-form-connections-display-section">
                <div className="network-form-connections-display-header">
                    <h3 className="network-form-connections-display-title">Добавленные связи</h3>
                    <span className="network-form-connections-count">{selectedConnections.length}</span>
                </div>

                {selectedConnections.length > 0 ? (
                    <div className="network-form-connections-list">
                        {selectedConnections.map((item, index) => (
                            <div key={index} className="network-form-connection-card">
                                <div className="network-form-connection-card-header">
                                    <h4 className="network-form-connection-card-title">Связь № {index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveConnection(index)}
                                        className="network-form-connection-card-remove"
                                        title="Удалить связь"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="network-form-connection-card-details">
                                    <div className="network-form-connection-card-division">
                                        <span className="network-form-connection-card-division">Подразделение: </span>
                                        <span className="network-form-connection-equipment">{item.division.name}</span>
                                    </div>
                                    <div className="network-form-connection-card-facility">
                                        <span className="network-form-connection-card-facility">Объект: </span>
                                        <span className="network-form-connection-equipment">{item.facility.name}</span>
                                    </div>
                                    <div className="network-form-connection-card-equipment">
                                        <span className="network-form-connection-card-equipment">Оборудование: </span>
                                        <span className="network-form-connection-equipment">{item.equipment.name}, зав. № {item.equipment.serial_number}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="network-form-empty-state">
                        <div className="network-form-empty-state-icon">🔗</div>
                        <p className="network-form-empty-state-text">Нет добавленных связей</p>
                    </div>
                )}
            </div>

            {/* Секция для отображения направлений */}
            <div className="network-form-connections-display-section">
                <div className="network-form-connections-display-header">
                    <h3 className="network-form-connections-display-title">Созданные направления</h3>
                    <span className="network-form-connections-count">{selectedDirections.length}</span>
                </div>

                {selectedDirections.length > 0 ? (
                    <div className="network-form-connections-list">
                        {selectedDirections.map((direction, index) => (
                            <div key={index} className="network-form-direction-card">
                                <div className="network-form-direction-card-header">
                                    <h4 className="network-form-direction-card-title">Направление #{index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveDirection(index)}
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
                        ))}
                    </div>
                ) : (
                    <div className="network-form-empty-state">
                        <div className="network-form-empty-state-icon">↔️</div>
                        <p className="network-form-empty-state-text">Нет созданных направлений</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectionsDisplay;