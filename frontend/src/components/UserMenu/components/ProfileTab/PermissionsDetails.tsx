import React, { useMemo } from 'react';
import { Shield } from 'lucide-react';

interface PermissionsDetailsProps {
    groupedModels: Record<string, Record<string, any>>;
    selectedModule: string | null;
    moduleSections: Record<string, any>; // оставлен для совместимости, но не используется
    getModuleDisplayName: (module: string) => string;
    getModelDisplayName: (model: string) => string;
    getActionDisplayName: (action: string) => string;
    getActionIcon: (action: string) => React.ReactNode;
}

export const PermissionsDetails = React.memo<PermissionsDetailsProps>(({
    groupedModels,
    selectedModule,
    getModuleDisplayName,
    getModelDisplayName,
    getActionDisplayName,
    getActionIcon,
}) => {
    // Формируем список секций (один модуль = одна секция)
    const sections = useMemo(() => {
        if (selectedModule) {
            // Показываем только выбранный модуль
            const models = groupedModels[selectedModule] || {};
            const entries = Object.entries(models);
            if (entries.length === 0) return [];
            return [{
                id: selectedModule,
                name: getModuleDisplayName(selectedModule),
                models: entries,
            }];
        } else {
            // Показываем все модули
            const allSections: any[] = [];
            Object.entries(groupedModels).forEach(([module, models]) => {
                const entries = Object.entries(models);
                if (entries.length === 0) return;
                allSections.push({
                    id: module,
                    name: getModuleDisplayName(module),
                    models: entries,
                });
            });
            return allSections;
        }
    }, [selectedModule, groupedModels, getModuleDisplayName]);

    if (Object.keys(groupedModels).length === 0) {
        return (
            <div className="cabinet-form-section permissions-details-section" key="empty">
                <div className="form-section-header">
                    <h4 className="form-section-title">
                        <Shield className="w-5 h-5 mr-2" />
                        Детальные разрешения
                    </h4>
                </div>
                <div className="permissions-table-container">
                    <div className="text-center py-4 text-gray-500">Нет данных о разрешениях</div>
                </div>
            </div>
        );
    }

    if (sections.length === 0) {
        return (
            <div className="cabinet-form-section permissions-details-section" key="no-data">
                <div className="form-section-header">
                    <h4 className="form-section-title">
                        <Shield className="w-5 h-5 mr-2" />
                        {selectedModule
                            ? `Детальные разрешения: ${getModuleDisplayName(selectedModule)}`
                            : 'Детальные разрешения'}
                    </h4>
                </div>
                <div className="permissions-table-container">
                    <div className="text-center py-4 text-gray-500">Нет моделей для отображения</div>
                </div>
            </div>
        );
    }

    return (
        <div className="cabinet-form-section permissions-details-section" key={selectedModule || 'all'}>
            <div className="form-section-header">
                <h4 className="form-section-title">
                    <Shield className="w-5 h-5 mr-2" />
                    {selectedModule
                        ? `Детальные разрешения: ${getModuleDisplayName(selectedModule)}`
                        : 'Детальные разрешения'}
                </h4>
            </div>
            <div className="permissions-table-container">
                {sections.map((section) => (
                    <div key={section.id} className="profile-tab-permissions-section">
                        {/* Показываем заголовок модуля только если показываем все модули */}
                        {!selectedModule && (
                            <h5 className="profile-tab-section-title">{section.name}</h5>
                        )}
                        <table className="permissions-table">
                            <tbody>
                                {section.models.map(([model, actions]: [string, any]) => (
                                    <tr key={model} className="permission-row">
                                        <td className="permission-model">
                                            <div className="permission-model-name">{getModelDisplayName(model)}</div>
                                        </td>
                                        <td className="permission-actions">
                                            <div className="actions-container">
                                                {Array.isArray(actions) &&
                                                    actions.map((action: string) => (
                                                        <div key={action} className="action-badge">
                                                            {getActionIcon(action)}
                                                            <span>{getActionDisplayName(action)}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
});