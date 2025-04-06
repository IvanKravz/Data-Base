import React, { useState } from 'react';
import { Users, Database, LayoutGrid, Building2, ListTodo, HardDrive, UserCog, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  onSetActiveTab: (tab: string) => void;
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: MenuItem[];
}

export function Sidebar({ activeTab, onSetActiveTab }: SidebarProps) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleTabClick = (item: MenuItem) => {
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

  const menuItems: MenuItem[] = [
    { id: 'divisions', icon: LayoutGrid, label: 'Подразделения' },
    {
      id: 'equipment',
      icon: Database,
      label: 'Техника',
      children: [
        { id: 'equipment-open', icon: Database, label: 'Открытая', path: '/equipment-open' },
        { id: 'equipment-closed', icon: Database, label: 'Закрытая', path: '/equipment-closed' },
        { id: 'equipment-disposed', icon: Trash2, label: 'Списанное', path: '/equipment-disposed' }
      ]
    },
    { id: 'personnel', icon: Users, label: 'Сотрудники' },
    {
      id: 'facilities',
      icon: Building2,
      label: 'Объекты',
      children: [
        { id: 'facilities-open', icon: Building2, label: 'Открытые', path: '/facilities-open' },
        { id: 'facilities-closed', icon: Building2, label: 'Закрытые', path: '/facilities-closed' }
      ]
    },
    { id: 'tasks', icon: ListTodo, label: 'Задачи', path: '/tasks' },
    { id: 'storage', icon: HardDrive, label: 'Хранилище', path: '/storage' },
    { id: 'cabinet', icon: UserCog, label: 'Кабинет', path: '/cabinet' }
  ];

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = activeTab === item.id ||
      (item.children?.some(child => activeTab === child.id));
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
        </div>
        {hasChildren && (
          <div
            className={`submenu ${isExpanded ? 'submenu--expanded' : 'submenu--collapsed'
              }`}
          >
            <div className="submenu-content">
              <div className="submenu-items">
                {item.children.map((child) => renderMenuItem(child, level + 1))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="navigation-menu">
      {menuItems.map((item) => renderMenuItem(item))}
    </nav>
  );
}