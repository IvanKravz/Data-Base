// src/components/networks/modals/SubnetSplitModal.tsx
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Subnet } from '../../../types';
import { networksApi } from '../../../api/networksApi';
import './Modal.css';

interface Props {
  token: string;
  subnet: Subnet;
  onSplit: () => void;
  onClose: () => void;
}

const SubnetSplitModal: React.FC<Props> = ({ token, subnet, onSplit, onClose }) => {
  const [childPrefix, setChildPrefix] = useState(
    Math.min(subnet.prefix_length + 1, 31),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefixes = useMemo(
    () => Array.from(
      { length: 31 - subnet.prefix_length },
      (_, i) => subnet.prefix_length + 1 + i,
    ),
    [subnet.prefix_length],
  );

  const preview = useMemo(() => {
    const count = Math.pow(2, childPrefix - subnet.prefix_length);
    const base = subnet.network_address
      .split('.').map(Number)
      .reduce((acc, v) => (acc << 8) | v, 0) >>> 0;
    const blockSize = Math.pow(2, 32 - childPrefix);
    const items: string[] = [];
    for (let i = 0; i < Math.min(count, 16); i++) {
      const n = (base + i * blockSize) >>> 0;
      items.push(
        `${n >>> 24}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}/${childPrefix}`,
      );
    }
    return { items, total: count };
  }, [subnet, childPrefix]);

  const handleSplit = async () => {
    setSaving(true);
    setError(null);
    try {
      await networksApi.splitSubnet(token, subnet.id, childPrefix);
      onSplit();
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ||
        e?.response?.data?.child_prefix ||
        'Ошибка разбиения',
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Разбить подсеть {subnet.cidr}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Новая маска</label>
            <select value={childPrefix} onChange={e => setChildPrefix(Number(e.target.value))}>
              {prefixes.map(p => (
                <option key={p} value={p}>/{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Получится {preview.total} подсетей:</label>
            <ul className="split-preview">
              {preview.items.map(c => <li key={c}>{c}</li>)}
              {preview.items.length < preview.total && <li>…</li>}
            </ul>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="button" disabled={saving} onClick={handleSplit}>
              {saving ? 'Создание…' : 'Разбить'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SubnetSplitModal;