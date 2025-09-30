import React from 'react';
import { Equipment } from '../../../../types';
import { FileText, ClipboardList, FileCheck } from 'lucide-react';
import '../style.css';

interface DocumentsInfoProps {
  equipment: Equipment;
}

export function DocumentsInfo({ equipment }: DocumentsInfoProps) {
  return (
    <div className="equipment-card">
      <h2 className="equipment-card__title">Документы</h2>
      <div className="equipment-card-content">
        <div className="equipment-info-grid">
          {equipment.first_invoice && (
            <div className="equipment-info-item">
              <FileText className="equipment-info-item__icon text-blue-500" size={20} />
              <div>
                <p className="equipment-info-item__label">Первичный документ</p>
                <p className="equipment-info-item__value">{equipment.first_invoice}</p>
              </div>
            </div>
          )}

          {equipment.material_invoice && (
            <div className="equipment-info-item">
              <ClipboardList className="equipment-info-item__icon text-green-500" size={20} />
              <div>
                <p className="equipment-info-item__label">Накладная на МОЛ</p>
                <p className="equipment-info-item__value">{equipment.material_invoice}</p>
              </div>
            </div>
          )}

          {/* Новое поле - акт безвозмездного пользования */}
          {equipment.is_free_use && equipment.free_use_act_number && (
            <div className="equipment-info-item">
              <FileCheck className="equipment-info-item__icon text-purple-500" size={20} />
              <div>
                <p className="equipment-info-item__label">Акт безвозмездного пользования</p>
                <p className="equipment-info-item__value">{equipment.free_use_act_number}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}