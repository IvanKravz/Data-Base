import React from 'react';

interface NetworkActionsProps {
    saving: boolean;
    onCancel: () => void;
    submitText?: string;
}

const NetworkActions: React.FC<NetworkActionsProps> = ({ saving, onCancel, submitText = 'Сохранить изменения' }) => {
    return (
        <div className="network-form-actions">
            <button
                type="button"
                className="network-form-cancel-button"
                onClick={onCancel}
            >
                Отмена
            </button>
            <button
                type="submit"
                className="network-form-save-button"
                disabled={saving}
            >
                {saving ? 'Сохранение...' : submitText}
            </button>
        </div>
    );
};

export default NetworkActions;