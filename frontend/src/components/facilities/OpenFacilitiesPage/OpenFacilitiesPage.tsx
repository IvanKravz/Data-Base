import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { Plus } from 'lucide-react';
import { FacilityList } from '../FacilityList';
import { DivisionTabs } from '../../divisions/DivisionTabs/DivisionTabs';
import { SearchBar } from '../../common/SearchBar';

export function OpenFacilitiesPage() {
  const navigate = useNavigate();
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType] = useState<'all' | 'station' | 'shd'>('station');
  const [facilityClassFilter] = useState<'all' | '1' | '2'>('all');

  const facilities = useSelector((state: RootState) => 
    state.facilities.facilities.filter(f => f.type === 'station')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Открытые объекты</h1>
        <button
          onClick={() => navigate('/facilities-open/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить объект</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <DivisionTabs
          selectedDivision={selectedDivision}
          onSelectDivision={setSelectedDivision}
        />

        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Поиск по названию или адресу..."
        />
      </div>

      <FacilityList
        viewType="grid"
        type="open"
        onSelectFacility={(facility) => navigate(`/facilities/${facility.id}`)}
        selectedDivision={selectedDivision}
        searchTerm={searchTerm}
        filterType={filterType}
        facilityClassFilter={facilityClassFilter}
      />
    </div>
  );
}