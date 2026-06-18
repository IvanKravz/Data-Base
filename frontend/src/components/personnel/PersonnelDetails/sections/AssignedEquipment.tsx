import React, { useState, useEffect, useMemo } from 'react';
import { HardDrive } from 'lucide-react';
import { Employee, Equipment } from '../../../../types';
import { equipmentApi } from '../../../../api/equipment';
import { ExportButton } from '../../../common/ExportButton';
import { exportEquipmentToExcel } from '../../../../utils/exportToExcel';
import { useSearchParams } from 'react-router-dom';
import '../PersonnelDetails.css';

interface AssignedEquipmentProps {
  person: Employee;
  id: string;
  hasAccess?: boolean;
  searchTerm?: string;
}

export function AssignedEquipment({ person, id, hasAccess = true, searchTerm = '' }: AssignedEquipmentProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken');
  const [searchParams] = useSearchParams();
  const subdivisionId = searchParams.get('subdivision');

  useEffect(() => {
    if (!hasAccess) return;
    const fetchData = async () => {
      try {
        if (token && id) {
          const data = await equipmentApi.getEquipmentByEmployee(token, id);
          setEquipmentList(data);
        }
      } catch (err) {
        setError('Не удалось загрузить закрепленную технику');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id, hasAccess]);

  const filteredEquipment = useMemo(() => {
    let items = equipmentList;
    if (subdivisionId) {
      items = items.filter(item => item.subdivision?.id == subdivisionId);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(lower) ||
        (item.inventory_number && item.inventory_number.toLowerCase().includes(lower)) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(lower))
      );
    }
    return items;
  }, [equipmentList, subdivisionId, searchTerm]);

  const totalCount = equipmentList.length;

  if (!hasAccess) return null;
  if (loading) return <div className="text-center py-4">Загрузка...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="personnel-equipment-tree-container">
      <div className="personnel-equipment-header">
        <h2 className="personnel-equipment-title">Закрепленная техника</h2>
        <div className="personnel-equipment-stats">
          <HardDrive size={18} />
          <span>Всего: {totalCount}</span>
          {searchTerm && <span> (найдено: {filteredEquipment.length})</span>}
          <ExportButton onClick={() => exportEquipmentToExcel(filteredEquipment)} label="Экспорт" />
        </div>
      </div>

      {filteredEquipment.length === 0 ? (
        <div className="personnel-empty-tree">
          {searchTerm ? 'Техника не найдена по запросу' : 'Техника не закреплена'}
        </div>
      ) : (
        <div className="personnel-equipment-list">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>№ п/п</th>
                <th>Наименование</th>
                <th>Инв. №</th>
                <th>Зав. №</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.inventory_number || '—'}</td>
                  <td>{item.serial_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}