// src/components/networks/management/NetworkTabs/NetworkTabs.tsx
import React, { useState, useCallback } from 'react';
import './NetworkTabs.css';
import VLANManagement from '../VLANManagement/VLANManagement';
import InterfaceManagement from '../InterfaceManagement/InterfaceManagement';
import IPAddressManagement from '../IPAddressManagement/IPAddressManagement';
import SubnetsManagement from '../management/SubnetsManagement/SubnetsManagement';

interface NetworkTabsProps {
  token: string | null;
}

const NetworkTabs: React.FC<NetworkTabsProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState('vlan');
  /**
   * ID подсети, которую нужно открыть на вкладке «Подсети».
   * Устанавливается при клике «Открыть в подсетях» на вкладке IP-адресов.
   */
  const [focusedSubnetId, setFocusedSubnetId] = useState<string | null>(null);

  const tabs = [
    { id: 'vlan', label: 'VLAN' },
    { id: 'interfaces', label: 'Интерфейсы' },
    { id: 'ipaddresses', label: 'IP-адреса' },
    { id: 'subnets', label: 'Подсети' },
  ];

  const handleNavigateToSubnets = useCallback((subnetId: string) => {
    setFocusedSubnetId(subnetId);
    setActiveTab('subnets');
  }, []);

  const handleConsumeFocus = useCallback(() => {
    setFocusedSubnetId(null);
  }, []);

  return (
    <div className="network-tabs">
      <div className="tabs-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              // при ручном переключении на вкладку «Подсети» фокус сбрасываем
              if (tab.id !== 'subnets') setFocusedSubnetId(null);
              setActiveTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
        <div className="tab-indicator" data-active-tab={activeTab} />
      </div>

      <div className="tab-content">
        {activeTab === 'vlan' && <VLANManagement token={token} />}
        {activeTab === 'interfaces' && <InterfaceManagement token={token} />}
        {activeTab === 'ipaddresses' && (
          <IPAddressManagement
            token={token}
            onNavigateToSubnets={handleNavigateToSubnets}
          />
        )}
        {activeTab === 'subnets' && (
          <SubnetsManagement
            token={token}
            initialSelectedId={focusedSubnetId}
            onConsumeInitial={handleConsumeFocus}
          />
        )}
      </div>
    </div>
  );
};

export default NetworkTabs;