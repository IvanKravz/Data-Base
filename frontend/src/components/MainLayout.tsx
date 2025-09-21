import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { MainContent } from './MainContent';
import { DivisionDetails } from './divisions/DivisionDetails/DivisionDetails';
import { PersonnelDetails } from './personnel/PersonnelDetails/PersonnelDetails';
import { FacilityDetails } from './facilities/FacilityDetails/FacilityDetails';
import { TasksSection } from './tasks';
import { StorageSection } from './storage/StorageSection';
import { CabinetSection } from './cabinet/CabinetSection';
import { UserMenu } from './common/UserMenu';
import { EquipmentDetailsPage } from './equipment/EquipmentDetailsPage/EquipmentDetailsPage';
import { ClosedFacilitiesPage } from './facilities/ClosedFacilitiesPage/ClosedFacilitiesPage';
import { PersonnelPage } from './personnel/PersonnelPage/PersonnelPage';
import { QualitativeCharacteristics } from './personnel/QualitativeCharacteristics/QualitativeCharacteristics';
import { DisposedEquipmentPage } from './equipment/DisposedEquipment/DisposedEquipmentPage';
import { PersonnelSection } from './divisions/DivisionDetails/sections/PersonnelSection';
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

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('divisions');
  const [viewTypes, setViewTypes] = useState<Record<string, 'grid' | 'table'>>({
    divisions: 'grid',
    equipment: 'grid',
    'equipment-open': 'grid',
    'equipment-closed': 'grid',
    personnel: 'table',
    facilities: 'grid',
    tasks: 'list'
  });

  return (
    <Layout
      activeTab={activeTab}
      onSetActiveTab={setActiveTab}
      userMenu={<UserMenu />}
    >
      <Routes>
        {/* Main Routes */}
        <Route path="/" element={
            <MainContent
              activeTab={activeTab}
              viewTypes={viewTypes}
              onSetActiveTab={setActiveTab}
              onSetViewType={(type) => setViewTypes({ ...viewTypes, [activeTab]: type })}
              onSelectDivision={() => { }}
            />
        } />

        {/* Division Routes */}
        <Route path="/divisions/:id" element={<DivisionDetails />} />
        <Route path="/divisions/:id/personnel" element={<PersonnelSection />} />
        <Route path="/divisions/:id/equipment" element={<EquipmentSection />} />
        <Route path="/divisions/:id/facilities" element={<FacilitiesSection />} />
        <Route path="/divisions/:id/facilities/new" element={<AddFacilityPage />} />
        <Route path="/divisions/:id/communication-posts/new" element={<AddCommunicationPostForm  />} />
        <Route path="/divisions/:id/tasks" element={<DivisionTasksSection />} />
        <Route path="/divisions/:id/networks" element={<CommunicationNetworks />} />
        <Route path="/divisions/:id/equipment/create" element={<CreateEquipmentForm />} />

        {/* Equipment Routes */}
        <Route path="/equipment-disposed" element={<DisposedEquipmentPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetailsPage />} />

        {/* Personnel Routes */}
        <Route path="/personnel" element={<PersonnelPage />} />
        <Route path="/personnel/create" element={<CreatePersonnelForm />} />
        <Route path="/personnel/:id" element={<PersonnelDetails />} />
        <Route path="/personnel/:id/qualitative" element={<QualitativeCharacteristics />} />

        {/* Facility Routes */}
        <Route path="/facilities-closed" element={<ClosedFacilitiesPage />} />
        <Route path="/facilities/:id" element={<FacilityDetails />} />

        {/* CommunicationNetworks */}
        <Route path="/divisions/:id/networks/communication-networks/edit/:id" element={<EditNetwork />} />
        <Route path="/divisions/:id/networks/management" element={<NetworkManagement />} />
        <Route path="/divisions/:id/networks/create" element={<CreateNetwork />} />
                
        {/* Other Routes */}
        <Route path="/tasks" element={<TasksSection />} />
        <Route path="/storage" element={<StorageSection />} />
        <Route path="/cabinet" element={<CabinetSection />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}