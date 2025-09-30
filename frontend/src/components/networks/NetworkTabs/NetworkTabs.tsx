import React, { useState } from 'react';
import './NetworkTabs.css';
import VLANManagement from '../VLANManagement/VLANManagement';
import InterfaceManagement from '../InterfaceManagement/InterfaceManagement';
import IPAddressManagement from '../IPAddressManagement/IPAddressManagement';
import IPRangeManagement from '../IPRangeManagement/IPRangeManagement';

interface NetworkTabsProps {
  token: string | null;
}

const NetworkTabs: React.FC<NetworkTabsProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState('vlan');

  const tabs = [
    { id: 'vlan', label: 'VLAN' },
    { id: 'interfaces', label: 'Интерфейсы' },
    { id: 'ipaddresses', label: 'IP-адреса' },
    { id: 'ipranges', label: 'Диапазоны IP' },
  ];

  return (
    <div className="network-tabs">
      <div className="tabs-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div className="tab-indicator" data-active-tab={activeTab}></div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'vlan' && <VLANManagement token={token} />}
        {activeTab === 'interfaces' && <InterfaceManagement token={token} />}
        {activeTab === 'ipaddresses' && <IPAddressManagement token={token} />}
        {activeTab === 'ipranges' && <IPRangeManagement token={token} />}
      </div>
    </div>
  );
};

export default NetworkTabs;