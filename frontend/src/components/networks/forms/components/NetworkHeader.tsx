import { ArrowLeft } from 'lucide-react';
import React from 'react';

interface NetworkHeaderProps {
    title: string;
    onCancel: () => void;
}

const NetworkHeader: React.FC<NetworkHeaderProps> = ({ title, onCancel }) => {
    return (
        <div className="network-form-header">
            <div className="network-form-header-title">
                <button type="button" onClick={onCancel} className="back-button">
                    <ArrowLeft className="back-button-icon" />
                </button>
                <h1>{title}</h1>
            </div>
        </div>
    );
};

export default NetworkHeader;