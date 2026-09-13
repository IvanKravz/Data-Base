import { useState, useMemo } from 'react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { Shield, Calendar, HardDrive, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import '../PersonnelDetails.css';
import { formatDisplayDate } from '../../../../api/utils/dateFormatters';

interface ResponsibilityInfoProps {
  person: Employee;
  searchTerm?: string;
}

export function ResponsibilityInfo({ person, searchTerm = '' }: ResponsibilityInfoProps) {
  const [isEquipmentExpanded, setIsEquipmentExpanded] = useState(false);

  if (!person.is_sha_worker || !person.sha_details) {
    return null;
  }

  const sha = person.sha_details;

  const filteredConclusions = useMemo(() => {
    if (!sha) return [];
    if (!searchTerm.trim()) return sha.equipment_conclusions;
    const lower = searchTerm.toLowerCase().trim();
    return sha.equipment_conclusions.filter(item =>
      item.equipment_type.toLowerCase().includes(lower) ||
      item.conclusion_number.toLowerCase().includes(lower)
    );
  }, [sha, searchTerm]);

  const mainInfoMatches = useMemo(() => {
    if (!sha) return false;
    if (!searchTerm.trim()) return true;
    const lower = searchTerm.toLowerCase().trim();
    const accessLabel = sha.access_level === '1' ? '1 класс' : '2 класс';
    const startDate = sha.start_date ? formatDisplayDate(sha.start_date) : '';
    return accessLabel.toLowerCase().includes(lower) ||
           startDate.toLowerCase().includes(lower) ||
           'класс сети'.toLowerCase().includes(lower) ||
           'дата начала'.toLowerCase().includes(lower) ||
           sha.access_level.includes(lower);
  }, [sha, searchTerm]);

  if (!mainInfoMatches && filteredConclusions.length === 0) {
    return <div className="no-comments-text">Ничего не найдено</div>;
  }

  return (
    <InfoCard title="Информация о ШР">
      <div className="info-card-content">
        {mainInfoMatches && (
          <>
            <div className="info-item-personel">
              <Shield className="info-item-icon" />
              <div>
                <p className="info-item-label">Класс сети</p>
                <p className="info-item-value">{sha.access_level} класс</p>
              </div>
            </div>

            <div className="info-item-personel">
              <Calendar className="info-item-icon" />
              <div>
                <p className="info-item-label">Дата начала работы</p>
                <p className="info-item-value">{sha.start_date ? formatDisplayDate(sha.start_date) : '—'}</p>
              </div>
            </div>
          </>
        )}

        {filteredConclusions.length > 0 && (
          <div className="personnel-equipment-section">
            <button
              className="personnel-equipment-toggle-button"
              onClick={() => setIsEquipmentExpanded(!isEquipmentExpanded)}
            >
              <HardDrive className="info-item-icon" />
              <span className="info-item-label">Техника и заключения ({filteredConclusions.length})</span>
              {isEquipmentExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className={`personnel-equipment-list-container ${isEquipmentExpanded ? 'expanded' : ''}`}>
              <div className="personnel-equipment-list">
                {filteredConclusions.map((item, index) => (
                  <div key={index} className="personnel-equipment-item">
                    <FileText className="personnel-equipment-icon" />
                    <div className="personnel-equipment-info">
                      <span className="personnel-equipment-type">{item.equipment_type}</span>
                      <span className="personnel-equipment-conclusion">заключение № {item.conclusion_number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </InfoCard>
  );
}