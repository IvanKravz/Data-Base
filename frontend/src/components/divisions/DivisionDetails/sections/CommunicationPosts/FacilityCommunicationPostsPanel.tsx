// components/divisions/DivisionDetails/sections/CommunicationPosts/FacilityCommunicationPostsPanel.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileDown, FileImage, Plus, RefreshCw, SatelliteDish } from 'lucide-react';
import type { CommunicationPost, Facility } from '../../../../../types';
import { communicationPostsApi, facilitiesApi } from '../../../../../api';
import { AddCommunicationPostForm } from './AddCommunicationPostForm';
import { EditCommunicationPostForm } from './EditCommunicationPostForm';
import { PostCard } from './PostCard';
import type { TreeNode } from './PostCard';
import { exportPostsTreeToPdf } from './exportPostsTreeToPdf';
import { exportPostsTreeToSvg } from './exportPostsTreeToSvg';
import './styles/FacilityCommunicationPostsPanel.css';

export type { TreeNode } from './PostCard';

interface FacilityCommunicationPostsPanelProps {
  token: string;
  facility?: Facility | null;
  divisionId?: string | null;
  subdivisionId?: string | null;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onChanged?: () => void;
  title?: string;
}

type AddContext =
  | { type: 'root' }
  | { type: 'child'; parent: TreeNode };

/** Приводит ID (строка / число / объект) к строке. */
function extractId(value: any): string {
  if (value == null) return '';
  if (typeof value === 'object') return value.id != null ? String(value.id) : '';
  return String(value);
}

/** Признак корневого поста. */
function isRootPost(p: CommunicationPost): boolean {
  return !(p.parent?.id ?? (p as any).parent_id);
}

/** Сортировка: сначала по числу после последнего дефиса, затем натурально. */
function extractTailNumber(name: string): number {
  const m = name.match(/(\d+)(?!.*\d)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

function comparePostNames(a: string, b: string): number {
  const aNum = extractTailNumber(a);
  const bNum = extractTailNumber(b);
  if (aNum !== bNum) return aNum - bNum;
  return a.localeCompare(b, 'ru', { numeric: true });
}

export function FacilityCommunicationPostsPanel({
  token,
  facility = null,
  divisionId: divisionIdProp = null,
  subdivisionId: subdivisionIdProp = null,
  canAdd = false,
  canEdit = false,
  canDelete = false,
  onChanged,
  title = 'Посты связи',
}: FacilityCommunicationPostsPanelProps) {
  const [allPosts, setAllPosts] = useState<CommunicationPost[]>([]);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingSvg, setExportingSvg] = useState(false);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [addContext, setAddContext] = useState<AddContext | null>(null);

  const pendingRootSnapshotRef = useRef<Set<string> | null>(null);

  const isFacilityMode = Boolean(facility);

  const divisionId = useMemo(() => {
    if (divisionIdProp) return String(divisionIdProp);
    if (facility) return extractId((facility as any).division);
    return '';
  }, [divisionIdProp, facility]);

  const subdivisionId = useMemo(() => {
    if (subdivisionIdProp) return String(subdivisionIdProp);
    if (facility) {
      const sub = (facility as any).subdivision;
      return sub == null ? undefined : extractId(sub) || undefined;
    }
    return undefined;
  }, [subdivisionIdProp, facility]);

  // ===== Загрузка постов =====
  const fetchPosts = useCallback(async (): Promise<CommunicationPost[]> => {
    if (!token) return [];
    setLoading(true);
    setError(null);
    try {
      const params: any = { token };
      if (divisionId) params.division = divisionId;
      if (subdivisionId) params.subdivision = subdivisionId;

      const posts = await communicationPostsApi.getCommunicationPosts(params);
      setAllPosts(posts);
      return posts;
    } catch (e) {
      console.error('Failed to load communication posts:', e);
      setError('Не удалось загрузить посты связи');
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, divisionId, subdivisionId]);

  // ===== Загрузка объектов (глобальный / подразделенческий режим) =====
  const fetchFacilities = useCallback(async () => {
    if (facility || !token) return;
    try {
      const params: any = { token };
      if (divisionId) params.division = divisionId;
      if (subdivisionId) params.subdivision = subdivisionId;
      const facs = await facilitiesApi.getFacilities(params);
      setAllFacilities(facs);
    } catch (e) {
      console.error('Failed to load facilities for post cards:', e);
      setAllFacilities([]);
    }
  }, [facility, token, divisionId, subdivisionId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // ===== ID постов, привязанных к объекту =====
  const facilityPostIds = useMemo<Set<string> | null>(() => {
    if (!facility) return null;
    const raw: any[] = (facility as any).communication_posts || [];
    return new Set(raw.map((p: any) => extractId(p)));
  }, [facility]);

  // ===== Набор включённых ID =====
  const includeIds = useMemo(() => {
    if (!facilityPostIds) {
      return new Set(allPosts.map(p => String(p.id)));
    }
    const set = new Set<string>(facilityPostIds);
    if (set.size === 0) return set;
    let changed = true;
    while (changed) {
      changed = false;
      allPosts.forEach(p => {
        if (set.has(String(p.id))) return;
        const parentId = p.parent?.id ?? (p as any).parent_id;
        if (parentId && set.has(String(parentId))) {
          set.add(String(p.id));
          changed = true;
        }
      });
    }
    return set;
  }, [facilityPostIds, allPosts]);

  // ===== Построение дерева =====
  const roots: TreeNode[] = useMemo(() => {
    if (includeIds.size === 0) return [];
    const byId = new Map<string, TreeNode>();
    const included = allPosts.filter(p => includeIds.has(String(p.id)));
    included.forEach(p => byId.set(String(p.id), { ...p, children: [] }));

    const result: TreeNode[] = [];
    included.forEach(p => {
      const parentId = p.parent?.id ?? (p as any).parent_id;
      if (parentId && byId.has(String(parentId))) {
        byId.get(String(parentId))!.children.push(byId.get(String(p.id))!);
      } else {
        result.push(byId.get(String(p.id))!);
      }
    });

    const sortRec = (arr: TreeNode[]) => {
      arr.sort((a, b) => comparePostNames(a.name, b.name));
      arr.forEach(n => sortRec(n.children));
    };
    sortRec(result);
    return result;
  }, [allPosts, includeIds]);

  // ===== Карта postId → Facility[] для отображения адреса =====
  const postsFacilitiesMap = useMemo(() => {
    const map = new Map<string, Facility[]>();

    if (facility) {
      roots.forEach(r => map.set(String(r.id), [facility]));
      return map;
    }

    allFacilities.forEach(f => {
      const facPosts = ((f as any).communication_posts || []) as any[];
      facPosts.forEach(p => {
        const postId = extractId(p);
        if (!postId) return;
        if (!map.has(postId)) map.set(postId, []);
        map.get(postId)!.push(f);
      });
    });

    return map;
  }, [facility, roots, allFacilities]);

  // ===== Привязка нового корневого поста к объекту =====
  const linkRootsToFacility = useCallback(
    async (rootIds: string[]) => {
      if (!facility || !facility.id || !token) return;
      const existingIds: number[] = ((facility as any).communication_posts || [])
        .map((p: any) => Number(extractId(p)))
        .filter((n: number) => Number.isFinite(n) && n > 0);

      const toAdd = rootIds
        .map(id => Number(id))
        .filter(n => Number.isFinite(n) && n > 0 && !existingIds.includes(n));

      if (toAdd.length === 0) return;

      try {
        await facilitiesApi.updateFacility(
          String(facility.id),
          { communication_post_ids: [...existingIds, ...toAdd] } as any,
          token,
        );
      } catch (e) {
        console.error('Failed to link posts to facility:', e);
      }
    },
    [facility, token],
  );

  // ===== Обработчики =====
  const handleAddPs = useCallback((root: TreeNode) => {
    setAddContext({ type: 'child', parent: root });
  }, []);

  const handleAddNdr = useCallback((ps: TreeNode) => {
    setAddContext({ type: 'child', parent: ps });
  }, []);

  const handleAddRoot = useCallback(() => {
    pendingRootSnapshotRef.current = new Set(
      allPosts.filter(isRootPost).map(p => String(p.id)),
    );
    setAddContext({ type: 'root' });
  }, [allPosts]);

  const handleCloseAdd = useCallback(() => {
    setAddContext(null);
    pendingRootSnapshotRef.current = null;
  }, []);

  const handleEditNode = useCallback((id: string) => {
    setEditingPostId(id);
  }, []);

  // ===== Общий обработчик после изменений =====
  const handleAfterChange = useCallback(async () => {
    const snapshot = pendingRootSnapshotRef.current;
    const freshPosts = await fetchPosts();

    if (snapshot && facility) {
      const currentRoots = freshPosts.filter(isRootPost);
      const newRootIds = currentRoots
        .map(p => String(p.id))
        .filter(id => !snapshot.has(id));

      if (newRootIds.length > 0) {
        await linkRootsToFacility(newRootIds);
      }
    }

    await fetchFacilities();
    onChanged?.();
  }, [fetchPosts, fetchFacilities, linkRootsToFacility, onChanged, facility]);

  // ===== Экспорт в PDF (landscape) =====
  const handleExportPdf = useCallback(async () => {
    if (roots.length === 0) return;
    setExportingPdf(true);
    try {
      await exportPostsTreeToPdf(facility, roots, {
        divisionName: !facility ? (allPosts[0]?.division_name || undefined) : undefined,
        facilitiesByPost: !facility ? postsFacilitiesMap : undefined,
      });
    } catch (e) {
      console.error('Failed to export PDF:', e);
    } finally {
      setExportingPdf(false);
    }
  }, [facility, roots, allPosts, postsFacilitiesMap]);

  // ===== Экспорт в SVG (для Visio) =====
  const handleExportSvg = useCallback(() => {
    if (roots.length === 0) return;
    setExportingSvg(true);
    try {
      exportPostsTreeToSvg(facility, roots, {
        divisionName: !facility ? (allPosts[0]?.division_name || undefined) : undefined,
        facilitiesByPost: !facility ? postsFacilitiesMap : undefined,
      });
    } catch (e) {
      console.error('Failed to export SVG:', e);
    } finally {
      setExportingSvg(false);
    }
  }, [facility, roots, allPosts, postsFacilitiesMap]);

  // ===== Контекст для AddCommunicationPostForm =====
  const addFormParent = useMemo(() => {
    if (!addContext || addContext.type !== 'child') return null;
    const node = addContext.parent;
    return {
      id: String(node.id),
      name: node.name,
      kind: node.kind,
      division: extractId(node.division as any),
      subdivision: node.subdivision
        ? extractId(node.subdivision as any) || null
        : null,
    };
  }, [addContext]);

  // ===== Рендер =====
  if (loading && roots.length === 0) {
    return (
      <div className="facility-posts-loading">
        <RefreshCw size={20} className="facility-posts-loading__spin" />
        <span>Загрузка постов связи...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="facility-posts-error">
        <span>{error}</span>
        <button className="facility-posts-error__retry" onClick={() => fetchPosts()}>
          Повторить
        </button>
      </div>
    );
  }

  const noData = roots.length === 0;
  const busy = exportingPdf || exportingSvg;

  return (
    <div className="facility-posts-panel">
      <div className="facility-posts-toolbar">
        <div className="facility-posts-toolbar__title">
          <SatelliteDish size={18} />
          <span>{title}</span>
          <span className="facility-posts-toolbar__count">{roots.length}</span>
        </div>
        <div className="facility-posts-toolbar__actions">
          <button
            type="button"
            className="facility-posts-toolbar__pdf"
            onClick={handleExportPdf}
            disabled={busy || noData}
            title={
              noData
                ? 'Нет данных для экспорта'
                : 'Скачать PDF (A4, альбомная ориентация)'
            }
          >
            <FileDown size={16} />
            <span>{exportingPdf ? 'Готовим PDF...' : 'Экспорт в PDF'}</span>
          </button>

          <button
            type="button"
            className="facility-posts-toolbar__pdf"
            onClick={handleExportSvg}
            disabled={busy || noData}
            title={
              noData
                ? 'Нет данных для экспорта'
                : 'Скачать SVG (A4, альбомная). Откройте в Visio: File → Open и сохраните как .vsdx'
            }
          >
            <FileImage size={16} />
            <span>{exportingSvg ? 'Готовим SVG...' : 'Экспорт в Visio (SVG)'}</span>
          </button>

          {canAdd && (
            <button
              type="button"
              className="facility-posts-toolbar__add"
              onClick={handleAddRoot}
            >
              <Plus size={16} />
              <span>Добавить пост</span>
            </button>
          )}
        </div>
      </div>

      {noData ? (
        <div className="facility-posts-empty">
          <SatelliteDish size={48} strokeWidth={1.4} />
          <h3>
            {isFacilityMode
              ? 'На объекте пока нет постов связи'
              : 'В подразделении пока нет постов связи'}
          </h3>
          <p>
            {isFacilityMode
              ? 'Посты создаются на уровне подразделения. Создайте первый пост (П или КП) — он автоматически привяжется к текущему объекту.'
              : 'Создайте первый пост (П или КП), чтобы начать.'}
          </p>
          {canAdd && (
            <button className="facility-posts-empty__btn" onClick={handleAddRoot}>
              <Plus size={16} />
              Добавить пост
            </button>
          )}
        </div>
      ) : (
        <div className="facility-posts-cards">
          {roots.map(root => (
            <PostCard
              key={root.id}
              post={root}
              facilities={postsFacilitiesMap.get(String(root.id)) || []}
              onAddPs={() => handleAddPs(root)}
              onAddNdr={ps => handleAddNdr(ps)}
              onEditNode={handleEditNode}
              canAdd={canAdd}
            />
          ))}
        </div>
      )}

      {/* Создание корневого поста */}
      {addContext?.type === 'root' && (
        <AddCommunicationPostForm
          onClose={handleCloseAdd}
          onSaved={handleAfterChange}
          divisionId={divisionId || undefined}
          subdivisionId={subdivisionId}
          // В режиме объекта форма фиксирует объект: привязка выполняется
          // автоматически через linkRootsToFacility в handleAfterChange.
          facilityId={facility ? String(facility.id) : undefined}
          facilityName={facility ? facility.name : undefined}
        />
      )}

      {/* Создание ПС / НДР */}
      {addContext?.type === 'child' && addFormParent && (
        <AddCommunicationPostForm
          onClose={handleCloseAdd}
          onSaved={handleAfterChange}
          parentPost={addFormParent}
        />
      )}

      {/* Редактирование / удаление любого узла (корневой / ПС / НДР) */}
      {editingPostId && (
        <EditCommunicationPostForm
          postId={editingPostId}
          onClose={() => setEditingPostId(null)}
          onSaved={handleAfterChange}
        />
      )}
    </div>
  );
}