// components/facilities/communication-posts/communicationPostKind.ts
import type { CommunicationPostKind } from '../../../../../types';

/**
 * Метаданные типа поста связи.
 *
 * Иерархия:
 *   P / KP  →  PS  →  NDR
 *
 * - P  — Пост связи (верхний уровень)
 * - KP — Командно-пунктовый пост (верхний уровень)
 * - PS — Элемент поста связи (родитель: P или KP)
 * - NDR — Номер дежурного расчёта (родитель: PS, лист)
 */
export interface KindMeta {
    /** Техническое значение (совпадает с CommunicationPostKind) */
    value: CommunicationPostKind;
    /** Короткий бейдж: П / КП / ПС / НДР */
    short: string;
    /** Полное название: «Пост связи» */
    full: string;
    /** Описание для подсказки/tooltip */
    description: string;
    /** Допустимые дочерние типы */
    allowedChildren: CommunicationPostKind[];
    /** Допустимые родительские типы (пусто = верхний уровень) */
    allowedParents: CommunicationPostKind[];
    /** CSS-класс цвета бейджа */
    badgeClass: string;
    /** HEX-акцент для иконок и подсветки */
    accent: string;
}

export const COMMUNICATION_POST_KINDS: Record<CommunicationPostKind, KindMeta> = {
    P: {
        value: 'P',
        short: 'П',
        full: 'Пост связи',
        description: 'Верхний уровень иерархии. Внутри — элементы ПС.',
        allowedChildren: ['PS'],
        allowedParents: [],
        badgeClass: 'kind-badge--p',
        accent: '#1d4ed8',
    },
    KP: {
        value: 'KP',
        short: 'КП',
        full: 'Командно-пунктовый пост',
        description: 'Верхний уровень иерархии (командный пункт). Внутри — элементы ПС.',
        allowedChildren: ['PS'],
        allowedParents: [],
        badgeClass: 'kind-badge--kp',
        accent: '#7c3aed',
    },
    PS: {
        value: 'PS',
        short: 'ПС',
        full: 'Элемент поста связи',
        description: 'Входит в П или КП. Внутри — номера дежурных расчётов НДР.',
        allowedChildren: ['NDR'],
        allowedParents: ['P', 'KP'],
        badgeClass: 'kind-badge--ps',
        accent: '#0891b2',
    },
    NDR: {
        value: 'NDR',
        short: 'НДР',
        full: 'Номер дежурного расчёта',
        description: 'Листовой элемент. Входит в ПС.',
        allowedChildren: [],
        allowedParents: ['PS'],
        badgeClass: 'kind-badge--ndr',
        accent: '#059669',
    },
};

/** Порядок отображения в списках (от старшего к младшему). */
export const COMMUNICATION_POST_KIND_ORDER: CommunicationPostKind[] = ['P', 'KP', 'PS', 'NDR'];

/** Список типов для выбора корневого поста. */
export const ROOT_KIND_OPTIONS: CommunicationPostKind[] = ['P', 'KP'];

/**
 * Возвращает метаданные по типу поста.
 * Безопасно принимает строку — вернёт null, если тип неизвестен.
 */
export const getKindMeta = (
    kind: CommunicationPostKind | string | undefined | null,
): KindMeta | null => {
    if (!kind) return null;
    return COMMUNICATION_POST_KINDS[kind as CommunicationPostKind] || null;
};

/** Дочерние типы для указанного типа. */
export const getAllowedChildKinds = (
    kind: CommunicationPostKind | string | undefined | null,
): CommunicationPostKind[] => getKindMeta(kind)?.allowedChildren ?? [];

/** Родительские типы для указанного типа. */
export const getAllowedParentKinds = (
    kind: CommunicationPostKind | string | undefined | null,
): CommunicationPostKind[] => getKindMeta(kind)?.allowedParents ?? [];

/**
 * Определяет, можно ли создать дочерний пост для данного родителя.
 * Возвращает тип дочернего поста или null, если детей быть не может.
 *
 * P / KP → PS
 * PS     → NDR
 * NDR    → null
 */
export const getChildKindFor = (
    parentKind: CommunicationPostKind | string | undefined | null,
): CommunicationPostKind | null => {
    if (!parentKind) return null;
    const children = getAllowedChildKinds(parentKind);
    return children.length > 0 ? children[0] : null;
};

/** Нужен ли родитель для создания поста данного типа. */
export const kindRequiresParent = (
    kind: CommunicationPostKind | string | undefined | null,
): boolean => getAllowedParentKinds(kind).length > 0;

/** Может ли `parentKind` быть родителем для `childKind`. */
export const canBeParentOf = (
    parentKind: CommunicationPostKind | string | undefined | null,
    childKind: CommunicationPostKind | string | undefined | null,
): boolean => {
    if (!parentKind || !childKind) return false;
    return getAllowedChildKinds(parentKind).includes(childKind as CommunicationPostKind);
};