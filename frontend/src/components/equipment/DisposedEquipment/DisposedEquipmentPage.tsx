import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../store/store';
import { Equipment } from '../../../types';
import { deleteEquipment } from '../../../store/slices/equipmentSlice';
import { DisposedEquipmentList } from './DisposedEquipmentList';
import { DisposedEquipmentFilters } from './DisposedEquipmentFilters';
import { Search, FileSpreadsheet } from 'lucide-react';
import { format, isWithinInterval, parse } from 'date-fns';
import { utils, writeFile } from 'xlsx';

export function DisposedEquipmentPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

  const equipment = useSelector((state: RootState) => 
    state.equipment.equipment.filter(e => 
      e.status === 'disposed' && 
      (activeTab === 'open' ? e.category !== 'closed' : e.category === 'closed')
    )
  );

  // Get unique years from disposal dates
  const years = useMemo(() => {
    const uniqueYears = new Set(equipment.map(item => 
      new Date(item.disposalInfo?.actDate || '').getFullYear()
    ));
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [equipment]);

  // Filter equipment based on all criteria
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchLower) ||
        item.serialNumber.toLowerCase().includes(searchLower) ||
        item.inventoryNumber.toLowerCase().includes(searchLower) ||
        item.disposalInfo?.actNumber.toLowerCase().includes(searchLower) ||
        item.disposalInfo?.disposalCertNumber.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      const disposalDate = new Date(item.disposalInfo?.actDate || '');
      const year = disposalDate.getFullYear();
      const month = disposalDate.getMonth();

      // Filter by year
      if (selectedYear !== 'all' && year !== parseInt(selectedYear)) {
        return false;
      }

      // Filter by month
      if (selectedMonth !== 'all' && month !== parseInt(selectedMonth)) {
        return false;
      }

      // Filter by date range
      if (dateRange.start && dateRange.end) {
        const start = parse(dateRange.start, 'yyyy-MM-dd', new Date());
        const end = parse(dateRange.end, 'yyyy-MM-dd', new Date());
        if (!isWithinInterval(disposalDate, { start, end })) {
          return false;
        }
      }

      return true;
    });
  }, [equipment, searchTerm, selectedYear, selectedMonth, dateRange]);

  const handleDelete = (id: string) => {
    dispatch(deleteEquipment(id));
  };

  const handleViewDetails = (equipment: Equipment) => {
    navigate(`/equipment/${equipment.id}`);
  };

  const handleExport = () => {
    const data = filteredEquipment.map(item => ({
      'Название': item.name,
      'Тип': item.type,
      'Серийный номер': item.serialNumber,
      'Инвентарный номер': item.inventoryNumber,
      'Подразделение': `${item.division}${item.subdivision ? ` - ${item.subdivision}` : ''}`,
      '№ акта списания': item.disposalInfo?.actNumber,
      'Дата акта': format(new Date(item.disposalInfo?.actDate || ''), 'dd.MM.yyyy'),
      '№ справки о ликвидации': item.disposalInfo?.disposalCertNumber,
      'Дата справки': format(new Date(item.disposalInfo?.disposalCertDate || ''), 'dd.MM.yyyy'),
      'Комментарии': item.disposalInfo?.comments || ''
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Списанная техника');

    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(20, key.length * 1.2)
    }));
    ws['!cols'] = colWidths;

    writeFile(wb, `disposed_${activeTab}_equipment_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Списанная {activeTab === 'open' ? 'открытая' : 'закрытая'} техника
        </h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Экспорт в Excel</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
              activeTab === 'open'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Открытая техника
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
              activeTab === 'closed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Закрытая техника
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию, номерам актов, серийному или инвентарному номеру..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <DisposedEquipmentFilters
          years={years}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Results count */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Найдено: <span className="font-medium text-gray-900">{filteredEquipment.length}</span>
          </p>
          {(selectedYear !== 'all' || selectedMonth !== 'all' || dateRange.start || dateRange.end) && (
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedMonth('all');
                setDateRange({ start: '', end: '' });
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Сбросить фильтры
            </button>
          )}
        </div>

        {/* Equipment list */}
        <DisposedEquipmentList
          equipment={filteredEquipment}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
}