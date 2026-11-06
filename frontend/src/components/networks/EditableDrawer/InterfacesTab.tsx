import React, { useCallback, useEffect, useState } from 'react';
import { Button, Empty, message } from 'antd';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { networksApi } from '../../../api/networksApi';
import { InterfaceModal } from '../modals/InterfaceModal';

interface Props {
  token: string | null;
  networkId: string | undefined;
  equipment: any;
  canEdit: boolean;
  onChanged?: () => void;
}

export const InterfacesTab: React.FC<Props> = ({ token, networkId, equipment, canEdit, onChanged }) => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const reload = useCallback(async () => {
    if (!token || !equipment?.id) return;
    setLoading(true);
    try {
      const data = await networksApi.getNetworkInterfaces(token, { equipment: equipment.id });
      setList(data);
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [token, equipment?.id]);

  useEffect(() => { reload(); }, [reload]);

  const remove = async (id: string) => {
    if (!token || !window.confirm('Удалить интерфейс?')) return;
    try {
      await networksApi.deleteNetworkInterface(token, id);
      message.success('Удалено');
      await reload();
      onChanged?.();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  if (!token) return null;

  return (
    <div className="iface-tab-compact">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        <Button size="small" icon={<RefreshCw size={14} />} onClick={reload} loading={loading}>
          Обновить
        </Button>
        {canEdit && (
          <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Интерфейс
          </Button>
        )}
      </div>

      {list.length === 0 && !loading && (
        <Empty description="Интерфейсов нет" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {list.map((i: any) => (
        <div
          key={i.id}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 8,
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`netconfig-status-dot ${i.enabled ? 'netconfig-status-dot--ok' : 'netconfig-status-dot--danger'}`} />
            <b>{i.name}</b>
            <span className="muted">{i.interface_type} · {i.mode}</span>
            {i.is_trunk && <span style={{ fontSize: 11, background: '#eef2ff', color: '#4338ca', borderRadius: 4, padding: '0 6px' }}>trunk</span>}
            <span style={{ flex: 1 }} />
            {canEdit && (
              <>
                <Button type="text" size="small" icon={<Pencil size={14} />} onClick={() => { setEditing(i); setModalOpen(true); }} />
                <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={() => remove(i.id)} />
              </>
            )}
          </div>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(i.ip_addresses || []).length === 0
              ? <span className="muted">Нет IP-адресов</span>
              : (i.ip_addresses || []).map((ip: any) => (
                  <code key={ip.id} style={{ fontSize: 11, background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>
                    {ip.address}
                  </code>
                ))}
          </div>
        </div>
      ))}

      <InterfaceModal
        open={modalOpen}
        token={token}
        equipment={equipment}
        initial={editing}
        networkId={networkId}
        allInterfaces={list}
        onClose={() => setModalOpen(false)}
        onSaved={async () => { setModalOpen(false); await reload(); onChanged?.(); }}
      />
    </div>
  );
};