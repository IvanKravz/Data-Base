import React from 'react';
import { Building2, User, MapPin } from 'lucide-react';
import { Equipment } from '../../../../../types';
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
}

export function AssignmentInfo({
  formData,
  onChange,
  availableSubdivisions = [],
  availablePersonnel = [],
  divisions = [],
  isLoading
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
    const divisionId = Number(e.target.value);
    const selectedDivision = divisions.find(d => d.id === divisionId);

    onChange({
      division: selectedDivision ? { id: selectedDivision.id, name: selectedDivision.name } : null,
      subdivision: null, // Сбрасываем выбранное отделение
      assigned_to: null, // Сбрасываем выбранного ответственного
      facility: null // Сбрасываем выбранный объект
    });
  };

  // УБИРАЕМ ФИЛЬТРАЦИЮ ОБЪЕКТОВ ПО ОТДЕЛЕНИЮ
  // Теперь показываем все объекты подразделения независимо от отделения
  const filteredFacilities = availableFacilities;

  // Обработчик изменения отделения
  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subdivisionId = Number(e.target.value);
    const selectedSubdivision = availableSubdivisions.find(s => s.id === subdivisionId);

    onChange({
      subdivision: selectedSubdivision ? {
        id: selectedSubdivision.id,
        name: selectedSubdivision.name
      } : null
    });
  };

  // Обработчик изменения объекта
  const handleFacilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facilityId = e.target.value;
    const selectedFacility = filteredFacilities.find(f => String(f.id) === String(facilityId));

    onChange({
      facility: selectedFacility ? {
        id: selectedFacility.id,
        name: selectedFacility.name,
        type: selectedFacility.type,
        class: selectedFacility.class
      } : null
    });
  };

  // Обработчик изменения ответственного
  const handlePersonnelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const personId = e.target.value;
    const selectedPerson = filteredPersonnel.find(p => String(p.id) === String(personId));

    onChange({
      assigned_to: selectedPerson ? {
        id: selectedPerson.id,
        full_name: selectedPerson.full_name,
        position: selectedPerson.position
      } : null
    });
  };

  console.log('availableFacilities', availableFacilities)

  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <Building2 size={20} />
        <h3 className="equipment-card-title">Принадлежность</h3>
      </div>
      <div className="equipment-card-content-edit">
        {/* Поле Подразделение */}
        <div className="form-group">
          <label className="form-label">Подразделение
          </label>
          <div className="form-input-container">
            <select
              value={formData.division?.id || ''}
              onChange={handleDivisionChange}
              className="form-select"
              disabled={isLoading}
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
          <label className="form-label">Отделение</label>
          <select
            value={formData.subdivision?.id || ''}
            onChange={handleSubdivisionChange}
            className="form-select"
            disabled={isLoading || !formData.division}
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
          <label className="form-label">Ответственный
          </label>
          <div className="form-input-container">
            <select
              value={formData.assigned_to?.id ? String(formData.assigned_to.id) : ''}
              onChange={handlePersonnelChange}
              className="form-select"
              disabled={isLoading || !formData.division}
            >
              <option value="">Не назначен</option>
              {filteredPersonnel.map(person => (
                <option key={person.id} value={person.id}>
                  {person.full_name} - {person.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Поле Объект */}
        <div className="form-group">
          <label className="form-label">Объект
          </label>
          <div className="form-input-container">
            <select
              value={formData.facility?.id ? String(formData.facility.id) : ''}
              onChange={handleFacilityChange}
              className="form-select"
              disabled={isLoading || !formData.division}
            >
              <option value="">Не привязан к объекту</option>
              {filteredFacilities.map(facility => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} (
                  {facility.type_name || 'Не указан'}
                  {facility.class_display && `, ${facility.class_display || ''}`}
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