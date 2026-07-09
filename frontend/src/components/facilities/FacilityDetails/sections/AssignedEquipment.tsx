// AssignedEquipment.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Facility, Equipment } from '../../../../types';
import { equipmentApi } from '../../../../api/equipment';
import { Section } from './Section';
import { getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';

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

  const filteredEquipment = useMemo(() => {
    if (!searchTerm.trim()) return equipment;
    const lower = searchTerm.toLowerCase().trim();
    return equipment.filter(item =>
      item.name.toLowerCase().includes(lower) ||
      item.serial_number.toLowerCase().includes(lower) ||
      item.inventory_number?.toLowerCase().includes(lower) ||
      (item.category_display || '').toLowerCase().includes(lower) ||
      (item.assigned_to?.full_name || '').toLowerCase().includes(lower) ||
      getStatusLabel(item.status).toLowerCase().includes(lower)
    );
  }, [equipment, searchTerm]);

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

  if (filteredEquipment.length === 0) {
    return (
      <Section title="Техника на объекте">
        <div className="facility-details-comments-empty">Нет техники на объекте</div>
      </Section>
    );
  }

  return (
    <Section title="Техника на объекте">
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
    </Section>
  );
}