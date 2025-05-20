import { TabBar } from '../TabBar';
import { ContentArea } from './ContentArea';
import { Division } from '../../types';
import { useMainContent } from './useMainContent';
// import { DivisionTabs } from '../divisions/DivisionTabs/DivisionTabs';
// import { SearchBar } from '../common/SearchBar';
// import { PersonnelCategoryButtons } from '../personnel/PersonnelCategoryButtons';
// import { PersonnelList } from '../personnel/PersonnelList/PersonnelList';
// import { EquipmentTypeList } from '../equipment/EquipmentTypeList/EquipmentTypeList';
// import { FacilityTypeFilter } from '../facilities/FacilityTypeFilter';
// import { useSelector } from 'react-redux';
// import { RootState } from '../../store/store';

interface MainContentProps {
  activeTab: string;
  viewTypes: Record<string, 'grid' | 'table'>;
  onSetActiveTab: (tab: string) => void;
  onSetViewType: (type: 'grid' | 'table') => void;
  onSelectDivision: (division: Division) => void;
}

export function MainContent(props: MainContentProps) {
  // const {
  //   searchTerms,
  //   setSearchTerm,
  //   filterType,
  //   setFilterType,
  //   selectedDivision,
  //   setSelectedDivision,
  //   selectedPersonnelCategory,
  //   setSelectedPersonnelCategory,
  //   selectedAccessClass,
  //   setSelectedAccessClass,
  //   facilityClassFilter,
  //   setFacilityClassFilter
  // } = useMainContent({
  //   activeTab: props.activeTab
  // });

  const renderContent = () => {
    switch (props.activeTab) {
      case 'divisions':
        return (
          <ContentArea
            {...props}
            onSelectDivision={props.onSelectDivision}
          />
        );

      // case 'personnel':
      //   return (
      //     <div className="space-y-6">
      //       <DivisionTabs
      //         selectedDivision={selectedDivision}
      //         onSelectDivision={setSelectedDivision}
      //       />
      //       <SearchBar
      //         searchTerm={searchTerms.personnel}
      //         setSearchTerm={(term) => setSearchTerm('personnel', term)}
      //         placeholder="Поиск по ФИО, телефону..."
      //       />
      //       <PersonnelCategoryButtons
      //         selectedDivision={selectedDivision}
      //         selectedCategory={selectedPersonnelCategory}
      //         onCategoryChange={setSelectedPersonnelCategory}
      //         selectedAccessClass={selectedAccessClass}
      //         onAccessClassChange={setSelectedAccessClass}
      //       />
      //       <div className="bg-white rounded-lg shadow-sm">
      //         <PersonnelList
      //           selectedDivision={selectedDivision}
      //           selectedCategory={selectedPersonnelCategory}
      //           selectedAccessClass={selectedAccessClass}
      //           searchTerm={searchTerms.personnel}
      //         />
      //       </div>
      //     </div>
      //   );

      // case 'equipment':
      //   return (
      //     <EquipmentTypeList
      //       equipment={equipment}
      //       onUpdateEquipment={() => {}}
      //       type="open"
      //     />
      //   );

      // case 'facilities':
      //   return (
      //     <div className="space-y-6">
      //       <DivisionTabs
      //         selectedDivision={selectedDivision}
      //         onSelectDivision={setSelectedDivision}
      //       />
      //       <SearchBar
      //         searchTerm={searchTerms.facilities}
      //         setSearchTerm={(term) => setSearchTerm('facilities', term)}
      //         placeholder="Поиск по названию, адресу..."
      //       />
      //       <FacilityTypeFilter
      //         facilities={[]}
      //         selectedType={filterType === 'all' ? 'all' : filterType as 'station' | 'shd'}
      //         onTypeChange={(type) => setFilterType(type)}
      //         selectedClass={facilityClassFilter as 'all' | '1' | '2'}
      //         onClassChange={setFacilityClassFilter}
      //       />
      //     </div>
      //   );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <TabBar {...props} />
      {renderContent()}
    </div>
  );
}