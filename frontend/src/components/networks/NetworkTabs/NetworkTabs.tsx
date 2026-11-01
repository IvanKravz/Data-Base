// src/components/networks/management/NetworkTabs/NetworkTabs.tsx
import React, { useCallback, useState } from 'react';
import './NetworkTabs.css';
import OverviewTab from '../management/OverviewTab/OverviewTab';
import SubnetsManagement from '../management/SubnetsManagement/SubnetsManagement';
import IPAddressManagement from '../IPAddressManagement/IPAddressManagement';
import VLANManagement from '../VLANManagement/VLANManagement';
import InterfaceManagement from '../InterfaceManagement/InterfaceManagement';

interface NetworkTabsProps {
  token: string | null;
}

const NetworkTabs: React.FC<NetworkTabsProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [focusedSubnetId, setFocusedSubnetId] = useState<string | null>(null);

  // Порядок: Обзор → Подсети → IP-адреса → VLAN → Интерфейсы
  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'subnets', label: 'Подсети' },
    { id: 'ipaddresses', label: 'IP-адреса' },
    { id: 'vlan', label: 'VLAN' },
    { id: 'interfaces', label: 'Интерфейсы' },
  ];

  const handleNavigateToTab = useCallback((tabId: string) => {
    if (tabId !== 'subnets') setFocusedSubnetId(null);
    setActiveTab(tabId);
  }, []);

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
        {activeTab === 'overview' && (
          <OverviewTab
            token={token}
            onNavigateToTab={handleNavigateToTab}
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
        {activeTab === 'ipaddresses' && (
          <IPAddressManagement
            token={token}
            onNavigateToSubnets={handleNavigateToSubnets}
          />
        )}
        {activeTab === 'vlan' && <VLANManagement token={token} />}
        {activeTab === 'interfaces' && <InterfaceManagement token={token} />}
      </div>
    </div>
  );
};

export default NetworkTabs;