import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { DivisionSelector } from '../DivisionSelector';
import { CategoryGrid } from '../CategoryGrid';
import { StatusButtons } from '../StatusButtons';
import { EquipmentList } from '../EquipmentList';
import { Search } from 'lucide-react';
import { EQUIPMENT_CATEGORIES } from '../constants';
import { Equipment, EquipmentCategory } from '../../../types';
import { deleteEquipment } from '../../../store/slices/equipmentSlice';

interface EquipmentTypeListProps {
  equipment: Equipment[];
  onUpdateEquipment: (equipment: Equipment) => void;
  type: 'open' | 'closed';
}

export function EquipmentTypeList({ equipment, onUpdateEquipment, type }: EquipmentTypeListProps) {
  const dispatch = useDispatch();
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Equipment['status'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out disposed equipment
  const activeEquipment = equipment.filter(item => item.status !== 'disposed');

  // Calculate equipment counts by status and category/type
  const statusEquipmentCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {
      'in-operation': {},
      'in-storage': {},
      'defective': {},
      'for-disposal': {}
    };

    activeEquipment.forEach(item => {
      if (selectedDivision !== 'all' && item.division !== selectedDivision) {
        return;
      }

      const key = type === 'closed' ? item.type : item.category;
      counts[item.status] = counts[item.status] || {};
      counts[item.status][key] = (counts[item.status][key] || 0) + 1;
    });

    return counts;
  }, [activeEquipment, selectedDivision, type]);

  // Filter equipment based on all criteria
  const filteredEquipment = useMemo(() => {
    return activeEquipment.filter(item => {
      // Check if equipment matches the type (open/closed)
      const matchesType = type === 'closed' 
        ? item.category === 'closed'
        : item.category !== 'closed';

      const matchesDivision = selectedDivision === 'all' || item.division === selectedDivision;
      
      // For closed equipment filter by type instead of category
      const matchesCategory = type === 'closed'
        ? !selectedCategory || item.type === selectedCategory
        : !selectedCategory || item.category === selectedCategory;
      
      // Filter by status
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchLower) ||
        item.type.toLowerCase().includes(searchLower) ||
        item.serialNumber.toLowerCase().includes(searchLower) ||
        item.inventoryNumber.toLowerCase().includes(searchLower) ||
        item.manufacturingDate.includes(searchTerm) ||
        item.purchaseDate.includes(searchTerm) ||
        (item.assignedTo && item.assignedTo.toLowerCase().includes(searchLower));

      return matchesType && matchesDivision && matchesCategory && matchesStatus && matchesSearch;
    });
  }, [activeEquipment, type, selectedDivision, selectedCategory, selectedStatus, searchTerm]);

  const handleDeleteEquipment = (id: string) => {
    dispatch(deleteEquipment(id));
  };

  return (
    <div className="space-y-8">
      <DivisionSelector
        selectedDivision={selectedDivision}
        onDivisionChange={setSelectedDivision}
      />

      <StatusButtons
        equipment={activeEquipment}
        selectedDivision={selectedDivision}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        type={type}
      />

      <CategoryGrid
        categories={EQUIPMENT_CATEGORIES}
        equipmentCounts={statusEquipmentCounts}
        selectedCategory={selectedCategory}
        onSelectType={setSelectedCategory}
        equipmentTypes={[]}
        isClosedEquipment={type === 'closed'}
        selectedStatus={selectedStatus}
        statusEquipmentCounts={statusEquipmentCounts}
      />

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по названию, типу, серийному номеру, инвентарному номеру, датам или ответственному..."
              className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-gray-400"
            />
          </div>
        </div>

        <EquipmentList
          equipment={filteredEquipment}
          onUpdateEquipment={onUpdateEquipment}
          onDeleteEquipment={handleDeleteEquipment}
          viewType="table"
        />
      </div>
    </div>
  );
}