import React from 'react';
import { Network } from '../../../../types';

interface TechnicalParamsSectionProps {
    currentNetwork: Network;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const TechnicalParamsSection: React.FC<TechnicalParamsSectionProps> = ({ currentNetwork, onChange }) => {
    return (
        <div className="network-form-section">
            <div className="network-form-section-header">
                <h3 className="network-form-section-title">Технические параметры</h3>
            </div>
            <div className="network-form-section-content">
                <div className="network-form-group">
                    <label className="network-form-label">Протокол</label>
                    <select
                        name="protocol"
                        value={currentNetwork.protocol}
                        onChange={onChange}
                        className="network-form-select"
                    >
                        <option value="TCP/IP">TCP/IP</option>
                        <option value="UDP">UDP</option>
                    </select>
                </div>
                <div className="network-form-group">
                    <label className="network-form-label">IP диапазон</label>
                    <input
                        type="text"
                        name="ip_range"
                        value={currentNetwork.ip_range}
                        onChange={onChange}
                        className="network-form-input"
                        placeholder="192.168.1.0/24"
                    />
                </div>
                <div className="network-form-group">
                    <label className="network-form-label">Пропускная способность (Мбит/с)</label>
                    <input
                        type="number"
                        name="throughput"
                        value={currentNetwork.throughput}
                        onChange={onChange}
                        className="network-form-input"
                        placeholder="1000"
                    />
                </div>
            </div>
        </div>
    );
};

export default TechnicalParamsSection;