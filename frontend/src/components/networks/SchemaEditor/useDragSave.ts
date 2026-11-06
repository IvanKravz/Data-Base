import { useCallback, useRef } from 'react';
import { networksApi } from '../../../api/networksApi';
import { NetworkNodePosition } from '../../../types';

export function useDragSave(
    token: string | null,
    networkId: string | undefined,
    onSaved?: (positions: NetworkNodePosition[]) => void,
) {
    const timer = useRef<number | null>(null);
    const pending = useRef<Map<string, NetworkNodePosition>>(new Map());

    const flush = useCallback(async () => {
        if (!token || !networkId || pending.current.size === 0) return;

        const batch = Array.from(pending.current.values());
        pending.current.clear();
        if (!Array.isArray(batch) || batch.length === 0) return;

        // Отдельно ловим ошибку API — чтобы не путать с ошибкой колбэка.
        try {
            await networksApi.saveNodePositions(token, networkId, batch);
        } catch (e) {
            console.error('[useDragSave] saveNodePositions failed:', e);
            return;
        }

        // Отдельно — колбэк: если родитель бросает, это его баг, а не API.
        if (typeof onSaved === 'function') {
            try {
                onSaved(batch);
            } catch (e) {
                console.error('[useDragSave] onPositionsSaved callback failed:', e);
            }
        }
    }, [token, networkId, onSaved]);

    const schedule = useCallback((pos: NetworkNodePosition) => {
        if (!pos || pos.node_id == null || pos.x == null || pos.y == null) return;
        pending.current.set(`${pos.node_type}-${pos.node_id}`, pos);
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => { flush(); }, 700);
    }, [flush]);

    return { schedule, flush };
}