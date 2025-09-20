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
    onDivisionChange,
    onFacilityChange,
    onEquipmentChange,
    onAddItem,
    connectionError
}) => {
    return (
        <div className="network-form-section">
            <h3 className="network-form-section-title">Добавление принадлежности</h3>

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
                >
                    <option value="">Выберите объект</option>
                    {facilities.map(facility => (
                        <option key={facility.id} value={facility.id.toString()}>
                            {facility.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="network-form-group">
                <label className="network-form-label">Выберите технику (SHД)</label>
                <select
                    value={currentEquipment}
                    onChange={(e) => onEquipmentChange(e.target.value)}
                    className="network-form-select"
                >
                    <option value="">Выберите технику</option>
                    {equipment.map(eq => (
                        <option key={eq.id} value={eq.id.toString()}>
                            {eq.name} ({eq.serial_number})
                        </option>
                    ))}
                </select>
            </div>

            <div className="network-form-group">
                <button
                    type="button"
                    onClick={onAddItem}
                    className="network-form-add-button"
                >
                    Добавить связь
                </button>
            </div>
        </div>
    );
};

export default MembershipSection;