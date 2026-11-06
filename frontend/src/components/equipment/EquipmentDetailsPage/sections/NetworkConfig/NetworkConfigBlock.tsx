// src/components/equipment/EquipmentDetailsPage/sections/NetworkConfig/NetworkConfigBlock.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Empty, Form, Input, InputNumber, message, Modal, Select, Spin, Table,
  Tabs, Tag, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSelector } from 'react-redux';
import {
  Cpu, Layers, Network as NetworkIcon, GitBranch, Shield,
  Plus, Pencil, Trash2, RefreshCw, Globe, Check, X as XIcon,
} from 'lucide-react';

import {
  Equipment,
  ACL,
  RoutingRow,
  NetworkInterface,
  IPAddress,
  VLAN,
} from '../../../../../types';

import { equipmentApi } from '../../../../../api/equipment';
import { networksApi } from '../../../../../api/networksApi';
import { RootState } from '../../../../../store/store';
import { PortGrid } from './PortGrid';
import { InterfaceModal } from '../../../../networks/modals/InterfaceModal';
import './style.css';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  equipment: Equipment;
  token: string;
}

type TabId = 'interfaces' | 'vlans' | 'ips' | 'routing' | 'acls';

// ============================================================
// KPI
// ============================================================
const Kpi: React.FC<{
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'danger';
  hint?: string;
}> = ({ label, value, tone = 'default', hint }) => {
  const body = (
    <div className={`netconfig-kpi netconfig-kpi--${tone}`}>
      <div className="netconfig-kpi__value">{value}</div>
      <div className="netconfig-kpi__label">{label}</div>
    </div>
  );
  return hint ? <Tooltip title={hint}>{body}</Tooltip> : body;
};

// ============================================================
// Главный компонент
// ============================================================
export function NetworkConfigBlock({ equipment, token }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('interfaces');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [ipAddresses, setIpAddresses] = useState<IPAddress[]>([]);
  const [routingTable, setRoutingTable] = useState<RoutingRow[]>([]);
  const [acls, setAcls] = useState<ACL[]>([]);

  // total_ports (inline edit)
  const [totalPorts, setTotalPorts] = useState<number | null>(equipment.total_ports ?? null);
  const [editingTotalPorts, setEditingTotalPorts] = useState(false);
  const [savingTotalPorts, setSavingTotalPorts] = useState(false);

  // Выбранный порт = фильтр таблицы
  const [selectedPort, setSelectedPort] = useState<number | null>(null);

  // Модалка интерфейса
  const [ifaceModalOpen, setIfaceModalOpen] = useState(false);
  const [editingIface, setEditingIface] = useState<NetworkInterface | null>(null);
  const [presetPort, setPresetPort] = useState<number | null>(null);

  // Простые модалки
  const [simpleModal, setSimpleModal] = useState<{
    kind: 'vlan' | 'ip' | 'routing' | 'acl' | null;
    row?: any;
  }>({ kind: null });

  // === Права ===
  const user = useSelector((state: RootState) => state.auth.user);
  const models = user?.permissions?.models || {};
  const canEditIface = models.NetworkInterface?.includes('change') ?? false;
  const canEditVlan = models.VLAN?.includes('change') ?? false;
  const canEditIp = models.IPAddress?.includes('change') ?? false;
  const canEditRouting = models.RoutingTable?.includes('change') ?? false;
  const canEditAcl = models.ACL?.includes('change') ?? false;

  const networkId = useMemo<string | undefined>(() => {
    const ms: any = (equipment as any).network_memberships;
    if (Array.isArray(ms) && ms.length > 0) {
      const n = ms[0]?.network;
      return n && typeof n === 'object' ? String(n.id) : (n ? String(n) : undefined);
    }
    return undefined;
  }, [equipment]);

  const reload = useCallback(async (soft = false) => {
    if (!token || !equipment?.id) return;
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const [config, ips] = await Promise.all([
        equipmentApi.getNetworkConfig(token, String(equipment.id)),
        networksApi.getIPAddresses(token, { interface__equipment: equipment.id }),
      ]);
      setInterfaces(config.interfaces || []);
      setVlans(config.vlans || []);
      setRoutingTable(config.routing_table || []);
      setAcls(config.acls || []);
      setIpAddresses(ips || []);
    } catch (e) {
      console.error('[NetworkConfigBlock] reload failed:', e);
      message.error('Не удалось загрузить сетевую конфигурацию');
    } finally {
      soft ? setRefreshing(false) : setLoading(false);
    }
  }, [token, equipment?.id]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => { setTotalPorts(equipment.total_ports ?? null); }, [equipment.id, equipment.total_ports]);

  // === total_ports ===
  const saveTotalPorts = async () => {
    if (!token || !equipment?.id) return;
    const value = totalPorts;
    if (value != null && (value < 0 || !Number.isFinite(value))) {
      message.error('Некорректное количество портов');
      return;
    }
    setSavingTotalPorts(true);
    try {
      await equipmentApi.patchEquipment(token, String(equipment.id), { total_ports: value } as any);
      message.success('Сохранено');
      setEditingTotalPorts(false);
    } catch {
      message.error('Не удалось сохранить');
    } finally {
      setSavingTotalPorts(false);
    }
  };

  // === Интерфейсы ===
  const openIface = (iface?: NetworkInterface, port?: number) => {
    setEditingIface(iface || null);
    setPresetPort(iface ? (iface.port_number ?? null) : (port ?? null));
    setIfaceModalOpen(true);
  };

  const deleteIface = async (id: string) => {
    if (!window.confirm('Удалить интерфейс?')) return;
    try {
      await networksApi.deleteNetworkInterface(token, id);
      message.success('Интерфейс удалён');
      if (selectedPort != null) setSelectedPort(null);
      await reload(true);
    } catch {
      message.error('Не удалось удалить интерфейс');
    }
  };

  // === Фильтр таблицы по порту ===
  const filteredInterfaces = useMemo(() => {
    if (selectedPort == null) return interfaces;
    if (selectedPort === -1) return interfaces.filter(i => i.port_number == null);
    return interfaces.filter(i => i.port_number === selectedPort);
  }, [interfaces, selectedPort]);

  // === Вкладка «Интерфейсы» ===
  const interfacesTab = useMemo(() => {
    const total = interfaces.length;
    const up = interfaces.filter(i => i.enabled).length;
    const down = total - up;
    const trunk = interfaces.filter(i => i.mode === 'trunk' || i.is_trunk).length;
    const withIp = interfaces.filter(i => (i.ip_addresses?.length || 0) > 0).length;

    return (
      <div className="netconfig-tab-body">
        {/* KPI */}
        <div className="netconfig-kpi-row">
          <Kpi
            label="Всего портов"
            value={
              editingTotalPorts ? (
                <InputNumber
                  size="small"
                  min={0}
                  max={4096}
                  value={totalPorts ?? undefined}
                  onChange={(v) => setTotalPorts(v ?? null)}
                  onPressEnter={saveTotalPorts}
                  autoFocus
                  style={{ width: 64 }}
                />
              ) : (
                <span
                  className={`netconfig-kpi__value-text ${canEditIface ? 'netconfig-kpi__value-text--editable' : ''}`}
                  onClick={() => canEditIface && setEditingTotalPorts(true)}
                >
                  {totalPorts != null ? totalPorts : '—'}
                  {canEditIface && (
                    <span className="netconfig-kpi__edit-trigger" aria-hidden="true">
                      <Pencil size={12} />
                    </span>
                  )}
                </span>
              )
            }
          />
          <Kpi label="Создано" value={total} hint="Количество созданных интерфейсов" />
          <Kpi label="Up" value={up} tone="ok" />
          <Kpi label="Down" value={down} tone={down > 0 ? 'warn' : 'default'} />
          <Kpi label="Trunk" value={trunk} />
          <Kpi label="С IP" value={withIp} />
        </div>

        {editingTotalPorts && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: -8 }}>
            <Button size="small" type="primary" icon={<Check size={14} />} loading={savingTotalPorts} onClick={saveTotalPorts}>
              Сохранить
            </Button>
            <Button size="small" icon={<XIcon size={14} />} onClick={() => { setEditingTotalPorts(false); setTotalPorts(equipment.total_ports ?? null); }}>
              Отмена
            </Button>
          </div>
        )}

        {/* Панель портов */}
        <div className="netconfig-toolbar">
          <div className="netconfig-toolbar__title"><Cpu size={16} /> Панель портов</div>
          <div className="netconfig-toolbar__actions">
            {canEditIface && (
              <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => openIface()}>
                Добавить
              </Button>
            )}
          </div>
        </div>

        <PortGrid
          interfaces={interfaces}
          totalPorts={totalPorts}
          selectedPort={selectedPort}
          onSelect={(_i, port) => {
            setSelectedPort(prev => prev === port ? null : port);
          }}
          onCreateAtPort={(port) => {
            if (!canEditIface) return;
            openIface(undefined, port);
          }}
        />

        {/* Таблица интерфейсов */}
        <div className="netconfig-toolbar netconfig-toolbar--spaced">
          <div className="netconfig-toolbar__title">
            <NetworkIcon size={16} /> Таблица интерфейсов
            {selectedPort != null && (
              <span
                className="netconfig-filter-chip"
                onClick={() => setSelectedPort(null)}
                title="Снять фильтр"
              >
                Порт: {selectedPort === -1 ? '—' : selectedPort} <XIcon size={12} />
              </span>
            )}
          </div>
          <div className="netconfig-toolbar__actions">
            <Button size="small" icon={<RefreshCw size={14} />} onClick={() => reload(true)} loading={refreshing}>
              Обновить
            </Button>
          </div>
        </div>

        <InterfaceTable
          interfaces={filteredInterfaces}
          canEdit={canEditIface}
          onEdit={(i) => openIface(i)}
          onDelete={deleteIface}
        />
      </div>
    );
  }, [interfaces, refreshing, selectedPort, totalPorts, editingTotalPorts, savingTotalPorts, reload, canEditIface]);

  // === Вкладка «VLAN» ===
  const vlansTab = (
    <div className="netconfig-tab-body">
      <Kpi label="VLANов" value={vlans.length} />
      <div className="netconfig-toolbar">
        <div className="netconfig-toolbar__title"><Layers size={16} /> VLAN-справочник</div>
        <div className="netconfig-toolbar__actions">
          {canEditVlan && (
            <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => setSimpleModal({ kind: 'vlan' })}>
              Добавить VLAN
            </Button>
          )}
        </div>
      </div>
      {vlans.length === 0 ? (
        <Empty description="Нет VLAN" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table<VLAN>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={vlans}
          columns={[
            { title: 'VLAN ID', dataIndex: 'vlan_id', width: 100, render: (v) => <b>{v}</b> },
            { title: 'Название', dataIndex: 'name' },
            { title: 'Описание', dataIndex: 'description', render: (v) => v || <span className="muted">—</span> },
            ...(canEditVlan ? [{
              title: '', width: 60,
              render: (_: any, row: VLAN) => (
                <Button type="text" size="small" icon={<Pencil size={14} />} onClick={() => setSimpleModal({ kind: 'vlan', row })} />
              ),
            }] : []),
          ]}
        />
      )}
    </div>
  );

  // === Вкладка «IP-адреса» ===
  const ipsTab = (
    <div className="netconfig-tab-body">
      <Kpi label="Всего IP" value={ipAddresses.length} />
      <div className="netconfig-toolbar">
        <div className="netconfig-toolbar__title"><Globe size={16} /> IP-адреса оборудования</div>
        <div className="netconfig-toolbar__actions">
          {canEditIp && (
            <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => setSimpleModal({ kind: 'ip' })}>
              Добавить IP
            </Button>
          )}
        </div>
      </div>
      {ipAddresses.length === 0 ? (
        <Empty description="Нет IP-адресов" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table<IPAddress>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={ipAddresses}
          columns={[
            { title: 'Адрес', dataIndex: 'address', render: (v, r) => <code>{v}{r.subnet_cidr ? ` (${r.subnet_cidr})` : ''}</code> },
            { title: 'Интерфейс', dataIndex: 'interface_name', render: (v) => v || <span className="muted">—</span> },
            { title: 'Hostname', dataIndex: 'hostname', render: (v) => v || <span className="muted">—</span> },
            { title: 'Статус', dataIndex: 'status', width: 130, render: (v) => <StatusTag status={v} /> },
            { title: 'Основной', dataIndex: 'is_primary', width: 100, render: (v) => v ? <Tag color="green">primary</Tag> : null },
            ...(canEditIp ? [{
              title: '', width: 60,
              render: (_: any, row: IPAddress) => (
                <Button type="text" size="small" icon={<Pencil size={14} />} onClick={() => setSimpleModal({ kind: 'ip', row })} />
              ),
            }] : []),
          ]}
        />
      )}
    </div>
  );

  // === Вкладка «Маршруты» ===
  const routingTab = (
    <div className="netconfig-tab-body">
      <Kpi label="Маршрутов" value={routingTable.length} />
      <div className="netconfig-toolbar">
        <div className="netconfig-toolbar__title"><GitBranch size={16} /> Таблица маршрутизации</div>
        <div className="netconfig-toolbar__actions">
          {canEditRouting && (
            <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => setSimpleModal({ kind: 'routing' })}>
              Добавить маршрут
            </Button>
          )}
        </div>
      </div>
      {routingTable.length === 0 ? (
        <Empty description="Нет записей маршрутизации" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table<RoutingRow>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={routingTable}
          columns={[
            { title: 'Сеть', dataIndex: 'network', render: (v) => <code>{v}</code> },
            { title: 'Маска', dataIndex: 'netmask', render: (v) => <code>{v}</code> },
            { title: 'Шлюз', dataIndex: 'gateway', render: (v) => <code>{v}</code> },
            { title: 'Метрика', dataIndex: 'metric', width: 90 },
            ...(canEditRouting ? [{
              title: '', width: 100,
              render: (_: any, row: RoutingRow) => (
                <>
                  <Button type="text" size="small" icon={<Pencil size={14} />} onClick={() => setSimpleModal({ kind: 'routing', row })} />
                  <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={() => deleteRouting(row.id)} />
                </>
              ),
            }] : []),
          ]}
        />
      )}
    </div>
  );

  // === Вкладка «ACL» ===
  const aclsTab = (
    <div className="netconfig-tab-body">
      <Kpi label="Правил ACL" value={acls.length} />
      <div className="netconfig-toolbar">
        <div className="netconfig-toolbar__title"><Shield size={16} /> Access Control Lists</div>
        <div className="netconfig-toolbar__actions">
          {canEditAcl && (
            <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => setSimpleModal({ kind: 'acl' })}>
              Добавить правило
            </Button>
          )}
        </div>
      </div>
      {acls.length === 0 ? (
        <Empty description="Нет правил ACL" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table<ACL>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={acls}
          columns={[
            { title: 'ACL', dataIndex: 'name' },
            { title: '#', dataIndex: 'sequence', width: 60 },
            { title: 'Действие', dataIndex: 'action', width: 110, render: (v) => <Tag color={v === 'permit' ? 'green' : 'red'}>{v}</Tag> },
            { title: 'Протокол', dataIndex: 'protocol', width: 90 },
            { title: 'Источник', dataIndex: 'source_network', render: (v) => <code>{v || 'any'}</code> },
            { title: 'Назначение', dataIndex: 'destination_network', render: (v) => <code>{v || 'any'}</code> },
            ...(canEditAcl ? [{
              title: '', width: 100,
              render: (_: any, row: ACL) => (
                <>
                  <Button type="text" size="small" icon={<Pencil size={14} />} onClick={() => setSimpleModal({ kind: 'acl', row })} />
                  <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={() => deleteAcl(row.id)} />
                </>
              ),
            }] : []),
          ]}
        />
      )}
    </div>
  );

  const deleteRouting = async (id: string) => {
    if (!window.confirm('Удалить маршрут?')) return;
    try {
      await networksApi.deleteRoutingTable(token, id);
      message.success('Маршрут удалён');
      reload(true);
    } catch { message.error('Ошибка удаления'); }
  };

  const deleteAcl = async (id: string) => {
    if (!window.confirm('Удалить правило ACL?')) return;
    try {
      await networksApi.deleteACL(token, id);
      message.success('Правило удалено');
      reload(true);
    } catch { message.error('Ошибка удаления'); }
  };

  // === Формирование вкладок (скрываем без прав) ===
  const tabsItems: any[] = [
    {
      key: 'interfaces',
      label: <span className="netconfig-tab-label"><Cpu size={14} /> Интерфейсы</span>,
      children: interfacesTab,
    },
  ];
  if (canEditVlan) tabsItems.push({ key: 'vlans', label: <span className="netconfig-tab-label"><Layers size={14} /> VLAN</span>, children: vlansTab });
  if (canEditIp) tabsItems.push({ key: 'ips', label: <span className="netconfig-tab-label"><Globe size={14} /> IP-адреса</span>, children: ipsTab });
  if (canEditRouting) tabsItems.push({ key: 'routing', label: <span className="netconfig-tab-label"><GitBranch size={14} /> Маршруты</span>, children: routingTab });
  if (canEditAcl) tabsItems.push({ key: 'acls', label: <span className="netconfig-tab-label"><Shield size={14} /> ACL</span>, children: aclsTab });

  // === Render ===
  if (!equipment.is_network) return null;
  if (!canEditIface) return null;

  return (
    <div className="netconfig-block">
      <div className="netconfig-block__header">
        <div>
          <div className="netconfig-block__title">Сетевая конфигурация</div>
          <div className="netconfig-block__subtitle">Интерфейсы, VLAN, IP, маршрутизация и ACL</div>
        </div>
        <Button size="small" icon={<RefreshCw size={14} />} onClick={() => reload(true)} loading={refreshing}>
          Обновить
        </Button>
      </div>

      {loading ? (
        <div className="netconfig-block__loading"><Spin /><div className="muted">Загрузка…</div></div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as TabId)}
          items={tabsItems}
        />
      )}

      <InterfaceModal
        open={ifaceModalOpen}
        token={token}
        equipment={equipment}
        initial={editingIface}
        networkId={networkId}
        allInterfaces={interfaces}
        presetPortNumber={presetPort}
        onClose={() => setIfaceModalOpen(false)}
        onSaved={async () => { setIfaceModalOpen(false); await reload(true); }}
      />

      <SimpleEntityModal
        kind={simpleModal.kind}
        row={simpleModal.row}
        token={token}
        equipment={equipment}
        interfaces={interfaces}
        vlans={vlans}
        onClose={() => setSimpleModal({ kind: null })}
        onSaved={async () => { setSimpleModal({ kind: null }); await reload(true); }}
      />
    </div>
  );
}

// ============================================================
// Вспомогательные компоненты
// ============================================================

const StatusTag: React.FC<{ status: IPAddress['status'] }> = ({ status }) => {
  const map: Record<string, { color: string; label: string }> = {
    free: { color: 'default', label: 'Свободен' },
    reserved: { color: 'gold', label: 'Зарезервирован' },
    in_use: { color: 'green', label: 'Используется' },
    deprecated: { color: 'red', label: 'Устарел' },
  };
  const it = map[status] || { color: 'default', label: status };
  return <Tag color={it.color}>{it.label}</Tag>;
};

const InterfaceTable: React.FC<{
  interfaces: NetworkInterface[];
  canEdit: boolean;
  onEdit: (i: NetworkInterface) => void;
  onDelete: (id: string) => void;
}> = ({ interfaces, canEdit, onEdit, onDelete }) => {
  const columns: ColumnsType<NetworkInterface> = [
    {
      title: 'Интерфейс', dataIndex: 'name',
      render: (v, r) => (
        <div className="netconfig-ifcell">
          <b>{v}</b>
          {r.interface_type !== 'physical' && <Tag color="purple">{r.interface_type}</Tag>}
        </div>
      ),
    },
    { title: 'Тип порта', dataIndex: 'physical_type', width: 100, render: (v) => v || <span className="muted">—</span> },
    { title: 'Порт', dataIndex: 'port_number', width: 70, render: (v) => v || <span className="muted">—</span> },
    {
      title: 'Режим', dataIndex: 'mode', width: 100,
      render: (v, r) => (
        <div className="netconfig-mode">
          <Tag color={v === 'trunk' || r.is_trunk ? 'blue' : 'default'}>{v}</Tag>
        </div>
      ),
    },
    {
      title: 'VLAN', dataIndex: 'access_vlan_name', width: 160,
      render: (v, r) => (
        <div className="netconfig-vlans">
          {v && <Tag color="geekblue">A: {v}</Tag>}
          {r.native_vlan_name && <Tag color="cyan">N: {r.native_vlan_name}</Tag>}
          {(r.vlan_configurations?.length || 0) > 0 && (
            <Tooltip title={r.vlan_configurations!.map(vc => vc.vlan).join(', ')}>
              <Tag color="purple">T: {r.vlan_configurations!.length}</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'IP', width: 180,
      render: (_, r) => (
        <div className="netconfig-ips">
          {(r.ip_addresses || []).length === 0
            ? <span className="muted">—</span>
            : (r.ip_addresses || []).map(ip => (
              <code key={ip.id} title={ip.hostname || undefined}>{ip.address}</code>
            ))}
        </div>
      ),
    },
    {
      title: 'Связан с', width: 200,
      render: (_, r) => r.connected_to_name
        ? <span title={r.connected_to_equipment_name || ''}>{r.connected_to_equipment_name ? `${r.connected_to_equipment_name} → ` : ''}{r.connected_to_name}</span>
        : <span className="muted">—</span>,
    },
    {
      title: 'Статус', dataIndex: 'enabled', width: 100,
      render: (v) => (
        <div className="netconfig-status">
          <span className={`netconfig-status-dot ${v ? 'netconfig-status-dot--ok' : 'netconfig-status-dot--danger'}`} />
          <span>{v ? 'Up' : 'Down'}</span>
        </div>
      ),
    },
    ...(canEdit ? [{
      title: '', width: 90,
      render: (_: any, r: NetworkInterface) => (
        <>
          <Button type="text" size="small" icon={<Pencil size={14} />} onClick={() => onEdit(r)} />
          <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={() => onDelete(r.id)} />
        </>
      ),
    }] : []),
  ];

  return (
    <Table<NetworkInterface>
      rowKey="id"
      size="small"
      dataSource={interfaces}
      columns={columns}
      pagination={false}
      scroll={{ x: 1200 }}
    />
  );
};

// ============================================================
// Универсальная модалка (VLAN / IP / Routing / ACL)
// ============================================================
const SimpleEntityModal: React.FC<{
  kind: 'vlan' | 'ip' | 'routing' | 'acl' | null;
  row?: any;
  token: string;
  equipment: Equipment;
  interfaces: NetworkInterface[];
  vlans: VLAN[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ kind, row, token, equipment, interfaces, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [subnets, setSubnets] = useState<any[]>([]);

  useEffect(() => {
    if (!kind) return;
    form.resetFields();
    if (row) form.setFieldsValue(row);
    if (kind === 'ip') {
      networksApi.getSubnets(token).then(setSubnets).catch(() => setSubnets([]));
    }
  }, [kind, row?.id]);

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (kind === 'vlan') {
        if (row) await networksApi.updateVlan(token, String(row.id), values);
        else await networksApi.createVlan(token, values);
      } else if (kind === 'ip') {
        if (row) await networksApi.updateIPAddress(token, String(row.id), values);
        else await networksApi.createIPAddress(token, values);
      } else if (kind === 'routing') {
        const payload = { ...values, equipment: equipment.id };
        if (row) await networksApi.updateRoutingTable(token, String(row.id), payload);
        else await networksApi.createRoutingTable(token, payload);
      } else if (kind === 'acl') {
        const payload = { ...values, equipment: equipment.id };
        if (row) await networksApi.updateACL(token, String(row.id), payload);
        else await networksApi.createACL(token, payload);
      }
      message.success('Сохранено');
      onSaved();
    } catch (e: any) {
      if (e?.errorFields) return;
      const err = e?.response?.data;
      message.error(typeof err === 'string' ? err : JSON.stringify(err || e?.message || 'Ошибка'));
    } finally {
      setSaving(false);
    }
  };

  const titles: Record<string, string> = {
    vlan: row ? 'Изменить VLAN' : 'Новый VLAN',
    ip: row ? 'Изменить IP-адрес' : 'Новый IP-адрес',
    routing: row ? 'Изменить маршрут' : 'Новый маршрут',
    acl: row ? 'Изменить правило ACL' : 'Новое правило ACL',
  };

  if (!kind) return null;

  return (
    <Modal
      title={titles[kind]}
      open
      onCancel={onClose}
      onOk={submit}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={saving}
      width={560}
      destroyOnHidden
      forceRender
    >
      <Form
        form={form}
        layout="vertical"
        size="middle"
        key={`${kind}-${row?.id ?? 'new'}`}
        initialValues={row || {}}
        preserve={false}
      >
        {kind === 'vlan' && (
          <>
            <Form.Item label="VLAN ID" name="vlan_id" rules={[{ required: true }]}>
              <InputNumber min={1} max={4094} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Название" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Описание" name="description">
              <TextArea rows={2} />
            </Form.Item>
          </>
        )}

        {kind === 'ip' && (
          <>
            <Form.Item label="Подсеть" name="subnet" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="children">
                {subnets.map(s => (
                  <Option key={s.id} value={s.id}>{s.cidr} — {s.purpose || 'без назначения'}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="IP-адрес" name="address" rules={[{ required: true }]}>
              <Input placeholder="192.168.1.10" />
            </Form.Item>
            <Form.Item label="Статус" name="status" initialValue="reserved">
              <Select>
                <Option value="free">Свободен</Option>
                <Option value="reserved">Зарезервирован</Option>
                <Option value="in_use">Используется</Option>
                <Option value="deprecated">Устарел</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Интерфейс" name="interface">
              <Select allowClear>
                {interfaces.map(i => (
                  <Option key={i.id} value={i.id}>{i.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Hostname" name="hostname"><Input /></Form.Item>
            <Form.Item label="Кому/чему назначен" name="assigned_to"><Input /></Form.Item>
            <Form.Item label="Назначение" name="purpose"><Input /></Form.Item>
            <Form.Item label="Основной" name="is_primary" valuePropName="checked">
              <input type="checkbox" />
            </Form.Item>
            <Form.Item label="Описание" name="description"><TextArea rows={2} /></Form.Item>
          </>
        )}

        {kind === 'routing' && (
          <>
            <Form.Item label="Сеть назначения" name="network" rules={[{ required: true }]}>
              <Input placeholder="192.168.0.0" />
            </Form.Item>
            <Form.Item label="Маска" name="netmask" rules={[{ required: true }]}>
              <Input placeholder="255.255.255.0" />
            </Form.Item>
            <Form.Item label="Шлюз" name="gateway" rules={[{ required: true }]}>
              <Input placeholder="192.168.0.1" />
            </Form.Item>
            <Form.Item label="Метрика" name="metric" initialValue={1}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Описание" name="description"><TextArea rows={2} /></Form.Item>
          </>
        )}

        {kind === 'acl' && (
          <>
            <Form.Item label="Название ACL" name="name" rules={[{ required: true }]}>
              <Input placeholder="INBOUND-1" />
            </Form.Item>
            <Form.Item label="Порядковый номер" name="sequence" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Действие" name="action" rules={[{ required: true }]} initialValue="permit">
              <Select>
                <Option value="permit">Permit</Option>
                <Option value="deny">Deny</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Протокол" name="protocol" initialValue="ip">
              <Select>
                <Option value="ip">IP</Option>
                <Option value="tcp">TCP</Option>
                <Option value="udp">UDP</Option>
                <Option value="icmp">ICMP</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Источник" name="source_network"><Input placeholder="any / 10.0.0.0/8" /></Form.Item>
            <Form.Item label="Назначение" name="destination_network"><Input placeholder="any / 10.0.0.0/8" /></Form.Item>
            <Form.Item label="Порт источника" name="source_port"><InputNumber min={1} max={65535} style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="Порт назначения" name="destination_port"><InputNumber min={1} max={65535} style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="Описание" name="description"><TextArea rows={2} /></Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};