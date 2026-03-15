import React from 'react';
import { Shield } from 'lucide-react';

interface PermissionsDetailsProps {
    groupedModels: Record<string, Record<string, any>>;
    selectedModule: string | null;
    filteredModels: Record<string, any>;
    moduleSections: Record<string, any>;
    getModuleDisplayName: (module: string) => string;
    getModelDisplayName: (model: string) => string;
    getActionDisplayName: (action: string) => string;
    getActionIcon: (action: string) => React.ReactNode;
}

export const PermissionsDetails: React.FC<PermissionsDetailsProps> = ({
    groupedModels,
    selectedModule,
    filteredModels,
    moduleSections,
    getModuleDisplayName,
    getModelDisplayName,
    getActionDisplayName,
    getActionIcon,
}) => {
    return (
        <div className="cabinet-form-section permissions-details-section">
            <div className="form-section-header">
                <h4 className="form-section-title">
                    <Shield className="w-5 h-5 mr-2" />
                    {selectedModule
                        ? `Детальные разрешения: ${getModuleDisplayName(selectedModule)}`
                        : 'Детальные разрешения'}
                </h4>
            </div>
            <div className="permissions-table-container">
                {selectedModule ? (
                    moduleSections[selectedModule]?.map((section: any) => {
                        const sectionModels = Object.entries(filteredModels).filter(([model]) =>
                            section.models.includes(model)
                        );
                        if (sectionModels.length === 0) return null;
                        return (
                            <div key={section.id} className="profile-tab-permissions-section">
                                <h5 className="profile-tab-section-title">{section.name}</h5>
                                <table className="permissions-table">
                                    <tbody>
                                        {sectionModels.map(([model, actions]) => (
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
                        );
                    })
                ) : (
                    Object.entries(groupedModels).map(([module, models]) => {
                        if (module === 'other') {
                            return (
                                <div key="other" className="profile-tab-permissions-section">
                                    <h5 className="profile-tab-section-title">Прочие модели</h5>
                                    <table className="permissions-table">
                                        <tbody>
                                            {Object.entries(models).map(([model, actions]) => (
                                                <tr key={model} className="permission-row">
                                                    <td className="permission-model">{getModelDisplayName(model)}</td>
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
                            );
                        }
                        const sections = moduleSections[module] || [];
                        return sections.map((section: any) => {
                            const sectionModels = Object.entries(models).filter(([model]) =>
                                section.models.includes(model)
                            );
                            if (sectionModels.length === 0) return null;
                            return (
                                <div key={`${module}-${section.id}`} className="profile-tab-permissions-section">
                                    <h5 className="profile-tab-section-title">
                                        {getModuleDisplayName(module)} — {section.name}
                                    </h5>
                                    <table className="permissions-table">
                                        <tbody>
                                            {sectionModels.map(([model, actions]) => (
                                                <tr key={model} className="permission-row">
                                                    <td className="permission-model">{getModelDisplayName(model)}</td>
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
                            );
                        });
                    })
                )}
                {Object.keys(groupedModels).length === 0 && (
                    <div className="text-center py-4 text-gray-500">Нет данных о разрешениях</div>
                )}
            </div>
        </div>
    );
};