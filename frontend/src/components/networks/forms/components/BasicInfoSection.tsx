import React from 'react';
import { Network } from '../../../../types';

interface BasicInfoSectionProps {
    currentNetwork: Network;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ currentNetwork, onChange }) => {
    return (
        <div className="network-form-section">
            <div className="network-form-section-header">
                <h3 className="network-form-section-title">Основная информация</h3>
            </div>
            <div className="network-form-section-content">
                <div className="network-form-group">
                    <label className="network-form-label">Название сети</label>
                    <input
                        type="text"
                        name="name"
                        value={currentNetwork.name}
                        onChange={onChange}
                        className="network-form-input"
                        placeholder="Введите название сети"
                    />
                </div>
                <div className="network-form-group">
                    <label className="network-form-label">Описание</label>
                    <textarea
                        name="description"
                        value={currentNetwork.description}
                        onChange={onChange}
                        className="network-form-textarea"
                        placeholder="Введите описание сети"
                        rows={3}
                    />
                </div>
            </div>
        </div>
    );
};

export default BasicInfoSection;

