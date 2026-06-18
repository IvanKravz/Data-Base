// QualityTabContent.tsx
import React from 'react';
import { Employee } from '../../../types';
import {
    BasicInfoCard as QualBasicInfoCard,
    WorkExperienceCard,
    SecurityClearanceCard,
    EducationCard,
} from '../QualitativeCharacteristics/sections';
import './QualityTabContent.css';

export type QualSubTabId = 'basic' | 'work' | 'security' | 'education';

interface QualityTabContentProps {
    person: Employee;
    isEditing: boolean;
    formData: Partial<Employee>;
    canEdit: boolean;
    onChange: (field: keyof Employee, value: string) => void;
    activeSubTab: QualSubTabId;
    onSubTabChange: (tab: QualSubTabId) => void;
    searchTerm?: string;
}

export function QualityTabContent({
    person,
    isEditing,
    formData,
    canEdit,
    onChange,
    activeSubTab,
    onSubTabChange,
    searchTerm = '',
}: QualityTabContentProps) {
    const renderSubTabContent = () => {
        switch (activeSubTab) {
            case 'basic':
                return isEditing ? (
                    <QualBasicInfoCard formData={formData} onChange={onChange} viewMode={false} canEdit={canEdit} searchTerm={searchTerm} />
                ) : (
                    <QualBasicInfoCard employee={person} viewMode canEdit={canEdit} searchTerm={searchTerm} />
                );
            case 'work':
                return isEditing ? (
                    <WorkExperienceCard formData={formData} onChange={onChange} viewMode={false} canEdit={canEdit} searchTerm={searchTerm} />
                ) : (
                    <WorkExperienceCard employee={person} viewMode canEdit={canEdit} searchTerm={searchTerm} />
                );
            case 'security':
                return isEditing ? (
                    <SecurityClearanceCard formData={formData} onChange={onChange} viewMode={false} canEdit={canEdit} searchTerm={searchTerm} />
                ) : (
                    <SecurityClearanceCard employee={person} viewMode canEdit={canEdit} searchTerm={searchTerm} />
                );
            case 'education':
                return isEditing ? (
                    <EducationCard formData={formData} onChange={onChange} viewMode={false} canEdit={canEdit} searchTerm={searchTerm} />
                ) : (
                    <EducationCard employee={person} viewMode canEdit={canEdit} searchTerm={searchTerm} />
                );
            default:
                return null;
        }
    };

    return (
        <div className="qc-tab-content">
            <div className="qc-sub-tabs">
                <button
                    className={`qc-sub-tab ${activeSubTab === 'basic' ? 'active' : ''}`}
                    onClick={() => onSubTabChange('basic')}
                >
                    Основная информация
                </button>
                <button
                    className={`qc-sub-tab ${activeSubTab === 'work' ? 'active' : ''}`}
                    onClick={() => onSubTabChange('work')}
                >
                    Стаж работы
                </button>
                <button
                    className={`qc-sub-tab ${activeSubTab === 'security' ? 'active' : ''}`}
                    onClick={() => onSubTabChange('security')}
                >
                    Допуск к ГТ
                </button>
                <button
                    className={`qc-sub-tab ${activeSubTab === 'education' ? 'active' : ''}`}
                    onClick={() => onSubTabChange('education')}
                >
                    Образование
                </button>
            </div>

            <div className="qc-sub-content">{renderSubTabContent()}</div>
        </div>
    );
}