import React from 'react';
import { Network } from '../../../../types';

interface TechnicalParamsSectionProps {
    currentNetwork: Network;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const TechnicalParamsSection: React.FC<TechnicalParamsSectionProps> = ({ currentNetwork, onChange }) => {
    return (
        <div className="edit-network-section">
            <h3 className="edit-network-section-title">Технические параметры</h3>
            <div className="edit-network-form-group">
                <label htmlFor="protocol" className="edit-network-label">Протокол связи</label>
                <select
                    id="protocol"
                    name="protocol"
                    value={currentNetwork.protocol}
                    onChange={onChange}
                    className="edit-network-select"
                >
                    <option value="TCP/IP">TCP/IP</option>
                    <option value="UDP">UDP</option>
                    <option value="MPLS">MPLS</option>
                    <option value="Other">Другой</option>
                </select>
            </div>

            <div className="edit-network-form-group">
                <label htmlFor="ip_range" className="edit-network-label">IP диапазон</label>
                <input
                    type="text"
                    id="ip_range"
                    name="ip_range"
                    value={currentNetwork.ip_range || ''}
                    onChange={onChange}
                    placeholder="192.168.1.0/24"
                    className="edit-network-input"
                />
            </div>

            <div className="edit-network-form-group">
                <label htmlFor="throughput" className="edit-network-label">Пропускная способность (Mbps)</label>
                <input
                    type="number"
                    id="throughput"
                    name="throughput"
                    value={currentNetwork.throughput || ''}
                    onChange={onChange}
                    min="0"
                    className="edit-network-input"
                />
            </div>
        </div>
    );
};

export default TechnicalParamsSection;