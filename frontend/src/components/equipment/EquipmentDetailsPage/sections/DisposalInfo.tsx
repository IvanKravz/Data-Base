import React from 'react';
import { FileText, Calendar } from 'lucide-react';
import { DisposalInfo as DisposalInfoType } from '../../../../types';
import { format } from 'date-fns';

interface DisposalInfoProps {
  disposalInfo: DisposalInfoType;
}

export function DisposalInfo({ disposalInfo }: DisposalInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Информация о списании</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">№ акта списания</p>
              <p className="font-medium text-gray-900">{disposalInfo.actNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Дата акта</p>
              <p className="font-medium text-gray-900">
                {format(new Date(disposalInfo.actDate), 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">№ справки о ликвидации</p>
              <p className="font-medium text-gray-900">{disposalInfo.disposalCertNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Дата справки</p>
              <p className="font-medium text-gray-900">
                {format(new Date(disposalInfo.disposalCertDate), 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {disposalInfo.comments && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Комментарии</h3>
          <p className="text-gray-700">{disposalInfo.comments}</p>
        </div>
      )}
    </div>
  );
}