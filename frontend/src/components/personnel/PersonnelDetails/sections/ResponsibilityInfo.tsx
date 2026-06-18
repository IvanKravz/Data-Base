import { useState, useMemo } from 'react';
import { Employee } from '../../../../types';
import { InfoCard } from './InfoCard';
import { Shield, Calendar, HardDrive, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import '../PersonnelDetails.css';

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

  // Функция для преобразования даты в читаемый формат DD.MM.YYYY
  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    // Если дата уже в формате DD-MM-YYYY или DD.MM.YYYY, преобразуем
    let parts: string[] = [];
    if (dateString.includes('-')) {
      parts = dateString.split('-');
    } else if (dateString.includes('.')) {
      parts = dateString.split('.');
    } else {
      // Неизвестный формат, пробуем напрямую через Date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ru-RU');
      }
      return '—';
    }
    // Проверяем, что у нас 3 части
    if (parts.length !== 3) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ru-RU');
      }
      return '—';
    }
    // Определяем формат: если первая часть > 12, то это день, значит формат DD-MM-YYYY
    // или если вторая часть > 12, то это месяц, значит формат YYYY-MM-DD
    // Обычно сервер отдаёт YYYY-MM-DD, но для безопасности попробуем оба.
    let day: string, month: string, year: string;
    // Если первая часть длиной 4, то это год, значит формат YYYY-MM-DD
    if (parts[0].length === 4) {
      year = parts[0];
      month = parts[1].padStart(2, '0');
      day = parts[2].padStart(2, '0');
    } else {
      // Иначе считаем, что формат DD-MM-YYYY или DD.MM.YYYY
      day = parts[0].padStart(2, '0');
      month = parts[1].padStart(2, '0');
      year = parts[2];
      // Если год всего 2 цифры, добавляем 20
      if (year.length === 2) year = '20' + year;
    }
    return `${day}.${month}.${year}`;
  };

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
    const startDate = sha.start_date ? formatDateForDisplay(sha.start_date) : '';
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
                <p className="info-item-value">{sha.start_date ? formatDateForDisplay(sha.start_date) : '—'}</p>
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