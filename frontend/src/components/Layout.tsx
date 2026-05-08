// Layout.tsx
import React from 'react';
import { Sidebar } from './Sidebar';
import label from '../assets/label.webp';
import bannerImage from '../assets/management.jpg';
import './style.css';
import './Layout.css';
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
      {/* Hero-баннер: изображение сверху, растянуто по ширине */}
      <div className="hero-banner">
        <div className="hero-banner__image-wrapper">
          <img 
            src={bannerImage} 
            alt="Hero background" 
            className="hero-banner__image"
            loading="eager"
          />
          <div className="hero-banner__overlay" />
        </div>
      </div>

      {/* Хедер (теперь — под баннером, стикер при скролле) */}
      <header className="layout-header">
        <div className="layout-header__content">
          <div className="layout-header__logo">
            <div className="layout-header__logo-icon">
              <img className="logo-icon" src={label} alt="Логотип" />
            </div>
            <h1 className="layout-header__title">
              Служба специальной связи и информатизации
            </h1>
          </div>
          <div className="layout-header__user-menu">
            {userMenu}
          </div>
        </div>
      </header>

      {/* Основная область с сайдбаром и контентом */}
      <div className="layout-main-row">
        <aside className="layout-sidebar">
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
        </aside>

        <main className="layout-content">
          <div className="layout-content__container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}