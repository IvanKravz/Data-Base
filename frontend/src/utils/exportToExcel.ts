import { utils, writeFile } from 'xlsx';
import { Equipment, Employee, Facility } from '../types';

// Стили для Excel
const EXCEL_STYLES = {
  header: {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  },
  cell: {
    alignment: { wrapText: true, vertical: 'top' },
    border: {
      top: { style: 'thin', color: { rgb: 'D9D9D9' } },
      bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
      left: { style: 'thin', color: { rgb: 'D9D9D9' } },
      right: { style: 'thin', color: { rgb: 'D9D9D9' } }
    }
  }
};

export const exportEquipmentToExcel = (equipment: Equipment[]) => {
  const data = equipment.map(item => ({
    'Название': item.name,
    'Тип': item.type,
    'Категория': getEquipmentCategory(item.category),
    'Статус': getEquipmentStatus(item.status),
    'Подразделение': `${item.division}${item.subdivision ? ` - ${item.subdivision}` : ''}`,
    'Серийный номер': item.serialNumber || '-',
    'Инвентарный номер': item.inventoryNumber || '-',
    'Дата производства': formatDate(item.manufacturingDate),
    'Дата покупки': formatDate(item.purchaseDate),
    'Закреплено за': item.assignedTo || '-'
  }));

  const ws = utils.json_to_sheet(data);
  applyStylesToWorksheet(ws, Object.keys(data[0] || {}));
  setColumnWidths(ws, {
    'Название': 30,
    'Тип': 20,
    'Категория': 15,
    'Статус': 20,
    'Подразделение': 30,
    'Серийный номер': 20,
    'Инвентарный номер': 20,
    'Дата производства': 15,
    'Дата покупки': 15,
    'Закреплено за': 25
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Техника');
  writeFile(wb, 'Техника.xlsx');
};

export const exportPersonnelToExcel = (personnel: Employee[]) => {
  const data = personnel.map(person => ({
    'ФИО': person.full_name,
    'Должность': person.position,
    'Подразделение': `${person.division.name}${person.subdivision?.name ? ` - ${person.subdivision.name}` : ''}`,
    'Класс сети': person.sha_details?.access_level ? `${person.sha_details.access_level} класс` : '-',
    'Форма допуска': person.form_state_secrets || '-',
    'Заключения на технику': formatEquipmentConclusions(person.sha_details?.equipment_conclusions),
    'Примечание': formatMultilineText(person.description)
  }));

  const ws = utils.json_to_sheet(data);
  applyStylesToWorksheet(ws, Object.keys(data[0] || {}));
  setColumnWidths(ws, {
    'ФИО': 30,
    'Должность': 25,
    'Подразделение': 30,
    'Класс сети': 15,
    'Форма допуска': 15,
    'Заключения на технику': 40,
    'Примечание': 50
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Сотрудники');
  writeFile(wb, 'Сотрудники.xlsx');
};

export const exportFacilitiesToExcel = (facilities: Facility[]) => {
  const data = facilities.map(facility => ({
    'Название': facility.name,
    'Тип': facility.type === 'station' ? 'Станция' : 'ШД',
    'Класс': `${facility.class} класс`,
    'Адрес': facility.address,
    'Подразделение': `${facility.division}${facility.subdivision ? ` - ${facility.subdivision}` : ''}`
  }));

  const ws = utils.json_to_sheet(data);
  applyStylesToWorksheet(ws, Object.keys(data[0] || {}));
  setColumnWidths(ws, {
    'Название': 30,
    'Тип': 15,
    'Класс': 15,
    'Адрес': 40,
    'Подразделение': 30
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Объекты');
  writeFile(wb, 'Объекты.xlsx');
};

// Вспомогательные функции
function formatEquipmentConclusions(conclusions?: Array<{equipment_type: string; conclusion_number: string}>): string {
  if (!conclusions || conclusions.length === 0) return '-';
  return conclusions.map(c => `${c.equipment_type} (№${c.conclusion_number})`).join('\n');
}

function formatMultilineText(text?: string): string {
  if (!text) return '-';
  // Заменяем \r\n на переносы строки и удаляем лишние пробелы
  return text.replace(/\r\n/g, '\n').trim();
}

function formatDate(date?: string | Date): string {
  if (!date) return '-';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ru-RU');
}

function getEquipmentCategory(category: string): string {
  const categories: Record<string, string> = {
    tko: 'ТКО',
    closed: 'Закрытая',
    radio: 'Радио',
    computer: 'СВТ',
    battery: 'АКБ',
    antenna: 'Антенны, мачты',
    power: 'Источники питания',
    materials: 'Материалы'
  };
  return categories[category] || category;
}

function getEquipmentStatus(status: string): string {
  const statuses: Record<string, string> = {
    'in-operation': 'Эксплуатируется',
    'in-storage': 'На складе',
    'defective': 'Неисправно',
    'for-disposal': 'На списание'
  };
  return statuses[status] || status;
}

function applyStylesToWorksheet(ws: any, headers: string[]) {
  // Применяем стили к заголовкам
  if (!ws['!cols']) ws['!cols'] = [];
  
  headers.forEach((_, colIndex) => {
    const headerCell = utils.encode_cell({ r: 0, c: colIndex });
    ws[headerCell].s = EXCEL_STYLES.header;
  });

  // Применяем стили к ячейкам данных
  const range = utils.decode_range(ws['!ref'] || 'A1:A1');
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cell = utils.encode_cell({ r: row, c: col });
      if (ws[cell]) {
        ws[cell].s = EXCEL_STYLES.cell;
      }
    }
  }
}

function setColumnWidths(ws: any, widths: Record<string, number>) {
  if (!ws['!cols']) ws['!cols'] = [];
  
  const headers = utils.sheet_to_json(ws, { header: 1 })[0] as string[];
  headers.forEach((header, index) => {
    ws['!cols'][index] = { 
      width: widths[header] || 15,
      wpx: (widths[header] || 15) * 7 // Примерное преобразование в пиксели
    };
  });
}