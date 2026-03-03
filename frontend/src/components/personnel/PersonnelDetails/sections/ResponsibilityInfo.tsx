import { useState, useRef } from 'react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { Shield, Calendar, HardDrive, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import '.././style.css';

interface ResponsibilityInfoProps {
  person: Employee;
}

export function ResponsibilityInfo({ person }: ResponsibilityInfoProps) {
  const [isEquipmentExpanded, setIsEquipmentExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Показываем карточку только если сотрудник является ШР и есть детали
  if (!person.is_sha_worker || !person.sha_details) {
    return null;
  }

  const toggleEquipmentList = () => {
    setIsEquipmentExpanded(!isEquipmentExpanded);
  };

  return (
    <div className="responsibility-grid">
      <InfoCard title="Информация о ШР">
        <div className="info-card-content relative">
          <div className="info-item-personel">
            <Shield className="info-item-icon text-blue-500" />
            <div>
              <p className="info-item-label">Класс сети</p>
              <p className="info-item-value">{person.sha_details.access_level} класс</p>
            </div>
          </div>

          <div className="info-item-personel">
            <Calendar className="info-item-icon text-orange-500" />
            <div>
              <p className="info-item-label">Дата начала работы</p>
              <p className="info-item-value">{person.sha_details.start_date}</p>
            </div>
          </div>

          {person.sha_details.equipment_conclusions.length > 0 && (
            <div className="relative">
              <button
                className="info-item-personel equipment-toggle-button w-full"
                onClick={toggleEquipmentList}
                aria-expanded={isEquipmentExpanded}
              >
                <HardDrive className="info-item-icon text-brown-500" />
                <div className="flex justify-between items-center w-full">
                  <p className="info-item-label">Техника и заключения</p>
                  {isEquipmentExpanded ? (
                    <ChevronUp className="toggle-icon" size={16} />
                  ) : (
                    <ChevronDown className="toggle-icon" size={16} />
                  )}
                </div>
              </button>

              <div
                ref={dropdownRef}
                className={`equipment-dropdown absolute left-0 right-0 z-10 ${
                  isEquipmentExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
              >
                <div className="equipment-list">
                  {person.sha_details.equipment_conclusions.map((item, index) => (
                    <div key={index} className="equipment-item">
                      <div className="info-item-personel">
                        <FileText className="info-item-icon text-gray-500" size={16} />
                        <div>
                          <div className="equipment-type">{item.equipment_type}</div>
                          <div className="equipment-conclusion">Заключение № {item.conclusion_number}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </InfoCard>
    </div>
  );
}