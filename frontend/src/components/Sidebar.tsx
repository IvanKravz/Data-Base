// Sidebar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Database,
  LayoutGrid,
  Building2,
  ListTodo,
  HardDrive,
  ChevronRight,
  Network,
  Map,
  Shield,
  Calendar,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppPermissions } from '../api/utils/AppPermissionsContext';
import {
  isExploitationChief,
  isExploitationEmployee,
  getCurrentUser as getCurrentUserGlobal,
} from '../api/utils/permissions';

interface SidebarProps {
  activeTab: string;
  availableTabs?: Record<string, boolean>;
  onSetActiveTab: (tab: string) => void;
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  model?: string;
  action?: string;
  children?: MenuItem[];
}

export function Sidebar({ activeTab, onSetActiveTab, availableTabs }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sidebarExpandedItems');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [userDivision, setUserDivision] = useState<string | null>(null);
  const [isExploitationEmp, setIsExploitationEmp] = useState(false);
  const [isChief, setIsChief] = useState(false);

  const { canAccessPage, personnelFilters } = useAppPermissions();

  useEffect(() => {
    localStorage.setItem('sidebarExpandedItems', JSON.stringify(expandedItems));
  }, [expandedItems]);

  useEffect(() => {
    const user = getCurrentUserGlobal();
    if (user?.division_info) {
      setUserDivision(user.division_info.id);
    }
    setIsExploitationEmp(isExploitationEmployee());
    setIsChief(isExploitationChief());
  }, []);

  const handleTabClick = (item: MenuItem, parentId?: string) => {
    // Особый случай: для эксплуатационников "divisions" ведёт на их подразделение
    if (item.id === 'divisions' && (isChief || isExploitationEmp) && userDivision) {
      navigate(`/divisions/${userDivision}`, { state: null });
      onSetActiveTab(item.id);
      return;
    }

    if (item.children && item.children.length > 0) {
      // Клик по родителю — только раскрытие/скрытие подменю
      setExpandedItems((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id],
      );
      return;
    }

    // Клик по листовому пункту — навигация.
    // Явно сбрасываем state: так кнопка «назад» на странице графика не
    // залипнет, если пользователь до этого пришёл туда из карточки подразделения.
    const targetTab = parentId ?? item.id;
    onSetActiveTab(targetTab);
    if (item.path) {
      navigate(item.path, { state: null });
    } else {
      navigate('/', { state: null });
    }
  };

  // Есть ли у пользователя фильтры по сотрудникам (например, exploitation_chief)
  const hasPersonnelFilters = useMemo(
    () => !!personnelFilters && Object.keys(personnelFilters).length > 0,
    [personnelFilters],
  );

  /**
   * URL и подпись пункта графика зависят от доступности сотрудников:
   *  — если фильтров нет → «Общий график работы» → /employee-schedule
   *  — если фильтры есть и известен userDivision →
   *      «График работы подразделения» → /employee-schedule?division=<id>
   *  — если фильтры есть, но userDivision нет → пункт скрывается
   */
  const scheduleItem = useMemo<MenuItem | null>(() => {
    if (!canAccessPage('ScheduleEvent', 'view')) return null;

    if (!hasPersonnelFilters) {
      return {
        id: 'employee-schedule',
        icon: Calendar,
        label: 'График работы',
        path: '/employee-schedule',
        model: 'ScheduleEvent',
      };
    }

    if (userDivision) {
      return {
        id: 'employee-schedule',
        icon: Calendar,
        label: 'График работы',
        path: `/employee-schedule?division=${userDivision}`,
        model: 'ScheduleEvent',
      };
    }

    return null;
  }, [canAccessPage, hasPersonnelFilters, userDivision]);

  const hasAccessToMenuItem = (item: MenuItem): boolean => {
    if (item.id === 'cabinet') return true;
    if (item.id === 'employee-schedule') return !!scheduleItem;
    if (item.model) {
      return canAccessPage(item.model, (item.action || 'view') as any);
    }
    return false;
  };

  const getDivisionsLabel = () => {
    if (isChief || isExploitationEmp) {
      return 'Подразделение';
    }
    return 'Подразделения';
  };

  const menuItems: MenuItem[] = [
    {
      id: 'divisions',
      icon: LayoutGrid,
      label: getDivisionsLabel(),
      model: 'Division',
    },
    {
      id: 'personnel',
      icon: Users,
      label: 'Сотрудники',
      model: 'Employee',
      children: [
        {
          id: 'personnel-list',
          icon: Users,
          label: 'Список сотрудников',
          path: '/personnel',
          model: 'Employee',
        },
        ...(scheduleItem ? [scheduleItem] : []),
      ],
    },
    {
      id: 'equipment',
      icon: Database,
      label: 'Техника',
      path: '/equipment',
      model: 'Equipment',
    },
    {
      id: 'facilities',
      icon: Building2,
      label: 'Объекты',
      path: '/facilities',
      model: 'Facility',
    },
    {
      id: 'networks',
      icon: Network,
      label: 'Сети связи',
      path: '/networks',
      model: 'CommunicationNetwork',
    },
    {
      id: 'tasks',
      icon: ListTodo,
      label: 'Задачи',
      path: '/tasks',
      model: 'Task',
    },
    {
      id: 'storage',
      icon: HardDrive,
      label: 'Хранилище',
      path: '/storage',
      model: 'StorageFile',
    },
    {
      id: 'map',
      icon: Map,
      label: 'Карта ТОБ',
      path: '/map',
      model: 'Map',
    },
  ];

  // Рекурсивная фильтрация: если у родителя после фильтрации не осталось детей, родитель тоже скрывается
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .map((item) => {
        if (item.children && item.children.length > 0) {
          const filteredChildren = filterMenuItems(item.children);
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        return hasAccessToMenuItem(item) ? item : null;
      })
      .filter((x): x is MenuItem => x !== null);
  };

  const filteredMenuItems = filterMenuItems(menuItems).filter((item) => {
    if (item.id === 'map' && (isChief || isExploitationEmp)) return false;
    return true;
  });

  /**
   * Определяет активность пункта меню:
   *  — если есть path (лист) → сравниваем по pathname (без query)
   *  — если есть дети → активен, если активен хотя бы один ребёнок
   *  — иначе (divisions) → сверяем с activeTab
   */
  const isMenuItemActive = (menuItem: MenuItem): boolean => {
    if (menuItem.children && menuItem.children.length > 0) {
      return menuItem.children.some(isMenuItemActive);
    }
    const pathname = menuItem.path ? menuItem.path.split('?')[0] : null;
    if (pathname) {
      return location.pathname === pathname;
    }
    return activeTab === menuItem.id;
  };

  const renderMenuItem = (item: MenuItem, level = 0, parentId?: string) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isMenuItemActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;
    return (
      <div key={`${item.id}-${item.path ?? 'group'}`} className="menu-item">
        <div
          onClick={() => handleTabClick(item, parentId)}
          className={`menu-item-button ${isActive ? 'menu-item-button--active' : 'menu-item-button--inactive'
            }`}
          style={{ paddingLeft: `${level * 12 + 16}px` }}
        >
          <div className="menu-item-content">
            <Icon
              className={`menu-item-icon ${isActive ? 'menu-item-icon--active' : 'menu-item-icon--inactive'
                }`}
            />
            <span className="menu-item-label">{item.label}</span>
          </div>
          {hasChildren && (
            <div
              className={`menu-item-arrow ${isExpanded ? 'menu-item-arrow--expanded' : ''}`}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
          {isActive && <div className="menu-item-indicator"></div>}
        </div>
        {hasChildren && (
          <div
            className={`submenu ${isExpanded ? 'submenu--expanded' : 'submenu--collapsed'}`}
          >
            <div className="submenu-content">
              <div className="submenu-items">
                {item.children?.map((child) => renderMenuItem(child, level + 1, item.id))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar-wrapper">
      <nav className="navigation-menu">
        {filteredMenuItems.map((item) => renderMenuItem(item))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer__line"></div>
        <div className="sidebar-footer__content">
          <div className="sidebar-footer__brand">
            <Shield className="sidebar-footer__icon" size={18} />
            <span className="sidebar-footer__title">«ШТАБ»</span>
          </div>
          <span className="sidebar-footer__version">Версия 1.0.0</span>
        </div>
      </div>
    </div>
  );
}