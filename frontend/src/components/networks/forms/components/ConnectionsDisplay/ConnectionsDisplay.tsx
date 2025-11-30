// ConnectionsDisplay.tsx
import React, { useState } from 'react';
import { Link2, Navigation } from 'lucide-react';
import ConnectionsList from './ConnectionsList';
import DirectionsList from './DirectionsList';
import './ConnectionsDisplay.css';

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

    return (
        <div className="connections-display-container">
            {/* Секция для отображения связей */}
            <div className="connections-display-section">
                <div className="connections-display-header">
                    <div className="connections-display-header-content">
                        <div className="connections-display-title-container">
                            <h3 className="connections-display-title">
                                <Link2 size={18} />
                                Добавленные связи
                            </h3>
                        </div>
                        <span className="connections-count">
                            {selectedConnections.length}
                        </span>
                    </div>
                    <div className="search-container-connections">
                        <input
                            type="text"
                            placeholder="Поиск по номеру, подразделению, объекту, оборудованию..."
                            value={connectionSearch}
                            onChange={(e) => setConnectionSearch(e.target.value)}
                            className="search-input"
                        />
                        {connectionSearch && (
                            <button
                                onClick={() => setConnectionSearch('')}
                                className="search-clear"
                                title="Очистить поиск"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <ConnectionsList
                    connections={selectedConnections}
                    searchTerm={connectionSearch}
                    onRemoveConnection={onRemoveConnection}
                />
            </div>

            {/* Секция для отображения направлений */}
            <div className="connections-display-section">
                <div className="connections-display-header">
                    <div className="connections-display-header-content">
                        <div className="connections-display-title-container">
                            <h3 className="connections-display-title">
                                <Navigation size={18} />
                                Созданные направления
                            </h3>
                        </div>
                        <span className="connections-count">
                            {selectedDirections.length}
                        </span>
                    </div>
                    <div className="search-container-connections">
                        <input
                            type="text"
                            placeholder="Поиск по номеру, подразделению, объекту, оборудованию..."
                            value={directionSearch}
                            onChange={(e) => setDirectionSearch(e.target.value)}
                            className="search-input"
                        />
                        {directionSearch && (
                            <button
                                onClick={() => setDirectionSearch('')}
                                className="search-clear"
                                title="Очистить поиск"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <DirectionsList
                    directions={selectedDirections}
                    searchTerm={directionSearch}
                    onRemoveDirection={onRemoveDirection}
                />
            </div>
        </div>
    );
};

export default ConnectionsDisplay;