import React from 'react';

interface NetworkHeaderProps {
    networkName: string;
    onCancel: () => void;
}

const NetworkHeader: React.FC<NetworkHeaderProps> = ({ networkName, onCancel }) => {
    return (
        <div className="edit-network-header">
            <h1>Редактирование сети: {networkName}</h1>
            <button
                className="edit-network-back-button"
                onClick={onCancel}
            >
                Назад к списку
            </button>
        </div>
    );
};

export default NetworkHeader;