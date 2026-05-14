import { utils, writeFile } from 'xlsx';
import { Equipment, Employee, Facility } from '../types';

// Стили для Excel (оставляем как есть или упрощаем)
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

// ---------- Вспомогательные функции ----------
function formatDate(date?: string | Date | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ru-RU');
}

function formatBoolean(value?: boolean): string {
  if (value === undefined || value === null) return '-';
  return value ? 'Да' : 'Нет';
}

function formatMultilineText(text?: string | null): string {
  if (!text) return '-';
  return text.replace(/\r\n/g, '\n').trim();
}

function formatList(items?: any[] | null, extractor?: (item: any) => string): string {
  if (!items || items.length === 0) return '-';
  const values = extractor ? items.map(extractor) : items.map(i => String(i));
  return values.join(', ');
}

function getCategoryName(category: any): string {
  if (!category) return '-';
  if (typeof category === 'string') return category;
  return category.name || category.value || '-';
}

function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'in-operation': 'Эксплуатируется',
    'in-storage': 'На складе',
    'defective': 'Неисправно',
    'for-disposal': 'На списание',
    'disposed': 'Списано'
  };
  return statusMap[status] || status;
}

function getSecretLevelDisplay(level?: string): string {
  const levelMap: Record<string, string> = {
    'OV': 'ОВ',
    'SS': 'СС',
    'SECRET': 'Секретно',
    'DSP': 'ДСП'
  };
  return level ? (levelMap[level] || level) : '-';
}

// ---------- Экспорт сотрудников (Employee) ----------
export const exportPersonnelToExcel = (personnel: Employee[]) => {
  const data = personnel.map(emp => ({
    'ФИО': emp.full_name,
    'Должность': emp.position,
    'Звание': emp.rank || '-',
    'Приказ на звание': emp.order_rank || '-',
    'Личный номер': emp.personal_number || '-',
    'Личный телефон': emp.personal_phone || '-',
    'Рабочий телефон': emp.work_phone || '-',
    'Дата рождения': formatDate(emp.birth_date),
    'Дата контракта': formatDate(emp.contract_date),
    'Форма гостайны': emp.form_state_secrets || '-',
    'Номер допуска': emp.number_state_secrets || '-',
    'Дата допуска': formatDate(emp.data_state_secrets),
    'Образование': emp.education || '-',
    'Учебное заведение': emp.institution || '-',
    'Дата окончания учебного заведения': formatDate(emp.year_graduation),
    'Дата начала службы': formatDate(emp.date_start_work),
    'Дата окончания контракта': formatDate(emp.date_end_work),
    'Подразделение': emp.division?.name || '-',
    'Отделение': emp.subdivision?.name || '-',
    'Категория': emp.category || '-',
    'Подкатегория': emp.subcategory || '-',
    'МОЛ': formatBoolean(emp.is_material_responsible),
    'ША-работник': formatBoolean(emp.is_sha_worker),
    'ША: дата начала': emp.is_sha_worker && emp.sha_details ? formatDate(emp.sha_details.start_date) : '-',
    'ША: уровень доступа': emp.is_sha_worker && emp.sha_details ? (emp.sha_details.access_level === '1' ? '1 класс' : '2 класс') : '-',
    'Заключения на технику': emp.is_sha_worker && emp.sha_details?.equipment_conclusions
      ? formatList(emp.sha_details.equipment_conclusions, c => `${c.equipment_type} (№${c.conclusion_number})`)
      : '-',
    'Комментарии': formatMultilineText(emp.description),
    'Дата создания': formatDate(emp.created_at),
    'Дата обновления': formatDate(emp.updated_at),
  }));

  const ws = utils.json_to_sheet(data);
  applyStylesToWorksheet(ws, Object.keys(data[0] || {}));
  setColumnWidths(ws, {
    'ФИО': 30,
    'Должность': 25,
    'Звание': 20,
    'Приказ на звание': 25,
    'Личный номер': 15,
    'Личный телефон': 15,
    'Рабочий телефон': 15,
    'Дата рождения': 15,
    'Дата контракта': 15,
    'Форма гостайны': 15,
    'Номер допуска': 15,
    'Дата допуска': 15,
    'Образование': 20,
    'Учебное заведение': 30,
    'Дата окончания учебного заведения': 20,
    'Дата начала службы': 18,
    'Дата окончания контракта': 18,
    'Подразделение': 25,
    'Отделение': 25,
    'Категория': 20,
    'Подкатегория': 20,
    'МОЛ': 10,
    'ША-работник': 15,
    'ША: дата начала': 15,
    'ША: уровень доступа': 20,
    'Заключения на технику': 40,
    'Комментарии': 50,
    'Дата создания': 18,
    'Дата обновления': 18,
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Сотрудники');
  writeFile(wb, `Сотрудники_${new Date().toISOString().slice(0, 19)}.xlsx`);
};

// ---------- Экспорт техники (Equipment) ----------
export const exportEquipmentToExcel = (equipment: Equipment[]) => {
  const data = equipment.map(eq => ({
    'Название': eq.name,
    'Тип': eq.type || '-',
    'Категория': getCategoryName(eq.category),
    'Закрытая техника': formatBoolean(eq.is_closed),
    'Сетевое оборудование': formatBoolean(eq.is_network),
    'Срок службы': eq.service_life || '-',
    'В чьих интересах': eq.interest_organ?.name || '-',
    'Степень секретности': getSecretLevelDisplay(eq.secret_level),
    'Безвозмездное пользование': formatBoolean(eq.is_free_use),
    'Номер акта безвозмездного пользования': eq.free_use_act_number || '-',
    'Статус': getStatusDisplay(eq.status),
    'Серийный номер': eq.serial_number || '-',
    'Инвентарный номер': eq.inventory_number || '-',
    'Дата производства': formatDate(eq.manufacturing_date),
    'Дата ввода в эксплуатацию': formatDate(eq.exploitation_date),
    'Подразделение': eq.division?.name || '-',
    'Отделение': eq.subdivision?.name || '-',
    'Объект': eq.facility?.name || '-',
    'Закреплено за': eq.assigned_to?.full_name || '-',
    'Первичный документ на получение': eq.first_invoice || '-',
    'Накладная на МОЛ': eq.material_invoice || '-',
    'Версия ПО': eq.ver_software || '-',
    'VLANы': formatList(eq.vlans, (v: any) => v.name || v.vlan_id),
    'IP-адреса': formatList(eq.ip_addresses, (ip: any) => ip.address),
    'Номер акта списания': eq.disposal_act_number || '-',
    'Дата акта списания': formatDate(eq.disposal_act_date),
    'Номер справки о ликвидации': eq.disposal_cert_number || '-',
    'Дата справки о ликвидации': formatDate(eq.disposal_cert_date),
    'Комментарии к списанию': formatMultilineText(eq.disposal_comments),
    'Комментарии': formatMultilineText(eq.comments),
    'Дата создания': formatDate(eq.created_at),
    'Дата обновления': formatDate(eq.updated_at),
  }));

  const ws = utils.json_to_sheet(data);
  applyStylesToWorksheet(ws, Object.keys(data[0] || {}));
  setColumnWidths(ws, {
    'Название': 35,
    'Тип': 20,
    'Категория': 20,
    'Закрытая техника': 15,
    'Сетевое оборудование': 18,
    'Срок службы': 15,
    'В чьих интересах': 25,
    'Степень секретности': 18,
    'Безвозмездное пользование': 20,
    'Номер акта безвозмездного пользования': 30,
    'Статус': 20,
    'Серийный номер': 25,
    'Инвентарный номер': 20,
    'Дата производства': 15,
    'Дата ввода в эксплуатацию': 20,
    'Подразделение': 25,
    'Отделение': 25,
    'Объект': 30,
    'Закреплено за': 25,
    'Первичный документ на получение': 25,
    'Накладная на МОЛ': 25,
    'Версия ПО': 20,
    'VLANы': 30,
    'IP-адреса': 25,
    'Номер акта списания': 25,
    'Дата акта списания': 18,
    'Номер справки о ликвидации': 25,
    'Дата справки о ликвидации': 18,
    'Комментарии к списанию': 40,
    'Комментарии': 40,
    'Дата создания': 18,
    'Дата обновления': 18,
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Техника');
  writeFile(wb, `Техника_${new Date().toISOString().slice(0, 19)}.xlsx`);
};

// ---------- Экспорт объектов (Facility) ----------
export const exportFacilitiesToExcel = (facilities: Facility[]) => {
  const data = facilities.map(f => ({
    'Название': f.name,
    'Тип объекта': f.type?.name || '-',
    'Класс': f.facility_class ? `${f.facility_class} класс` : '-',
    'Город': f.city || '-',
    'Улица': f.street || '-',
    'Номер дома': f.house_number || '-',
    'Полный адрес': f.address || '-',
    'Подразделение': f.division?.name || '-',
    'Отделение': f.subdivision?.name || '-',
    'Посты связи': formatList(f.communication_posts, (p: any) => p.name),
    'ИНН': f.inn || '-',
    'Закрытый объект': formatBoolean(f.is_closed),
    'Номер акта приемки помещения': f.acceptance_act_number || '-',
    'Номер акта РИМ': f.rim_act_number || '-',
    'Номер акта ввода': f.commissioning_act_number || '-',
    'Номер разрешения на открытие': f.opening_permission_number || '-',
    'Размер КЗ': f.kz_size || '-',
    'ТП в пределах КЗ': formatBoolean(f.has_transformer_in_kz),
    'Контур заземления в пределах КЗ': formatBoolean(f.has_grounding_in_kz),
    'Широта': f.latitude ?? '-',
    'Долгота': f.longitude ?? '-',
    'Комментарии': formatMultilineText(f.comments),
    'Дата создания': formatDate(f.created_at),
    'Дата обновления': formatDate(f.updated_at),
  }));

  const ws = utils.json_to_sheet(data);
  applyStylesToWorksheet(ws, Object.keys(data[0] || {}));
  setColumnWidths(ws, {
    'Название': 35,
    'Тип объекта': 20,
    'Класс': 10,
    'Город': 20,
    'Улица': 25,
    'Номер дома': 12,
    'Полный адрес': 50,
    'Подразделение': 25,
    'Отделение': 25,
    'Посты связи': 30,
    'ИНН': 15,
    'Закрытый объект': 15,
    'Номер акта приемки помещения': 30,
    'Номер акта РИМ': 25,
    'Номер акта ввода': 25,
    'Номер разрешения на открытие': 30,
    'Размер КЗ': 15,
    'ТП в пределах КЗ': 20,
    'Контур заземления в пределах КЗ': 25,
    'Широта': 15,
    'Долгота': 15,
    'Комментарии': 50,
    'Дата создания': 18,
    'Дата обновления': 18,
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Объекты');
  writeFile(wb, `Объекты_${new Date().toISOString().slice(0, 19)}.xlsx`);
};

// ---------- Вспомогательные функции для стилей ----------
function applyStylesToWorksheet(ws: any, headers: string[]) {
  if (!ws['!cols']) ws['!cols'] = [];
  if (!ws['!ref']) return;

  const range = utils.decode_range(ws['!ref']);
  // Заголовки (строка 0)
  for (let col = 0; col <= range.e.c; col++) {
    const cellAddress = utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddress]) ws[cellAddress].s = EXCEL_STYLES.header;
  }
  // Ячейки данных
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = utils.encode_cell({ r: row, c: col });
      if (ws[cellAddress]) ws[cellAddress].s = EXCEL_STYLES.cell;
    }
  }
}

function setColumnWidths(ws: any, widths: Record<string, number>) {
  if (!ws['!cols']) ws['!cols'] = [];
  const headers = utils.sheet_to_json(ws, { header: 1 })[0] as string[];
  headers.forEach((header, idx) => {
    const width = widths[header] || 15;
    ws['!cols'][idx] = { width, wpx: width * 7 };
  });
}