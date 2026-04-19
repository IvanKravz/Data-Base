// components/CabinetModal.tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, X, Clock, Database } from 'lucide-react';
import { ProfileTab } from './ProfileTab/ProfileTab';
import { ActivityTab } from './ActivityTab';
import { AdminPanel } from '../UserManagementPage/components/AdminPanel';
import '../styles/CabinetModal.css';

interface CabinetModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
}

export function CabinetModal({ isOpen, onClose, userData }: CabinetModalProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'admin'>('profile');

    if (!isOpen) return null;

    const isAdmin = userData?.is_staff || userData?.roles?.includes('admin');

    const modalContent = (
        <div className="cabinet-modal-overlay" onClick={onClose}>
            <div className="cabinet-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cabinet-header">
                    <div className="cabinet-header-left">
                        <User className="cabinet-title-icon" />
                        <div>
                            <h2 className="cabinet-title">Личный кабинет</h2>
                            <p className="cabinet-subtitle">Управление профилем и настройками</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="cabinet-close-btn"
                        aria-label="Закрыть"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="cabinet-tabs">
                    <button
                        className={`cabinet-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User className="w-4 h-4" />
                        <span>Профиль</span>
                    </button>
                    <button
                        className={`cabinet-tab ${activeTab === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        <Clock className="w-4 h-4" />
                        <span>Активность</span>
                    </button>
                    {isAdmin && (
                        <button
                            className={`cabinet-tab ${activeTab === 'admin' ? 'active' : ''}`}
                            onClick={() => setActiveTab('admin')}
                        >
                            <Database className="w-4 h-4" />
                            <span>Администрирование</span>
                        </button>
                    )}
                </div>

                <div className="cabinet-content">
                    {activeTab === 'profile' && <ProfileTab userData={userData} />}
                    {activeTab === 'activity' && <ActivityTab />}
                    {activeTab === 'admin' && <AdminPanel />}
                </div>
            </div>
        </div>
    );

    const modalRoot = document.getElementById('modal-root') || document.body;
    return createPortal(modalContent, modalRoot);
}