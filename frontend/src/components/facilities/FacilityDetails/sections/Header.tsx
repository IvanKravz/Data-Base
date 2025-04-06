import React from 'react';
import { ArrowLeft, Pencil, FileSpreadsheet } from 'lucide-react';
import { Facility } from '../../../../types';
import { utils, writeFile } from 'xlsx';

interface HeaderProps {
  title: string;
  onBack: () => void;
  onEdit?: () => void;
  facility?: Facility;
}

export function Header({ title, onBack, onEdit, facility }: HeaderProps) {
  const handleExport = () => {
    if (!facility) return;

    // Prepare data for export
    const data = [{
      'Название': facility.name,
      'Тип': facility.type === 'station' ? 'Станция' : 'ШД',
      'Класс': `${facility.class} класс`,
      'Адрес': facility.address,
      'Подразделение': `${facility.division}${facility.subdivision ? ` - ${facility.subdivision}` : ''}`,
      'Номер акта приемки помещения': facility.acceptanceActNumber || '-',
      'Номер акта РИМ': facility.rimActNumber || '-',
      'Номер акта ввода': facility.commissioningActNumber || '-',
      'Номер разрешения на открытие': facility.openingPermissionNumber || '-',
      'Размер КЗ': facility.kzSize || '-',
      'ТП в пределах КЗ': facility.hasTransformerInKz ? 'Да' : 'Нет',
      'Контур заземления в пределах КЗ': facility.hasGroundingInKz ? 'Да' : 'Нет'
    }];

    // Create workbook and worksheet
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Объект');

    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(20, key.length * 1.2)
    }));
    ws['!cols'] = colWidths;

    // Generate filename based on facility name
    const filename = `${facility.name.replace(/[^a-zа-яё0-9]/gi, '_').toLowerCase()}.xlsx`;

    // Save file
    writeFile(wb, filename);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {facility && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Экспорт</span>
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            <span>Редактировать</span>
          </button>
        )}
      </div>
    </div>
  );
}