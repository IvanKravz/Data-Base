import React from 'react';
import { Equipment, EquipmentFieldPermissions } from '../../../../../types';
import { FileText, ShieldCheck } from 'lucide-react';
import '../style.css';

interface DocumentsInfoProps {
  formData: Partial<Equipment>;
  onChange: (data: Partial<Equipment>) => void;
  isDisposed?: boolean;
  permissions?: EquipmentFieldPermissions;
  validationErrors?: Record<string, string>;
}

/** Приводит дату к формату YYYY-MM-DD для <input type="date"> */
function toInputDate(value: string | null | undefined): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const m = value.match(/^(\d{2})[.\-](\d{2})[.\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}

export function DocumentsInfo({
  formData,
  onChange,
  isDisposed = false,
  permissions,
  validationErrors = {},
}: DocumentsInfoProps) {
  const isSzi = formData.category?.value === 'szi';
  const canEditSzi = permissions?.canEditSzi ?? permissions?.canEditDocuments ?? true;

  return (
    <div className="equipment-card-edit">
      <div className="equipment-card-header">
        <FileText size={20} />
        <h3 className="equipment-card-title">Документы</h3>
      </div>
      <div className="equipment-card-content-edit">
        <div className="equipment-form-group">
          <label className="equipment-form-label">Первичный документ</label>
          <input
            type="text"
            value={formData.first_invoice || ''}
            onChange={(e) => onChange({ first_invoice: e.target.value })}
            className="form-input-edit"
            placeholder="Номер первичного документа"
            disabled={isDisposed || !permissions?.canEditDocuments}
          />
          {validationErrors.first_invoice && (
            <div className="ep-field-error">{validationErrors.first_invoice}</div>
          )}
        </div>

        <div className="equipment-form-group">
          <label className="equipment-form-label">Накладная на МОЛ</label>
          <input
            type="text"
            value={formData.material_invoice || ''}
            onChange={(e) => onChange({ material_invoice: e.target.value })}
            className="form-input-edit"
            placeholder="Номер накладной на МОЛ"
            disabled={isDisposed || !permissions?.canEditDocuments}
          />
          {validationErrors.material_invoice && (
            <div className="ep-field-error">{validationErrors.material_invoice}</div>
          )}
        </div>

        {/* === Блок СЗИ — только для категории szi === */}
        {isSzi && (
          <div className="equipment-szi-section">
            <div className="equipment-szi-section-header">
              <ShieldCheck size={18} className="equipment-szi-section-icon" />
              <span>Сертификат СЗИ</span>
            </div>

            <div className="equipment-form-group">
              <label className="equipment-form-label">Номер сертификата</label>
              <input
                type="text"
                value={formData.szi_certificate_number || ''}
                onChange={(e) =>
                  onChange({ szi_certificate_number: e.target.value || null } as any)
                }
                className="form-input-edit"
                placeholder="Например: ФСТЭК России № 1234"
                disabled={isDisposed || !canEditSzi}
              />
              {validationErrors.szi_certificate_number && (
                <div className="ep-field-error">
                  {validationErrors.szi_certificate_number}
                </div>
              )}
            </div>

            <div className="equipment-form-group">
              <label className="equipment-form-label">Дата сертификата</label>
              <input
                type="date"
                value={toInputDate(formData.szi_certificate_date)}
                onChange={(e) =>
                  onChange({ szi_certificate_date: e.target.value || null } as any)
                }
                className="form-input-edit"
                disabled={isDisposed || !canEditSzi}
              />
              {validationErrors.szi_certificate_date && (
                <div className="ep-field-error">
                  {validationErrors.szi_certificate_date}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}