import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { Plus } from 'lucide-react';
import { PersonnelList } from '../PersonnelList/PersonnelList';
import { DivisionTabs } from '../../divisions/DivisionTabs/DivisionTabs';
import { SearchBar } from '../../common/SearchBar';
import { PersonnelCategoryButtons } from '../PersonnelCategoryButtons';

export function PersonnelPage() {
  const navigate = useNavigate();
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mol' | 'sha'>('all');
  const [selectedAccessClass, setSelectedAccessClass] = useState<'all' | '1' | '2'>('all');

  // Get personnel from Redux store
  const personnel = useSelector((state: RootState) => state.personnel.personnel);
  const loading = useSelector((state: RootState) => state.personnel.loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Сотрудники</h1>
        <button
          onClick={() => navigate('/personnel/create')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить сотрудника</span>
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
          placeholder="Поиск по ФИО, телефону..."
        />

        <PersonnelCategoryButtons
          selectedDivision={selectedDivision}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedAccessClass={selectedAccessClass}
          onAccessClassChange={setSelectedAccessClass}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <PersonnelList
          viewType="table"
          selectedDivision={selectedDivision}
          selectedCategory={selectedCategory}
          selectedAccessClass={selectedAccessClass}
          searchTerm={searchTerm}
          onSelectPerson={(person) => navigate(`/personnel/${person.id}`)}
        />
      </div>
    </div>
  );
}