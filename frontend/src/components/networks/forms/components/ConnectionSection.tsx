import React, { useState } from 'react';

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

interface ConnectionSectionProps {
    selectedConnections: SelectedItem[];
    selectedDirections: NetworkDirection[];
    onAddDirection: (direction: NetworkDirection) => void;
    onRemoveDirection: (index: number) => void;
    directionError: string | null;
}

const ConnectionSection: React.FC<ConnectionSectionProps> = ({
    selectedConnections,
    onAddDirection,
    directionError
}) => {
    const [fromConnection, setFromConnection] = useState<string>('');
    const [toConnection, setToConnection] = useState<string>('');
    const [bandwidth, setBandwidth] = useState<string>('');
    const [latency, setLatency] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    const handleAddDirection = () => {
        if (!fromConnection || !toConnection) return;

        const from = selectedConnections.find(c => 
            `${c.division.id}-${c.facility.id}-${c.equipment.id}` === fromConnection
        );
        const to = selectedConnections.find(c => 
            `${c.division.id}-${c.facility.id}-${c.equipment.id}` === toConnection
        );

        if (from && to) {
            const newDirection: NetworkDirection = {
                from,
                to,
                bandwidth: bandwidth ? parseInt(bandwidth) : undefined,
                latency: latency ? parseInt(latency) : undefined,
                description: description || undefined
            };

            onAddDirection(newDirection);
            
            // Сброс полей
            setFromConnection('');
            setToConnection('');
            setBandwidth('');
            setLatency('');
            setDescription('');
        }
    };

    return (
        <div className="network-form-section">
            <div className="network-form-section-header">
                <h3 className="network-form-section-title">Создание направлений</h3>
            </div>
            <div className="network-form-section-content">
                {directionError && (
                    <div className="network-form-error-message">{directionError}</div>
                )}
                
                <div className="network-form-group">
                    <label className="network-form-label">Откуда (Источник)</label>
                    <select
                        value={fromConnection}
                        onChange={(e) => setFromConnection(e.target.value)}
                        className="network-form-select"
                    >
                        <option value="">Выберите источник</option>
                        {selectedConnections.map((conn, index) => (
                            <option 
                                key={index} 
                                value={`${conn.division.id}-${conn.facility.id}-${conn.equipment.id}`}
                            >
                                {conn.division.name} - {conn.facility.name} - {conn.equipment.name}, зав. № {conn.equipment.serial_number}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="network-form-group">
                    <label className="network-form-label">Куда (Назначение)</label>
                    <select
                        value={toConnection}
                        onChange={(e) => setToConnection(e.target.value)}
                        className="network-form-select"
                    >
                        <option value="">Выберите назначение</option>
                        {selectedConnections.map((conn, index) => (
                            <option 
                                key={index} 
                                value={`${conn.division.id}-${conn.facility.id}-${conn.equipment.id}`}
                            >
                                {conn.division.name} - {conn.facility.name} - {conn.equipment.name}, зав. № {conn.equipment.serial_number}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="network-form-group">
                    <label className="network-form-label">Пропускная способность (Mbps)</label>
                    <input
                        type="number"
                        value={bandwidth}
                        onChange={(e) => setBandwidth(e.target.value)}
                        className="network-form-input"
                        placeholder="Не указано"
                    />
                </div>

                <div className="network-form-group">
                    <label className="network-form-label">Задержка (ms)</label>
                    <input
                        type="number"
                        value={latency}
                        onChange={(e) => setLatency(e.target.value)}
                        className="network-form-input"
                        placeholder="Не указано"
                    />
                </div>

                <div className="network-form-group">
                    <label className="network-form-label">Описание</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="network-form-textarea"
                        placeholder="Описание направления"
                        rows={3}
                    />
                </div>

                <div className="network-form-group">
                    <button
                        type="button"
                        onClick={handleAddDirection}
                        className="network-form-add-button"
                        disabled={!fromConnection || !toConnection}
                    >
                        Добавить направление
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionSection;