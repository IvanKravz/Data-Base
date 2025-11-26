import React from 'react';
import { Building2 } from 'lucide-react';
import { Equipment, EquipmentFieldPermissions } from '../../../../../types';
import '../style.css';

interface AssignmentInfoProps {
  formData: Partial<Equipment>;
  onChange: (data: Partial<Equipment>) => void;
  availableSubdivisions: { id: string, name: string }[];
  availablePersonnel: any[];
  divisions: {
    id: string;
    name: string;
    subdivisions: { id: string, name: string }[];
    facilities: {
      id: string;
      name: string;
      type_name: 'station' | 'shd';
      class: string;
      class_display: string;
    }[];
  }[];
  isLoading: boolean;
  fixedDivision?: boolean;
  fixedSubdivision?: boolean;
  permissions: EquipmentFieldPermissions;
}

export function AssignmentInfo({
  formData,
  onChange,
  availableSubdivisions = [],
  availablePersonnel = [],
  divisions = [],
  isLoading,
  fixedDivision = false,
  fixedSubdivision = false,
  permissions
}: AssignmentInfoProps) {
  // Получаем текущее подразделение и доступные объекты
  const currentDivision = divisions.find(d => d.id === formData.division?.id);
  const availableFacilities = currentDivision?.facilities || [];

  const filteredPersonnel = availablePersonnel.filter(person => {
    // Если не выбрано подразделение - не показываем никого
    if (!formData.division?.id) return false;

    // Проверяем, что сотрудник принадлежит текущему подразделению
    const personBelongsToDivision = person.division?.id === formData.division.id;
    if (!personBelongsToDivision) return false;

    // Если не выбрано отделение - показываем всех сотрудников подразделения
    if (!formData.subdivision?.id) return true;

    // Фильтруем по отделению
    return person.subdivision?.id === formData.subdivision.id;
  });

  // Обработчик изменения подразделения
  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedDivision || !permissions.canEditDivision) return;
    
    const divisionId = e.target.value;
    const selectedDivision = divisions.find(d => String(d.id) === String(divisionId));

    onChange({
      division: selectedDivision ? { id: selectedDivision.id, name: selectedDivision.name } : null,
      subdivision: null,
      assigned_to: null,
      facility: null
    });
  };

  // Обработчик изменения отделения
  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (fixedSubdivision || !permissions.canEditSubdivision) return;
    
    const subdivisionId = e.target.value;
    const selectedSubdivision = availableSubdivisions.find(s => String(s.id) === String(subdivisionId));

    onChange({
      subdivision: selectedSubdivision ? {
        id: selectedSubdivision.id,
        name: selectedSubdivision.name
      } : null
    });
  };

  // Обработчик изменения объекта
  const handleFacilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!permissions.canEditFacility) return;
    
    const facilityId = e.target.value;
    const selectedFacility = availableFacilities.find(f => String(f.id) === String(facilityId));

    onChange({
      facility: selectedFacility ? {
        id: selectedFacility.id,
        name: selectedFacility.name,
        type: selectedFacility.type_name,
        class: selectedFacility.class
      } : null
    });
  };

  // Обработчик изменения ответственного
  const handlePersonnelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!permissions.canEditAssignedTo) return;
    
    const personId = e.target.value;
    const selectedPerson = filteredPersonnel.find(p => String(p.id) === String(personId));

    onChange({
      assigned_to: selectedPerson ? {
        id: selectedPerson.id,
        full_name: selectedPerson.full_name || '',
        position: selectedPerson.position || ''
      } : null
    });
  };

  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <Building2 size={20} />
        <h3 className="equipment-card-title">Принадлежность</h3>
      </div>
      <div className="equipment-card-content-edit">
        {/* Поле Подразделение */}
        <div className="form-group">
          <label className="equipment-form-label">Подразделение</label>
          <div className="form-input-container">
            <select
              value={formData.division?.id ? String(formData.division.id) : ''}
              onChange={handleDivisionChange}
              className="form-select"
              disabled={isLoading || fixedDivision || !permissions.canEditDivision}
            >
              <option value="">Выберите подразделение</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Поле Отделение */}
        <div className="form-group">
          <label className="equipment-form-label">Отделение</label>
          <select
            value={formData.subdivision?.id ? String(formData.subdivision.id) : ''}
            onChange={handleSubdivisionChange}
            className="form-select"
            disabled={isLoading || !formData.division || fixedSubdivision || !permissions.canEditSubdivision}
          >
            <option value="">Выберите отделение</option>
            {availableSubdivisions.map(subdivision => (
              <option key={subdivision.id} value={subdivision.id}>
                {subdivision.name}
              </option>
            ))}
          </select>
        </div>

        {/* Поле Ответственный */}
        <div className="form-group">
          <label className="equipment-form-label">Ответственный</label>
          <div className="form-input-container">
            <select
              value={formData.assigned_to?.id ? String(formData.assigned_to.id) : ''}
              onChange={handlePersonnelChange}
              className="form-select"
              disabled={isLoading || !formData.division || !permissions.canEditAssignedTo}
            >
              <option value="">Не назначен</option>
              {filteredPersonnel.map(person => (
                <option key={person.id} value={person.id}>
                  {person.full_name || 'Неизвестно'} - {person.position || 'Должность не указана'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Поле Объект */}
        <div className="form-group">
          <label className="equipment-form-label">Объект</label>
          <div className="form-input-container">
            <select
              value={formData.facility?.id ? String(formData.facility.id) : ''}
              onChange={handleFacilityChange}
              className="form-select"
              disabled={isLoading || !formData.division || !permissions.canEditFacility}
            >
              <option value="">Не привязан к объекту</option>
              {availableFacilities.map(facility => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} (
                  {facility.type_name || 'Не указан'}
                  {facility.class_display && `, ${facility.class_display}`}
                  )
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}