// components/divisions/DivisionDetails/sections/CommunicationPosts/postFacilityHelpers.ts
import { facilitiesApi } from '../../../../../api';

/**
 * Опция объекта для селекта в формах поста.
 * `postIds` — снимок привязанных постов на момент загрузки, нужен
 * для корректного add/remove при обновлении M2M.
 */
export interface FacilityOption {
  id: string;
  /** Название объекта (фолбэк, если тип не задан). */
  name: string;
  /** Тип объекта (например, «ШД», «УС»). Основной лейбл в селекте. */
  typeName: string | null;
  address: string | null;
  postIds: string[];
}

/** Загружает объекты выбранного подразделения (и, опционально, отделения). */
export async function loadFacilitiesForDivision(
  token: string,
  divisionId: string,
  subdivisionId?: string | null,
): Promise<FacilityOption[]> {
  const params: any = { token, division: divisionId };
  if (subdivisionId) params.subdivision = subdivisionId;

  const list = await facilitiesApi.getFacilities(params);
  return (list || []).map((f: any) => ({
    id: String(f.id),
    name: f.name || 'Объект',
    typeName: f.type?.name ?? f.type_name ?? null,
    address: f.address ?? null,
    postIds: ((f.communication_posts || []) as any[]).map((p: any) =>
      typeof p === 'object' && p !== null ? String(p.id) : String(p),
    ),
  }));
}

/** Добавляет / удаляет пост в M2M-связи объекта. */
export async function setFacilityPostLink(
  token: string,
  facilityId: string,
  postId: string,
  action: 'add' | 'remove',
  currentPostIds: string[],
): Promise<void> {
  const current = new Set(currentPostIds.map(String));
  if (action === 'add') current.add(String(postId));
  else current.delete(String(postId));

  const next = Array.from(current)
    .map(s => parseInt(s, 10))
    .filter(n => Number.isFinite(n) && n > 0);

  await facilitiesApi.updateFacility(
    facilityId,
    { communication_post_ids: next } as any,
    token,
  );
}

/** Находит объект, к которому привязан пост (если есть). */
export function findFacilityForPost(
  facilities: FacilityOption[],
  postId: string,
): FacilityOption | null {
  return facilities.find(f => f.postIds.includes(String(postId))) || null;
}