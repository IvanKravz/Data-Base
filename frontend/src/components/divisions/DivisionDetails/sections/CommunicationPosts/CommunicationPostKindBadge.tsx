// components/facilities/communication-posts/CommunicationPostKindBadge.tsx
import React from 'react';
import type { CommunicationPostKind } from '../../../../../types';
import { getKindMeta } from './communicationPostKind';
import './styles/CommunicationPostKindBadge.css';

interface CommunicationPostKindBadgeProps {
    /** Тип поста: P / KP / PS / NDR */
    kind: CommunicationPostKind | string;
    /** Показывать полное название рядом с коротким */
    showFull?: boolean;
    /** Размер бейджа */
    size?: 'sm' | 'md' | 'lg';
    /** Включить tooltip с описанием */
    tooltip?: boolean;
    className?: string;
}

export function CommunicationPostKindBadge({
    kind,
    showFull = false,
    size = 'md',
    tooltip = true,
    className = '',
}: CommunicationPostKindBadgeProps) {
    const meta = getKindMeta(kind);
    if (!meta) return null;

    const title = tooltip ? `${meta.full}. ${meta.description}` : undefined;

    return (
        <span
            className={`kind-badge kind-badge--${size} ${meta.badgeClass} ${className}`.trim()}
            title={title}
            aria-label={meta.full}
        >
            <span className="kind-badge__short">{meta.short}</span>
            {showFull && <span className="kind-badge__full">{meta.full}</span>}
        </span>
    );
}