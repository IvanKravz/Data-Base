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
  canEdit?: boolean; // Добавляем пропс для управления правами
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
    <div className="header-container-facility">
      <div className="header-title-group">
        <button
          onClick={onBack}
          className="header-button"
        >
          <ArrowLeft className="header-icon" />
        </button>
        <h1 className="header-title-facility">
          {title}
        </h1>
      </div>
      <div className="header-actions-group">
        {facility && (
          <button
            onClick={handleExport}
            className="header-action-button header-action-button-export"
          >
            <FileSpreadsheet className="header-action-icon" />
            <span>Экспорт</span>
          </button>
        )}
        {onEdit && canEdit && (
          <button
            onClick={onEdit}
            className="header-action-button header-action-button-edit"
          >
            <Pencil className="header-action-icon" />
            <span>Редактировать</span>
          </button>
        )}
      </div>
    </div>
  );
}