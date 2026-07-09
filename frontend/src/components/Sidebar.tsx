// Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { Users, Database, LayoutGrid, Building2, ListTodo, HardDrive, UserCog, ChevronRight, Network, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppPermissions } from '../api/utils/AppPermissionsContext';
import {
    isExploitationChief,
    isExploitationEmployee,
    getCurrentUser as getCurrentUserGlobal
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
    // Инициализация expandedItems из localStorage
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

    const { canAccessPage } = useAppPermissions();

    // Сохранение expandedItems в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('sidebarExpandedItems', JSON.stringify(expandedItems));
    }, [expandedItems]);

    useEffect(() => {
        const user = getCurrentUserGlobal();
        if (user && user.division_info) {
            setUserDivision(user.division_info.id);
        }
        setIsExploitationEmp(isExploitationEmployee());
    }, []);

    const handleTabClick = (item: MenuItem) => {
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
        if (item.id === 'cabinet') return true;
        if (item.model) {
            return canAccessPage(item.model, (item.action || 'view') as any);
        }
        return false;
    };

    const getDivisionsLabel = () => {
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