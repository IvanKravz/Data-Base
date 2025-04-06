import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Equipment, Facility } from '../../types';

interface UseMainContentProps {
  activeTab: string;
}

export function useMainContent({ activeTab }: UseMainContentProps) {
  const [searchTerms, setSearchTerms] = useState({
    divisions: '',
    equipment: '',
    personnel: '',
    facilities: ''
  });
  const [filterType, setFilterType] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedPersonnelCategory, setSelectedPersonnelCategory] = useState<'all' | 'mol' | 'sha'>('all');
  const [selectedAccessClass, setSelectedAccessClass] = useState<'all' | '1' | '2'>('all');
  const [facilityClassFilter, setFacilityClassFilter] = useState('all');

  // Get data from Redux store
  const equipment = useSelector((state: RootState) => state.equipment.equipment);
  const personnel = useSelector((state: RootState) => state.personnel.personnel);
  const facilities = useSelector((state: RootState) => state.facilities.facilities);

  const setSearchTerm = (tab: string, term: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [tab]: term
    }));
  };

  const filteredEquipment = useMemo(() => 
    equipment.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerms.equipment.toLowerCase()) ||
                          item.type.toLowerCase().includes(searchTerms.equipment.toLowerCase());
      const matchesFilter = filterType === 'all' || item.status === filterType;
      const matchesDivision = selectedDivision === 'all' || item.division === selectedDivision;
      return matchesSearch && matchesFilter && matchesDivision;
    }), [equipment, searchTerms.equipment, filterType, selectedDivision]);

  // const filteredPersonnel = useMemo(() => 
  //   personnel.filter(person => {
  //     console.log('person', person)
  //     const searchLower = searchTerms.personnel.toLowerCase();
  //     const [lastName, ...firstNameParts] = person.name.split(' ');
  //     const firstName = firstNameParts.join(' ');
      
  //     const matchesSearch = 
  //       person.name.toLowerCase().includes(searchLower) ||
  //       lastName.toLowerCase().includes(searchLower) ||
  //       firstName.toLowerCase().includes(searchLower) ||
  //       person.phone.toLowerCase().includes(searchLower) ||
  //       person.division.toLowerCase().includes(searchLower) ||
  //       (person.subdivision && person.subdivision.toLowerCase().includes(searchLower));

  //     const matchesDivision = selectedDivision === 'all' || person.division === selectedDivision;
  //     const matchesCategory = selectedPersonnelCategory === 'all' ||
  //       (selectedPersonnelCategory === 'mol' && person.isMaterialResponsible) ||
  //       (selectedPersonnelCategory === 'sha' && person.isShaWorker);
  //     const matchesAccessClass = selectedPersonnelCategory !== 'sha' ||
  //       selectedAccessClass === 'all' ||
  //       person.shaDetails?.accessLevel === selectedAccessClass;

  //     return matchesSearch && matchesDivision && matchesCategory && matchesAccessClass;
  //   }), [
  //     personnel, 
  //     searchTerms.personnel, 
  //     selectedDivision, 
  //     selectedPersonnelCategory,
  //     selectedAccessClass
  //   ]);

  const filteredFacilities = useMemo(() => 
    facilities.filter(facility => {
      const matchesSearch = facility.name.toLowerCase().includes(searchTerms.facilities.toLowerCase()) ||
                          facility.address.toLowerCase().includes(searchTerms.facilities.toLowerCase());
      const matchesType = filterType === 'all' || facility.type === filterType;
      const matchesDivision = selectedDivision === 'all' || facility.division === selectedDivision;
      const matchesClass = facilityClassFilter === 'all' || facility.class === facilityClassFilter;
      return matchesSearch && matchesType && matchesDivision && matchesClass;
    }), [facilities, searchTerms.facilities, filterType, selectedDivision, facilityClassFilter]);

  return {
    searchTerms,
    setSearchTerm,
    filterType,
    setFilterType,
    selectedDivision,
    setSelectedDivision,
    selectedPersonnelCategory,
    setSelectedPersonnelCategory,
    selectedAccessClass,
    setSelectedAccessClass,
    facilityClassFilter,
    setFacilityClassFilter,
    filteredEquipment,
    // filteredPersonnel,
    filteredFacilities
  };
}