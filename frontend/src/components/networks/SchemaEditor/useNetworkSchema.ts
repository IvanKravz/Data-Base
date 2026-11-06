import { useCallback, useEffect, useRef, useState } from 'react';
import { networksApi } from '../../../api/networksApi';
import { NetworkNodePosition, NetworkSchemaPayload } from '../../../types';

export type LayoutMode = 'auto' | 'saved';

/** Сентинел для «ещё не перетащенного» явно добавленного узла. */
export const EXPLICIT_SENTINEL = -99999;

export function useNetworkSchema(
    token: string | null,
    networkId: string | undefined,
) {
    const [data, setData] = useState<NetworkSchemaPayload | null>(null);

    // `loading` — только для ПЕРВОЙ загрузки конкретной сети.
    // SchemaEditor монтируется один раз и при reload больше не размонтируется.
    const [loading, setLoading] = useState(false);

    // `refreshing` — фоновое обновление (add/remove). Родитель может
    // показать небольшой индикатор, не скрывая SchemaEditor.
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Для какой сети initial load уже завершён. Пока ref != текущего
    // networkId — это initial load; после — все reload'ы идут «тихо».
    const loadedNetworkRef = useRef<string | null>(null);

    const reload = useCallback(async () => {
        if (!token || !networkId) return;
        const key = String(networkId);
        const isInitial = loadedNetworkRef.current !== key;

        try {
            if (isInitial) setLoading(true);
            else setRefreshing(true);
            setError(null);

            const payload = await networksApi.getNetworkSchema(token, networkId);

            setData({
                ...payload,
                memberships: Array.isArray(payload?.memberships) ? payload.memberships : [],
                directions: Array.isArray(payload?.directions) ? payload.directions : [],
                positions: Array.isArray(payload?.positions) ? payload.positions : [],
                counts: {
                    interfaces: payload?.counts?.interfaces ?? {},
                    ip_addresses: payload?.counts?.ip_addresses ?? {},
                },
                ...({
                    explicit_divisions: Array.isArray((payload as any)?.explicit_divisions)
                        ? (payload as any).explicit_divisions : [],
                    explicit_facilities: Array.isArray((payload as any)?.explicit_facilities)
                        ? (payload as any).explicit_facilities : [],
                } as any),
            });

            loadedNetworkRef.current = key;
        } catch (e: any) {
            setError(e?.message || 'Не удалось загрузить схему');
        } finally {
            if (isInitial) setLoading(false);
            else setRefreshing(false);
        }
    }, [token, networkId]);

    useEffect(() => { reload(); }, [reload]);

    /** Точечно обновляет payload.positions после drag-and-drop. */
    const patchPositions = useCallback((positions?: NetworkNodePosition[]) => {
        if (!Array.isArray(positions) || positions.length === 0) return;

        setData(prev => {
            if (!prev) return prev;

            const base: NetworkNodePosition[] = Array.isArray(prev.positions)
                ? prev.positions
                : [];

            const incoming = new Map<string, NetworkNodePosition>(
                positions.map(p => [`${p.node_type}-${p.node_id}`, p]),
            );

            const nextPositions: NetworkNodePosition[] = base.map(p => {
                const u = incoming.get(`${p.node_type}-${p.node_id}`);
                return u ? { ...p, x: u.x, y: u.y } : p;
            });

            const existing = new Set(
                nextPositions.map(p => `${p.node_type}-${p.node_id}`),
            );

            positions.forEach(p => {
                const k = `${p.node_type}-${p.node_id}`;
                if (!existing.has(k)) {
                    nextPositions.push(p);
                    existing.add(k);
                }
            });

            return { ...prev, positions: nextPositions };
        });
    }, []);

    return { data, loading, refreshing, error, reload, patchPositions };
}

/**
 * Авто-лейаут по типу узла (компактный вариант):
 *  division: горизонтальная линия
 *  facility: под своим division
 *  equipment: под своим facility
 * Детерминирован (по id), чтобы узлы не «прыгали».
 */
export interface HierarchyPosition {
    node_type: 'division' | 'facility' | 'equipment';
    node_id: number;
    x: number;
    y: number;
    parent_type?: 'division' | 'facility';
    parent_id?: number;
    width?: number;
    height?: number;
}

const EQ_W = 130;
const EQ_H = 58;
const EQ_GAP = 12;
const FAC_HEADER = 32;
const DIV_HEADER = 36;
const PAD = 12;

const MIN_FAC_W = 240;
const MIN_FAC_H = 130;
const MIN_CELL_H = 130;

export const MIN_CELL_W = 240;
export const DIV_GAP = 40;
export const CANVAS_OFFSET = 20;

export function buildAutoLayout(payload: NetworkSchemaPayload | null): HierarchyPosition[] {
    if (!payload) return [];

    const memberships = Array.isArray(payload.memberships) ? payload.memberships : [];
    const explicitDivs: any[] = ((payload as any).explicit_divisions as any[]) || [];
    const explicitFacs: any[] = ((payload as any).explicit_facilities as any[]) || [];

    const divMap = new Map<number, { division: any; facilityIds: Set<number> }>();
    const facMap = new Map<number, { facility: any; divId?: number; equipIds: Set<number> }>();

    memberships.forEach(m => {
        if (m.division && !divMap.has(m.division.id)) {
            divMap.set(m.division.id, { division: m.division, facilityIds: new Set() });
        }
        if (m.facility && !facMap.has(m.facility.id)) {
            facMap.set(m.facility.id, {
                facility: m.facility,
                divId: m.division?.id,
                equipIds: new Set(),
            });
            if (m.division) divMap.get(m.division.id)?.facilityIds.add(m.facility.id);
        }
        if (m.equipment && m.facility) {
            facMap.get(m.facility.id)?.equipIds.add(m.equipment.id);
        }
    });

    // Пустые подразделения
    explicitDivs.forEach((d: any) => {
        if (!divMap.has(d.id)) {
            divMap.set(d.id, { division: d, facilityIds: new Set() });
        }
    });

    // Пустые объекты
    explicitFacs.forEach((f: any) => {
        if (!facMap.has(f.id)) {
            facMap.set(f.id, {
                facility: f,
                divId: f.division_id,
                equipIds: new Set(),
            });
            if (f.division_id && divMap.has(f.division_id)) {
                divMap.get(f.division_id)!.facilityIds.add(f.id);
            }
        }
    });

    const positions: HierarchyPosition[] = [];

    const divisions = Array.from(divMap.values())
        .sort((a, b) => a.division.id - b.division.id);

    let cursorX = CANVAS_OFFSET;
    const cursorY = CANVAS_OFFSET;

    divisions.forEach(div => {
        const facIds = Array.from(div.facilityIds).sort((a, b) => a - b);

        const facSizes = new Map<number, { w: number; h: number }>();
        facIds.forEach(fId => {
            const fe = facMap.get(fId);
            if (!fe) return;
            const eqCount = fe.equipIds.size;
            const cols = Math.min(2, Math.max(1, eqCount));
            const rows = Math.ceil(eqCount / 2) || 1;
            const w = Math.max(MIN_FAC_W, PAD * 2 + cols * EQ_W + (cols - 1) * EQ_GAP);
            const h = Math.max(MIN_FAC_H, FAC_HEADER + PAD * 2 + rows * EQ_H + (rows - 1) * EQ_GAP);
            facSizes.set(fId, { w, h });
        });

        const facCols = Math.min(2, facIds.length) || 1;
        const facRows = Math.ceil(facIds.length / facCols) || 1;
        const colWidths: number[] = [];
        for (let c = 0; c < facCols; c++) {
            colWidths[c] = Math.max(
                MIN_CELL_W,
                ...facIds
                    .filter((_, i) => i % facCols === c)
                    .map(fId => facSizes.get(fId)?.w ?? MIN_CELL_W),
            );
        }
        const rowHeights: number[] = [];
        for (let r = 0; r < facRows; r++) {
            rowHeights[r] = Math.max(
                MIN_CELL_H,
                ...facIds
                    .slice(r * facCols, (r + 1) * facCols)
                    .map(fId => facSizes.get(fId)?.h ?? MIN_CELL_H),
            );
        }

        const divW =
            PAD * 2 + colWidths.reduce((a, b) => a + b, 0) + (facCols - 1) * PAD;
        const divH =
            DIV_HEADER +
            PAD * 2 +
            rowHeights.reduce((a, b) => a + b, 0) +
            (facRows - 1) * PAD;

        positions.push({
            node_type: 'division',
            node_id: div.division.id,
            x: cursorX,
            y: cursorY,
            width: divW,
            height: divH,
        });

        facIds.forEach((fId, idx) => {
            const col = idx % facCols;
            const row = Math.floor(idx / facCols);
            const colOffset = colWidths.slice(0, col).reduce((a, b) => a + b, 0);
            const rowOffset = rowHeights.slice(0, row).reduce((a, b) => a + b, 0);
            const fe = facMap.get(fId);
            const size = facSizes.get(fId);
            if (!fe || !size) return;

            positions.push({
                node_type: 'facility',
                node_id: fId,
                x: PAD + colOffset,
                y: DIV_HEADER + PAD + rowOffset,
                parent_type: 'division',
                parent_id: div.division.id,
                width: size.w,
                height: size.h,
            });

            const eqIds = Array.from(fe.equipIds).sort((a, b) => a - b);
            eqIds.forEach((eId, eIdx) => {
                const eCol = eIdx % 2;
                const eRow = Math.floor(eIdx / 2);
                positions.push({
                    node_type: 'equipment',
                    node_id: eId,
                    x: PAD + eCol * (EQ_W + EQ_GAP),
                    y: FAC_HEADER + PAD + eRow * (EQ_H + EQ_GAP),
                    parent_type: 'facility',
                    parent_id: fId,
                });
            });
        });

        cursorX += divW + DIV_GAP;
    });

    return positions;
}

/**
 * Мержим сохранённые x/y поверх auto.
 * Если сохранённые координаты — SENTINEL (узел не перетаскивали
 * или он был «удалён» с is_explicit: false), берём auto-позицию.
 */
export function mergePositions(
    payload: NetworkSchemaPayload | null,
    autoFallback: HierarchyPosition[],
): HierarchyPosition[] {
    if (!payload) return autoFallback;

    const saved = new Map<string, { x: number; y: number }>();
    (Array.isArray(payload.positions) ? payload.positions : []).forEach((p: any) => {
        saved.set(`${p.node_type}-${p.node_id}`, { x: p.x, y: p.y });
    });

    return autoFallback.map(p => {
        const key = `${p.node_type}-${p.node_id}`;
        const s = saved.get(key);
        if (!s) return p;

        // Не перетаскивали / удалили → авто-позиция.
        if (s.x === EXPLICIT_SENTINEL && s.y === EXPLICIT_SENTINEL) {
            return p;
        }
        return { ...p, x: s.x, y: s.y };
    });
}