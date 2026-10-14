// AssignedEquipment.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Facility, Equipment } from '../../../../types';
import { equipmentApi } from '../../../../api/equipment';
import { Section } from './Section';
import { getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import { SziTable } from './SziTable';

interface AssignedEquipmentProps {
  facility: Facility;
  searchTerm?: string;
}

export function AssignedEquipment({ facility, searchTerm = '' }: AssignedEquipmentProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!token || !facility.id) return;
      try {
        setLoading(true);
        const data = await equipmentApi.getEquipment(token, { facility: facility.id.toString() });
        setEquipment(data || []);
      } catch (err) {
        console.error('Ошибка загрузки техники:', err);
        setError('Не удалось загрузить список техники');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [facility.id, token]);

  /**
   * Обычная техника (без СЗИ). СЗИ выводится отдельным блоком ниже.
   */
  const regularEquipment = useMemo(
    () => equipment.filter((item) => !item.is_szi),
    [equipment],
  );

  const sziEquipment = useMemo(
    () => equipment.filter((item) => item.is_szi),
    [equipment],
  );

  const filteredEquipment = useMemo(() => {
    if (!searchTerm.trim()) return regularEquipment;
    const lower = searchTerm.toLowerCase().trim();
    return regularEquipment.filter(item =>
      item.name.toLowerCase().includes(lower) ||
      (item.serial_number || '').toLowerCase().includes(lower) ||
      (item.inventory_number || '').toLowerCase().includes(lower) ||
      (item.category_display || '').toLowerCase().includes(lower) ||
      (item.assigned_to?.full_name || '').toLowerCase().includes(lower) ||
      getStatusLabel(item.status).toLowerCase().includes(lower)
    );
  }, [regularEquipment, searchTerm]);

  const filteredSzi = useMemo(() => {
    if (!searchTerm.trim()) return sziEquipment;
    const lower = searchTerm.toLowerCase().trim();
    return sziEquipment.filter(item =>
      item.name.toLowerCase().includes(lower) ||
      (item.serial_number || '').toLowerCase().includes(lower) ||
      (item.inventory_number || '').toLowerCase().includes(lower) ||
      (item.assigned_to?.full_name || '').toLowerCase().includes(lower) ||
      (item.szi_certificate_number || '').toLowerCase().includes(lower)
    );
  }, [sziEquipment, searchTerm]);

  if (loading) {
    return (
      <Section title="Техника на объекте">
        <div className="facility-details-loading">Загрузка техники...</div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Техника на объекте">
        <div className="facility-details-error">{error}</div>
      </Section>
    );
  }

  const hasAnyEquipment = regularEquipment.length > 0 || sziEquipment.length > 0;

  if (!hasAnyEquipment) {
    return (
      <Section title="Техника на объекте">
        <div className="facility-details-comments-empty">Нет техники на объекте</div>
      </Section>
    );
  }

  return (
    <>
      <Section title="Техника на объекте">
        {filteredEquipment.length === 0 ? (
          <div className="facility-details-comments-empty">
            {searchTerm.trim() ? 'Ничего не найдено' : 'Нет техники на объекте'}
          </div>
        ) : (
          <div className="facility-equipment-table-wrapper">
            <table className="facility-equipment-table">
              <thead>
                <tr>
                  <th>№ п/п</th>
                  <th>Название</th>
                  <th>Серийный номер</th>
                  <th>Инв. номер</th>
                  <th>Категория</th>
                  <th>Закреплено</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((item, index) => (
                  <tr key={item.id} className="facility-equipment-row">
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.serial_number || '—'}</td>
                    <td>{item.inventory_number || '—'}</td>
                    <td>{item.category_display || '—'}</td>
                    <td>{item.assigned_to?.full_name || '—'}</td>
                    <td>
                      <span className={`facility-equipment-status-badge ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Блок СЗИ — показывается только если на объекте есть хотя бы одна единица */}
      {sziEquipment.length > 0 && (
        <SziTable equipment={filteredSzi} totalCount={sziEquipment.length} />
      )}
    </>
  );
}