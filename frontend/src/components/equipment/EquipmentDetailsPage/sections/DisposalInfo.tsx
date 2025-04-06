import React from 'react';
import { FileText, Calendar } from 'lucide-react';
import { DisposalInfo as DisposalInfoType } from '../../../../types';
import { format } from 'date-fns';
import '.././style.css'

interface DisposalInfoProps {
  disposalInfo: DisposalInfoType;
}

export function DisposalInfo({ disposalInfo }: DisposalInfoProps) {
  return (
    <div className="equipment-card">
      <h2 className="equipment-card__title">Информация о списании</h2>
      <div className="equipment-grid equipment-grid--2cols equipment-gap-md">
        <div className="equipment-card-content">
          <div className="equipment-info-item">
            <FileText className="equipment-info-item__icon text-blue-500" size={20} />
            <div>
              <p className="equipment-info-item__label">№ акта списания</p>
              <p className="equipment-info-item__value">{disposalInfo.disposal_act_number}</p>
            </div>
          </div>
          <div className="equipment-info-item">
            <Calendar className="equipment-info-item__icon text-green-500" size={20} />
            <div>
              <p className="equipment-info-item__label">Дата акта</p>
              <p className="equipment-info-item__value">
                {format(new Date(disposalInfo.disposal_act_date), 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="equipment-space-y">
          <div className="equipment-info-item">
            <FileText className="equipment-info-item__icon text-purple-500" size={20} />
            <div>
              <p className="equipment-info-item__label">№ справки о ликвидации</p>
              <p className="equipment-info-item__value">{disposalInfo.disposal_cert_number}</p>
            </div>
          </div>
          <div className="equipment-info-item">
            <Calendar className="equipment-info-item__icon text-orange-500" size={20} />
            <div>
              <p className="equipment-info-item__label">Дата справки</p>
              <p className="equipment-info-item__value">
                {format(new Date(disposalInfo.disposal_cert_date), 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {disposalInfo.comments && (
        <div className="equipment-space-y equipment-space-y--lg">
          <h3 className="equipment-info-item__label">Комментарии</h3>
          <p className="equipment-info-item__value equipment-info-item__value--multiline">
            {disposalInfo.comments}
          </p>
        </div>
      )}
    </div>
  );
}