// Layout.tsx
import React from 'react';
import { Sidebar } from './Sidebar';
import label from '../assets/label.webp';
import './style.css';
import { useAppPermissions } from '../api/utils/AppPermissionsContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onSetActiveTab: (tab: string) => void;
  userMenu?: React.ReactNode;
}

export function Layout({ children, activeTab, onSetActiveTab, userMenu }: LayoutProps) {
  const {
    canAccessDivisions,
    canAccessPersonnel,
    canAccessEquipment,
    canAccessFacilities,
    canAccessTasks,
    canAccessNetworks,
    canAccessMap
  } = useAppPermissions();

  return (
    <div className="page-container">
      {/* Хедер */}
      <div className="header">
        <div className="header-content">
          <div className="header-logo">
            <div className="header-logo-icon">
              <img className="logo-icon" src={label} alt="Логотип" />
            </div>
            <h1 className="header-title">
              Служба специальной связи и информатизации
            </h1>
          </div>
          {userMenu}
        </div>
      </div>

      {/* Сайдбар */}
      <div className="sidebar">
        <Sidebar
          activeTab={activeTab}
          onSetActiveTab={onSetActiveTab}
          availableTabs={{
            divisions: canAccessDivisions(),
            personnel: canAccessPersonnel(),
            equipment: canAccessEquipment(),
            facilities: canAccessFacilities(),
            tasks: canAccessTasks(),
            networks: canAccessNetworks(),
            map: canAccessMap(),
          }}
        />
      </div>

      {/* Основной контент */}
      <div className="main-content">
        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  );
}