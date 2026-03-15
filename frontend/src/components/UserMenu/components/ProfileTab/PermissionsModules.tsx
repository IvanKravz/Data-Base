import React from 'react';
import { Shield } from 'lucide-react';

interface PermissionsModulesProps {
    modules: string[];
    selectedModule: string | null;
    onModuleClick: (module: string) => void;
    getModuleDisplayName: (module: string) => string;
    getModuleIcon: (module: string) => React.ReactNode;
}

export const PermissionsModules: React.FC<PermissionsModulesProps> = ({
    modules,
    selectedModule,
    onModuleClick,
    getModuleDisplayName,
    getModuleIcon,
}) => {
    return (
        <div className="cabinet-form-section permissions-modules-section">
            <div className="form-section-header">
                <h4 className="form-section-title">
                    <Shield className="w-5 h-5 mr-2" />
                    Доступные модули
                </h4>
                {selectedModule && (
                    <button
                        onClick={() => onModuleClick(selectedModule)} // при клике на "Показать все" сбрасываем
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Показать все
                    </button>
                )}
            </div>
            <div className="modules-grid">
                {modules.map((module, index) => (
                    <div
                        key={index}
                        className={`module-card ${selectedModule === module ? 'module-card-selected' : ''}`}
                        onClick={() => onModuleClick(module)}
                        title={`Нажмите для просмотра разрешений модуля "${getModuleDisplayName(module)}"`}
                    >
                        <div className="module-icon-container">{getModuleIcon(module)}</div>
                        <span className="module-name">{getModuleDisplayName(module)}</span>
                        {selectedModule === module && <div className="module-selected-indicator"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};