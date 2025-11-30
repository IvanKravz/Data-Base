// MembershipSection.tsx
import React from 'react';

interface SelectedItem {
    division: { id: string; name: string };
    facility: { id: string; name: string };
    equipment: { id: string; name: string; serial_number: string };
}

interface MembershipSectionProps {
    divisions: any[];
    facilities: any[];
    equipment: any[];
    currentDivision: string;
    currentFacility: string;
    currentEquipment: string;
    selectedConnections: SelectedItem[];
    onDivisionChange: (divisionId: string) => void;
    onFacilityChange: (facilityId: string) => void;
    onEquipmentChange: (equipmentId: string) => void;
    onAddItem: () => void;
    onRemoveConnection: (index: number) => void;
    connectionError: string | null;
}

const MembershipSection: React.FC<MembershipSectionProps> = ({
    divisions,
    facilities,
    equipment,
    currentDivision,
    currentFacility,
    currentEquipment,
    selectedConnections,
    onDivisionChange,
    onFacilityChange,
    onEquipmentChange,
    onAddItem,
    onRemoveConnection,
    connectionError
}) => {
    // Фильтруем объекты по выбранному подразделению
    const filteredFacilities = currentDivision 
        ? facilities.filter(facility => facility.division?.id?.toString() === currentDivision)
        : [];

    return (
        <div className="network-form-section">
            <div className="network-form-section-header">
                <h3 className="network-form-section-title">Добавление принадлежности</h3>
            </div>
            <div className="network-form-section-content">
                {connectionError && (
                    <div className="network-form-error-message">{connectionError}</div>
                )}

                <div className="network-form-group">
                    <label className="network-form-label">Выберите подразделение</label>
                    <select
                        value={currentDivision}
                        onChange={(e) => onDivisionChange(e.target.value)}
                        className="network-form-select"
                    >
                        <option value="">Выберите подразделение</option>
                        {divisions.map(division => (
                            <option key={division.id} value={division.id.toString()}>
                                {division.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="network-form-group">
                    <label className="network-form-label">Выберите объект</label>
                    <select
                        value={currentFacility}
                        onChange={(e) => onFacilityChange(e.target.value)}
                        className="network-form-select"
                        disabled={!currentDivision} // Отключаем если не выбрано подразделение
                    >
                        <option value="">Выберите объект</option>
                        {filteredFacilities.map(facility => (
                            <option key={facility.id} value={facility.id.toString()}>
                                {facility.name}
                            </option>
                        ))}
                    </select>
                    {currentDivision && filteredFacilities.length === 0 && (
                        <div className="network-form-hint">
                            Нет объектов для выбранного подразделения
                        </div>
                    )}
                </div>

                <div className="network-form-group">
                    <label className="network-form-label">Выберите технику (SHД)</label>
                    <select
                        value={currentEquipment}
                        onChange={(e) => onEquipmentChange(e.target.value)}
                        className="network-form-select"
                        disabled={!currentFacility} // Отключаем если не выбран объект
                    >
                        <option value="">Выберите технику</option>
                        {equipment.map(eq => (
                            <option key={eq.id} value={eq.id.toString()}>
                                {eq.name} ({eq.serial_number})
                            </option>
                        ))}
                    </select>
                    {currentFacility && equipment.length === 0 && (
                        <div className="network-form-hint">
                            Нет техники для выбранного объекта
                        </div>
                    )}
                </div>

                <div className="network-form-group">
                    <button
                        type="button"
                        onClick={onAddItem}
                        className="network-form-add-button"
                        disabled={!currentDivision || !currentFacility || !currentEquipment}
                    >
                        Добавить связь
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MembershipSection;