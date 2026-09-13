// src/utils/dateFormatters.ts

/**
 * Преобразует дату в формат для отображения: ДД.ММ.ГГГГ
 */
export const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    // Если уже в формате ДД.ММ.ГГГГ или ДД-ММ-ГГГГ
    const dotMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dotMatch) return dateString;
    const dashMatch = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dashMatch) return `${dashMatch[1]}.${dashMatch[2]}.${dashMatch[3]}`;
    // Если ISO (YYYY-MM-DD)
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
    // Если ничего не подошло, пробуем через Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('ru-RU');
    }
    return '—';
  };
  
  /**
   * Преобразует дату для input type="date" (в YYYY-MM-DD)
   */
  export const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    // Если уже ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // Если ДД.ММ.ГГГГ или ДД-ММ-ГГГГ
    const dotMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dotMatch) return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}`;
    const dashMatch = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dashMatch) return `${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`;
    // Пробуем через Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return '';
  };
  
  /**
   * Преобразует дату для отправки на сервер (ISO YYYY-MM-DD)
   */
  export const formatDateForServer = (dateString: string): string => {
    if (!dateString) return '';
    // Если уже ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // Если ДД.ММ.ГГГГ
    const dotMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dotMatch) return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}`;
    // Если ДД-ММ-ГГГГ
    const dashMatch = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dashMatch) return `${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`;
    return dateString;
  };