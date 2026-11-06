import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    onClose: () => void;
    disabled?: boolean;
}

/**
 * Универсальная обёртка модального окна схемы.
 * Рендерится через React Portal в document.body, чтобы никакой
 * `overflow: hidden` / `transform` / `position: relative` родителя
 * не влиял на положение и не «прижимал» окно к углу контейнера.
 */
export const SchemaModal: React.FC<Props> = ({
    title, icon, children, footer, onClose, disabled,
}) => {
    const handleBackdrop = (e: React.MouseEvent) => {
        if (disabled) return;
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <div
            className="schema-modal-backdrop"
            onClick={handleBackdrop}
            role="dialog"
            aria-modal="true"
        >
            <div className="schema-modal" onClick={e => e.stopPropagation()}>
                <div className="schema-modal__header">
                    {icon && <span className="schema-modal__icon">{icon}</span>}
                    <h3 className="schema-modal__title">{title}</h3>
                    <button
                        type="button"
                        className="schema-modal__close"
                        onClick={onClose}
                        aria-label="Закрыть"
                        disabled={disabled}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="schema-modal__body">{children}</div>
                {footer && <div className="schema-modal__footer">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
};