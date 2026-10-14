// components/AdminModal.tsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, X } from 'lucide-react';
import { AdminPanel } from '../UserManagementPage/components/AdminPanel';
import '../styles/AdminModal.css';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
    // Escape + блокировка скролла body
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <div className="admin-modal-header-left">
                        <Shield className="admin-modal-title-icon" />
                        <div>
                            <h2 className="admin-modal-title">Администрирование</h2>
                            <p className="admin-modal-subtitle">
                                Управление системными данными и резервными копиями
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="admin-modal-close-btn"
                        aria-label="Закрыть"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="admin-modal-content">
                    <AdminPanel />
                </div>
            </div>
        </div>
    );

    const modalRoot = document.getElementById('modal-root') || document.body;
    return createPortal(modalContent, modalRoot);
}