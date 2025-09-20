import React from 'react';
import { Network } from '../../../../types';

interface BasicInfoSectionProps {
    currentNetwork: Network;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ currentNetwork, onChange }) => {
    return (
        <div className="network-form-section">
            <h3 className="network-form-section-title">Основная информация</h3>
            <div className="network-form-group">
                <label htmlFor="name" className="network-form-label">Название сети</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={currentNetwork.name}
                    onChange={onChange}
                    className="network-form-input"
                    required
                />
            </div>

            <div className="network-form-group">
                <label htmlFor="description" className="network-form-label">Описание</label>
                <textarea
                    id="description"
                    name="description"
                    value={currentNetwork.description || ''}
                    onChange={onChange}
                    rows={3}
                    className="network-form-textarea"
                />
            </div>
        </div>
    );
};

export default BasicInfoSection;