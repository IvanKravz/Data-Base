// Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { Users, Database, LayoutGrid, Building2, ListTodo, HardDrive, UserCog, ChevronRight, Network, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { isExploitationChief, getCurrentUser, isExploitationEmployee } from '../api/utils/permissions';

interface SidebarProps {
  activeTab: string;
  onSetActiveTab: (tab: string) => void;
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  module?: string;
  children?: MenuItem[];
}

export function Sidebar({ activeTab, onSetActiveTab }: SidebarProps) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [modulePermissions, setModulePermissions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDivision, setUserDivision] = useState<string | null>(null);
  const [showMapItem, setShowMapItem] = useState(false);
  const [isExploitationEmp, setIsExploitationEmp] = useState(false);

  useEffect(() => {
    const loadPermissionsAndUser = () => {
      const permissions = authApi.getModulePermissions();
      setModulePermissions(permissions);

      const user = getCurrentUser();
      if (user && user.division_info) {
        setUserDivision(user.division_info.id);
      }

      // Проверяем, нужно ли показывать пункт "Карта ТОБ"
      const isEmp = isExploitationEmployee();
      setShowMapItem(isExploitationChief() || isEmp);
      setIsExploitationEmp(isEmp);

      setIsLoading(false);
    };

    const timer = setTimeout(loadPermissionsAndUser, 100);
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
    if (isLoading) return true;
    if (!modulePermissions) return true;

    const alwaysAccessible = ['divisions', 'cabinet', 'storage', 'networks'];
    if (alwaysAccessible.includes(item.id)) return true;

    // Для пункта "Карта ТОБ" проверяем роль
    if (item.id === 'map') {
      return showMapItem;
    }

    if (item.module && modulePermissions[item.module]) {
      return modulePermissions[item.module].can_view;
    }

    if (modulePermissions[item.id]) {
      return modulePermissions[item.id].can_view;
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
      label: getDivisionsLabel()
    },
    {
      id: 'personnel',
      icon: Users,
      label: 'Сотрудники',
      path: '/personnel',
      module: 'employees'
    },
    {
      id: 'equipment',
      icon: Database,
      label: 'Техника',
      path: '/equipment',
      module: 'equipment'
    },
    {
      id: 'facilities',
      icon: Building2,
      label: 'Объекты',
      path: '/facilities',
      module: 'facilities'
    },
    {
      id: 'networks',
      icon: Network,
      label: 'Сети связи',
      path: '/networks'
    },
    {
      id: 'tasks',
      icon: ListTodo,
      label: 'Задачи',
      path: '/tasks',
      module: 'tasks'
    },
    {
      id: 'storage',
      icon: HardDrive,
      label: 'Хранилище',
      path: '/storage'
    },
    {
      id: 'map',
      icon: Map,
      label: 'Карта ТОБ',
      path: '/map'
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