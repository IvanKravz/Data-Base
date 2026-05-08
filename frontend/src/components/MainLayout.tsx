// components/MainLayout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { MainContent } from './MainContent';
import { DivisionDetails } from './divisions/DivisionDetails/DivisionDetails';
import { PersonnelDetails } from './personnel/PersonnelDetails/PersonnelDetails';
import { FacilityDetails } from './facilities/FacilityDetails/FacilityDetails';
import Storage from './storage/Storage';
import { UserMenu } from './UserMenu/UserMenu';
import { EquipmentDetailsPage } from './equipment/EquipmentDetailsPage/EquipmentDetailsPage';
import { QualitativeCharacteristics } from './personnel/QualitativeCharacteristics/QualitativeCharacteristics';
import { DisposedEquipmentPage } from './equipment/DisposedEquipment/DisposedEquipmentPage';
import { PersonnelSection } from './divisions/DivisionDetails/sections/PersonnelSection/PersonnelSection';
import { EquipmentSection } from './divisions/DivisionDetails/sections/EquipmentSection/EquipmentSection';
import { FacilitiesSection } from './divisions/DivisionDetails/sections/FacilitiesSection/FacilitiesSection';
import { DivisionTasksSection } from './divisions/DivisionDetails/sections/TasksSection/DivisionTasksSection';
import { AddFacilityPage } from './facilities/forms/AddFacilityPage';
import { AddCommunicationPostForm } from './divisions/DivisionDetails/sections/CommunicationPosts/AddCommunicationPostForm';
import { CreatePersonnelForm } from './personnel/forms';
import CommunicationNetworks from './divisions/DivisionDetails/sections/CommunicationNetworks/CommunicationNetworks';
import NetworkManagement from './networks/NetworkManagement/NetworkManagement';
import CreateNetwork from './networks/forms/CreateNetwork/CreateNetwork';
import EditNetwork from './networks/forms/EditNetwork/EditNetwork';
import { CreateEquipmentForm } from './equipment/forms/CreateEquipmentForm/CreateEquipmentForm';
import { getCurrentUser, isExploitationChief, isExploitationEmployee } from '../api/utils/permissions';
import { MapCountry } from './map/MapCountry/MapCountry';
import {
  PersonnelRoute,
  EquipmentRoute,
  FacilitiesRoute,
  TasksRoute,
  NetworksRoute,
  CommunicationPostsRoute,
  DivisionsRoute,
  StorageRoute,
  MapRoute,
  UsersRoute,
  ProtectedRoute
} from './ProtectedRoute';
import { UserManagementPage } from './UserMenu/UserManagementPage/UserManagementPage';
import { useAppPermissions } from '../api/utils/AppPermissionsContext';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('divisions');
  const [viewTypes, setViewTypes] = useState<Record<string, 'grid' | 'table'>>({
    divisions: 'grid',
    equipment: 'grid',
    personnel: 'table',
    facilities: 'grid',
    tasks: 'list'
  });
  const navigate = useNavigate();
  const location = useLocation();
  const {
    canAccessDivisions,
    canAccessPersonnel,
    canAccessEquipment,
    canAccessFacilities,
    canAccessTasks,
    canAccessNetworks,
    canAccessMap,
    canAccessStorage,
    personnelFilters
  } = useAppPermissions();

  // Функция определения активной вкладки по текущему пути
  const getActiveTabFromPath = (pathname: string): string => {
    // Для путей, начинающихся с /divisions (включая вложенные)
    if (pathname.startsWith('/divisions')) {
      return 'divisions';
    }
    // Для других модулей
    if (pathname.startsWith('/personnel')) return 'personnel';
    if (pathname.startsWith('/equipment')) return 'equipment';
    if (pathname.startsWith('/facilities')) return 'facilities';
    if (pathname.startsWith('/tasks')) return 'tasks';
    if (pathname.startsWith('/networks')) return 'networks';
    if (pathname.startsWith('/storage')) return 'storage';
    if (pathname.startsWith('/map')) return 'map';
    // Корневой путь
    if (pathname === '/') return 'divisions';
    // По умолчанию
    return 'divisions';
  };

  useEffect(() => {
    const newActiveTab = getActiveTabFromPath(location.pathname);
    setActiveTab(newActiveTab);
  }, [location.pathname]);

  // Автоматический редирект для эксплуатационников на их подразделение
  useEffect(() => {
    const user = getCurrentUser();
    const divisionId = user?.division_info?.id;

    if ((isExploitationChief() || isExploitationEmployee()) && divisionId && window.location.pathname === '/') {
      navigate(`/divisions/${divisionId}`, { replace: true });
      setActiveTab('divisions');
    }
  }, [navigate]);

  // Функция проверки доступа к качественной характеристике (нет фильтров на Employee)
  const checkQualitativeAccess = useMemo(() => {
    const hasFilters = personnelFilters && Object.keys(personnelFilters).length > 0;
    return () => !hasFilters;
  }, [personnelFilters]);

  // Компонент для корневого маршрута: если есть доступ к подразделениям — показываем список, иначе редирект на первый доступный модуль
  const RootRedirect = () => {
    const hasDivisionAccess = canAccessDivisions();

    if (hasDivisionAccess) {
      return (
        <MainContent
          activeTab={activeTab}
          viewTypes={viewTypes}
          onSetActiveTab={setActiveTab}
          onSetViewType={(type) => setViewTypes({ ...viewTypes, [activeTab]: type })}
          onSelectDivision={() => { }}
        />
      );
    }

    // Нет доступа к подразделениям — редирект на первый доступный модуль
    if (canAccessPersonnel()) return <Navigate to="/personnel" replace />;
    if (canAccessEquipment()) return <Navigate to="/equipment" replace />;
    if (canAccessFacilities()) return <Navigate to="/facilities" replace />;
    if (canAccessTasks()) return <Navigate to="/tasks" replace />;
    if (canAccessNetworks()) return <Navigate to="/networks" replace />;
    if (canAccessMap()) return <Navigate to="/map" replace />;
    if (canAccessStorage()) return <Navigate to="/storage" replace />;

    return <Navigate to="/access-denied" replace />;
  };

  return (
    <Layout
      activeTab={activeTab}
      onSetActiveTab={setActiveTab}
      userMenu={<UserMenu />}
    >
      <Routes>
        {/* Корневой маршрут: список подразделений или редирект */}
        <Route path="/" element={<RootRedirect />} />

        {/* Редирект со старого пути /divisions на корень */}
        <Route path="/divisions" element={<Navigate to="/" replace />} />

        {/* Global Routes (без привязки к подразделению) */}
        <Route path="/personnel" element={
          <PersonnelRoute>
            <PersonnelSection />
          </PersonnelRoute>
        } />

        <Route path="/equipment" element={
          <EquipmentRoute>
            <EquipmentSection />
          </EquipmentRoute>
        } />

        <Route path="/facilities" element={
          <FacilitiesRoute>
            <FacilitiesSection />
          </FacilitiesRoute>
        } />

        <Route path="/tasks" element={
          <TasksRoute>
            <DivisionTasksSection />
          </TasksRoute>
        } />

        <Route path="/communication-posts/new" element={
          <CommunicationPostsRoute action="add">
            <AddCommunicationPostForm />
          </CommunicationPostsRoute>
        } />

        {/* Глобальные маршруты для сетей связи */}
        <Route path="/networks" element={
          <NetworksRoute>
            <CommunicationNetworks />
          </NetworksRoute>
        } />

        <Route path="/networks/management" element={
          <NetworksRoute>
            <NetworkManagement />
          </NetworksRoute>
        } />

        <Route path="/networks/create" element={
          <NetworksRoute action="add">
            <CreateNetwork />
          </NetworksRoute>
        } />

        <Route path="/networks/communication-networks/edit/:id" element={
          <NetworksRoute action="change">
            <EditNetwork />
          </NetworksRoute>
        } />

        {/* Division Routes */}
        <Route path="/divisions/:id" element={
          <DivisionsRoute>
            <DivisionDetails />
          </DivisionsRoute>
        } />

        <Route path="/divisions/:id/personnel" element={
          <PersonnelRoute>
            <PersonnelSection />
          </PersonnelRoute>
        } />

        <Route path="/divisions/:id/equipment" element={
          <EquipmentRoute>
            <EquipmentSection />
          </EquipmentRoute>
        } />

        <Route path="/divisions/:id/facilities" element={
          <FacilitiesRoute>
            <FacilitiesSection />
          </FacilitiesRoute>
        } />

        <Route path="/divisions/:id/facilities/new" element={
          <FacilitiesRoute action="add">
            <AddFacilityPage />
          </FacilitiesRoute>
        } />

        <Route path="/divisions/:id/communication-posts/new" element={
          <CommunicationPostsRoute action="add">
            <AddCommunicationPostForm />
          </CommunicationPostsRoute>
        } />

        <Route path="/divisions/:id/tasks" element={
          <TasksRoute>
            <DivisionTasksSection />
          </TasksRoute>
        } />

        <Route path="/divisions/:id/networks" element={
          <NetworksRoute>
            <CommunicationNetworks />
          </NetworksRoute>
        } />

        <Route path="/divisions/:id/networks/management" element={
          <NetworksRoute>
            <NetworkManagement />
          </NetworksRoute>
        } />

        <Route path="/divisions/:id/networks/create" element={
          <NetworksRoute action="add">
            <CreateNetwork />
          </NetworksRoute>
        } />

        <Route path="/divisions/:id/equipment/create" element={
          <EquipmentRoute action="add">
            <CreateEquipmentForm />
          </EquipmentRoute>
        } />

        {/* Equipment Routes */}
        <Route path="/equipment/create" element={
          <EquipmentRoute action="add">
            <CreateEquipmentForm />
          </EquipmentRoute>
        } />

        <Route path="/equipment-disposed" element={
          <EquipmentRoute>
            <DisposedEquipmentPage />
          </EquipmentRoute>
        } />

        <Route path="/equipment/:id" element={
          <EquipmentRoute>
            <EquipmentDetailsPage />
          </EquipmentRoute>
        } />

        {/* Personnel Routes */}
        <Route path="/personnel/create" element={
          <PersonnelRoute action="add">
            <CreatePersonnelForm />
          </PersonnelRoute>
        } />

        <Route path="/personnel/:id" element={
          <PersonnelRoute>
            <PersonnelDetails />
          </PersonnelRoute>
        } />

        {/* Качественная характеристика – только при отсутствии фильтров на Employee */}
        <Route path="/personnel/:id/qualitative" element={
          <ProtectedRoute model="Employee" action="view" extraCheck={checkQualitativeAccess}>
            <QualitativeCharacteristics />
          </ProtectedRoute>
        } />

        {/* Facility Routes */}
        <Route path="/facilities/create" element={
          <FacilitiesRoute action="add">
            <AddFacilityPage />
          </FacilitiesRoute>
        } />

        <Route path="/facilities/:id" element={
          <FacilitiesRoute>
            <FacilityDetails />
          </FacilitiesRoute>
        } />

        {/* CommunicationNetworks */}
        <Route path="/divisions/:id/networks/communication-networks/edit/:id" element={
          <NetworksRoute action="change">
            <EditNetwork />
          </NetworksRoute>
        } />

        {/* Other Routes */}
        <Route path="/storage" element={
          <StorageRoute>
            <Storage />
          </StorageRoute>
        } />
        <Route path="/storage/:folderId" element={
          <StorageRoute>
            <Storage />
          </StorageRoute>
        } />
        <Route path="/storage/:folderId/:subfolderId" element={
          <StorageRoute>
            <Storage />
          </StorageRoute>
        } />

        <Route path="/map" element={
          <MapRoute>
            <MapCountry />
          </MapRoute>
        } />

        {/* Административная страница управления пользователями */}
        <Route path="/manage/users" element={
          <UsersRoute>
            <UserManagementPage />
          </UsersRoute>
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}