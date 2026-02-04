// MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
  MapRoute
} from './ProtectedRoute';

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

  // Автоматический редирект для начальника эксплуатации и сотрудника эксплуатации
  useEffect(() => {
    const user = getCurrentUser();
    const divisionId = user?.division_info?.id;

    if ((isExploitationChief() || isExploitationEmployee()) && divisionId && window.location.pathname === '/') {
      navigate(`/divisions/${divisionId}`, { replace: true });
      setActiveTab('divisions');
    }
  }, [navigate]);

  return (
    <Layout
      activeTab={activeTab}
      onSetActiveTab={setActiveTab}
      userMenu={<UserMenu />}
    >
      <Routes>
        {/* Main Routes */}
        <Route path="/" element={
          <DivisionsRoute>
            <MainContent
              activeTab={activeTab}
              viewTypes={viewTypes}
              onSetActiveTab={setActiveTab}
              onSetViewType={(type) => setViewTypes({ ...viewTypes, [activeTab]: type })}
              onSelectDivision={() => { }}
            />
          </DivisionsRoute>
        } />

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

        <Route path="/personnel/:id/qualitative" element={
          <PersonnelRoute>
            <QualitativeCharacteristics />
          </PersonnelRoute>
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

        {/* Other Routes - используем специализированные маршруты */}
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

        {/* Fallback route - используем абсолютный путь */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}