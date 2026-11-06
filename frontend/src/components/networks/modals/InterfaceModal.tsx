// src/components/networks/modals/InterfaceModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Button, Form, Input, InputNumber, Modal, Select, Switch, Tabs, message, Tag,
} from 'antd';
import { Plus, X } from 'lucide-react';
import type { Equipment, IfaceLike } from '../../../types';
import { networksApi } from '../../../api/networksApi';
import { VlanPicker } from '../EditableDrawer/VlanPicker';
import { IpAddressPicker } from '../EditableDrawer/IpAddressPicker';
// ✅ NEW: базовые стили полей (.picker, .iface-form__field, .iface-form__label)
import '../EditableDrawer/styles/EquipmentDrawer.css';
// ✅ NEW: кастомизация antd Select под .iface-form__field
import './InterfaceModal.css';

const { Option } = Select;

interface Props {
    open: boolean;
    token: string;
    equipment: Equipment;
    initial: IfaceLike | null;
    networkId?: string;
    allInterfaces: IfaceLike[];
    presetPortNumber?: number | null;
    onClose: () => void;
    onSaved: () => void;
}

const EMPTY = (presetPort: number | null): Partial<IfaceLike> => ({
    name: presetPort ? `Port ${presetPort}` : '',
    interface_type: 'physical',
    physical_type: 'rj45',
    port_number: presetPort ?? null,
    slot: null,
    module: null,
    enabled: true,
    mode: 'access',
    mac_address: '',
    mtu: 1500,
    speed: '',
    access_vlan: null,
    is_trunk: false,
    native_vlan: null,
    connected_to: null,
});

export const InterfaceModal: React.FC<Props> = ({
    open, token, equipment, initial, networkId, allInterfaces, presetPortNumber, onClose, onSaved,
}) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [ipPickerOpen, setIpPickerOpen] = useState(false);
    const [taggedVlans, setTaggedVlans] = useState<string[]>([]);
    const [vlans, setVlans] = useState<Array<{ id: string; name: string; vlan_id: number }>>([]);

    // access_vlan / native_vlan не привязаны к antd Form.Item
    // (VlanPicker — кастомный контрол, не antd-контрол),
    // поэтому храним их в обычном state.
    const [accessVlan, setAccessVlan] = useState<number | null>(null);
    const [nativeVlan, setNativeVlan] = useState<number | null>(null);
    const initialValues = initial || EMPTY(presetPortNumber ?? null);
    const formKey = initial?.id ?? `new-${presetPortNumber ?? 'x'}`;

    const isEdit = !!initial;

    useEffect(() => {
        if (!open) return;

        // Локальный state, не привязанный к antd Form
        setAccessVlan(initial?.access_vlan ? Number(initial.access_vlan) : null);
        setNativeVlan(initial?.native_vlan ? Number(initial.native_vlan) : null);
        setTaggedVlans(
            (initial?.vlan_configurations || []).map(vc => String(vc.vlan)),
        );
        setIpPickerOpen(false);

        networksApi.getVlans(token).then(setVlans).catch(() => setVlans([]));
    }, [open, initial?.id, token]);

    const ipList = useMemo(() => initial?.ip_addresses || [], [initial]);

    const connectedCandidates = useMemo(
        () => allInterfaces.filter(i => i.id !== initial?.id),
        [allInterfaces, initial?.id],
    );

    const submit = async () => {
        const values = await form.validateFields();
        setSaving(true);
        try {
            const isTrunk = values.mode === 'trunk' || values.is_trunk;
            const payload: any = {
                equipment: equipment.id,
                name: values.name,
                interface_type: values.interface_type,
                physical_type: values.physical_type || null,
                port_number: values.port_number ?? null,
                slot: values.slot ?? null,
                module: values.module ?? null,
                enabled: !!values.enabled,
                mode: values.mode,
                mac_address: values.mac_address || '',
                mtu: values.mtu || 1500,
                speed: values.speed || '',
                access_vlan: accessVlan ?? null,
                native_vlan: nativeVlan ?? null,
                is_trunk: isTrunk,
                connected_to: values.connected_to || null,
            };

            let ifaceId: string;
            if (isEdit) {
                const saved = await networksApi.updateNetworkInterface(
                    token, initial!.id, payload,
                );
                ifaceId = saved?.id || initial!.id;
            } else {
                const saved = await networksApi.createNetworkInterface(token, payload);
                ifaceId = saved.id;
            }

            // --- Синхронизация tagged VLANs ---
            const current: Array<{ id: string; vlan: string }> =
                initial?.vlan_configurations || [];
            const currentVlanIds = current.map(vc => String(vc.vlan));
            const toAdd = taggedVlans.filter(v => !currentVlanIds.includes(v));
            const toRemove = current.filter(
                vc => !taggedVlans.includes(String(vc.vlan)),
            );

            for (const v of toRemove) {
                await networksApi.deleteVlanConfiguration(token, v.id);
            }
            for (const v of toAdd) {
                await networksApi.createVlanConfiguration(token, {
                    interface: ifaceId,
                    vlan: v,
                    is_tagged: true,
                });
            }

            message.success(isEdit ? 'Интерфейс обновлён' : 'Интерфейс создан');
            onSaved();
        } catch (e: any) {
            // Ошибки валидации antd Form — не показываем message.error,
            // они и так рендерятся под полями.
            if (e?.errorFields) return;

            const err = e?.response?.data;
            message.error(
                typeof err === 'string'
                    ? err
                    : JSON.stringify(err || 'Ошибка сохранения'),
            );
        } finally {
            setSaving(false);
        }
    };

    const detachIp = async (ipId: string) => {
        if (!window.confirm('Отвязать IP от интерфейса?')) return;
        try {
            await networksApi.releaseIpFromInterface(token, Number(ipId));
            message.success('IP отвязан');
            onSaved();
        } catch {
            message.error('Ошибка');
        }
    };

    const attachIp = async (ip: {
        address: string;
        subnet_id: number;
        hostname?: string;
        purpose?: string;
        assigned_to?: string;
    }) => {
        if (!initial?.id) {
            message.warning('Сначала сохраните интерфейс');
            return;
        }
        try {
            await networksApi.assignIpToInterface(token, Number(initial.id), {
                subnet: ip.subnet_id,
                address: ip.address,
                status: 'in_use',
                hostname: ip.hostname,
                purpose: ip.purpose,
                assigned_to: ip.assigned_to,
            });
            setIpPickerOpen(false);
            message.success('IP назначен');
            onSaved();
        } catch {
            message.error('Не удалось назначить IP');
        }
    };

    return (
        <Modal
            title={isEdit ? `Интерфейс: ${initial?.name}` : 'Новый интерфейс'}
            open={open}
            onCancel={onClose}
            onOk={submit}
            okText="Сохранить"
            cancelText="Отмена"
            confirmLoading={saving}
            width={720}
            destroyOnHidden
            forceRender

        >
            <Form
                form={form}
                layout="vertical"
                size="middle"
                key={formKey}
                initialValues={initialValues}
                preserve={false}
            >
                <Tabs
                    items={[
                        {
                            key: 'basic',
                            label: 'Основное',
                            children: (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 12,
                                    }}
                                >
                                    <Form.Item
                                        label="Имя интерфейса"
                                        name="name"
                                        rules={[{ required: true }]}
                                    >
                                        <Input placeholder="Gi0/1" />
                                    </Form.Item>

                                    <Form.Item label="Тип интерфейса" name="interface_type">
                                        <Select>
                                            <Option value="physical">Физический</Option>
                                            <Option value="vlan">VLAN Interface</Option>
                                            <Option value="bond">Bond / LAG</Option>
                                            <Option value="bridge">Bridge</Option>
                                            <Option value="loopback">Loopback</Option>
                                            <Option value="port-channel">Port-Channel</Option>
                                            <Option value="tunnel">Tunnel</Option>
                                            <Option value="virtual">Виртуальный</Option>
                                        </Select>
                                    </Form.Item>

                                    <Form.Item label="Тип порта" name="physical_type">
                                        <Select allowClear>
                                            <Option value="rj45">RJ-45</Option>
                                            <Option value="sfp">SFP</Option>
                                            <Option value="sfp+">SFP+</Option>
                                            <Option value="qsfp">QSFP</Option>
                                            <Option value="console">Console</Option>
                                            <Option value="usb">USB</Option>
                                        </Select>
                                    </Form.Item>

                                    <Form.Item label="Номер порта" name="port_number">
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>

                                    <Form.Item label="Слот" name="slot">
                                        <InputNumber min={0} style={{ width: '100%' }} />
                                    </Form.Item>

                                    <Form.Item label="Модуль" name="module">
                                        <InputNumber min={0} style={{ width: '100%' }} />
                                    </Form.Item>

                                    <Form.Item label="MAC-адрес" name="mac_address">
                                        <Input placeholder="00:1a:2b:3c:4d:5e" />
                                    </Form.Item>

                                    <Form.Item label="MTU" name="mtu">
                                        <InputNumber min={68} max={9000} style={{ width: '100%' }} />
                                    </Form.Item>

                                    <Form.Item label="Скорость" name="speed">
                                        <Input placeholder="1 Gbps" />
                                    </Form.Item>

                                    <Form.Item
                                        label="Включён"
                                        name="enabled"
                                        valuePropName="checked"
                                    >
                                        <Switch />
                                    </Form.Item>
                                </div>
                            ),
                        },
                        {
                            key: 'vlan',
                            label: 'VLAN',
                            children: (
                                <>
                                    <Form.Item label="Режим порта" name="mode">
                                        <Select>
                                            <Option value="access">Access</Option>
                                            <Option value="trunk">Trunk</Option>
                                            <Option value="general">General</Option>
                                            <Option value="hybrid">Hybrid</Option>
                                        </Select>
                                    </Form.Item>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 12,
                                            marginBottom: 16,
                                        }}
                                    >
                                        <div className="iface-form__field">
                                            <span className="iface-form__label">
                                                Access VLAN
                                            </span>
                                            <VlanPicker
                                                token={token}
                                                value={accessVlan}
                                                onChange={setAccessVlan}
                                            />
                                        </div>
                                        <div className="iface-form__field">
                                            <span className="iface-form__label">
                                                Native VLAN
                                            </span>
                                            <VlanPicker
                                                token={token}
                                                value={nativeVlan}
                                                onChange={setNativeVlan}
                                            />
                                        </div>
                                    </div>

                                    {/* ✅ Обёрнуто в .iface-form__field — консистентно с Access/Native */}
                                    <div className="iface-form__field">
                                        <span className="iface-form__label">
                                            Tagged VLANs (trunk)
                                        </span>
                                        <Select
                                            className="iface-form__ant-select"
                                            mode="multiple"
                                            style={{ width: '100%' }}
                                            popupClassName="iface-form__dropdown"
                                            placeholder="Выберите VLAN, разрешённые на trunk"
                                            value={taggedVlans}
                                            onChange={setTaggedVlans}
                                            optionFilterProp="label"
                                            options={vlans.map(v => ({
                                                value: v.id,
                                                label: `${v.vlan_id} — ${v.name}`,
                                            }))}
                                        />
                                    </div>
                                </>
                            ),
                        },
                        {
                            key: 'ips',
                            label: `IP-адреса (${ipList.length})`,
                            children: (
                                <div>
                                    {!initial?.id && (
                                        <div className="muted" style={{ marginBottom: 8 }}>
                                            Сначала сохраните интерфейс — затем можно будет
                                            назначить IP.
                                        </div>
                                    )}

                                    {ipList.map(ip => (
                                        <div
                                            key={ip.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '6px 0',
                                                borderBottom: '1px solid #f1f5f9',
                                            }}
                                        >
                                            <code>{ip.address}</code>
                                            {ip.subnet_cidr && (
                                                <span className="muted">
                                                    ({ip.subnet_cidr})
                                                </span>
                                            )}
                                            {ip.is_primary && (
                                                <Tag color="green">primary</Tag>
                                            )}
                                            <span style={{ flex: 1 }} />
                                            <Button
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<X size={14} />}
                                                onClick={() => detachIp(ip.id)}
                                            />
                                        </div>
                                    ))}

                                    {initial?.id && (
                                        <Button
                                            type="dashed"
                                            icon={<Plus size={14} />}
                                            onClick={() => setIpPickerOpen(true)}
                                            style={{ marginTop: 8 }}
                                        >
                                            Назначить IP
                                        </Button>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'advanced',
                            label: 'Связи',
                            children: (
                                <Form.Item
                                    label="Связан с интерфейсом"
                                    name="connected_to"
                                >
                                    <Select
                                        showSearch
                                        allowClear
                                        optionFilterProp="label"
                                        placeholder="Интерфейс другого устройства"
                                        options={connectedCandidates.map(i => ({
                                            value: i.id,
                                            label: `${i.name}${(i as any).equipment_name
                                                ? ` (${(i as any).equipment_name})`
                                                : ''
                                                }`,
                                        }))}
                                    />
                                </Form.Item>
                            ),
                        },
                    ]}
                />
            </Form>

            {ipPickerOpen && initial?.id && (
                <IpAddressPicker
                    token={token}
                    networkId={networkId}
                    onClose={() => setIpPickerOpen(false)}
                    onPick={(ip) => attachIp(ip as any)}
                />
            )}
        </Modal>
    );
};