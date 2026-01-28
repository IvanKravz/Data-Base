import React from 'react';
import { ArrowLeft, Pencil, FileSpreadsheet } from 'lucide-react';
import { Facility } from '../../../../types';
import { utils, writeFile } from 'xlsx';
import '../FacilityForm.css'

interface HeaderProps {
  title: string;
  onBack: () => void;
  onEdit?: () => void;
  facility?: Facility;
  canEdit?: boolean;
}

export function Header({ title, onBack, onEdit, facility, canEdit = false }: HeaderProps) {
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
    <div className="facility-header">
      <div className="facility-header-main">
        <button
          onClick={onBack}
          className="facility-btn--icon"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="facility-title-container">
          <h1 className="facility-view-title">
            {title}
          </h1>
        </div>
      </div>
      <div className="facility-header-actions">
        {facility && (
          <button
            onClick={handleExport}
            className="facility-btn facility-btn--primary"
          >
            <FileSpreadsheet size={16} />
            <span>Экспорт</span>
          </button>
        )}
        {onEdit && canEdit && (
          <button
            onClick={onEdit}
            className="facility-btn facility-btn--primary"
          >
            <Pencil size={16} />
            <span>Редактировать</span>
          </button>
        )}
      </div>
    </div>
  );
}