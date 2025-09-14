import React from 'react';
import { Network } from '../../../../types';

interface BasicInfoSectionProps {
    currentNetwork: Network;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ currentNetwork, onChange }) => {
    return (
        <div className="edit-network-section">
            <h3 className="edit-network-section-title">Основная информация</h3>
            <div className="edit-network-form-group">
                <label htmlFor="name" className="edit-network-label">Название сети</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={currentNetwork.name}
                    onChange={onChange}
                    className="edit-network-input"
                    required
                />
            </div>

            <div className="edit-network-form-group">
                <label htmlFor="description" className="edit-network-label">Описание</label>
                <textarea
                    id="description"
                    name="description"
                    value={currentNetwork.description || ''}
                    onChange={onChange}
                    rows={3}
                    className="edit-network-textarea"
                />
            </div>
        </div>
    );
};

export default BasicInfoSection;