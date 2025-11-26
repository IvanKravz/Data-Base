import React from 'react';
import { Equipment, EquipmentFieldPermissions } from '../../../../../types';
import { Shield } from 'lucide-react';
import '../style.css';

interface AdditionalInfoProps {
    formData: Partial<Equipment>;
    onChange: (data: Partial<Equipment>) => void;
    interestOrgans: any[];
    isDisposed?: boolean;
    permissions: EquipmentFieldPermissions;
}

export function AdditionalInfo({
    formData,
    onChange,
    interestOrgans,
    isDisposed = false,
    permissions
}: AdditionalInfoProps) {
    const handleFreeUseChange = (checked: boolean) => {
        if (!permissions.canEditFreeUse) return;
        
        const newData: Partial<Equipment> = {
            is_free_use: checked,
            // Если снимаем галочку, очищаем номер акта
            ...(checked ? {} : { free_use_act_number: '' })
        };
        onChange(newData);
    };

    // Исправление: Обработчик изменения степени секретности
    const handleSecretLevelChange = (value: string) => {
        if (!permissions.canEditSecretLevel) return;
        // Отправляем null вместо пустой строки
        onChange({ secret_level: value === '' ? null : value });
    };

    return (
        <div className="equipment-card-edit">
            <div className="equipment-card-header">
                <Shield size={20} />
                <h3 className="equipment-card-title">Дополнительная информация</h3>
            </div>
            <div className="equipment-card-content-edit">
                <div className="equipment-form-group">
                    <label className="form-label">Степень секретности</label>
                    <select
                        value={formData.secret_level || ''}
                        onChange={(e) => handleSecretLevelChange(e.target.value)}
                        className="form-select"
                        disabled={isDisposed || !permissions.canEditSecretLevel}
                    >
                        <option value="">Не выбрано</option>
                        <option value="OV">ОВ</option>
                        <option value="SS">СС</option>
                        <option value="SECRET">Секретно</option>
                        <option value="DSP">ДСП</option>
                    </select>
                </div>

                <div className="equipment-form-group">
                    <label className="form-label">В чьих интересах эксплуатируется</label>
                    <select
                        value={formData.interest_organ?.id || ''}
                        onChange={(e) => {
                            if (!permissions.canEditInterestOrgan) return;
                            const organId = e.target.value;
                            const selectedOrgan = interestOrgans.find(org => org.id.toString() === organId);
                            onChange({ interest_organ: selectedOrgan || null });
                        }}
                        className="form-select"
                        disabled={isDisposed || !permissions.canEditInterestOrgan}
                    >
                        <option value="">Не выбрано</option>
                        {interestOrgans.map(organ => (
                            <option key={organ.id} value={organ.id}>
                                {organ.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="equipment-form-group">
                    <div className="checkbox-container">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={formData.is_free_use || false}
                                onChange={(e) => handleFreeUseChange(e.target.checked)}
                                disabled={isDisposed || !permissions.canEditFreeUse}
                            />
                            <span className="checkbox-label-text">Выдана в безвозмездное пользование</span>
                        </label>
                    </div>
                </div>

                {formData.is_free_use && (
                    <div className="equipment-form-group">
                        <label className="form-label">
                            Номер акта приема-передачи 
                            <span style={{color: 'var(--danger)', marginLeft: '4px'}}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.free_use_act_number || ''}
                            onChange={(e) => onChange({ free_use_act_number: e.target.value })}
                            className="form-input-edit"
                            placeholder="Введите номер акта"
                            disabled={isDisposed || !permissions.canEditFreeUse}
                            required
                        />
                    </div>
                )}
            </div>
        </div>
    );
}