import React, { useState } from 'react';
import { DivisionsManagementTab } from './tabs/DivisionsManagementTab';
import { FacilityTypesTab } from './tabs/FacilityTypesTab';
import './AdminDivisionsManagementPage.css';
import { Tabs } from '../../common/Tabs/Tabs';

export const AdminDivisionsManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'divisions' | 'facility-types'>('divisions');

    const tabs = [
        { id: 'divisions', label: 'Подразделения' },
        { id: 'facility-types', label: 'Типы объектов' },
    ];

    return (
        <div className="admin-divisions-management">
            <h1 className="page-title">Управление подразделениями</h1>
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as typeof activeTab)}
            />
            <div className="tab-content">
                {activeTab === 'divisions' && <DivisionsManagementTab />}
                {activeTab === 'facility-types' && <FacilityTypesTab />}
            </div>
        </div>
    );
};