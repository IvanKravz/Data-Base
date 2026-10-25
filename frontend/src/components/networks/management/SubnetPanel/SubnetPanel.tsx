// src/components/networks/management/SubnetPanel/SubnetPanel.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Subnet, SubnetHost, IPStatus } from '../../../../types';
import { networksApi } from '../../../../api/networksApi';
import { Edit, Scissors, Trash2, Save, X } from 'lucide-react';
import SubnetHeatmap from '../SubnetHeatmap/SubnetHeatmap';
import SubnetIPEditModal from '../SubnetIPEditModal/SubnetIPEditModal';
import './SubnetPanel.css';

interface Props {
  token: string;
  subnet: Subnet;
  onRefresh: () => void;
  onEdit: () => void;
  onSplit: () => void;
  onDelete: () => void;
}

const STATUS_LABEL: Record<IPStatus, string> = {
  free: 'Свободен',
  reserved: 'Зарезервирован',
  in_use: 'Используется',
  deprecated: 'Устарел',
};

const SubnetPanel: React.FC<Props> = ({
  token, subnet, onRefresh, onEdit, onSplit, onDelete,
}) => {
  const [hosts, setHosts] = useState<SubnetHost[]>([]);
  const [dirty, setDirty] = useState<Record<string, Partial<SubnetHost>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showOnlyUsed, setShowOnlyUsed] = useState(true);

  // Для режима heatmap: адрес, открытый в модалке
  const [editingAddress, setEditingAddress] = useState<string | null>(null);

  // Heatmap рендерим только для /24 и меньше
  const canUseHeatmap = subnet.prefix_length >= 24;

  useEffect(() => {
    setSearch('');
    setEditingAddress(null);
  }, [subnet.id]);

  const fetchHosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await networksApi.getSubnetHosts(token, subnet.id);
      setHosts(data);
      setDirty({});
    } catch {
      setError('Не удалось загрузить IP-пул');
    } finally {
      setLoading(false);
    }
  }, [token, subnet.id]);

  useEffect(() => { fetchHosts(); }, [fetchHosts]);

  const merged = useMemo(
    () => hosts.map(h => ({ ...h, ...(dirty[h.address] || {}) })),
    [hosts, dirty],
  );

  // Применяется только к таблице
  const filtered = useMemo(() => {
    let r = showOnlyUsed ? merged.filter(h => h.status !== 'free') : merged;
    if (search.trim()) {
      const f = search.toLowerCase();
      r = r.filter(h =>
        h.address.includes(f) ||
        h.hostname.toLowerCase().includes(f) ||
        h.assigned_to.toLowerCase().includes(f) ||
        h.purpose.toLowerCase().includes(f),
      );
    }
    return r;
  }, [merged, showOnlyUsed, search]);

  const update = (address: string, patch: Partial<SubnetHost>) => {
    setDirty(p => ({ ...p, [address]: { ...(p[address] || {}), ...patch } }));
  };

  /** Батч-сохранение для таблицы */
  const handleSave = async () => {
    if (!Object.keys(dirty).length) return;
    setSaving(true);
    setError(null);
    try {
      const items = Object.entries(dirty).map(([address]) => {
        const base = merged.find(h => h.address === address)!;
        return {
          address,
          status: base.status,
          hostname: base.hostname,
          purpose: base.purpose,
          assigned_to: base.assigned_to,
          description: base.description,
          is_primary: base.is_primary,
          interface_id: base.interface_id,
        };
      });
      await networksApi.saveSubnetHosts(token, subnet.id, items);
      await fetchHosts();
      onRefresh();
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ||
        (e?.response?.data?.errors && JSON.stringify(e.response.data.errors)) ||
        'Ошибка сохранения',
      );
    } finally {
      setSaving(false);
    }
  };

  /** Хост для модалки редактирования (клик по клетке heatmap) */
  const editingHost = useMemo(
    () => (editingAddress ? merged.find(h => h.address === editingAddress) ?? null : null),
    [editingAddress, merged],
  );

  /**
   * Сохранение из модалки (клик по клетке) — сразу в БД, без `dirty`.
   * При ошибке бросает исключение — модалка покажет ошибку.
   */
  const handleGridEdit = async (patch: Partial<SubnetHost>) => {
    if (!editingHost) return;
    const updated = { ...editingHost, ...patch };
    await networksApi.saveSubnetHosts(token, subnet.id, [
      {
        address: updated.address,
        status: updated.status,
        hostname: updated.hostname,
        purpose: updated.purpose,
        assigned_to: updated.assigned_to,
        description: updated.description,
        is_primary: updated.is_primary,
        interface_id: updated.interface_id,
      },
    ]);
    setEditingAddress(null);
    await fetchHosts();
    onRefresh();
  };

  const usedCount = merged.filter(h => h.status !== 'free').length;
  const dirtyCount = Object.keys(dirty).length;

  return (
    <div className="sp">
      {/* Заголовок */}
      <header className="sp-header">
        <div className="sp-title-row">
          <h2 className="sp-cidr">{subnet.cidr}</h2>
          <div className="sp-badges">
            {subnet.vlan_name && (
              <span className="sp-badge sp-badge-vlan">VLAN {subnet.vlan_name}</span>
            )}
            {subnet.purpose && (
              <span className="sp-badge sp-badge-purpose">{subnet.purpose}</span>
            )}
          </div>
        </div>
        <div className="sp-sub">
          <span>Маска: <b>{subnet.netmask}</b></span>
          {subnet.gateway && <span>Шлюз: <b>{subnet.gateway}</b></span>}
          {subnet.description && <span>{subnet.description}</span>}
        </div>
        <div className="sp-actions">
          <button type="button" onClick={onEdit}>
            <Edit size={14} /> Изменить
          </button>
          <button
            type="button"
            onClick={onSplit}
            disabled={subnet.prefix_length >= 31 || subnet.children_count > 0}
            title={subnet.children_count > 0 ? 'Уже разбита на подсети' : 'Разбить'}
          >
            <Scissors size={14} /> Разбить
          </button>
          <button type="button" onClick={onDelete} className="sp-btn-danger">
            <Trash2 size={14} /> Удалить
          </button>
        </div>
      </header>

      {/* Статистика */}
      <div className="sp-stats">
        <div className="sp-stat">
          <span className="sp-stat-label">Занято</span>
          <span className="sp-stat-value">{usedCount} / {subnet.host_count}</span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-label">Свободно</span>
          <span className="sp-stat-value sp-stat-free">
            {subnet.host_count - usedCount}
          </span>
        </div>
        <div className="sp-stat">
          <span className="sp-stat-label">Зарезервировано</span>
          <span className="sp-stat-value">{subnet.reserved_count}</span>
        </div>
        <div className="sp-usage-bar-big">
          <div
            className="sp-usage-fill-big"
            style={{
              width: `${subnet.host_count ? (usedCount / subnet.host_count) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Тулбар — поиск/фильтр применяются к таблице; heatmap всегда показывает всё */}
      <div className="sp-ip-toolbar">
        <input
          type="text"
          placeholder="Поиск по IP, hostname, назначению…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sp-ip-search"
        />

        <label className="sp-ip-toggle">
          <input
            type="checkbox"
            checked={showOnlyUsed}
            onChange={e => setShowOnlyUsed(e.target.checked)}
          />
          Только занятые в таблице
        </label>

        {dirtyCount > 0 && (
          <div className="sp-ip-actions">
            <button
              type="button"
              className="sp-btn-cancel"
              onClick={() => setDirty({})}
              disabled={saving}
            >
              <X size={14} /> Отмена ({dirtyCount})
            </button>
            <button
              type="button"
              className="sp-btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={14} /> {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Загрузка IP-пула…</div>
      ) : (
        <>
          {/* Heatmap сверху — обзор всего пула */}
          {canUseHeatmap ? (
            <section className="sp-heatmap-section">
              <h3 className="sp-section-title">
                Карта занятости
                <span className="sp-section-hint">клик по клетке — редактировать</span>
              </h3>
              <SubnetHeatmap
                subnet={subnet}
                hosts={merged}
                onCellClick={setEditingAddress}
              />
            </section>
          ) : (
            <div className="sp-heatmap-disabled">
              Для подсетей /23 и больше карта занятости недоступна — используйте таблицу ниже.
            </div>
          )}

          {/* Таблица под картой — детали и батч-редактирование */}
          <section className="sp-table-section">
            <h3 className="sp-section-title">
              Список адресов
              <span className="sp-section-hint">
                {filtered.length} из {merged.length}
              </span>
            </h3>
            <div className="sp-ip-table-wrap">
              <table className="sp-ip-table">
                <thead>
                  <tr>
                    <th>IP</th>
                    <th>Статус</th>
                    <th>Hostname</th>
                    <th>Назначение</th>
                    <th>Кому / чему</th>
                    <th>Интерфейс</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(h => {
                    const isFree = h.status === 'free';
                    const isDirty = h.address in dirty;
                    return (
                      <tr
                        key={h.address}
                        className={`sp-ip-row status-${h.status} ${isDirty ? 'dirty' : ''}`}
                      >
                        <td><code>{h.address}</code></td>
                        <td>
                          <select
                            value={h.status}
                            onChange={e =>
                              update(h.address, { status: e.target.value as IPStatus })
                            }
                          >
                            {(Object.keys(STATUS_LABEL) as IPStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            value={h.hostname}
                            disabled={isFree}
                            onChange={e => update(h.address, { hostname: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={h.purpose}
                            disabled={isFree}
                            onChange={e => update(h.address, { purpose: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={h.assigned_to}
                            disabled={isFree}
                            onChange={e => update(h.address, { assigned_to: e.target.value })}
                          />
                        </td>
                        <td className="sp-ip-interface">
                          {h.equipment_name
                            ? `${h.equipment_name} / ${h.interface_name}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="sp-ip-empty">
                        {showOnlyUsed
                          ? 'Занятых адресов нет. Снимите «Только занятые», чтобы выбрать свободный.'
                          : 'Нет адресов, подходящих под фильтр.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Модалка редактирования IP (клик по клетке heatmap) */}
      {editingHost && (
        <SubnetIPEditModal
          host={editingHost}
          onSave={handleGridEdit}
          onClose={() => setEditingAddress(null)}
        />
      )}
    </div>
  );
};

export default SubnetPanel;