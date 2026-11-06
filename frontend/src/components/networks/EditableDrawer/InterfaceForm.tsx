import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { networksApi } from '../../../api/networksApi';
import { VlanPicker } from './VlanPicker';

interface Props {
  iface: any;
  token: string | null;
  networkId: string | undefined;
  onCancel: () => void;
  onSave: (iface: any) => void;
}

export const InterfaceForm: React.FC<Props> = ({ iface, token, onCancel, onSave }) => {
  const [form, setForm] = useState(iface);
  const [vlans, setVlans] = useState<Array<{ id: string; name: string; vlan_id: number }>>([]);
  const [tagged, setTagged] = useState<string[]>(
    (iface.vlan_configurations || []).map((vc: any) => String(vc.vlan)),
  );
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!token) return;
    networksApi.getVlans(token).then(setVlans).catch(() => setVlans([]));
  }, [token]);

  const save = () => {
    onSave({ ...form, tagged_vlans: tagged });
  };

  return (
    <div className="iface-form">
      <h4>{iface.id ? 'Изменить интерфейс' : 'Новый интерфейс'}</h4>

      <label>Имя
        <input value={form.name} onChange={e => set('name', e.target.value)} />
      </label>

      <label>Тип
        <select value={form.interface_type} onChange={e => set('interface_type', e.target.value)}>
          <option value="physical">Физический</option>
          <option value="vlan">VLAN Interface</option>
          <option value="bond">Bond</option>
          <option value="bridge">Bridge</option>
          <option value="loopback">Loopback</option>
          <option value="tunnel">Tunnel</option>
          <option value="virtual">Виртуальный</option>
        </select>
      </label>

      <label>Режим
        <select value={form.mode} onChange={e => set('mode', e.target.value)}>
          <option value="access">Access</option>
          <option value="trunk">Trunk</option>
          <option value="general">General</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </label>

      <div className="iface-form__field">
        <span className="iface-form__label">Access VLAN</span>
        <VlanPicker token={token} value={form.access_vlan} onChange={(v) => set('access_vlan', v)} />
      </div>

      <div className="iface-form__field">
        <span className="iface-form__label">Native VLAN</span>
        <VlanPicker token={token} value={form.native_vlan} onChange={(v) => set('native_vlan', v)} />
      </div>

      <div className="iface-form__field">
        <span className="iface-form__label">Tagged VLANs</span>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Для trunk-портов"
          value={tagged}
          onChange={setTagged}
          optionFilterProp="label"
          options={vlans.map(v => ({ value: v.id, label: `${v.vlan_id} — ${v.name}` }))}
        />
      </div>

      <label className="iface-form__check">
        <input type="checkbox" checked={!!form.is_trunk} onChange={e => set('is_trunk', e.target.checked)} />
        <span>Trunk</span>
      </label>

      <div className="iface-form__actions">
        <button type="button" onClick={onCancel}>Отмена</button>
        <button type="button" className="btn-primary" onClick={save}>Сохранить</button>
      </div>
    </div>
  );
};