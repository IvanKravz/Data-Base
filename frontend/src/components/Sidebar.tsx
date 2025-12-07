// Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { Users, Database, LayoutGrid, Building2, ListTodo, HardDrive, UserCog, ChevronRight, Network, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import {
  isExploitationChief,
  getCurrentUser,
  isExploitationEmployee,
  canAccessPage
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
  model?: string;  // Модель для проверки прав
  action?: string; // Действие (по умолчанию 'view')
  children?: MenuItem[];
}

export function Sidebar({ activeTab, onSetActiveTab, availableTabs }: SidebarProps) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDivision, setUserDivision] = useState<string | null>(null);
  const [isExploitationEmp, setIsExploitationEmp] = useState(false);

  useEffect(() => {
    const loadUserData = () => {
      const user = getCurrentUser();
      if (user && user.division_info) {
        setUserDivision(user.division_info.id);
      }

      const isEmp = isExploitationEmployee();
      setIsExploitationEmp(isEmp);

      setIsLoading(false);
    };

    const timer = setTimeout(loadUserData, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleTabClick = (item: MenuItem) => {
    // Для сотрудника эксплуатации и начальника эксплуатации - переход в свое подразделение
    if (item.id === 'divisions' && (isExploitationChief() || isExploitationEmp) && userDivision) {
      navigate(`/divisions/${userDivision}`);
      onSetActiveTab(item.id);
      return;
    }

    if (item.children) {
      setExpandedItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      onSetActiveTab(item.id);
      if (item.path) {
        navigate(item.path);
      } else {
        navigate('/');
      }
    }
  };

  const hasAccessToMenuItem = (item: MenuItem): boolean => {
    // Для кабинета всегда доступен
    if (item.id === 'cabinet') {
        return true;
    }

    // Для всех остальных пунктов - строгая проверка через canAccessPage
    if (item.model) {
        return canAccessPage(item.model, (item.action || 'view') as any);
    }

    return false;
};

  const getDivisionsLabel = () => {
    // Для сотрудника эксплуатации и начальника эксплуатации - "Подразделение"
    if (isExploitationChief() || isExploitationEmp) {
      return 'Подразделение';
    }
    return 'Подразделения';
  };

  const menuItems: MenuItem[] = [
    {
      id: 'divisions',
      icon: LayoutGrid,
      label: getDivisionsLabel(),
      model: 'Division'
    },
    {
      id: 'personnel',
      icon: Users,
      label: 'Сотрудники',
      path: '/personnel',
      model: 'Employee'
    },
    {
      id: 'equipment',
      icon: Database,
      label: 'Техника',
      path: '/equipment',
      model: 'Equipment'
    },
    {
      id: 'facilities',
      icon: Building2,
      label: 'Объекты',
      path: '/facilities',
      model: 'Facility'
    },
    {
      id: 'networks',
      icon: Network,
      label: 'Сети связи',
      path: '/networks',
      model: 'CommunicationNetwork'
    },
    {
      id: 'tasks',
      icon: ListTodo,
      label: 'Задачи',
      path: '/tasks',
      model: 'Task'
    },
    {
      id: 'storage',
      icon: HardDrive,
      label: 'Хранилище',
      path: '/storage',
      model: 'StorageFile'
    },
    {
      id: 'map',
      icon: Map,
      label: 'Карта ТОБ',
      path: '/map',
      model: 'Map'
    },
    {
      id: 'cabinet',
      icon: UserCog,
      label: 'Кабинет',
      path: '/cabinet'
    },
  ];

  const filteredMenuItems = menuItems.filter(hasAccessToMenuItem);

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    return (
      <div key={item.id} className="menu-item">
        <div
          onClick={() => handleTabClick(item)}
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
              className={`menu-item-arrow ${isExpanded ? 'menu-item-arrow--expanded' : ''
                }`}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
          {/* Добавляем индикатор активной категории */}
          {isActive && <div className="menu-item-indicator"></div>}
        </div>
        {hasChildren && (
          <div
            className={`submenu ${isExpanded ? 'submenu--expanded' : 'submenu--collapsed'
              }`}
          >
            <div className="submenu-content">
              <div className="submenu-items">
                {item.children?.map((child) => renderMenuItem(child, level + 1))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="navigation-menu">
      {filteredMenuItems.map((item) => renderMenuItem(item))}
    </nav>
  );
}