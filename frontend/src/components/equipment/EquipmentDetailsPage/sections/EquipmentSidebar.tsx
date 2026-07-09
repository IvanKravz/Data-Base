// EquipmentSidebar.tsx
import React from 'react';
import { Equipment } from '../../../../types';
import { getStatusLabel, getStatusColor } from '../../../../utils/statusUtils';
import {
    Hash,
    NotebookTabs,
    HardDrive,
    Package,
    ArrowLeft,
} from 'lucide-react';

interface EquipmentSidebarProps {
    equipment: Equipment;
    onBack: () => void;
}

export function EquipmentSidebar({ equipment, onBack }: EquipmentSidebarProps) {
    const specificationItems = [
        { icon: HardDrive, label: 'Модель / Тип', value: equipment.type || '—' },
        { icon: Package, label: 'Версия ПО', value: equipment.ver_software || '—' },
    ];

    return (
        <div className="equipment-sidebar-card">
            {/* Заголовок: кнопка назад + имя в одной строке, затем статус, затем категория */}
            <div className="equipment-sidebar-header">
                <div className="equipment-sidebar-header-top">
                    <button onClick={onBack} className="equipment-btn--icon equipment-sidebar-back">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="equipment-sidebar-name">{equipment.name}</div>
                </div>
                <div className={`equipment-sidebar-status ${getStatusColor(equipment.status)}`}>
                    {getStatusLabel(equipment.status)}
                </div>
                <div className="equipment-sidebar-category">
                    {equipment.category_display || '—'}
                </div>
            </div>

            {/* Группа: Идентификация */}
            <div className="equipment-sidebar-group">
                <div className="equipment-sidebar-item">
                    <Hash size={18} className="equipment-sidebar-icon" />
                    <div className="equipment-sidebar-item-content">
                        <span className="equipment-sidebar-label">Серийный номер</span>
                        <span className="equipment-sidebar-value">{equipment.serial_number || '—'}</span>
                    </div>
                </div>
                <div className="equipment-sidebar-item">
                    <NotebookTabs size={18} className="equipment-sidebar-icon" />
                    <div className="equipment-sidebar-item-content">
                        <span className="equipment-sidebar-label">Инвентарный номер</span>
                        <span className="equipment-sidebar-value">{equipment.inventory_number || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Группа: Характеристики */}
            <div className="equipment-sidebar-group">
                {specificationItems.map((item, idx) => (
                    <div className="equipment-sidebar-item" key={idx}>
                        <item.icon size={18} className="equipment-sidebar-icon" />
                        <div className="equipment-sidebar-item-content">
                            <span className="equipment-sidebar-label">{item.label}</span>
                            <span className="equipment-sidebar-value">{item.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}