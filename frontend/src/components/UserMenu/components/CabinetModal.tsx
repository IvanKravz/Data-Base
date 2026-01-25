// components/CabinetModal.tsx
import React, { useState } from 'react';
import { User, X, Clock } from 'lucide-react';
import { ProfileTab } from './ProfileTab';
import { ActivityTab } from './ActivityTab';
import '../styles/CabinetModal.css';

interface CabinetModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
}

export function CabinetModal({ isOpen, onClose, userData }: CabinetModalProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile');

    if (!isOpen) return null;

    return (
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
                </div>

                <div className="cabinet-content">
                    {activeTab === 'profile' ? (
                        <ProfileTab userData={userData} />
                    ) : (
                        <ActivityTab />
                    )}
                </div>
            </div>
        </div>
    );
}