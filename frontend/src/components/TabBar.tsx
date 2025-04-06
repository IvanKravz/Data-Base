import React from 'react';
import { LayoutGrid, Plus, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TabBarProps {
  activeTab: string;
  viewTypes: Record<string, 'grid' | 'table'>;
  onSetViewType: (type: 'grid' | 'table') => void;
}

export function TabBar({
  activeTab,
  viewTypes,
  onSetViewType
}: TabBarProps) {
  const navigate = useNavigate();

  if (activeTab === 'divisions' || activeTab === 'equipment') {
    return null;
  }

  const handleCreateClick = () => {
    switch (activeTab) {
      case 'personnel':
        navigate('/personnel/create');
        break;
      case 'facilities-open':
        navigate('/facilities-open/create');
        break;
      case 'facilities-closed':
        navigate('/facilities-closed/create');
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex items-center justify-end gap-4 mb-6">
      <div className="flex items-center gap-2 border rounded-lg p-1">
        <button
          onClick={() => onSetViewType('grid')}
          className={`p-2 rounded ${viewTypes[activeTab] === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
        >
          <LayoutGrid className="h-5 w-5" />
        </button>
        <button
          onClick={() => onSetViewType('table')}
          className={`p-2 rounded ${viewTypes[activeTab] === 'table' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
        >
          <LayoutList className="h-5 w-5" />
        </button>
      </div>
      <button
        onClick={handleCreateClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
        <span>
          {activeTab === 'personnel' ? 'Добавить сотрудника' : 'Добавить объект'}
        </span>
      </button>
    </div>
  );
}