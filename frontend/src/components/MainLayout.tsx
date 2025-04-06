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
import { OpenEquipmentPage } from './equipment/OpenEquipmentPage/OpenEquipmentPage';
import { ClosedEquipmentPage } from './equipment/ClosedEquipmentPage/ClosedEquipmentPage';
import { EquipmentDetailsPage } from './equipment/EquipmentDetailsPage/EquipmentDetailsPage';
import { OpenFacilitiesPage } from './facilities/OpenFacilitiesPage/OpenFacilitiesPage';
import { ClosedFacilitiesPage } from './facilities/ClosedFacilitiesPage/ClosedFacilitiesPage';
import { PersonnelPage } from './personnel/PersonnelPage/PersonnelPage';
import { CreatePersonnelPage } from './personnel/CreatePersonnelPage/CreatePersonnelPage';
import { QualitativeCharacteristics } from './personnel/QualitativeCharacteristics/QualitativeCharacteristics';
import { CreateOpenEquipmentPage } from './equipment/CreateOpenEquipmentPage/CreateOpenEquipmentPage';
import { CreateClosedEquipmentPage } from './equipment/CreateClosedEquipmentPage/CreateClosedEquipmentPage';
import { CreateOpenFacilityPage } from './facilities/CreateOpenFacilityPage/CreateOpenFacilityPage';
import { CreateClosedFacilityPage } from './facilities/CreateClosedFacilityPage/CreateClosedFacilityPage';
import { DisposedEquipmentPage } from './equipment/DisposedEquipment/DisposedEquipmentPage';
import { PersonnelSection } from './divisions/DivisionDetails/sections/PersonnelSection';
import { EquipmentSection } from './divisions/DivisionDetails/sections/EquipmentSection';
import { FacilitiesSection } from './divisions/DivisionDetails/sections/FacilitiesSection';
import { DivisionTasksSection } from './divisions/DivisionDetails/sections/DivisionTasksSection';

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
        <Route path="/divisions/:id/tasks" element={<DivisionTasksSection />} />

        {/* Equipment Routes */}
        <Route path="/equipment-open" element={<OpenEquipmentPage />} />
        <Route path="/equipment-closed" element={<ClosedEquipmentPage />} />
        <Route path="/equipment-disposed" element={<DisposedEquipmentPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetailsPage />} />
        <Route path="/equipment-open/create" element={<CreateOpenEquipmentPage />} />
        <Route path="/equipment-closed/create" element={<CreateClosedEquipmentPage />} />

        {/* Personnel Routes */}
        <Route path="/personnel" element={<PersonnelPage />} />
        <Route path="/personnel/create" element={<CreatePersonnelPage />} />
        <Route path="/personnel/:id" element={<PersonnelDetails />} />
        <Route path="/personnel/:id/qualitative" element={<QualitativeCharacteristics />} />

        {/* Facility Routes */}
        <Route path="/facilities-open" element={<OpenFacilitiesPage />} />
        <Route path="/facilities-closed" element={<ClosedFacilitiesPage />} />
        <Route path="/facilities/:id" element={<FacilityDetails />} />
        <Route path="/facilities-open/create" element={<CreateOpenFacilityPage />} />
        <Route path="/facilities-closed/create" element={<CreateClosedFacilityPage />} />

        {/* Other Routes */}
        <Route path="/tasks" element={<TasksSection />} />
        <Route path="/storage" element={<StorageSection />} />
        <Route path="/cabinet" element={<CabinetSection />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}