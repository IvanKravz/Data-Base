import React from 'react';

interface NetworkActionsProps {
    saving: boolean;
    onCancel: () => void;
}

const NetworkActions: React.FC<NetworkActionsProps> = ({ saving, onCancel }) => {
    return (
        <div className="edit-network-actions">
            <button
                type="button"
                className="edit-network-cancel-button"
                onClick={onCancel}
            >
                Отмена
            </button>
            <button
                type="submit"
                className="edit-network-save-button"
                disabled={saving}
            >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
        </div>
    );
};

export default NetworkActions;