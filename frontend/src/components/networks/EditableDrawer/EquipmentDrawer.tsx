import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { InterfacesTab } from './InterfacesTab';
import './EquipmentDrawer.css';


interface Props {
  open: boolean;
  onClose: () => void;
  token: string | null;
  networkId: string | undefined;
  equipment: any;
  canEdit: boolean;
  onChanged?: () => void;
}

type Tab = 'interfaces' | 'vlans' | 'routing' | 'acls';

export const EquipmentDrawer: React.FC<Props> = ({
  open, onClose, token, networkId, equipment, canEdit, onChanged,
}) => {
  const [tab, setTab] = useState<Tab>('interfaces');

  useEffect(() => { setTab('interfaces'); }, [equipment?.id]);

  if (!open || !equipment) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="equipment-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-drawer__head">
          <div>
            <h3>{equipment.name}</h3>
            <div className="equipment-drawer__sub">
              {equipment.device_type_display || equipment.category?.name || 'Оборудование'}
              {equipment.is_closed ? ' · ША' : ''}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </header>

        <nav className="equipment-drawer__tabs">
          {(['interfaces', 'vlans', 'routing', 'acls'] as Tab[]).map(t => (
            <button
              key={t}
              className={`drawer-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {{
                interfaces: 'Интерфейсы',
                vlans: 'VLAN',
                routing: 'Маршруты',
                acls: 'ACL',
              }[t]}
            </button>
          ))}
        </nav>

        <div className="equipment-drawer__body">
          {tab === 'interfaces' && (
            <InterfacesTab
              token={token}
              networkId={networkId}
              equipment={equipment}
              canEdit={canEdit}
              onChanged={onChanged}
            />
          )}
          {tab !== 'interfaces' && (
            <div className="drawer-placeholder">
              Раздел «{{ vlans: 'VLAN', routing: 'Маршруты', acls: 'ACL' }[tab]}» —
              та же схема, что и «Интерфейсы»; реализуется по аналогии.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};