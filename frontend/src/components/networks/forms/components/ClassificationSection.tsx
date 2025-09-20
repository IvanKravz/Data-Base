import React from 'react';
import { Network } from '../../../../types';

interface ClassificationSectionProps {
    currentNetwork: Network;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const ClassificationSection: React.FC<ClassificationSectionProps> = ({ currentNetwork, onChange }) => {
    return (
        <div className="network-form-section">
            <h3 className="network-form-section-title">Классификация</h3>
            <div className="network-form-group">
                <label htmlFor="network_class" className="network-form-label">Класс сети</label>
                <select
                    id="network_class"
                    name="network_class"
                    value={currentNetwork.network_class || ''}
                    onChange={onChange}
                    className="network-form-select"
                >
                    <option value="">Выберите класс</option>
                    <option value="1">1 класс</option>
                    <option value="2">2 класс</option>
                </select>
            </div>

            <div className="network-form-group">
                <label htmlFor="security_level" className="network-form-label">Степень секретности</label>
                <select
                    id="security_level"
                    name="security_level"
                    value={currentNetwork.security_level}
                    onChange={onChange}
                    className="network-form-select"
                    required
                >
                    <option value="public">Открычная</option>
                    <option value="confidential">Конфиденциальная</option>
                    <option value="secret">Секретная</option>
                    <option value="top_secret">Совершенно секретная</option>
                </select>
            </div>
        </div>
    );
};

export default ClassificationSection;